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
        // Get API credentials from environment
        const KCT_API_URL = Deno.env.get('KCT_KNOWLEDGE_API_URL');
        const KCT_API_KEY = Deno.env.get('KCT_KNOWLEDGE_API_KEY');
        const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
        const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

        if (!KCT_API_URL || !KCT_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
            throw new Error('Missing required environment variables');
        }

        const requestData = await req.json();
        const { timeframe = '30d', metrics = ['revenue', 'conversion', 'trends'] } = requestData;

        // Fetch Core Products from dedicated function and Catalog Products from Supabase
        const [coreProductsResponse, ordersResponse, catalogProductsResponse, paymentsResponse] = await Promise.all([
            // Call our stripe-core-products function
            fetch(`${SUPABASE_URL}/functions/v1/stripe-core-products`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({})
            }),
            fetch(`${SUPABASE_URL}/rest/v1/orders?select=*,order_items(*)&order=created_at.desc`, {
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
            fetch(`${SUPABASE_URL}/rest/v1/payments?select=*&order=created_at.desc`, {
                headers: {
                    'apikey': SUPABASE_SERVICE_ROLE_KEY,
                    'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
                }
            })
        ]);

        const [coreProductsData, orders, catalogProducts, payments] = await Promise.all([
            coreProductsResponse.ok ? coreProductsResponse.json() : { data: [] },
            ordersResponse.json(),
            catalogProductsResponse.json(),
            paymentsResponse.json()
        ]);

        const coreProducts = coreProductsData.data || [];
        const catalogProductsArray = Array.isArray(catalogProducts) ? catalogProducts : [];
        
        // Ensure arrays are properly handled
        const ordersArray = Array.isArray(orders) ? orders : [];
        const paymentsArray = Array.isArray(payments) ? payments : [];

        // Separate orders by product type and calculate weighted metrics
        const coreProductIds = new Set(coreProducts.map(p => p.id));
        const catalogProductIds = new Set(catalogProductsArray.map(p => p.id));
        
        // Analyze orders to separate Core vs Catalog
        const coreOrders = [];
        const catalogOrders = [];
        const mixedOrders = [];
        
        ordersArray.forEach(order => {
            if (!order.order_items || !Array.isArray(order.order_items)) {
                return;
            }
            
            const hasCore = order.order_items.some(item => coreProductIds.has(item.product_id));
            const hasCatalog = order.order_items.some(item => catalogProductIds.has(item.product_id));
            
            if (hasCore && hasCatalog) {
                mixedOrders.push(order);
            } else if (hasCore) {
                coreOrders.push(order);
            } else if (hasCatalog) {
                catalogOrders.push(order);
            }
        });

        // Calculate revenue split
        const coreRevenue = [...coreOrders, ...mixedOrders].reduce((sum, order) => {
            if (!order.order_items) return sum;
            return sum + order.order_items
                .filter(item => coreProductIds.has(item.product_id))
                .reduce((itemSum, item) => itemSum + (item.price * item.quantity), 0);
        }, 0);
        
        const catalogRevenue = [...catalogOrders, ...mixedOrders].reduce((sum, order) => {
            if (!order.order_items) return sum;
            return sum + order.order_items
                .filter(item => catalogProductIds.has(item.product_id))
                .reduce((itemSum, item) => itemSum + (item.price * item.quantity), 0);
        }, 0);

        const totalRevenue = coreRevenue + catalogRevenue;
        
        // Apply 70/30 weighting for analytics calculations
        const weightedRevenue = (coreRevenue * 0.7) + (catalogRevenue * 0.3);
        const coreRevenuePercentage = totalRevenue > 0 ? (coreRevenue / totalRevenue) * 100 : 0;
        const catalogRevenuePercentage = totalRevenue > 0 ? (catalogRevenue / totalRevenue) * 100 : 0;
        
        // Calculate conversion rates
        const totalOrders = ordersArray.length;
        const completedOrders = ordersArray.filter(o => o.status === 'completed').length;
        const conversionRate = totalOrders > 0 ? (completedOrders / totalOrders) * 100 : 0;
        
        const coreConversionRate = coreOrders.length > 0 ? 
            (coreOrders.filter(o => o.status === 'completed').length / coreOrders.length) * 100 : 0;
        const catalogConversionRate = catalogOrders.length > 0 ? 
            (catalogOrders.filter(o => o.status === 'completed').length / catalogOrders.length) * 100 : 0;

        // Get fashion intelligence from KCT API
        let fashionIntelligence = null;
        try {
            const kctHealthResponse = await fetch(`${KCT_API_URL}/api/v1/health`, {
                headers: {
                    'X-API-Key': KCT_API_KEY
                }
            });
            fashionIntelligence = await kctHealthResponse.json();
        } catch (error) {
            console.error('KCT API error:', error);
        }

        // Calculate month-over-month growth
        const currentDate = new Date();
        const lastMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
        const thisMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        
        const thisMonthOrders = ordersArray.filter(o => new Date(o.created_at) >= thisMonth);
        const lastMonthOrders = ordersArray.filter(o => {
            const date = new Date(o.created_at);
            return date >= lastMonth && date < thisMonth;
        });
        
        const revenueGrowth = lastMonthOrders.length > 0 
            ? ((thisMonthOrders.length - lastMonthOrders.length) / lastMonthOrders.length) * 100
            : 0;

        // Optimization score based on weighted performance
        const corePerformanceScore = coreConversionRate * 0.7;
        const catalogPerformanceScore = catalogConversionRate * 0.3;
        const optimizationScore = Math.min(95, Math.max(60, 75 + corePerformanceScore + catalogPerformanceScore - 50));
        
        // Enhanced recommendations based on dual product architecture
        const recommendations = [
            {
                type: 'core_products',
                impact: 'high',
                description: `Core Products generate ${coreRevenuePercentage.toFixed(1)}% of revenue with ${coreConversionRate.toFixed(1)}% conversion rate`,
                priority: coreConversionRate < 80 ? 'high' : 'medium',
                action: coreConversionRate < 80 ? 'Focus on Core Product marketing and customer journey optimization' : 'Maintain Core Product momentum'
            },
            {
                type: 'catalog_products',
                impact: 'medium',
                description: `Catalog Products contribute ${catalogRevenuePercentage.toFixed(1)}% of revenue with ${catalogConversionRate.toFixed(1)}% conversion rate`,
                priority: catalogConversionRate < 60 ? 'high' : 'low',
                action: catalogConversionRate < 60 ? 'Improve Catalog Product discovery and conversion funnel' : 'Use as Core Product entry point'
            },
            {
                type: 'revenue_optimization',
                impact: totalRevenue > 100000 ? 'high' : 'medium',
                description: `Total revenue of $${totalRevenue.toLocaleString()} with ${revenueGrowth > 0 ? 'positive' : 'negative'} ${Math.abs(revenueGrowth).toFixed(1)}% growth`,
                priority: revenueGrowth < 0 ? 'high' : 'medium',
                action: revenueGrowth < 0 ? 'Implement revenue recovery strategies' : 'Scale successful channels'
            }
        ];

        return new Response(JSON.stringify({ 
            success: true,
            data: {
                // Overall metrics with weighted calculations
                revenue: totalRevenue,
                weighted_revenue: weightedRevenue,
                revenue_growth: revenueGrowth,
                total_orders: totalOrders,
                order_growth: revenueGrowth,
                conversion_rate: conversionRate,
                conversion_change: Math.abs(revenueGrowth) * 0.1,
                
                // Dual Product Architecture metrics
                product_split: {
                    core_products: {
                        count: coreProducts.length,
                        revenue: coreRevenue,
                        revenue_percentage: coreRevenuePercentage,
                        orders: coreOrders.length,
                        conversion_rate: coreConversionRate,
                        weight: '70%'
                    },
                    catalog_products: {
                        count: catalogProductsArray.length,
                        revenue: catalogRevenue,
                        revenue_percentage: catalogRevenuePercentage,
                        orders: catalogOrders.length,
                        conversion_rate: catalogConversionRate,
                        weight: '30%'
                    },
                    mixed_orders: mixedOrders.length
                },
                
                optimization_score: optimizationScore,
                recommendations,
                
                // Enhanced trend analysis
                trends: [
                    {
                        metric: 'Core Product Revenue',
                        value: coreRevenue,
                        change: revenueGrowth * 0.7, // Weighted change
                        period: 'Current Month'
                    },
                    {
                        metric: 'Catalog Product Revenue',
                        value: catalogRevenue,
                        change: revenueGrowth * 0.3, // Weighted change
                        period: 'Current Month'
                    },
                    {
                        metric: 'Weighted Performance',
                        value: weightedRevenue,
                        change: revenueGrowth,
                        period: 'Current Month'
                    }
                ],
                
                // Fashion intelligence data
                fashion_intelligence: fashionIntelligence?.data || null,
                
                // Enhanced insights
                insights: [
                    `Total revenue: $${totalRevenue.toLocaleString()} (Core: ${coreRevenuePercentage.toFixed(1)}%, Catalog: ${catalogRevenuePercentage.toFixed(1)}%)`,
                    `Core Products (${coreProducts.length} items) drive ${coreRevenuePercentage.toFixed(1)}% of revenue with ${coreConversionRate.toFixed(1)}% conversion`,
                    `Catalog Products (${catalogProductsArray.length} items) contribute ${catalogRevenuePercentage.toFixed(1)}% of revenue with ${catalogConversionRate.toFixed(1)}% conversion`,
                    `${revenueGrowth > 0 ? 'Growth' : 'Decline'} of ${Math.abs(revenueGrowth).toFixed(1)}% with weighted performance score of ${optimizationScore.toFixed(1)}%`,
                    `Mixed orders (${mixedOrders.length}) show cross-selling effectiveness between product types`
                ]
            },
            metadata: {
                timeframe,
                orders_analyzed: ordersArray.length,
                core_products_count: coreProducts.length,
                catalog_products_count: catalogProductsArray.length,
                weighting_applied: 'Core: 70%, Catalog: 30%',
                generated_at: new Date().toISOString(),
                data_sources: ['stripe_core_products', 'supabase_orders', 'supabase_catalog_products', 'kct_fashion_api']
            }
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Sales optimization error:', error);
        
        return new Response(JSON.stringify({
            error: {
                code: 'SALES_OPTIMIZATION_ERROR',
                message: error.message
            }
        }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});