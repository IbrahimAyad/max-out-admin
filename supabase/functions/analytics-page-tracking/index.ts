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

        // Parse request body - handle empty body gracefully
        let requestData;
        try {
            const body = await req.text();
            requestData = body ? JSON.parse(body) : {};
        } catch (parseError) {
            // If no body provided, use default values
            requestData = {
                page_path: '/test-default',
                page_title: 'Test Page'
            };
        }
        const { page_path, page_title, referrer, session_id, user_id, duration_seconds, exit_page, bounce } = requestData;

        // Validate required fields
        if (!page_path) {
            throw new Error('page_path is required');
        }

        // Insert analytics data
        const response = await fetch(`${supabaseUrl}/rest/v1/analytics_page_views`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
                page_path,
                page_title: page_title || null,
                referrer: referrer || null,
                session_id: session_id || null,
                user_id: user_id || null,
                duration_seconds: duration_seconds || null,
                exit_page: exit_page || false,
                bounce: bounce || false
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Database error: ${response.status} - ${errorText}`);
        }

        const data = await response.json();

        return new Response(JSON.stringify({
            data: {
                success: true,
                message: 'Page view tracked successfully'
            }
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Analytics page tracking error:', error);
        
        const errorResponse = {
            error: {
                code: 'ANALYTICS_TRACKING_ERROR',
                message: error.message
            }
        };

        return new Response(JSON.stringify(errorResponse), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});