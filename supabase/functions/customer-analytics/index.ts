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

        // Fetch customer and order data for behavioral analysis
        const [customersResponse, ordersResponse, paymentsResponse] = await Promise.all([
            fetch(`${SUPABASE_URL}/rest/v1/customers?select=*&order=created_at.desc`, {
                headers: {
                    'apikey': SUPABASE_SERVICE_ROLE_KEY,
                    'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
                }
            }),
            fetch(`${SUPABASE_URL}/rest/v1/orders?select=*,order_items(*),customer_id&order=created_at.desc`, {
                headers: {
                    'apikey': SUPABASE_SERVICE_ROLE_KEY,
                    'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
                }
            }),
            fetch(`${SUPABASE_URL}/rest/v1/payments?select=*&order=created_at.desc`, {
                headers: {
                    'apikey': SUPABASE_SERVICE_ROLE_KEY,
                    'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
                }
            })
        ]);

        const [customers, orders, payments] = await Promise.all([
            customersResponse.json(),
            ordersResponse.json(),
            paymentsResponse.json()
        ]);

        const requestData = await req.json();
        const { 
            analysis_type = 'behavior',
            segment_criteria = ['purchase_frequency', 'value', 'recency'],
            timeframe = '6m'
        } = requestData;

        // Prepare customer analytics payload
        const customerPayload = {
            customer_data: {
                customers,
                orders,
                payments
            },
            analysis_config: {
                type: analysis_type,
                segmentation: segment_criteria,
                timeframe,
                metrics: ['clv', 'churn_risk', 'satisfaction', 'preferences']
            },
            timestamp: new Date().toISOString()
        };

        console.log('Calling KCT API at:', `${KCT_API_URL}/customer-analytics/analyze`);

        // Call KCT Knowledge API for customer analytics
        const kctResponse = await fetch(`${KCT_API_URL}/customer-analytics/analyze`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${KCT_API_KEY}`
            },
            body: JSON.stringify(customerPayload)
        });

        console.log('KCT API Response Status:', kctResponse.status);

        if (!kctResponse.ok) {
            const errorText = await kctResponse.text();
            console.error('KCT API Error:', errorText);
            throw new Error(`Customer analytics API error: ${kctResponse.status} - ${errorText}`);
        }

        const customerData = await kctResponse.json();
        console.log('KCT API Success - Response received');

        return new Response(JSON.stringify({ 
            success: true,
            data: customerData,
            metadata: {
                analysis_type,
                customers_analyzed: customers.length,
                orders_analyzed: orders.length,
                timeframe,
                generated_at: new Date().toISOString()
            }
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Customer analytics error:', error);
        
        return new Response(JSON.stringify({
            error: {
                code: 'CUSTOMER_ANALYTICS_ERROR',
                message: error.message
            }
        }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});