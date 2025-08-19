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
        const { action, user_id, portal_type, session_data } = requestData;
        
        switch (action) {
            case 'create_cross_portal_session':
                // Create session data that works across all portals
                const profileResponse = await fetch(`${supabaseUrl}/rest/v1/user_profiles?user_id=eq.${user_id}&select=*`, {
                    headers: {
                        'Authorization': `Bearer ${supabaseKey}`,
                        'apikey': supabaseKey,
                        'Content-Type': 'application/json'
                    }
                });
                
                if (!profileResponse.ok) {
                    throw new Error('Failed to fetch user profile');
                }
                
                const profiles = await profileResponse.json();
                
                if (profiles.length === 0) {
                    throw new Error('User profile not found');
                }
                
                const profile = profiles[0];
                
                // Determine user's access levels across portals
                const accessLevels = {
                    enhanced_profile: true, // Always have access to profile system
                    couples_portal: false,
                    groomsmen_portal: false,
                    admin_portal: false
                };
                
                // Check for couple portal access
                const coupleWeddingResponse = await fetch(`${supabaseUrl}/rest/v1/weddings?or=(primary_customer_id.eq.${user_id},partner_customer_id.eq.${user_id})&select=*`, {
                    headers: {
                        'Authorization': `Bearer ${supabaseKey}`,
                        'apikey': supabaseKey,
                        'Content-Type': 'application/json'
                    }
                });
                
                let coupleWedding = null;
                if (coupleWeddingResponse.ok) {
                    const coupleWeddings = await coupleWeddingResponse.json();
                    if (coupleWeddings.length > 0) {
                        coupleWedding = coupleWeddings[0];
                        accessLevels.couples_portal = true;
                    }
                }
                
                // Check for party member portal access
                const partyMemberResponse = await fetch(`${supabaseUrl}/rest/v1/wedding_party_members?user_id=eq.${user_id}&select=*,weddings!inner(*)`, {
                    headers: {
                        'Authorization': `Bearer ${supabaseKey}`,
                        'apikey': supabaseKey,
                        'Content-Type': 'application/json'
                    }
                });
                
                let partyMemberData = null;
                if (partyMemberResponse.ok) {
                    const partyMembers = await partyMemberResponse.json();
                    if (partyMembers.length > 0) {
                        partyMemberData = partyMembers[0];
                        accessLevels.groomsmen_portal = true;
                    }
                }
                
                // Check for admin access (based on email domain or specific admin users)
                // For now, allow admin access for certain email patterns or explicitly set admin users
                const adminEmails = ['admin@kctmenswear.com', 'support@kctmenswear.com'];
                const isAdminEmail = adminEmails.includes(profile.email?.toLowerCase());
                const isExplicitAdmin = profile.wedding_role === 'admin' || profile.account_status === 'admin';
                
                if (isAdminEmail || isExplicitAdmin) {
                    accessLevels.admin_portal = true;
                }
                
                // Create unified session data
                const sessionInfo = {
                    user_id: user_id,
                    profile: profile,
                    access_levels: accessLevels,
                    couple_wedding: coupleWedding,
                    party_member_data: partyMemberData,
                    portal_context: {
                        current_portal: portal_type,
                        available_portals: Object.keys(accessLevels).filter(portal => accessLevels[portal]),
                        primary_role: coupleWedding ? 'couple' : partyMemberData ? 'party_member' : 'customer'
                    },
                    session_created: new Date().toISOString(),
                    session_expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
                };
                
                return new Response(JSON.stringify({
                    success: true,
                    data: {
                        session_info: sessionInfo,
                        access_token_data: {
                            user_id: user_id,
                            portal_access: accessLevels,
                            primary_role: sessionInfo.portal_context.primary_role
                        }
                    }
                }), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
                
            case 'validate_portal_access':
                // Validate if user has access to specific portal
                const { portal_name, required_role } = requestData;
                
                const validateProfileResponse = await fetch(`${supabaseUrl}/rest/v1/user_profiles?user_id=eq.${user_id}&select=*`, {
                    headers: {
                        'Authorization': `Bearer ${supabaseKey}`,
                        'apikey': supabaseKey,
                        'Content-Type': 'application/json'
                    }
                });
                
                if (!validateProfileResponse.ok) {
                    return new Response(JSON.stringify({
                        success: false,
                        has_access: false,
                        error: 'User profile not found'
                    }), {
                        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                    });
                }
                
                const validateProfiles = await validateProfileResponse.json();
                
                if (validateProfiles.length === 0) {
                    return new Response(JSON.stringify({
                        success: false,
                        has_access: false,
                        error: 'User profile not found'
                    }), {
                        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                    });
                }
                
                let hasAccess = false;
                let accessReason = 'No access granted';
                
                switch (portal_name) {
                    case 'couples_portal':
                        const coupleCheckResponse = await fetch(`${supabaseUrl}/rest/v1/weddings?or=(primary_customer_id.eq.${user_id},partner_customer_id.eq.${user_id})&select=id`, {
                            headers: {
                                'Authorization': `Bearer ${supabaseKey}`,
                                'apikey': supabaseKey,
                                'Content-Type': 'application/json'
                            }
                        });
                        
                        if (coupleCheckResponse.ok) {
                            const coupleWeddings = await coupleCheckResponse.json();
                            hasAccess = coupleWeddings.length > 0;
                            accessReason = hasAccess ? 'User is couple in wedding' : 'User is not a couple';
                        }
                        break;
                        
                    case 'groomsmen_portal':
                        const partyCheckResponse = await fetch(`${supabaseUrl}/rest/v1/wedding_party_members?user_id=eq.${user_id}&select=id`, {
                            headers: {
                                'Authorization': `Bearer ${supabaseKey}`,
                                'apikey': supabaseKey,
                                'Content-Type': 'application/json'
                            }
                        });
                        
                        if (partyCheckResponse.ok) {
                            const partyMembers = await partyCheckResponse.json();
                            hasAccess = partyMembers.length > 0;
                            accessReason = hasAccess ? 'User is wedding party member' : 'User is not a party member';
                        }
                        break;
                        
                    case 'admin_portal':
                        // Check admin role from user profile or email
                        const adminEmails = ['admin@kctmenswear.com', 'support@kctmenswear.com'];
                        const userProfile = validateProfiles[0];
                        const isAdminEmail = adminEmails.includes(userProfile.email?.toLowerCase());
                        const isExplicitAdmin = userProfile.wedding_role === 'admin' || userProfile.account_status === 'admin';
                        
                        hasAccess = isAdminEmail || isExplicitAdmin;
                        accessReason = hasAccess ? 'User has admin access' : 'User does not have admin access';
                        break;
                        
                    case 'enhanced_profile':
                        // All authenticated users have access to profile system
                        hasAccess = true;
                        accessReason = 'All users have profile access';
                        break;
                        
                    default:
                        hasAccess = false;
                        accessReason = 'Unknown portal type';
                }
                
                return new Response(JSON.stringify({
                    success: true,
                    has_access: hasAccess,
                    access_reason: accessReason,
                    user_profile: validateProfiles[0]
                }), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
                
            case 'switch_portal_context':
                // Switch user context between portals
                const { target_portal, context_data } = requestData;
                
                // Update user session context in database if needed
                const contextProfile = await fetch(`${supabaseUrl}/rest/v1/user_profiles?user_id=eq.${user_id}`, {
                    method: 'PATCH',
                    headers: {
                        'Authorization': `Bearer ${supabaseKey}`,
                        'apikey': supabaseKey,
                        'Content-Type': 'application/json',
                        'Prefer': 'return=representation'
                    },
                    body: JSON.stringify({
                        last_portal_accessed: target_portal,
                        portal_context: {
                            ...context_data,
                            last_switched: new Date().toISOString()
                        },
                        updated_at: new Date().toISOString()
                    })
                });
                
                let updatedProfile = null;
                if (contextProfile.ok) {
                    const updatedProfiles = await contextProfile.json();
                    updatedProfile = updatedProfiles[0];
                }
                
                return new Response(JSON.stringify({
                    success: true,
                    data: {
                        target_portal: target_portal,
                        profile: updatedProfile,
                        context_updated: true
                    }
                }), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
                
            default:
                throw new Error(`Unknown action: ${action}`);
        }
        
    } catch (error) {
        console.error('Session manager error:', error);
        
        const errorResponse = {
            success: false,
            error: {
                code: 'SESSION_MANAGER_ERROR',
                message: error.message
            }
        };

        return new Response(JSON.stringify(errorResponse), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});