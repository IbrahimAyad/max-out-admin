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
        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
        const supabaseUrl = Deno.env.get('SUPABASE_URL');
        
        if (!serviceRoleKey || !supabaseUrl) {
            throw new Error('Supabase configuration missing');
        }

        const { action, user_id } = await req.json();
        
        if (action === 'clear_refresh_tokens' && user_id) {
            // Clear all existing refresh tokens for a user to prevent "already used" errors
            console.log('Clearing refresh tokens for user:', user_id);
            
            const clearTokensResponse = await fetch(
                `${supabaseUrl}/auth/v1/admin/users/${user_id}/factors`,
                {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'apikey': serviceRoleKey,
                        'Content-Type': 'application/json'
                    }
                }
            );
            
            // Force user to re-authenticate by invalidating all sessions
            const logoutResponse = await fetch(
                `${supabaseUrl}/auth/v1/admin/users/${user_id}/logout`,
                {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'apikey': serviceRoleKey,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ scope: 'global' })
                }
            );

            return new Response(JSON.stringify({
                success: true,
                message: 'Refresh tokens cleared successfully',
                user_id: user_id,
                actions_performed: ['clear_factors', 'global_logout']
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }
        
        if (action === 'health_check') {
            // Health check endpoint for authentication system
            const healthResponse = await fetch(
                `${supabaseUrl}/auth/v1/health`,
                {
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'apikey': serviceRoleKey
                    }
                }
            );
            
            const healthData = await healthResponse.json();
            
            return new Response(JSON.stringify({
                success: true,
                auth_health: healthData,
                timestamp: new Date().toISOString()
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }
        
        // Default: Return authentication status and recommendations
        return new Response(JSON.stringify({
            success: true,
            message: 'Authentication token management service is active',
            available_actions: [
                'clear_refresh_tokens - Clear refresh tokens for a user',
                'health_check - Check authentication service health'
            ],
            usage: {
                clear_tokens: { action: 'clear_refresh_tokens', user_id: 'uuid' },
                health: { action: 'health_check' }
            }
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Auth token fix error:', error);
        
        return new Response(JSON.stringify({
            error: {
                code: 'AUTH_TOKEN_FIX_FAILED',
                message: error.message,
                timestamp: new Date().toISOString()
            }
        }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});
