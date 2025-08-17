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
        const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY');
        const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
        const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

        if (!STRIPE_SECRET_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
            throw new Error('Missing required environment variables');
        }

        // Fetch Core Products from Stripe
        const stripeResponse = await fetch('https://api.stripe.com/v1/products?limit=100&active=true', {
            headers: {
                'Authorization': `Bearer ${STRIPE_SECRET_KEY}`,
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });

        if (!stripeResponse.ok) {
            throw new Error(`Stripe API error: ${stripeResponse.status}`);
        }

        const stripeData = await stripeResponse.json();
        const coreProducts = stripeData.data || [];

        // Fetch Catalog Products from Supabase
        const supabaseResponse = await fetch(`${SUPABASE_URL}/rest/v1/products?select=*`, {
            headers: {
                'apikey': SUPABASE_SERVICE_ROLE_KEY,
                'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
            }
        });

        const catalogProducts = await supabaseResponse.json();
        const catalogArray = Array.isArray(catalogProducts) ? catalogProducts : [];

        // Fetch order data to analyze product performance
        const ordersResponse = await fetch(`${SUPABASE_URL}/rest/v1/orders?select=*,order_items(*)&order=created_at.desc`, {
            headers: {
                'apikey': SUPABASE_SERVICE_ROLE_KEY,
                'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
            }
        });

        const orders = await ordersResponse.json();
        const ordersArray = Array.isArray(orders) ? orders : [];

        // Analyze Core vs Catalog performance
        const coreProductIds = coreProducts.map(p => p.id);
        const catalogProductIds = catalogArray.map(p => p.id);

        // Calculate revenue split between Core and Catalog
        let coreRevenue = 0;
        let catalogRevenue = 0;
        let coreOrderCount = 0;
        let catalogOrderCount = 0;

        ordersArray.forEach(order => {
            const orderTotal = order.total_amount || 0;
            if (order.order_items && order.order_items.length > 0) {
                const hasCore = order.order_items.some(item => 
                    coreProductIds.includes(item.stripe_product_id) || 
                    (item.product_id && coreProductIds.includes(item.product_id))
                );
                const hasCatalog = order.order_items.some(item => 
                    catalogProductIds.includes(item.product_id)
                );

                if (hasCore) {
                    coreRevenue += orderTotal;
                    coreOrderCount++;
                } else if (hasCatalog) {
                    catalogRevenue += orderTotal;
                    catalogOrderCount++;
                }
            }
        });

        // Customer segmentation by product type
        const coreCustomers = [];
        const catalogCustomers = [];
        const hybridCustomers = [];

        const customerMap = new Map();
        ordersArray.forEach(order => {
            if (!customerMap.has(order.customer_id)) {
                customerMap.set(order.customer_id, {
                    id: order.customer_id,
                    email: order.customer_email,
                    coreOrders: 0,
                    catalogOrders: 0,
                    totalValue: 0
                });
            }
            
            const customer = customerMap.get(order.customer_id);
            customer.totalValue += order.total_amount || 0;

            if (order.order_items) {
                const hasCore = order.order_items.some(item => 
                    coreProductIds.includes(item.stripe_product_id) || 
                    coreProductIds.includes(item.product_id)
                );
                const hasCatalog = order.order_items.some(item => 
                    catalogProductIds.includes(item.product_id)
                );

                if (hasCore) customer.coreOrders++;
                if (hasCatalog) customer.catalogOrders++;
            }
        });

        customerMap.forEach(customer => {
            if (customer.coreOrders > 0 && customer.catalogOrders > 0) {
                hybridCustomers.push(customer);
            } else if (customer.coreOrders > 0) {
                coreCustomers.push(customer);
            } else if (customer.catalogOrders > 0) {
                catalogCustomers.push(customer);
            }
        });

        // Style leaders identification (Core product purchasers)
        const styleLeaders = coreCustomers.concat(hybridCustomers)
            .sort((a, b) => b.totalValue - a.totalValue)
            .slice(0, 10);

        // Product performance with weighted importance
        const totalRevenue = coreRevenue + catalogRevenue;
        const weightedRevenue = (coreRevenue * 0.7) + (catalogRevenue * 0.3);
        
        const coreProductPerformance = coreProducts.slice(0, 10).map(product => ({
            id: product.id,
            name: product.name,
            type: 'core',
            description: product.description,
            created: product.created,
            active: product.active,
            metadata: product.metadata,
            importance_weight: 0.7
        }));

        const catalogProductPerformance = catalogArray.slice(0, 10).map(product => ({
            id: product.id,
            name: product.name,
            type: 'catalog',
            description: product.description,
            inventory_quantity: product.inventory_quantity,
            price: product.price,
            importance_weight: 0.3
        }));

        return new Response(JSON.stringify({
            success: true,
            data: {
                // Product Architecture Overview
                product_architecture: {
                    core_products: {
                        count: coreProducts.length,
                        weight: 0.7,
                        revenue: coreRevenue,
                        orders: coreOrderCount
                    },
                    catalog_products: {
                        count: catalogArray.length,
                        weight: 0.3,
                        revenue: catalogRevenue,
                        orders: catalogOrderCount
                    },
                    total_revenue: totalRevenue,
                    weighted_revenue: weightedRevenue
                },

                // Customer Intelligence
                customer_intelligence: {
                    style_leaders: {
                        count: styleLeaders.length,
                        profiles: styleLeaders,
                        avg_order_value: styleLeaders.length > 0 
                            ? styleLeaders.reduce((sum, c) => sum + c.totalValue, 0) / styleLeaders.length 
                            : 0
                    },
                    segments: {
                        core_focused: {
                            count: coreCustomers.length,
                            percentage: ((coreCustomers.length / customerMap.size) * 100).toFixed(1)
                        },
                        catalog_focused: {
                            count: catalogCustomers.length,
                            percentage: ((catalogCustomers.length / customerMap.size) * 100).toFixed(1)
                        },
                        hybrid_buyers: {
                            count: hybridCustomers.length,
                            percentage: ((hybridCustomers.length / customerMap.size) * 100).toFixed(1)
                        }
                    }
                },

                // Product Performance
                product_performance: {
                    core_products: coreProductPerformance,
                    catalog_products: catalogProductPerformance
                },

                // Revenue Analytics
                revenue_analytics: {
                    core_share: totalRevenue > 0 ? ((coreRevenue / totalRevenue) * 100).toFixed(1) : 0,
                    catalog_share: totalRevenue > 0 ? ((catalogRevenue / totalRevenue) * 100).toFixed(1) : 0,
                    weighted_performance: {
                        score: weightedRevenue > 0 ? Math.min(100, (weightedRevenue / 100000) * 100) : 0,
                        interpretation: 'Core products weighted at 70% importance'
                    }
                },

                // Conversion Path Analysis
                conversion_analysis: {
                    catalog_to_core_rate: catalogCustomers.length > 0 
                        ? ((hybridCustomers.length / catalogCustomers.length) * 100).toFixed(1)
                        : 0,
                    core_retention_rate: coreCustomers.length > 0 
                        ? (((coreCustomers.length + hybridCustomers.length) / (coreCustomers.length + hybridCustomers.length)) * 100).toFixed(1)
                        : 0
                }
            },
            metadata: {
                core_products_fetched: coreProducts.length,
                catalog_products_fetched: catalogArray.length,
                orders_analyzed: ordersArray.length,
                unique_customers: customerMap.size,
                generated_at: new Date().toISOString(),
                data_sources: ['stripe_core_products', 'supabase_catalog_products', 'supabase_orders']
            }
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Core products integration error:', error);
        
        return new Response(JSON.stringify({
            error: {
                code: 'CORE_PRODUCTS_ERROR',
                message: error.message
            }
        }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});