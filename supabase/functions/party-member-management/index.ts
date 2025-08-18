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
        const { action, member_data, party_member_id, wedding_id } = requestData;
        
        switch (action) {
            case 'invite_party_member':
                // Generate unique invite code
                const inviteCode = generateInviteCode();
                
                // Create wedding party member record
                const newMember = {
                    wedding_id: member_data.wedding_id,
                    first_name: member_data.first_name,
                    last_name: member_data.last_name,
                    email: member_data.email,
                    phone: member_data.phone || null,
                    role: member_data.role,
                    invite_code: inviteCode,
                    invite_status: 'pending',
                    special_requests: member_data.special_requests || null,
                    invited_at: new Date().toISOString()
                };
                
                // Insert into database
                const memberResponse = await fetch(`${supabaseUrl}/rest/v1/wedding_party_members`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${supabaseKey}`,
                        'apikey': supabaseKey,
                        'Content-Type': 'application/json',
                        'Prefer': 'return=representation'
                    },
                    body: JSON.stringify(newMember)
                });
                
                if (!memberResponse.ok) {
                    const errorText = await memberResponse.text();
                    throw new Error(`Failed to create party member: ${errorText}`);
                }
                
                const createdMember = await memberResponse.json();
                
                // Create invitation record
                const invitation = {
                    wedding_id: member_data.wedding_id,
                    email: member_data.email,
                    first_name: member_data.first_name,
                    last_name: member_data.last_name,
                    role: member_data.role,
                    invite_code: inviteCode,
                    custom_message: member_data.custom_message || null,
                    sent_at: new Date().toISOString()
                };
                
                const invitationResponse = await fetch(`${supabaseUrl}/rest/v1/wedding_invitations`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${supabaseKey}`,
                        'apikey': supabaseKey,
                        'Content-Type': 'application/json',
                        'Prefer': 'return=representation'
                    },
                    body: JSON.stringify(invitation)
                });
                
                if (!invitationResponse.ok) {
                    const errorText = await invitationResponse.text();
                    console.error('Failed to create invitation record:', errorText);
                }
                
                // Send invitation email via wedding-invitation-sender function
                try {
                    await fetch('https://gvcswimqaxvylgxbklbz.supabase.co/functions/v1/wedding-invitation-sender', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            wedding_id: member_data.wedding_id,
                            invitations: [{
                                email: member_data.email,
                                first_name: member_data.first_name,
                                last_name: member_data.last_name,
                                role: member_data.role,
                                invite_code: inviteCode,
                                custom_message: member_data.custom_message
                            }]
                        })
                    });
                } catch (emailError) {
                    console.error('Failed to send invitation email:', emailError);
                    // Don't fail the whole process if email fails
                }
                
                return new Response(JSON.stringify({
                    success: true,
                    party_member: createdMember[0],
                    invite_code: inviteCode,
                    message: 'Party member invited successfully'
                }), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
                
            case 'get_party_members':
                if (!wedding_id) {
                    throw new Error('Wedding ID is required');
                }
                
                const membersResponse = await fetch(`${supabaseUrl}/rest/v1/wedding_party_members?wedding_id=eq.${wedding_id}&select=*`, {
                    headers: {
                        'Authorization': `Bearer ${supabaseKey}`,
                        'apikey': supabaseKey,
                        'Content-Type': 'application/json'
                    }
                });
                
                if (!membersResponse.ok) {
                    const errorText = await membersResponse.text();
                    throw new Error(`Failed to fetch party members: ${errorText}`);
                }
                
                const members = await membersResponse.json();
                
                return new Response(JSON.stringify({
                    success: true,
                    party_members: members
                }), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
                
            case 'update_member_status':
                if (!party_member_id) {
                    throw new Error('Party member ID is required');
                }
                
                const updateData = {
                    invite_status: member_data.invite_status,
                    accepted_at: member_data.invite_status === 'accepted' ? new Date().toISOString() : null,
                    updated_at: new Date().toISOString()
                };
                
                const updateResponse = await fetch(`${supabaseUrl}/rest/v1/wedding_party_members?id=eq.${party_member_id}`, {
                    method: 'PATCH',
                    headers: {
                        'Authorization': `Bearer ${supabaseKey}`,
                        'apikey': supabaseKey,
                        'Content-Type': 'application/json',
                        'Prefer': 'return=representation'
                    },
                    body: JSON.stringify(updateData)
                });
                
                if (!updateResponse.ok) {
                    const errorText = await updateResponse.text();
                    throw new Error(`Failed to update member status: ${errorText}`);
                }
                
                const updatedMember = await updateResponse.json();
                
                return new Response(JSON.stringify({
                    success: true,
                    party_member: updatedMember[0]
                }), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
                
            default:
                throw new Error(`Unknown action: ${action}`);
        }
        
    } catch (error) {
        console.error('Party member management error:', error);
        
        const errorResponse = {
            error: {
                code: 'PARTY_MEMBER_MANAGEMENT_ERROR',
                message: error.message
            }
        };

        return new Response(JSON.stringify(errorResponse), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});

// Generate random invite code
function generateInviteCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 12; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}