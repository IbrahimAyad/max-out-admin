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

        console.log('Creating fresh admin user for KCT Menswear');
        
        const adminEmail = 'kct.admin@business.com';
        const adminPassword = 'SecureKCT2025!';

        // First, check if user exists and delete if necessary
        console.log('Checking for existing user...');
        
        const listUsersResponse = await fetch(`${supabaseUrl}/auth/v1/admin/users`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey,
                'Content-Type': 'application/json'
            }
        });
        
        if (listUsersResponse.ok) {
            const users = await listUsersResponse.json();
            const existingUser = users.users?.find((u: any) => u.email === adminEmail);
            
            if (existingUser) {
                console.log('Deleting existing user:', existingUser.id);
                
                const deleteResponse = await fetch(`${supabaseUrl}/auth/v1/admin/users/${existingUser.id}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'apikey': serviceRoleKey
                    }
                });
                
                if (!deleteResponse.ok) {
                    console.log('Could not delete existing user, continuing anyway...');
                }
            }
        }

        // Create new user with admin privileges
        console.log('Creating new admin user:', adminEmail);
        
        const createUserResponse = await fetch(`${supabaseUrl}/auth/v1/admin/users`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: adminEmail,
                password: adminPassword,
                email_confirm: true,
                user_metadata: {
                    role: 'admin',
                    access_level: 'full',
                    created_by: 'system',
                    department: 'administration'
                },
                app_metadata: {
                    role: 'admin',
                    permissions: ['all']
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
            message: 'Fresh admin user created successfully',
            user_id: userData.id,
            email: userData.email,
            login_credentials: {
                email: adminEmail,
                password: adminPassword
            },
            confirmation_status: 'confirmed'
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Fresh admin user creation error:', error);
        
        const errorResponse = {
            error: {
                code: 'FRESH_ADMIN_CREATION_FAILED',
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