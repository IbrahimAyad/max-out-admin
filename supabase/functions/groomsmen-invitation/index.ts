Deno.serve(async (req) => {
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE, PATCH',
        'Access-Control-Max-Age': '86400',
        'Access-Control-Allow-Credentials': 'false'
    };

    if (req.method === 'OPTIONS') {
        return new Response(null, { status: 200, headers: corsHeaders });
    }

    try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL');
        const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');

        if (!supabaseUrl || !supabaseAnonKey) {
            throw new Error('Supabase configuration missing');
        }

        const url = new URL(req.url);
        const method = req.method;

        if (method === 'POST' && url.pathname.endsWith('/validate')) {
            // Validate invitation code
            const { inviteCode } = await req.json();

            if (!inviteCode) {
                throw new Error('Invitation code is required');
            }

            // Check invitation in database
            const inviteResponse = await fetch(`${supabaseUrl}/rest/v1/wedding_invitations?invite_code=eq.${inviteCode}&select=*,weddings(*)`, {
                headers: {
                    'apikey': supabaseAnonKey,
                    'Content-Type': 'application/json'
                }
            });

            if (!inviteResponse.ok) {
                throw new Error('Failed to validate invitation');
            }

            const invitations = await inviteResponse.json();

            if (invitations.length === 0) {
                return new Response(JSON.stringify({
                    error: {
                        code: 'INVALID_INVITATION',
                        message: 'Invalid invitation code'
                    }
                }), {
                    status: 400,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
            }

            const invitation = invitations[0];

            // Check if invitation is expired
            if (invitation.expires_at && new Date(invitation.expires_at) < new Date()) {
                return new Response(JSON.stringify({
                    error: {
                        code: 'INVITATION_EXPIRED',
                        message: 'This invitation has expired'
                    }
                }), {
                    status: 400,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
            }

            // Check if already accepted
            if (invitation.accepted_at) {
                return new Response(JSON.stringify({
                    error: {
                        code: 'ALREADY_ACCEPTED',
                        message: 'This invitation has already been accepted'
                    }
                }), {
                    status: 400,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
            }

            return new Response(JSON.stringify({
                data: {
                    invitation,
                    wedding: invitation.weddings,
                    valid: true
                }
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });

        } else if (method === 'POST' && url.pathname.endsWith('/accept')) {
            // Accept invitation and create/link user account
            const { inviteCode, userInfo } = await req.json();

            if (!inviteCode) {
                throw new Error('Invitation code is required');
            }

            // Get user from auth header if provided
            const authHeader = req.headers.get('authorization');
            let userId = null;
            
            if (authHeader) {
                const token = authHeader.replace('Bearer ', '');
                
                const userResponse = await fetch(`${supabaseUrl}/auth/v1/user`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'apikey': supabaseAnonKey
                    }
                });
                
                if (userResponse.ok) {
                    const userData = await userResponse.json();
                    userId = userData.id;
                }
            }

            // Update invitation as accepted
            const updateInviteResponse = await fetch(`${supabaseUrl}/rest/v1/wedding_invitations?invite_code=eq.${inviteCode}`, {
                method: 'PATCH',
                headers: {
                    'apikey': supabaseAnonKey,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    accepted_at: new Date().toISOString(),
                    clicked_at: new Date().toISOString()
                })
            });

            if (!updateInviteResponse.ok) {
                throw new Error('Failed to update invitation');
            }

            // Get invitation details
            const inviteResponse = await fetch(`${supabaseUrl}/rest/v1/wedding_invitations?invite_code=eq.${inviteCode}&select=*`, {
                headers: {
                    'apikey': supabaseAnonKey,
                    'Content-Type': 'application/json'
                }
            });

            const invitations = await inviteResponse.json();
            const invitation = invitations[0];

            // Create or update wedding party member
            const memberData = {
                wedding_id: invitation.wedding_id,
                user_id: userId,
                first_name: userInfo?.firstName || invitation.first_name,
                last_name: userInfo?.lastName || invitation.last_name,
                email: invitation.email,
                phone: userInfo?.phone,
                role: invitation.role,
                invite_code: inviteCode,
                invite_status: 'accepted',
                accepted_at: new Date().toISOString(),
                measurements_status: 'pending',
                outfit_status: 'pending',
                payment_status: 'pending',
                overall_completion_percentage: 0
            };

            // Check if party member already exists
            const existingMemberResponse = await fetch(`${supabaseUrl}/rest/v1/wedding_party_members?invite_code=eq.${inviteCode}`, {
                headers: {
                    'apikey': supabaseAnonKey,
                    'Content-Type': 'application/json'
                }
            });

            const existingMembers = await existingMemberResponse.json();

            let memberResponse;
            if (existingMembers.length > 0) {
                // Update existing member
                memberResponse = await fetch(`${supabaseUrl}/rest/v1/wedding_party_members?invite_code=eq.${inviteCode}`, {
                    method: 'PATCH',
                    headers: {
                        'apikey': supabaseAnonKey,
                        'Content-Type': 'application/json',
                        'Prefer': 'return=representation'
                    },
                    body: JSON.stringify(memberData)
                });
            } else {
                // Create new member
                memberResponse = await fetch(`${supabaseUrl}/rest/v1/wedding_party_members`, {
                    method: 'POST',
                    headers: {
                        'apikey': supabaseAnonKey,
                        'Content-Type': 'application/json',
                        'Prefer': 'return=representation'
                    },
                    body: JSON.stringify(memberData)
                });
            }

            if (!memberResponse.ok) {
                const errorText = await memberResponse.text();
                throw new Error(`Failed to create/update party member: ${errorText}`);
            }

            const members = await memberResponse.json();
            const member = members[0];

            return new Response(JSON.stringify({
                data: {
                    member,
                    message: 'Invitation accepted successfully'
                }
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });

        } else {
            return new Response(JSON.stringify({
                error: {
                    code: 'METHOD_NOT_ALLOWED',
                    message: 'Method not allowed'
                }
            }), {
                status: 405,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

    } catch (error) {
        console.error('Groomsmen invitation error:', error);

        const errorResponse = {
            error: {
                code: 'INVITATION_ERROR',
                message: error.message
            }
        };

        return new Response(JSON.stringify(errorResponse), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});