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

        // Fetch product and inventory data
        const [productsResponse, ordersResponse, orderItemsResponse] = await Promise.all([
            fetch(`${SUPABASE_URL}/rest/v1/products?select=*`, {
                headers: {
                    'apikey': SUPABASE_SERVICE_ROLE_KEY,
                    'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
                }
            }),
            fetch(`${SUPABASE_URL}/rest/v1/orders?select=*&order=created_at.desc&limit=500`, {
                headers: {
                    'apikey': SUPABASE_SERVICE_ROLE_KEY,
                    'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
                }
            }),
            fetch(`${SUPABASE_URL}/rest/v1/order_items?select=*&order=created_at.desc&limit=1000`, {
                headers: {
                    'apikey': SUPABASE_SERVICE_ROLE_KEY,
                    'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
                }
            })
        ]);

        const [products, orders, orderItems] = await Promise.all([
            productsResponse.json(),
            ordersResponse.json(),
            orderItemsResponse.json()
        ]);

        const requestData = await req.json();
        const { 
            optimization_type = 'stock_levels',
            algorithms = ['abc_analysis', 'eoq', 'safety_stock'],
            constraints = {}
        } = requestData;

        // Prepare inventory optimization payload
        const inventoryPayload = {
            inventory_data: {
                products,
                sales_history: orders,
                order_items: orderItems
            },
            optimization_config: {
                type: optimization_type,
                algorithms,
                constraints: {
                    budget_limit: constraints.budget || null,
                    storage_capacity: constraints.storage || null,
                    supplier_constraints: constraints.suppliers || null,
                    seasonal_factors: constraints.seasonality || true
                }
            },
            timestamp: new Date().toISOString()
        };

        console.log('Calling KCT API at:', `${KCT_API_URL}/inventory-optimization/analyze`);

        // Call KCT Knowledge API for inventory optimization
        const kctResponse = await fetch(`${KCT_API_URL}/inventory-optimization/analyze`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${KCT_API_KEY}`
            },
            body: JSON.stringify(inventoryPayload)
        });

        console.log('KCT API Response Status:', kctResponse.status);

        if (!kctResponse.ok) {
            const errorText = await kctResponse.text();
            console.error('KCT API Error:', errorText);
            throw new Error(`Inventory optimization API error: ${kctResponse.status} - ${errorText}`);
        }

        const inventoryData = await kctResponse.json();
        console.log('KCT API Success - Response received');

        return new Response(JSON.stringify({ 
            success: true,
            data: inventoryData,
            metadata: {
                optimization_type,
                products_analyzed: products.length,
                sales_records: orderItems.length,
                algorithms_used: algorithms,
                generated_at: new Date().toISOString()
            }
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Inventory optimization error:', error);
        
        return new Response(JSON.stringify({
            error: {
                code: 'INVENTORY_OPTIMIZATION_ERROR',
                message: error.message
            }
        }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});