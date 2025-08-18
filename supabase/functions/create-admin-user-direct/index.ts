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
        // Get environment variables
        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
        const supabaseUrl = Deno.env.get('SUPABASE_URL');
        
        if (!serviceRoleKey || !supabaseUrl) {
            throw new Error('Supabase configuration missing');
        }

        const { email, password } = await req.json();
        
        if (!email || !password) {
            throw new Error('Email and password are required');
        }

        console.log('Creating admin user:', email);

        // Create user with admin privileges
        const createUserResponse = await fetch(`${supabaseUrl}/auth/v1/admin/users`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: email,
                password: password,
                email_confirm: true,
                user_metadata: {
                    role: 'admin',
                    access_level: 'full'
                }
            })
        });

        if (!createUserResponse.ok) {
            const errorText = await createUserResponse.text();
            console.error('Failed to create user:', errorText);
            throw new Error(`Failed to create user: ${errorText}`);
        }

        const userData = await createUserResponse.json();
        console.log('Admin user created successfully:', userData.id);

        return new Response(JSON.stringify({
            success: true,
            message: 'Admin user created successfully',
            user_id: userData.id,
            email: userData.email
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Admin user creation error:', error);
        
        const errorResponse = {
            error: {
                code: 'ADMIN_USER_CREATION_FAILED',
                message: error.message,
                timestamp: new Date().toISOString()
            }
        };

        return new Response(JSON.stringify(errorResponse), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});