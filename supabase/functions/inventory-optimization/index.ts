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

        // Fetch Core Products and inventory data for dual product optimization
        const [coreProductsResponse, catalogProductsResponse, ordersResponse, orderItemsResponse] = await Promise.all([
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

        const [coreProductsData, catalogProducts, orders, orderItems] = await Promise.all([
            coreProductsResponse.ok ? coreProductsResponse.json() : { data: [] },
            catalogProductsResponse.json(),
            ordersResponse.json(),
            orderItemsResponse.json()
        ]);

        const requestData = await req.json();
        const { 
            optimization_type = 'stock_levels',
            algorithms = ['abc_analysis', 'eoq', 'safety_stock'],
            constraints = {}
        } = requestData;

        const coreProducts = coreProductsData.data || [];
        const catalogProductsArray = Array.isArray(catalogProducts) ? catalogProducts : [];
        const coreProductIds = new Set(coreProducts.map(p => p.id));
        const catalogProductIds = new Set(catalogProductsArray.map(p => p.id));

        // Separate analysis for Core vs Catalog products
        const totalCatalogProducts = catalogProductsArray.length;
        const lowStockCatalogProducts = catalogProductsArray.filter(p => (p.inventory_quantity || 0) < 10);
        const outOfStockCatalogProducts = catalogProductsArray.filter(p => (p.inventory_quantity || 0) === 0);
        
        // Core Products have different inventory management (via Stripe)
        const coreProductSales = orderItems.filter(item => coreProductIds.has(item.product_id));
        const catalogProductSales = orderItems.filter(item => catalogProductIds.has(item.product_id));
        
        // Calculate weighted optimization scores
        const catalogStockHealthScore = totalCatalogProducts > 0 
            ? ((totalCatalogProducts - lowStockCatalogProducts.length) / totalCatalogProducts) * 100 
            : 100;
        
        // Core Products optimization based on sales velocity (since inventory is managed via Stripe)
        const coreProductPerformance = coreProducts.map(product => {
            const sales = orderItems.filter(item => item.product_id === product.id);
            const avgMonthlySales = sales.length / 6;
            return { product, sales_velocity: avgMonthlySales };
        });
        
        const avgCoreVelocity = coreProductPerformance.reduce((sum, p) => sum + p.sales_velocity, 0) / Math.max(1, coreProductPerformance.length);
        const corePerformanceScore = Math.min(100, (avgCoreVelocity / 5) * 100); // Scale to 5 sales/month baseline
        
        // Apply 70/30 weighting for overall optimization score
        const weightedOptimizationScore = (corePerformanceScore * 0.7) + (catalogStockHealthScore * 0.3);

        // Enhanced recommendations with dual product architecture
        const coreRecommendations = coreProducts.slice(0, 3).map(product => {
            const productSales = orderItems.filter(item => item.product_id === product.id);
            const avgMonthlySales = productSales.length / 6;
            const salesVelocity = avgMonthlySales;
            
            let action, priority, reason;
            
            if (salesVelocity > 8) {
                action = 'Monitor high demand - ensure Stripe inventory availability';
                priority = 'high';
                reason = 'High velocity Core Product';
            } else if (salesVelocity > 3) {
                action = 'Maintain current availability';
                priority = 'medium';
                reason = 'Steady performance';
            } else if (salesVelocity > 1) {
                action = 'Consider promotional strategies';
                priority = 'medium';
                reason = 'Moderate sales velocity';
            } else {
                action = 'Review product positioning';
                priority = 'low';
                reason = 'Low sales velocity';
            }
            
            return {
                product: product.name || `Core Product ${product.id}`,
                product_type: 'Core Product',
                sales_velocity: parseFloat(salesVelocity.toFixed(1)),
                inventory_management: 'Stripe Platform',
                action,
                priority,
                reason,
                weight: '70%'
            };
        });
        
        const catalogRecommendations = catalogProductsArray.slice(0, 3).map(product => {
            const currentStock = product.inventory_quantity || 0;
            const productSales = orderItems.filter(item => item.product_id === product.id);
            const avgMonthlySales = productSales.length / 6;
            const optimalStock = Math.max(15, Math.round(avgMonthlySales * 2.5)); // 2.5-month supply for catalog
            
            let action, priority, reason;
            const stockDiff = optimalStock - currentStock;
            
            if (currentStock === 0) {
                action = 'Critical restock needed';
                priority = 'high';
                reason = 'Out of stock - customer discovery channel blocked';
            } else if (stockDiff > 15) {
                action = `Increase stock by ${stockDiff} units`;
                priority = 'medium';
                reason = 'Entry point for Core Product discovery';
            } else if (stockDiff < -10) {
                action = `Reduce stock by ${Math.abs(stockDiff)} units`;
                priority = 'low';
                reason = 'Overstocked catalog item';
            } else {
                action = 'Maintain current levels';
                priority = 'low';
                reason = 'Balanced stock for discovery channel';
            }
            
            return {
                product: product.name || 'Unknown Product',
                product_type: 'Catalog Product',
                current_stock: currentStock,
                optimal_stock: optimalStock,
                inventory_management: 'Supabase',
                action,
                priority,
                reason,
                weight: '30%'
            };
        });
        
        const recommendations = [...coreRecommendations, ...catalogRecommendations];

        // Enhanced alerts with product type context
        const alerts = [];
        if (outOfStockCatalogProducts.length > 0) {
            alerts.push({
                type: 'catalog_stockout_risk',
                message: `${outOfStockCatalogProducts.length} Catalog Products out of stock - impacts Core Product discovery`,
                severity: 'critical',
                affects: 'Customer Journey',
                weight_impact: '30%'
            });
        }
        if (lowStockCatalogProducts.length > 0) {
            alerts.push({
                type: 'catalog_low_stock',
                message: `${lowStockCatalogProducts.length} Catalog Products running low - ensure discovery channel availability`,
                severity: 'warning',
                affects: 'Entry Point Effectiveness',
                weight_impact: '30%'
            });
        }
        
        // Core Product velocity alerts
        const lowVelocityCoreProducts = coreProductPerformance.filter(p => p.sales_velocity < 2).length;
        if (lowVelocityCoreProducts > 0) {
            alerts.push({
                type: 'core_velocity_concern',
                message: `${lowVelocityCoreProducts} Core Products showing low sales velocity`,
                severity: 'warning',
                affects: 'Premium Revenue Stream',
                weight_impact: '70%'
            });
        }
        
        // Get fashion trends that might affect inventory from KCT API
        let fashionTrends = null;
        try {
            const kctResponse = await fetch(`${KCT_API_URL}/api/v1/health`, {
                headers: {
                    'X-API-Key': KCT_API_KEY
                }
            });
            fashionTrends = await kctResponse.json();
        } catch (error) {
            console.error('KCT API error:', error);
        }

        // Enhanced ABC Analysis with dual product architecture
        const coreProductSalesData = coreProducts.map(product => {
            const sales = orderItems.filter(item => item.product_id === product.id);
            const revenue = sales.reduce((sum, item) => sum + ((item.price || 0) * (item.quantity || 1)), 0);
            return { 
                product: product.name || `Core Product ${product.id}`, 
                revenue, 
                sales_count: sales.length,
                product_type: 'Core Product',
                weight: '70%'
            };
        });
        
        const catalogProductSalesData = catalogProductsArray.map(product => {
            const sales = orderItems.filter(item => item.product_id === product.id);
            const revenue = sales.reduce((sum, item) => sum + ((item.price || 0) * (item.quantity || 1)), 0);
            return { 
                product: product.name, 
                revenue, 
                sales_count: sales.length,
                product_type: 'Catalog Product',
                weight: '30%'
            };
        });
        
        const allProductSalesData = [...coreProductSalesData, ...catalogProductSalesData]
            .sort((a, b) => b.revenue - a.revenue);
        
        const totalRevenue = allProductSalesData.reduce((sum, p) => sum + p.revenue, 0);
        const coreRevenue = coreProductSalesData.reduce((sum, p) => sum + p.revenue, 0);
        const catalogRevenue = catalogProductSalesData.reduce((sum, p) => sum + p.revenue, 0);
        
        // Weighted ABC analysis
        let runningTotal = 0;
        const abcAnalysis = allProductSalesData.map(product => {
            runningTotal += product.revenue;
            const percentage = (runningTotal / totalRevenue) * 100;
            
            if (percentage <= 80) return { ...product, category: 'A' };
            if (percentage <= 95) return { ...product, category: 'B' };
            return { ...product, category: 'C' };
        });
        
        const aCount = abcAnalysis.filter(p => p.category === 'A').length;
        const bCount = abcAnalysis.filter(p => p.category === 'B').length;
        const cCount = abcAnalysis.filter(p => p.category === 'C').length;
        const totalProducts = coreProducts.length + catalogProductsArray.length;

        // Enhanced turnover analysis with product type separation
        const coreAverageTurnover = coreProductSales.length / Math.max(1, coreProducts.length) / 6; // Monthly turnover
        const catalogAverageTurnover = catalogProductSales.length / Math.max(1, catalogProductsArray.length) / 6;
        
        return new Response(JSON.stringify({ 
            success: true,
            data: {
                optimization_score: Math.round(weightedOptimizationScore),
                recommendations,
                alerts,
                
                // Dual product architecture inventory insights
                product_inventory_analysis: {
                    core_products: {
                        count: coreProducts.length,
                        inventory_management: 'Stripe Platform',
                        avg_sales_velocity: parseFloat((coreProductSales.length / Math.max(1, coreProducts.length) / 6).toFixed(1)),
                        performance_score: Math.round(corePerformanceScore),
                        revenue_contribution: coreRevenue,
                        weight: '70%'
                    },
                    catalog_products: {
                        count: catalogProductsArray.length,
                        inventory_management: 'Supabase Database',
                        low_stock_count: lowStockCatalogProducts.length,
                        out_of_stock_count: outOfStockCatalogProducts.length,
                        stock_health_score: Math.round(catalogStockHealthScore),
                        revenue_contribution: catalogRevenue,
                        weight: '30%'
                    },
                    combined_metrics: {
                        total_products: totalProducts,
                        weighted_optimization_score: Math.round(weightedOptimizationScore),
                        total_revenue: totalRevenue,
                        revenue_split: {
                            core_percentage: parseFloat(((coreRevenue/totalRevenue)*100).toFixed(1)),
                            catalog_percentage: parseFloat(((catalogRevenue/totalRevenue)*100).toFixed(1))
                        }
                    }
                },
                
                // Enhanced turnover analysis
                turnover_analysis: [
                    { 
                        category: 'Core Products (High Value)', 
                        turnover: parseFloat(coreAverageTurnover.toFixed(1)), 
                        target: 6.0, 
                        efficiency: Math.round((coreAverageTurnover/6.0)*100),
                        weight: '70%',
                        management: 'Stripe'
                    },
                    { 
                        category: 'Catalog Products (Discovery)', 
                        turnover: parseFloat(catalogAverageTurnover.toFixed(1)), 
                        target: 4.0, 
                        efficiency: Math.round((catalogAverageTurnover/4.0)*100),
                        weight: '30%',
                        management: 'Supabase'
                    },
                    { 
                        category: 'Cross-Category Optimization', 
                        turnover: parseFloat(((coreAverageTurnover * 0.7) + (catalogAverageTurnover * 0.3)).toFixed(1)), 
                        target: 5.5, 
                        efficiency: Math.round((((coreAverageTurnover * 0.7) + (catalogAverageTurnover * 0.3))/5.5)*100),
                        weight: 'Weighted',
                        management: 'Dual Platform'
                    }
                ],
                
                // Enhanced ABC analysis with product types
                abc_distribution: [
                    { 
                        category: 'A-Class (Premium Focus)', 
                        value: 80, 
                        count: Math.round((aCount/totalProducts)*100), 
                        color: '#10B981',
                        description: 'Core Products + Top Catalog Items'
                    },
                    { 
                        category: 'B-Class (Growth Potential)', 
                        value: 15, 
                        count: Math.round((bCount/totalProducts)*100), 
                        color: '#F59E0B',
                        description: 'Mid-tier products with optimization potential'
                    },
                    { 
                        category: 'C-Class (Entry Level)', 
                        value: 5, 
                        count: Math.round((cCount/totalProducts)*100), 
                        color: '#EF4444',
                        description: 'Discovery channel and seasonal items'
                    }
                ],
                
                fashion_intelligence: fashionTrends?.data || null
            },
            metadata: {
                optimization_type,
                algorithms_used: [...algorithms, 'dual_product_weighting'],
                products_analyzed: totalProducts,
                core_products_count: coreProducts.length,
                catalog_products_count: catalogProductsArray.length,
                sales_records: orderItems.length,
                weighting_applied: 'Core: 70%, Catalog: 30%',
                inventory_systems: ['Stripe (Core)', 'Supabase (Catalog)'],
                low_stock_count: lowStockCatalogProducts.length,
                out_of_stock_count: outOfStockCatalogProducts.length,
                generated_at: new Date().toISOString(),
                data_sources: ['stripe_core_products', 'supabase_catalog_products', 'supabase_orders', 'kct_fashion_api']
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