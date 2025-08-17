Deno.serve(async (req) => {
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
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

        // Fetch historical data for predictive analysis
        const [ordersResponse, inventoryResponse, customerResponse] = await Promise.all([
            fetch(`${SUPABASE_URL}/rest/v1/orders?select=*,order_items(*)&order=created_at.desc&limit=1000`, {
                headers: {
                    'apikey': SUPABASE_SERVICE_ROLE_KEY,
                    'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
                }
            }),
            fetch(`${SUPABASE_URL}/rest/v1/products?select=*`, {
                headers: {
                    'apikey': SUPABASE_SERVICE_ROLE_KEY,
                    'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
                }
            }),
            fetch(`${SUPABASE_URL}/rest/v1/customers?select=*&order=created_at.desc`, {
                headers: {
                    'apikey': SUPABASE_SERVICE_ROLE_KEY,
                    'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
                }
            })
        ]);

        const [orders, inventory, customers] = await Promise.all([
            ordersResponse.json(),
            inventoryResponse.json(),
            customerResponse.json()
        ]);

        const requestData = await req.json();
        const { 
            prediction_type = 'revenue',
            horizon = '90d',
            confidence_level = 0.95 
        } = requestData;

        // Prepare predictive analysis payload
        const predictionPayload = {
            historical_data: {
                orders,
                inventory,
                customers
            },
            prediction_config: {
                type: prediction_type,
                horizon,
                confidence_level,
                factors: ['seasonality', 'trends', 'promotions', 'inventory_levels']
            },
            timestamp: new Date().toISOString()
        };

        console.log('Calling KCT API at:', `${KCT_API_URL}/predictive-analytics/analyze`);

        // Call KCT Knowledge API for predictive analytics
        const kctResponse = await fetch(`${KCT_API_URL}/predictive-analytics/analyze`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${KCT_API_KEY}`
            },
            body: JSON.stringify(predictionPayload)
        });

        console.log('KCT API Response Status:', kctResponse.status);

        if (!kctResponse.ok) {
            const errorText = await kctResponse.text();
            console.error('KCT API Error:', errorText);
            throw new Error(`Predictive analytics API error: ${kctResponse.status} - ${errorText}`);
        }

        const predictionData = await kctResponse.json();
        console.log('KCT API Success - Response received');

        return new Response(JSON.stringify({ 
            success: true,
            data: predictionData,
            metadata: {
                prediction_type,
                horizon,
                historical_records: orders.length,
                generated_at: new Date().toISOString()
            }
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Predictive analytics error:', error);
        
        return new Response(JSON.stringify({
            error: {
                code: 'PREDICTIVE_ANALYTICS_ERROR',
                message: error.message
            }
        }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});