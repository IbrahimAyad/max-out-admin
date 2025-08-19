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
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        
        const requestData = await req.json();
        const { action, invite_code, email, password, user_data } = requestData;
        
        switch (action) {
            case 'validate_invitation_code':
                // Validate invitation code and return invitation information
                const invitationResponse = await fetch(`${supabaseUrl}/rest/v1/wedding_party_members?invite_code=eq.${invite_code}&select=*,weddings!inner(*)`, {
                    headers: {
                        'Authorization': `Bearer ${supabaseKey}`,
                        'apikey': supabaseKey,
                        'Content-Type': 'application/json'
                    }
                });
                
                if (!invitationResponse.ok) {
                    throw new Error('Failed to validate invitation code');
                }
                
                const invitations = await invitationResponse.json();
                
                if (invitations.length === 0) {
                    return new Response(JSON.stringify({
                        success: false,
                        error: 'Invalid invitation code'
                    }), {
                        status: 400,
                        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                    });
                }
                
                const invitation = invitations[0];
                
                // Check if invitation is expired
                if (invitation.invite_expires_at && new Date(invitation.invite_expires_at) < new Date()) {
                    return new Response(JSON.stringify({
                        success: false,
                        error: 'Invitation code has expired'
                    }), {
                        status: 400,
                        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                    });
                }
                
                return new Response(JSON.stringify({
                    success: true,
                    data: {
                        invitation,
                        wedding: invitation.weddings,
                        requires_auth: !invitation.user_id,
                        message: invitation.user_id 
                            ? 'Please sign in to continue'
                            : 'Create your account to join the wedding party'
                    }
                }), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
                
            case 'authenticate_with_invitation':
                // First validate invitation code
                const validateResponse = await fetch(`${supabaseUrl}/rest/v1/wedding_party_members?invite_code=eq.${invite_code}&select=*,weddings!inner(*)`, {
                    headers: {
                        'Authorization': `Bearer ${supabaseKey}`,
                        'apikey': supabaseKey,
                        'Content-Type': 'application/json'
                    }
                });
                
                if (!validateResponse.ok) {
                    throw new Error('Failed to validate invitation code');
                }
                
                const validInvitations = await validateResponse.json();
                
                if (validInvitations.length === 0) {
                    return new Response(JSON.stringify({
                        success: false,
                        error: 'Invalid invitation code'
                    }), {
                        status: 400,
                        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                    });
                }
                
                const validInvitation = validInvitations[0];
                
                // Check if invitation is expired
                if (validInvitation.invite_expires_at && new Date(validInvitation.invite_expires_at) < new Date()) {
                    return new Response(JSON.stringify({
                        success: false,
                        error: 'Invitation code has expired'
                    }), {
                        status: 400,
                        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                    });
                }
                
                // Attempt to authenticate or create user
                let authResult;
                let isNewUser = false;
                
                try {
                    // Try to sign in existing user
                    const authResponse = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${supabaseKey}`,
                            'apikey': supabaseKey,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ email, password })
                    });
                    
                    if (authResponse.ok) {
                        authResult = await authResponse.json();
                    } else {
                        // User doesn't exist, create new account
                        isNewUser = true;
                        const signUpResponse = await fetch(`${supabaseUrl}/auth/v1/signup`, {
                            method: 'POST',
                            headers: {
                                'Authorization': `Bearer ${supabaseKey}`,
                                'apikey': supabaseKey,
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({ 
                                email, 
                                password,
                                data: {
                                    wedding_role: validInvitation.role,
                                    invite_code: invite_code,
                                    wedding_id: validInvitation.wedding_id,
                                    ...user_data
                                }
                            })
                        });
                        
                        if (!signUpResponse.ok) {
                            const errorData = await signUpResponse.json();
                            throw new Error(`Failed to create account: ${errorData.msg}`);
                        }
                        
                        authResult = await signUpResponse.json();
                    }
                } catch (error) {
                    throw new Error(`Authentication failed: ${error.message}`);
                }
                
                const userId = authResult.user.id;
                
                // Update party member record with user_id if not already linked
                if (!validInvitation.user_id) {
                    const updateMemberResponse = await fetch(`${supabaseUrl}/rest/v1/wedding_party_members?id=eq.${validInvitation.id}`, {
                        method: 'PATCH',
                        headers: {
                            'Authorization': `Bearer ${supabaseKey}`,
                            'apikey': supabaseKey,
                            'Content-Type': 'application/json',
                            'Prefer': 'return=representation'
                        },
                        body: JSON.stringify({ 
                            user_id: userId,
                            invite_status: 'accepted',
                            accepted_at: new Date().toISOString(),
                            updated_at: new Date().toISOString()
                        })
                    });
                    
                    if (!updateMemberResponse.ok) {
                        console.error('Failed to update party member with user_id');
                    }
                }
                
                // Get or create user profile
                const profileResponse = await fetch(`${supabaseUrl}/rest/v1/user_profiles?user_id=eq.${userId}`, {
                    headers: {
                        'Authorization': `Bearer ${supabaseKey}`,
                        'apikey': supabaseKey,
                        'Content-Type': 'application/json'
                    }
                });
                
                let profile = null;
                if (profileResponse.ok) {
                    const profiles = await profileResponse.json();
                    profile = profiles.length > 0 ? profiles[0] : null;
                }
                
                if (!profile) {
                    // Create user profile
                    const createProfileResponse = await fetch(`${supabaseUrl}/rest/v1/user_profiles`, {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${supabaseKey}`,
                            'apikey': supabaseKey,
                            'Content-Type': 'application/json',
                            'Prefer': 'return=representation'
                        },
                        body: JSON.stringify({
                            user_id: userId,
                            email: authResult.user.email,
                            first_name: user_data?.first_name || validInvitation.first_name,
                            last_name: user_data?.last_name || validInvitation.last_name,
                            wedding_role: validInvitation.role,
                            is_wedding_customer: true,
                            wedding_preferences: {
                                invite_code: invite_code,
                                wedding_id: validInvitation.wedding_id,
                                party_member_id: validInvitation.id
                            },
                            created_at: new Date().toISOString(),
                            updated_at: new Date().toISOString()
                        })
                    });
                    
                    if (createProfileResponse.ok) {
                        const createdProfiles = await createProfileResponse.json();
                        profile = createdProfiles[0];
                    }
                } else if (isNewUser) {
                    // Update existing profile with wedding information
                    const updateProfileResponse = await fetch(`${supabaseUrl}/rest/v1/user_profiles?user_id=eq.${userId}`, {
                        method: 'PATCH',
                        headers: {
                            'Authorization': `Bearer ${supabaseKey}`,
                            'apikey': supabaseKey,
                            'Content-Type': 'application/json',
                            'Prefer': 'return=representation'
                        },
                        body: JSON.stringify({
                            wedding_role: validInvitation.role,
                            is_wedding_customer: true,
                            wedding_preferences: {
                                invite_code: invite_code,
                                wedding_id: validInvitation.wedding_id,
                                party_member_id: validInvitation.id
                            },
                            updated_at: new Date().toISOString()
                        })
                    });
                    
                    if (updateProfileResponse.ok) {
                        const updatedProfiles = await updateProfileResponse.json();
                        profile = updatedProfiles[0];
                    }
                }
                
                return new Response(JSON.stringify({
                    success: true,
                    data: {
                        user: authResult.user,
                        session: authResult.session || authResult,
                        wedding: validInvitation.weddings,
                        invitation: validInvitation,
                        profile: profile,
                        invite_code: invite_code,
                        is_new_user: isNewUser
                    }
                }), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
                
            case 'accept_invitation':
                // Mark invitation as accepted for existing user
                const acceptResponse = await fetch(`${supabaseUrl}/rest/v1/wedding_party_members?invite_code=eq.${invite_code}`, {
                    method: 'PATCH',
                    headers: {
                        'Authorization': `Bearer ${supabaseKey}`,
                        'apikey': supabaseKey,
                        'Content-Type': 'application/json',
                        'Prefer': 'return=representation'
                    },
                    body: JSON.stringify({
                        invite_status: 'accepted',
                        accepted_at: new Date().toISOString(),
                        user_id: requestData.user_id,
                        updated_at: new Date().toISOString()
                    })
                });
                
                if (!acceptResponse.ok) {
                    throw new Error('Failed to accept invitation');
                }
                
                const acceptedInvitations = await acceptResponse.json();
                
                return new Response(JSON.stringify({
                    success: true,
                    data: {
                        invitation: acceptedInvitations[0]
                    }
                }), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
                
            default:
                throw new Error(`Unknown action: ${action}`);
        }
        
    } catch (error) {
        console.error('Invitation code auth error:', error);
        
        const errorResponse = {
            success: false,
            error: {
                code: 'INVITATION_CODE_AUTH_ERROR',
                message: error.message
            }
        };

        return new Response(JSON.stringify(errorResponse), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});