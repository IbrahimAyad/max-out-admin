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
        // Get API credentials - using the exact values provided
        const KCT_API_URL = 'https://kct-knowledge-api-2-production.up.railway.app';
        const KCT_API_KEY = 'kct-menswear-api-2024-secret';
        const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
        const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

        if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
            throw new Error('Missing required Supabase environment variables');
        }

        const requestData = await req.json();
        const { endpoint, params = {} } = requestData;

        // Fetch Supabase data for context
        const supabaseResponse = await fetch(`${SUPABASE_URL}/rest/v1/orders?select=*,order_items(*)`, {
            headers: {
                'apikey': SUPABASE_SERVICE_ROLE_KEY,
                'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        const supabaseData = await supabaseResponse.json();

        // Prepare data for KCT Knowledge API
        const kctPayload = {
            supabase_data: supabaseData,
            analysis_params: params,
            timestamp: new Date().toISOString()
        };

        console.log('Calling KCT API at:', `${KCT_API_URL}${endpoint}`);

        // Call KCT Knowledge API
        const kctResponse = await fetch(`${KCT_API_URL}${endpoint}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${KCT_API_KEY}`
            },
            body: JSON.stringify(kctPayload)
        });

        console.log('KCT API Response Status:', kctResponse.status);

        if (!kctResponse.ok) {
            const errorText = await kctResponse.text();
            console.error('KCT API Error:', errorText);
            throw new Error(`KCT API error: ${kctResponse.status} - ${errorText}`);
        }

        const kctData = await kctResponse.json();
        console.log('KCT API Success - Response received');

        return new Response(JSON.stringify({ 
            success: true, 
            data: kctData,
            metadata: {
                endpoint,
                timestamp: new Date().toISOString(),
                supabase_records: supabaseData.length
            }
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Analytics proxy error:', error);
        
        const errorResponse = {
            error: {
                code: 'ANALYTICS_PROXY_ERROR',
                message: error.message
            }
        };

        return new Response(JSON.stringify(errorResponse), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});