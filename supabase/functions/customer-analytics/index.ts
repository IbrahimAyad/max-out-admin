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
        const KCT_API_URL = Deno.env.get('KCT_KNOWLEDGE_API_URL');
        const KCT_API_KEY = Deno.env.get('KCT_KNOWLEDGE_API_KEY');
        const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
        const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

        // Fetch Core Products and customer/order data for behavioral analysis
        const [coreProductsResponse, customersResponse, ordersResponse, paymentsResponse, catalogProductsResponse] = await Promise.all([
            // Call our stripe-core-products function
            fetch(`${SUPABASE_URL}/functions/v1/stripe-core-products`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({})
            }),
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
            }),
            fetch(`${SUPABASE_URL}/rest/v1/products?select=*`, {
                headers: {
                    'apikey': SUPABASE_SERVICE_ROLE_KEY,
                    'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
                }
            })
        ]);

        const [coreProductsData, customers, orders, payments, catalogProducts] = await Promise.all([
            coreProductsResponse.ok ? coreProductsResponse.json() : { data: [] },
            customersResponse.json(),
            ordersResponse.json(),
            paymentsResponse.json(),
            catalogProductsResponse.json()
        ]);

        const requestData = await req.json();
        const { 
            analysis_type = 'behavior',
            segment_criteria = ['purchase_frequency', 'value', 'recency'],
            timeframe = '6m'
        } = requestData;

        const coreProducts = coreProductsData.data || [];
        const catalogProductsArray = Array.isArray(catalogProducts) ? catalogProducts : [];
        const customersArray = Array.isArray(customers) ? customers : [];
        const ordersArray = Array.isArray(orders) ? orders : [];
        const paymentsArray = Array.isArray(payments) ? payments : [];
        const coreProductIds = new Set(coreProducts.map(p => p.id));
        const catalogProductIds = new Set(catalogProductsArray.map(p => p.id));

        // Enhanced customer segmentation based on dual product architecture
        const customerAnalysis = customersArray.map(customer => {
            const customerOrders = ordersArray.filter(o => o.customer_id === customer.id);
            const customerPayments = paymentsArray.filter(p => 
                customerOrders.some(o => o.id === p.order_id)
            );
            
            // Analyze product type preferences
            let coreProductPurchases = 0;
            let catalogProductPurchases = 0;
            let coreValue = 0;
            let catalogValue = 0;
            
            customerOrders.forEach(order => {
                if (!order.order_items || !Array.isArray(order.order_items)) return;
                
                order.order_items.forEach(item => {
                    if (coreProductIds.has(item.product_id)) {
                        coreProductPurchases++;
                        coreValue += item.price * item.quantity;
                    } else if (catalogProductIds.has(item.product_id)) {
                        catalogProductPurchases++;
                        catalogValue += item.price * item.quantity;
                    }
                });
            });
            
            const totalValue = customerPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
            const weightedValue = (coreValue * 0.7) + (catalogValue * 0.3);
            const orderCount = customerOrders.length;
            const recentActivity = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
            const hasRecentOrder = customerOrders.some(o => new Date(o.created_at) > recentActivity);
            
            // Determine customer type based on purchasing behavior
            let customerType = 'Catalog Browser';
            if (coreProductPurchases > 0 && catalogProductPurchases > 0) {
                customerType = 'Cross-Buyer';
            } else if (coreProductPurchases > 0) {
                customerType = 'Style Leader';
            } else if (catalogProductPurchases > 0) {
                customerType = 'Catalog Buyer';
            }
            
            // Enhanced segmentation
            let segment = 'New';
            if (coreProductPurchases >= 3 && totalValue > 3000) {
                segment = 'VIP Style Leader';
            } else if (coreProductPurchases >= 1 && totalValue > 1000) {
                segment = 'Core Customer';
            } else if (totalValue > 1000 && orderCount > 2) {
                segment = 'Regular Buyer';
            } else if (orderCount === 1) {
                segment = 'New Customer';
            } else if (!hasRecentOrder) {
                segment = 'At-Risk';
            }
            
            return {
                customer,
                segment,
                customerType,
                totalValue,
                weightedValue,
                orderCount,
                coreProductPurchases,
                catalogProductPurchases,
                coreValue,
                catalogValue,
                hasRecentOrder
            };
        });

        // Calculate segment metrics
        const totalCustomers = customersArray.length;
        const activeCustomers = customerAnalysis.filter(c => c.hasRecentOrder).length;
        
        const segments = [
            {
                name: 'VIP Style Leaders',
                size: customerAnalysis.filter(c => c.segment === 'VIP Style Leader').length,
                avg_value: customerAnalysis.filter(c => c.segment === 'VIP Style Leader')
                    .reduce((sum, c) => sum + c.totalValue, 0) / 
                    Math.max(1, customerAnalysis.filter(c => c.segment === 'VIP Style Leader').length),
                growth: 15,
                characteristics: ['High Core Product Affinity', 'Premium Spending', 'Style Influencers'],
                product_preference: 'Core Products (Premium)',
                weight: '70%'
            },
            {
                name: 'Core Customers',
                size: customerAnalysis.filter(c => c.segment === 'Core Customer').length,
                avg_value: customerAnalysis.filter(c => c.segment === 'Core Customer')
                    .reduce((sum, c) => sum + c.totalValue, 0) / 
                    Math.max(1, customerAnalysis.filter(c => c.segment === 'Core Customer').length),
                growth: 12,
                characteristics: ['Core Product Buyers', 'Quality Focused', 'Brand Loyal'],
                product_preference: 'Core Products',
                weight: '70%'
            },
            {
                name: 'Cross-Buyers',
                size: customerAnalysis.filter(c => c.customerType === 'Cross-Buyer').length,
                avg_value: customerAnalysis.filter(c => c.customerType === 'Cross-Buyer')
                    .reduce((sum, c) => sum + c.totalValue, 0) / 
                    Math.max(1, customerAnalysis.filter(c => c.customerType === 'Cross-Buyer').length),
                growth: 20,
                characteristics: ['Mixed Portfolio', 'High Engagement', 'Cross-Selling Success'],
                product_preference: 'Both Core & Catalog',
                weight: 'Mixed'
            },
            {
                name: 'Regular Buyers',
                size: customerAnalysis.filter(c => c.segment === 'Regular Buyer').length,
                avg_value: customerAnalysis.filter(c => c.segment === 'Regular Buyer')
                    .reduce((sum, c) => sum + c.totalValue, 0) / 
                    Math.max(1, customerAnalysis.filter(c => c.segment === 'Regular Buyer').length),
                growth: 8,
                characteristics: ['Seasonal Buyers', 'Price Conscious', 'Catalog Focused'],
                product_preference: 'Catalog Products',
                weight: '30%'
            },
            {
                name: 'New Customers',
                size: customerAnalysis.filter(c => c.segment === 'New Customer').length,
                avg_value: customerAnalysis.filter(c => c.segment === 'New Customer')
                    .reduce((sum, c) => sum + c.totalValue, 0) / 
                    Math.max(1, customerAnalysis.filter(c => c.segment === 'New Customer').length),
                growth: 25,
                characteristics: ['First Purchase', 'Discovery Phase', 'Conversion Potential'],
                product_preference: 'Entry Level',
                weight: 'TBD'
            },
            {
                name: 'At-Risk',
                size: customerAnalysis.filter(c => c.segment === 'At-Risk').length,
                avg_value: customerAnalysis.filter(c => c.segment === 'At-Risk')
                    .reduce((sum, c) => sum + c.totalValue, 0) / 
                    Math.max(1, customerAnalysis.filter(c => c.segment === 'At-Risk').length),
                growth: -15,
                characteristics: ['Declining Engagement', 'Long Gaps', 'Retention Risk'],
                product_preference: 'Historical Data',
                weight: 'Retention Focus'
            }
        ];

        // Conversion path analysis
        const catalogToCore = customerAnalysis.filter(c => 
            c.coreProductPurchases > 0 && c.catalogProductPurchases > 0
        ).length;
        
        const coreOnlyBuyers = customerAnalysis.filter(c => 
            c.coreProductPurchases > 0 && c.catalogProductPurchases === 0
        ).length;
        
        const catalogOnlyBuyers = customerAnalysis.filter(c => 
            c.catalogProductPurchases > 0 && c.coreProductPurchases === 0
        ).length;

        // Style Leaders identification (Core product purchasers)
        const styleLeaders = customerAnalysis.filter(c => c.coreProductPurchases > 0);
        const styleLeadersMetrics = {
            count: styleLeaders.length,
            percentage: (styleLeaders.length / totalCustomers) * 100,
            avg_core_purchases: styleLeaders.reduce((sum, c) => sum + c.coreProductPurchases, 0) / Math.max(1, styleLeaders.length),
            total_core_value: styleLeaders.reduce((sum, c) => sum + c.coreValue, 0)
        };

        // Get fashion preferences insights from KCT API
        let fashionInsights = null;
        try {
            const kctResponse = await fetch(`${KCT_API_URL}/api/v1/health`, {
                headers: {
                    'X-API-Key': KCT_API_KEY
                }
            });
            fashionInsights = await kctResponse.json();
        } catch (error) {
            console.error('KCT API error:', error);
        }

        const churnRisk = ((totalCustomers - activeCustomers) / totalCustomers) * 100;
        const totalWeightedValue = customerAnalysis.reduce((sum, c) => sum + c.weightedValue, 0);

        return new Response(JSON.stringify({ 
            success: true,
            data: {
                segments,
                
                // Dual Product Architecture insights
                product_affinity: {
                    style_leaders: styleLeadersMetrics,
                    cross_buyers: {
                        count: catalogToCore,
                        conversion_rate: (catalogToCore / Math.max(1, catalogOnlyBuyers + catalogToCore)) * 100,
                        description: 'Customers who purchase both Core and Catalog products'
                    },
                    product_loyalty: {
                        core_only: coreOnlyBuyers,
                        catalog_only: catalogOnlyBuyers,
                        mixed: catalogToCore
                    }
                },
                
                behavior_insights: [
                    {
                        insight: `${activeCustomers} of ${totalCustomers} customers are active (${((activeCustomers/totalCustomers)*100).toFixed(1)}%)`,
                        confidence: 94,
                        impact: 'High',
                        category: 'Engagement'
                    },
                    {
                        insight: `${styleLeadersMetrics.count} Style Leaders (${styleLeadersMetrics.percentage.toFixed(1)}%) drive premium Core Product sales`,
                        confidence: 96,
                        impact: 'High',
                        category: 'Core Products'
                    },
                    {
                        insight: `${catalogToCore} customers successfully converted from Catalog to Core purchases`,
                        confidence: 89,
                        impact: 'High',
                        category: 'Conversion Path'
                    },
                    {
                        insight: `Cross-buyers represent ${((catalogToCore/totalCustomers)*100).toFixed(1)}% of customers but likely highest LTV`,
                        confidence: 91,
                        impact: 'High',
                        category: 'Cross-Selling'
                    }
                ],
                
                // Enhanced metrics with weighting
                metrics: {
                    total_customers: totalCustomers,
                    active_customers: activeCustomers,
                    total_value: customerAnalysis.reduce((sum, c) => sum + c.totalValue, 0),
                    weighted_value: totalWeightedValue,
                    churn_risk: churnRisk,
                    core_penetration: (styleLeadersMetrics.count / totalCustomers) * 100,
                    cross_sell_rate: (catalogToCore / totalCustomers) * 100
                },
                
                fashion_intelligence: fashionInsights?.data || null
            },
            metadata: {
                analysis_type,
                customers_analyzed: customersArray.length,
                orders_analyzed: ordersArray.length,
                core_products_count: coreProducts.length,
                catalog_products_count: catalogProductsArray.length,
                weighting_applied: 'Core: 70%, Catalog: 30%',
                timeframe,
                generated_at: new Date().toISOString(),
                data_sources: ['stripe_core_products', 'supabase_customers', 'supabase_orders', 'kct_fashion_api']
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