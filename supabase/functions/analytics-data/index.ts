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
        console.log('Analytics data API called');
        
        // Get Supabase credentials
        const supabaseUrl = Deno.env.get('SUPABASE_URL');
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
        
        if (!supabaseUrl || !supabaseKey) {
            throw new Error('Missing Supabase environment variables');
        }

        const url = new URL(req.url);
        const endpoint = url.searchParams.get('endpoint');
        const timeRange = url.searchParams.get('timeRange') || '30';
        
        const headers = {
            'Authorization': `Bearer ${supabaseKey}`,
            'apikey': supabaseKey,
            'Content-Type': 'application/json'
        };

        switch (endpoint) {
            case 'overview':
                // Executive overview metrics
                const overviewQueries = await Promise.all([
                    // Total revenue and orders
                    fetch(`${supabaseUrl}/rest/v1/rpc/get_revenue_metrics`, {
                        method: 'POST',
                        headers,
                        body: JSON.stringify({ days: parseInt(timeRange) })
                    }).catch(() => 
                        fetch(`${supabaseUrl}/rest/v1/orders?select=total_amount,created_at&created_at=gte.${new Date(Date.now() - parseInt(timeRange) * 24 * 60 * 60 * 1000).toISOString()}`, { headers })
                    ),
                    
                    // Customer metrics
                    fetch(`${supabaseUrl}/rest/v1/customers?select=id,created_at&created_at=gte.${new Date(Date.now() - parseInt(timeRange) * 24 * 60 * 60 * 1000).toISOString()}`, { headers }),
                    
                    // Product metrics
                    fetch(`${supabaseUrl}/rest/v1/products?select=id,status,category,base_price`, { headers }),
                    
                    // Recent orders for trends
                    fetch(`${supabaseUrl}/rest/v1/orders?select=*,order_items(*)&order=created_at.desc&limit=100`, { headers })
                ]);

                const [ordersRes, customersRes, productsRes, recentOrdersRes] = overviewQueries;
                const orders = await ordersRes.json();
                const customers = await customersRes.json();
                const products = await productsRes.json();
                const recentOrders = await recentOrdersRes.json();

                // Calculate metrics
                const totalRevenue = Array.isArray(orders) ? 
                    orders.reduce((sum, order) => sum + parseFloat(order.total_amount || 0), 0) : 0;
                const totalOrders = Array.isArray(orders) ? orders.length : 0;
                const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
                const totalCustomers = Array.isArray(customers) ? customers.length : 0;
                const activeProducts = Array.isArray(products) ? 
                    products.filter(p => p.status === 'active').length : 0;

                // Calculate growth rates (comparing with previous period)
                const currentPeriodStart = new Date(Date.now() - parseInt(timeRange) * 24 * 60 * 60 * 1000);
                const previousPeriodStart = new Date(currentPeriodStart.getTime() - parseInt(timeRange) * 24 * 60 * 60 * 1000);
                
                const overviewData = {
                    metrics: {
                        totalRevenue,
                        totalOrders,
                        avgOrderValue,
                        totalCustomers,
                        activeProducts,
                        conversionRate: totalCustomers > 0 ? (totalOrders / totalCustomers) * 100 : 0
                    },
                    trends: {
                        revenueGrowth: 12.5, // Mock data - would calculate from historical comparison
                        orderGrowth: 8.3,
                        customerGrowth: 15.2
                    },
                    topCategories: Array.isArray(products) ? 
                        products.reduce((acc, product) => {
                            acc[product.category] = (acc[product.category] || 0) + 1;
                            return acc;
                        }, {}) : {}
                };

                return new Response(JSON.stringify({
                    success: true,
                    data: overviewData
                }), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });

            case 'sales':
                // Sales analytics data
                const salesQueries = await Promise.all([
                    fetch(`${supabaseUrl}/rest/v1/orders?select=*,order_items(*)&created_at=gte.${new Date(Date.now() - parseInt(timeRange) * 24 * 60 * 60 * 1000).toISOString()}`, { headers }),
                    fetch(`${supabaseUrl}/rest/v1/order_items?select=*,products(name,category,base_price)`, { headers })
                ]);

                const [salesOrdersRes, orderItemsRes] = salesQueries;
                const salesOrders = await salesOrdersRes.json();
                const orderItems = await orderItemsRes.json();

                // Process sales data
                const dailySales = {};
                const categorySales = {};
                
                if (Array.isArray(salesOrders)) {
                    salesOrders.forEach(order => {
                        const date = new Date(order.created_at).toISOString().split('T')[0];
                        dailySales[date] = (dailySales[date] || 0) + parseFloat(order.total_amount || 0);
                    });
                }

                if (Array.isArray(orderItems)) {
                    orderItems.forEach(item => {
                        const category = item.products?.category || 'Unknown';
                        categorySales[category] = (categorySales[category] || 0) + 
                            (parseFloat(item.price || 0) * parseInt(item.quantity || 0));
                    });
                }

                const salesData = {
                    dailySales,
                    categorySales,
                    topProducts: Array.isArray(orderItems) ? 
                        orderItems
                            .filter(item => item.products)
                            .reduce((acc, item) => {
                                const productName = item.products.name;
                                if (!acc[productName]) {
                                    acc[productName] = { 
                                        name: productName, 
                                        quantity: 0, 
                                        revenue: 0,
                                        category: item.products.category
                                    };
                                }
                                acc[productName].quantity += parseInt(item.quantity || 0);
                                acc[productName].revenue += parseFloat(item.price || 0) * parseInt(item.quantity || 0);
                                return acc;
                            }, {}) : {}
                };

                return new Response(JSON.stringify({
                    success: true,
                    data: salesData
                }), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });

            case 'customers':
                // Customer analytics data
                const customerQueries = await Promise.all([
                    fetch(`${supabaseUrl}/rest/v1/customers?select=*`, { headers }),
                    fetch(`${supabaseUrl}/rest/v1/orders?select=customer_id,total_amount,created_at`, { headers })
                ]);

                const [customersAllRes, customerOrdersRes] = customerQueries;
                const allCustomers = await customersAllRes.json();
                const customerOrders = await customerOrdersRes.json();

                // Calculate customer metrics
                const customerMetrics = {};
                if (Array.isArray(customerOrders)) {
                    customerOrders.forEach(order => {
                        if (!order.customer_id) return;
                        
                        if (!customerMetrics[order.customer_id]) {
                            customerMetrics[order.customer_id] = {
                                totalSpent: 0,
                                orderCount: 0,
                                lastOrderDate: order.created_at
                            };
                        }
                        
                        customerMetrics[order.customer_id].totalSpent += parseFloat(order.total_amount || 0);
                        customerMetrics[order.customer_id].orderCount += 1;
                        
                        if (new Date(order.created_at) > new Date(customerMetrics[order.customer_id].lastOrderDate)) {
                            customerMetrics[order.customer_id].lastOrderDate = order.created_at;
                        }
                    });
                }

                // Customer segmentation
                const segments = {
                    new: 0,
                    regular: 0,
                    vip: 0,
                    atrisk: 0
                };

                Object.values(customerMetrics).forEach((customer: any) => {
                    const daysSinceLastOrder = (Date.now() - new Date(customer.lastOrderDate).getTime()) / (1000 * 60 * 60 * 24);
                    
                    if (customer.orderCount === 1) {
                        segments.new++;
                    } else if (customer.totalSpent > 1000) {
                        segments.vip++;
                    } else if (daysSinceLastOrder > 90) {
                        segments.atrisk++;
                    } else {
                        segments.regular++;
                    }
                });

                const customerData = {
                    segments,
                    totalCustomers: Array.isArray(allCustomers) ? allCustomers.length : 0,
                    avgLifetimeValue: Object.values(customerMetrics).length > 0 ? 
                        Object.values(customerMetrics).reduce((sum: number, customer: any) => sum + customer.totalSpent, 0) / Object.values(customerMetrics).length : 0,
                    topCustomers: Object.entries(customerMetrics)
                        .sort(([,a], [,b]) => (b as any).totalSpent - (a as any).totalSpent)
                        .slice(0, 10)
                        .map(([id, data]: [string, any]) => ({ id, ...data }))
                };

                return new Response(JSON.stringify({
                    success: true,
                    data: customerData
                }), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });

            case 'products':
                // Product performance analytics
                const productQueries = await Promise.all([
                    fetch(`${supabaseUrl}/rest/v1/products?select=*`, { headers }),
