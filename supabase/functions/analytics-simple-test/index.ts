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
        // Get Supabase credentials
        const supabaseUrl = Deno.env.get('SUPABASE_URL');
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
        
        if (!supabaseUrl || !supabaseKey) {
            throw new Error('Missing Supabase environment variables');
        }

        const headers = {
            'Authorization': `Bearer ${supabaseKey}`,
            'apikey': supabaseKey,
            'Content-Type': 'application/json'
        };

        // Insert a simple test record
        const response = await fetch(`${supabaseUrl}/rest/v1/analytics_page_views`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
                page_path: '/test-simple',
                page_title: 'Simple Test Page',
                referrer: 'edge-function-test'
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Database error: ${response.status} - ${errorText}`);
        }

        return new Response(JSON.stringify({
            data: {
                success: true,
                message: 'Analytics test successful'
            }
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Analytics test error:', error);
        
        const errorResponse = {
            error: {
                code: 'ANALYTICS_TEST_ERROR',
                message: error.message
            }
        };

        return new Response(JSON.stringify(errorResponse), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});