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
        const { action, wedding_code, email, password, user_data } = requestData;
        
        switch (action) {
            case 'validate_wedding_code':
                // Validate wedding code and return wedding information
                const weddingResponse = await fetch(`${supabaseUrl}/rest/v1/weddings?wedding_code=eq.${wedding_code}&select=*`, {
                    headers: {
                        'Authorization': `Bearer ${supabaseKey}`,
                        'apikey': supabaseKey,
                        'Content-Type': 'application/json'
                    }
                });
                
                if (!weddingResponse.ok) {
                    throw new Error('Failed to validate wedding code');
                }
                
                const weddings = await weddingResponse.json();
                
                if (weddings.length === 0) {
                    return new Response(JSON.stringify({
                        success: false,
                        error: 'Invalid wedding code'
                    }), {
                        status: 400,
                        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                    });
                }
                
                const wedding = weddings[0];
                
                return new Response(JSON.stringify({
                    success: true,
                    data: {
                        wedding,
                        requires_auth: true,
                        message: 'Wedding code valid. Please sign in or create account.'
                    }
                }), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
                
            case 'authenticate_with_wedding_code':
                // First validate wedding code
                const validateResponse = await fetch(`${supabaseUrl}/rest/v1/weddings?wedding_code=eq.${wedding_code}&select=*`, {
                    headers: {
                        'Authorization': `Bearer ${supabaseKey}`,
                        'apikey': supabaseKey,
                        'Content-Type': 'application/json'
                    }
                });
                
                if (!validateResponse.ok) {
                    throw new Error('Failed to validate wedding code');
                }
                
                const validWeddings = await validateResponse.json();
                
                if (validWeddings.length === 0) {
                    return new Response(JSON.stringify({
                        success: false,
                        error: 'Invalid wedding code'
                    }), {
                        status: 400,
                        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                    });
                }
                
                const validWedding = validWeddings[0];
                
                // Attempt to authenticate user with Supabase Auth
                let authResult;
                try {
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
                                    wedding_role: 'couple',
                                    wedding_code: wedding_code,
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
                
                // Check if user has access to this wedding
                const userId = authResult.user.id;
                const hasWeddingAccess = 
                    validWedding.primary_customer_id === userId ||
                    validWedding.partner_customer_id === userId;
                
                if (!hasWeddingAccess) {
                    // Link user to wedding as primary customer if not linked
                    if (!validWedding.primary_customer_id) {
                        const updateResponse = await fetch(`${supabaseUrl}/rest/v1/weddings?id=eq.${validWedding.id}`, {
                            method: 'PATCH',
                            headers: {
                                'Authorization': `Bearer ${supabaseKey}`,
                                'apikey': supabaseKey,
                                'Content-Type': 'application/json',
                                'Prefer': 'return=representation'
                            },
                            body: JSON.stringify({ 
                                primary_customer_id: userId,
                                updated_at: new Date().toISOString()
                            })
                        });
                        
                        if (!updateResponse.ok) {
                            console.error('Failed to link user to wedding');
                        }
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
                            wedding_role: 'couple',
                            is_wedding_customer: true,
                            wedding_preferences: {
                                wedding_code: wedding_code,
                                linked_wedding_id: validWedding.id
                            },
                            created_at: new Date().toISOString(),
                            updated_at: new Date().toISOString()
                        })
                    });
                    
                    if (createProfileResponse.ok) {
                        const createdProfiles = await createProfileResponse.json();
                        profile = createdProfiles[0];
                    }
                }
                
                return new Response(JSON.stringify({
                    success: true,
                    data: {
                        user: authResult.user,
                        session: authResult.session || authResult,
                        wedding: validWedding,
                        profile: profile,
                        wedding_code: wedding_code
                    }
                }), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
                
            case 'link_existing_user_to_wedding':
                // Link existing authenticated user to wedding
                const linkResponse = await fetch(`${supabaseUrl}/rest/v1/weddings?wedding_code=eq.${wedding_code}&select=*`, {
                    headers: {
                        'Authorization': `Bearer ${supabaseKey}`,
                        'apikey': supabaseKey,
                        'Content-Type': 'application/json'
                    }
                });
                
                if (!linkResponse.ok) {
                    throw new Error('Failed to find wedding');
                }
                
                const linkWeddings = await linkResponse.json();
                
                if (linkWeddings.length === 0) {
                    return new Response(JSON.stringify({
                        success: false,
                        error: 'Invalid wedding code'
                    }), {
                        status: 400,
                        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                    });
                }
                
                const linkWedding = linkWeddings[0];
                const { user_id } = requestData;
                
                // Update user profile with wedding information
                const updateProfileResponse = await fetch(`${supabaseUrl}/rest/v1/user_profiles?user_id=eq.${user_id}`, {
                    method: 'PATCH',
                    headers: {
                        'Authorization': `Bearer ${supabaseKey}`,
                        'apikey': supabaseKey,
                        'Content-Type': 'application/json',
                        'Prefer': 'return=representation'
                    },
                    body: JSON.stringify({
                        wedding_role: 'couple',
                        is_wedding_customer: true,
                        wedding_preferences: {
                            wedding_code: wedding_code,
                            linked_wedding_id: linkWedding.id
                        },
                        updated_at: new Date().toISOString()
                    })
                });
                
                if (!updateProfileResponse.ok) {
                    throw new Error('Failed to update profile');
                }
                
                const updatedProfiles = await updateProfileResponse.json();
                
                return new Response(JSON.stringify({
                    success: true,
                    data: {
                        wedding: linkWedding,
                        profile: updatedProfiles[0],
                        wedding_code: wedding_code
                    }
                }), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
                
            default:
                throw new Error(`Unknown action: ${action}`);
        }
        
    } catch (error) {
        console.error('Wedding code auth error:', error);
        
        const errorResponse = {
            success: false,
            error: {
                code: 'WEDDING_CODE_AUTH_ERROR',
                message: error.message
            }
        };

        return new Response(JSON.stringify(errorResponse), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});