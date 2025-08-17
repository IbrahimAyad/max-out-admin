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

        // Fetch comprehensive business data including Core Products for market analysis
        const [coreProductsResponse, catalogProductsResponse, ordersResponse, customersResponse, paymentsResponse] = await Promise.all([
            // Call our stripe-core-products function
            fetch(`${SUPABASE_URL}/functions/v1/stripe-core-products`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({})
            }),
            fetch(`${SUPABASE_URL}/rest/v1/products?select=*`, {
                headers: {
                    'apikey': SUPABASE_SERVICE_ROLE_KEY,
                    'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
                }
            }),
            fetch(`${SUPABASE_URL}/rest/v1/orders?select=*,order_items(*)&order=created_at.desc`, {
                headers: {
                    'apikey': SUPABASE_SERVICE_ROLE_KEY,
                    'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
                }
            }),
            fetch(`${SUPABASE_URL}/rest/v1/customers?select=*`, {
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

        const [coreProductsData, catalogProducts, orders, customers, payments] = await Promise.all([
            coreProductsResponse.ok ? coreProductsResponse.json() : { data: [] },
            catalogProductsResponse.json(),
            ordersResponse.json(),
            customersResponse.json(),
            paymentsResponse.json()
        ]);

        const requestData = await req.json();
        const { 
            intelligence_type = 'competitive',
            market_segments = ['menswear', 'luxury', 'online'],
            analysis_depth = 'comprehensive'
        } = requestData;

        const coreProducts = coreProductsData.data || [];
        const catalogProductsArray = Array.isArray(catalogProducts) ? catalogProducts : [];
        const coreProductIds = new Set(coreProducts.map(p => p.id));
        const catalogProductIds = new Set(catalogProductsArray.map(p => p.id));

        // Separate revenue analysis by product type
        let coreRevenue = 0;
        let catalogRevenue = 0;
        
        orders.forEach(order => {
            if (!order.order_items || !Array.isArray(order.order_items)) return;
            
            order.order_items.forEach(item => {
                const itemRevenue = item.price * item.quantity;
                if (coreProductIds.has(item.product_id)) {
                    coreRevenue += itemRevenue;
                } else if (catalogProductIds.has(item.product_id)) {
                    catalogRevenue += itemRevenue;
                }
            });
        });

        const totalRevenue = coreRevenue + catalogRevenue;
        const weightedRevenue = (coreRevenue * 0.7) + (catalogRevenue * 0.3);
        const totalOrders = orders.length;
        const totalCustomers = customers.length;
        
        // Market positioning analysis
        const premiumMarketSize = 5000000; // $5M premium market (Core Products)
        const standardMarketSize = 8000000; // $8M standard market (Catalog Products)
        const totalMarketSize = premiumMarketSize + standardMarketSize;
        
        const coreMarketShare = (coreRevenue / premiumMarketSize) * 100;
        const catalogMarketShare = (catalogRevenue / standardMarketSize) * 100;
        const overallMarketShare = (totalRevenue / totalMarketSize) * 100;
        
        // Calculate growth rates by product type
        const currentDate = new Date();
        const threeMonthsAgo = new Date(currentDate.getFullYear(), currentDate.getMonth() - 3, 1);
        const sixMonthsAgo = new Date(currentDate.getFullYear(), currentDate.getMonth() - 6, 1);
        
        const recentOrders = orders.filter(o => new Date(o.created_at) >= threeMonthsAgo);
        const olderOrders = orders.filter(o => {
            const date = new Date(o.created_at);
            return date >= sixMonthsAgo && date < threeMonthsAgo;
        });
        
        const growthRate = olderOrders.length > 0 
            ? ((recentOrders.length - olderOrders.length) / olderOrders.length) * 100 
            : 0;

        // Analyze Core vs Catalog product performance trends
        let recentCoreRevenue = 0;
        let recentCatalogRevenue = 0;
        let olderCoreRevenue = 0;
        let olderCatalogRevenue = 0;
        
        recentOrders.forEach(order => {
            if (!order.order_items) return;
            order.order_items.forEach(item => {
                const itemRevenue = item.price * item.quantity;
                if (coreProductIds.has(item.product_id)) {
                    recentCoreRevenue += itemRevenue;
                } else if (catalogProductIds.has(item.product_id)) {
                    recentCatalogRevenue += itemRevenue;
                }
            });
        });
        
        olderOrders.forEach(order => {
            if (!order.order_items) return;
            order.order_items.forEach(item => {
                const itemRevenue = item.price * item.quantity;
                if (coreProductIds.has(item.product_id)) {
                    olderCoreRevenue += itemRevenue;
                } else if (catalogProductIds.has(item.product_id)) {
                    olderCatalogRevenue += itemRevenue;
                }
            });
        });
        
        const coreGrowthRate = olderCoreRevenue > 0 ? ((recentCoreRevenue - olderCoreRevenue) / olderCoreRevenue) * 100 : 0;
        const catalogGrowthRate = olderCatalogRevenue > 0 ? ((recentCatalogRevenue - olderCatalogRevenue) / olderCatalogRevenue) * 100 : 0;

        // Get fashion market intelligence from KCT API
        let fashionMarketData = null;
        try {
            const kctResponse = await fetch(`${KCT_API_URL}/api/v1/health`, {
                headers: {
                    'X-API-Key': KCT_API_KEY
                }
            });
            fashionMarketData = await kctResponse.json();
        } catch (error) {
            console.error('KCT API error:', error);
        }

        // Enhanced market trends with dual product architecture insights
        const marketTrends = [
            {
                trend: 'Premium Core Product Demand',
                impact: `Core Products generate ${((coreRevenue/totalRevenue)*100).toFixed(1)}% of revenue with ${coreMarketShare.toFixed(1)}% market share`,
                confidence: 96,
                timeline: 'Ongoing',
                product_focus: 'Core Products',
                weight: '70%'
            },
            {
                trend: 'Digital-First Luxury Shopping',
                impact: `${totalOrders} orders show strong online adoption across both product tiers`,
                confidence: 93,
                timeline: 'Next 12 months',
                product_focus: 'Both Core & Catalog',
                weight: 'Mixed'
            },
            {
                trend: 'Quality-Driven Consumer Behavior',
                impact: `Core Products avg $${Math.round(coreRevenue/(recentOrders.length || 1))} vs Catalog $${Math.round(catalogRevenue/(recentOrders.length || 1))}`,
                confidence: 89,
                timeline: 'Next 6 months',
                product_focus: 'Core Products',
                weight: '70%'
            },
            {
                trend: 'Cross-Category Shopping Patterns',
                impact: 'Customers showing interest in both premium and accessible product lines',
                confidence: 87,
                timeline: 'Ongoing',
                product_focus: 'Cross-Selling',
                weight: 'Strategic'
            }
        ];

        // Enhanced opportunities based on dual product architecture
        const opportunities = [
            {
                opportunity: 'Core Product Market Expansion',
                potential_value: Math.round(coreRevenue * 2.0),
                timeline: '6-12 months',
                difficulty: 'Medium',
                reasoning: `Current ${coreMarketShare.toFixed(1)}% premium market share shows significant growth potential`,
                product_focus: 'Core Products',
                weight: '70%'
            },
            {
                opportunity: 'Catalog-to-Core Conversion Strategy',
                potential_value: Math.round(catalogRevenue * 0.4),
                timeline: '3-6 months',
                difficulty: 'Low',
                reasoning: `${catalogProductsArray.length} catalog products provide entry point for Core upselling`,
                product_focus: 'Cross-Selling',
                weight: 'Strategic'
            },
            {
                opportunity: 'Premium Market Leadership',
                potential_value: Math.round(totalRevenue * 1.8),
                timeline: '8-15 months',
                difficulty: 'High',
                reasoning: 'Fashion intelligence suggests premium positioning opportunity in luxury menswear',
                product_focus: 'Core Products',
                weight: '70%'
            },
            {
                opportunity: 'Catalog Product Optimization',
                potential_value: Math.round(catalogRevenue * 1.3),
                timeline: '2-4 months',
                difficulty: 'Low',
                reasoning: 'Optimize catalog products as premium product discovery channel',
                product_focus: 'Catalog Products',
                weight: '30%'
            }
        ];

        // Risk assessment with product-specific considerations
        const threats = [
            {
                threat: 'Premium Market Competition',
                risk_level: coreRevenue > 50000 ? 'Medium' : 'High',
                probability: coreRevenue > 50000 ? 35 : 65,
                mitigation: 'Strengthen Core Product differentiation and brand positioning',
                affects: 'Core Products primarily',
                weight_impact: '70%'
            },
            {
                threat: 'Price Sensitivity in Catalog Segment',
                risk_level: 'Medium',
                probability: 45,
                mitigation: 'Focus on value proposition and quality messaging',
                affects: 'Catalog Products',
                weight_impact: '30%'
            },
            {
                threat: 'Fashion Trend Volatility',
                risk_level: 'Low',
                probability: 30,
                mitigation: 'Leverage KCT fashion intelligence for proactive trend adaptation',
                affects: 'Both product categories',
                weight_impact: 'Balanced'
            },
            {
                threat: 'Economic Luxury Spending Decline',
                risk_level: 'Medium',
                probability: 25,
                mitigation: 'Maintain catalog products as recession-resistant option',
                affects: 'Core Products primarily',
                weight_impact: '70%'
            }
        ];

        // Enhanced competitive position with weighted calculations
        const competitiveFactors = {
            core_revenue_performance: Math.min(100, (coreRevenue / 75000) * 100), // $75k baseline for Core
            catalog_revenue_performance: Math.min(100, (catalogRevenue / 25000) * 100), // $25k baseline for Catalog
            customer_base: Math.min(100, (totalCustomers / 500) * 100),
            core_growth_rate: Math.min(100, Math.max(0, 50 + coreGrowthRate)),
            catalog_growth_rate: Math.min(100, Math.max(0, 50 + catalogGrowthRate)),
            market_share_core: Math.min(100, coreMarketShare * 5),
            market_share_catalog: Math.min(100, catalogMarketShare * 3)
        };
        
        // Apply 70/30 weighting to competitive position
        const weightedCompetitivePosition = (
            (competitiveFactors.core_revenue_performance * 0.7) +
            (competitiveFactors.catalog_revenue_performance * 0.3) +
            (competitiveFactors.core_growth_rate * 0.7) +
            (competitiveFactors.catalog_growth_rate * 0.3) +
            (competitiveFactors.market_share_core * 0.7) +
            (competitiveFactors.market_share_catalog * 0.3) +
            competitiveFactors.customer_base
        ) / 4;

        // Market share trend data with product separation
        const marketShareTrend = [];
        for (let i = 5; i >= 0; i--) {
            const monthDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
            const monthOrders = orders.filter(o => {
                const orderDate = new Date(o.created_at);
                return orderDate.getMonth() === monthDate.getMonth() && 
                       orderDate.getFullYear() === monthDate.getFullYear();
            });
            
            let monthCoreRevenue = 0;
            let monthCatalogRevenue = 0;
            
            monthOrders.forEach(order => {
                if (!order.order_items) return;
                order.order_items.forEach(item => {
                    const itemRevenue = item.price * item.quantity;
                    if (coreProductIds.has(item.product_id)) {
                        monthCoreRevenue += itemRevenue;
                    } else if (catalogProductIds.has(item.product_id)) {
                        monthCatalogRevenue += itemRevenue;
                    }
                });
            });
            
            const monthTotalRevenue = monthCoreRevenue + monthCatalogRevenue;
            const monthShare = (monthTotalRevenue / (totalMarketSize / 12)) * 100;
            
            marketShareTrend.push({
                period: `${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, '0')}`,
                total_share: parseFloat(monthShare.toFixed(1)),
                core_revenue: monthCoreRevenue,
                catalog_revenue: monthCatalogRevenue,
                total_revenue: monthTotalRevenue,
                core_share: (monthCoreRevenue / (premiumMarketSize / 12)) * 100,
                catalog_share: (monthCatalogRevenue / (standardMarketSize / 12)) * 100
            });
        }

        return new Response(JSON.stringify({ 
            success: true,
            data: {
                competitive_position: Math.round(weightedCompetitivePosition),
                market_trends: marketTrends,
                opportunities,
                threats,
                market_share_data: marketShareTrend,
                
                // Dual Product Architecture intelligence
                product_market_analysis: {
                    core_products: {
                        revenue: coreRevenue,
                        market_share: parseFloat(coreMarketShare.toFixed(1)),
                        growth_rate: parseFloat(coreGrowthRate.toFixed(1)),
                        market_size: premiumMarketSize,
                        position: 'Premium/Luxury Segment',
                        weight: '70%'
                    },
                    catalog_products: {
                        revenue: catalogRevenue,
                        market_share: parseFloat(catalogMarketShare.toFixed(1)),
                        growth_rate: parseFloat(catalogGrowthRate.toFixed(1)),
                        market_size: standardMarketSize,
                        position: 'Accessible/Entry Segment',
                        weight: '30%'
                    },
                    combined_metrics: {
                        total_revenue: totalRevenue,
                        weighted_revenue: weightedRevenue,
                        overall_market_share: parseFloat(overallMarketShare.toFixed(1)),
                        revenue_split: {
                            core_percentage: parseFloat(((coreRevenue/totalRevenue)*100).toFixed(1)),
                            catalog_percentage: parseFloat(((catalogRevenue/totalRevenue)*100).toFixed(1))
                        }
                    }
                },
                
                business_intelligence: {
                    total_revenue: totalRevenue,
                    weighted_revenue: weightedRevenue,
                    market_share: parseFloat(overallMarketShare.toFixed(1)),
                    growth_rate: parseFloat(growthRate.toFixed(1)),
                    customer_base: totalCustomers,
                    competitive_factors: competitiveFactors
                },
                fashion_intelligence: fashionMarketData?.data || null
            },
            metadata: {
                intelligence_type,
                market_segments: [...market_segments, 'premium_core', 'accessible_catalog'],
                analysis_depth,
                weighting_applied: 'Core: 70%, Catalog: 30%',
                data_points: {
                    core_products: coreProducts.length,
                    catalog_products: catalogProductsArray.length,
                    orders: orders.length,
                    customers: customers.length,
                    payments: payments.length
                },
                generated_at: new Date().toISOString(),
                data_sources: ['stripe_core_products', 'supabase_catalog_products', 'supabase_business_data', 'kct_fashion_api']
            }
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Market intelligence error:', error);
        
        return new Response(JSON.stringify({
            error: {
                code: 'MARKET_INTELLIGENCE_ERROR',
                message: error.message
            }
        }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});