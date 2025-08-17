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
        const { action, order_data, order_id, filters } = await req.json();
        
        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
        const supabaseUrl = Deno.env.get('SUPABASE_URL');
        
        if (!serviceRoleKey || !supabaseUrl) {
            throw new Error('Supabase configuration missing');
        }

        const headers = {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'apikey': serviceRoleKey,
            'Content-Type': 'application/json'
        };

        switch (action) {
            case 'create_order_queue_entry': {
                // Intelligent order routing based on dual product architecture
                const productSource = determineProductSource(order_data.items);
                const orderType = determineOrderType(order_data);
                const priorityLevel = calculatePriorityLevel(order_data);
                
                const queueEntry = {
                    order_id: order_data.order_id,
                    priority_level: priorityLevel,
                    product_source: productSource,
                    order_type: orderType,
                    estimated_completion_time: calculateEstimatedCompletion(order_data),
                    metadata: {
                        total_amount: order_data.total_amount,
                        item_count: order_data.items?.length || 0,
                        customer_tier: order_data.customer_tier || 'standard',
                        rush_order: order_data.rush_order || false,
                        special_requirements: order_data.special_requirements || null
                    }
                };

                const response = await fetch(`${supabaseUrl}/rest/v1/order_processing_queue`, {
                    method: 'POST',
                    headers: { ...headers, 'Prefer': 'return=representation' },
                    body: JSON.stringify(queueEntry)
                });

                if (!response.ok) {
                    throw new Error(`Failed to create queue entry: ${await response.text()}`);
                }

                const result = await response.json();
                return new Response(JSON.stringify({ data: result[0] }), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
            }

            case 'get_processing_queue': {
                const statusFilter = filters?.status ? `&queue_status=eq.${filters.status}` : '';
                const priorityFilter = filters?.priority ? `&priority_level=eq.${filters.priority}` : '';
                const sourceFilter = filters?.source ? `&product_source=eq.${filters.source}` : '';
                
                const response = await fetch(
                    `${supabaseUrl}/rest/v1/order_processing_queue?select=*,orders:order_id(order_number,customer_name,total_amount,created_at)&order=created_at.asc${statusFilter}${priorityFilter}${sourceFilter}`,
                    { headers }
                );

                if (!response.ok) {
                    throw new Error(`Failed to fetch queue: ${await response.text()}`);
                }

                const queueData = await response.json();
                return new Response(JSON.stringify({ data: queueData }), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
            }

            case 'update_order_status': {
                const { new_status, notes, changed_by } = order_data;
                
                // Update order status
                const orderUpdateResponse = await fetch(`${supabaseUrl}/rest/v1/orders?id=eq.${order_id}`, {
                    method: 'PATCH',
                    headers,
                    body: JSON.stringify({ 
                        status: new_status,
                        updated_at: new Date().toISOString()
                    })
                });

                if (!orderUpdateResponse.ok) {
                    throw new Error(`Failed to update order: ${await orderUpdateResponse.text()}`);
                }

                // Create status history entry
                const historyEntry = {
                    order_id,
                    new_status,
                    changed_by,
                    changed_by_system: !changed_by,
                    notes,
                    metadata: {
                        timestamp: new Date().toISOString(),
                        automated: !changed_by
                    }
                };

                const historyResponse = await fetch(`${supabaseUrl}/rest/v1/order_status_history`, {
                    method: 'POST',
                    headers,
                    body: JSON.stringify(historyEntry)
                });

                if (!historyResponse.ok) {
                    console.error('Failed to create status history:', await historyResponse.text());
                }

                // Update queue status if applicable
                if (['completed', 'shipped', 'delivered', 'cancelled'].includes(new_status)) {
                    await fetch(`${supabaseUrl}/rest/v1/order_processing_queue?order_id=eq.${order_id}`, {
                        method: 'PATCH',
                        headers,
                        body: JSON.stringify({ 
                            queue_status: 'completed',
                            actual_completion_time: new Date().toISOString()
                        })
                    });
                }

                return new Response(JSON.stringify({ data: { success: true, order_id, new_status } }), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
            }

            case 'get_order_analytics': {
                // Get comprehensive order analytics
                const ordersResponse = await fetch(
                    `${supabaseUrl}/rest/v1/orders?select=*&order=created_at.desc&limit=1000`,
                    { headers }
                );

                if (!ordersResponse.ok) {
                    throw new Error('Failed to fetch orders');
                }

                const orders = await ordersResponse.json();
                
                // Calculate analytics
                const analytics = calculateOrderAnalytics(orders);
                
                return new Response(JSON.stringify({ data: analytics }), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
            }

            case 'process_automation_rules': {
                // Execute automation rules for order processing
                const rulesResponse = await fetch(
                    `${supabaseUrl}/rest/v1/order_automation_rules?is_active=eq.true&order=execution_order.asc`,
                    { headers }
                );

                if (!rulesResponse.ok) {
                    throw new Error('Failed to fetch automation rules');
                }

                const rules = await rulesResponse.json();
                const results = [];

                for (const rule of rules) {
                    try {
                        const result = await executeAutomationRule(rule, supabaseUrl, headers);
                        results.push({ rule_id: rule.id, success: true, result });
                        
                        // Update rule success count
                        await fetch(`${supabaseUrl}/rest/v1/order_automation_rules?id=eq.${rule.id}`, {
                            method: 'PATCH',
                            headers,
                            body: JSON.stringify({ 
                                success_count: (rule.success_count || 0) + 1,
                                last_executed_at: new Date().toISOString()
                            })
                        });
                    } catch (error) {
                        results.push({ rule_id: rule.id, success: false, error: error.message });
                        
                        // Update rule failure count
                        await fetch(`${supabaseUrl}/rest/v1/order_automation_rules?id=eq.${rule.id}`, {
                            method: 'PATCH',
                            headers,
                            body: JSON.stringify({ 
                                failure_count: (rule.failure_count || 0) + 1,
                                last_executed_at: new Date().toISOString()
                            })
                        });
                    }
                }

                return new Response(JSON.stringify({ data: { executed_rules: results.length, results } }), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
            }

            default:
                throw new Error(`Unknown action: ${action}`);
        }

    } catch (error) {
        console.error('Order management error:', error);
        
        return new Response(JSON.stringify({
            error: {
                code: 'ORDER_MANAGEMENT_ERROR',
                message: error.message
            }
        }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});

// Helper functions
function determineProductSource(items) {
    if (!items || items.length === 0) return 'catalog';
    
    const stripeItems = items.filter(item => item.source === 'stripe' || item.stripe_product_id);
    const catalogItems = items.filter(item => item.source === 'catalog' || !item.stripe_product_id);
    
    if (stripeItems.length > 0 && catalogItems.length > 0) return 'mixed';
    if (stripeItems.length > 0) return 'stripe';
    return 'catalog';
}

function determineOrderType(orderData) {
    if (orderData.wedding_party_size && orderData.wedding_party_size > 1) return 'wedding_party';
    if (orderData.bundle_type) return 'bundle';
    if (orderData.rush_order) return 'rush';
    if (orderData.custom_measurements) return 'custom';
    if (orderData.group_size && orderData.group_size > 1) return 'group';
    return 'standard';
}

function calculatePriorityLevel(orderData) {
    let priority = 'standard';
    
    // VIP customers get high priority
    if (orderData.customer_tier === 'vip' || orderData.total_amount > 5000) {
        priority = 'high';
    }
    
    // Rush orders get urgent priority
    if (orderData.rush_order || orderData.event_date) {
        const eventDate = new Date(orderData.event_date);
        const now = new Date();
        const daysUntilEvent = (eventDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
        
        if (daysUntilEvent < 14) {
            priority = 'urgent';
        } else if (daysUntilEvent < 30) {
            priority = 'high';
        }
    }
    
    // Wedding party orders get elevated priority
    if (orderData.wedding_party_size && orderData.wedding_party_size > 4) {
        priority = priority === 'standard' ? 'high' : priority;
    }
    
    return priority;
}

function calculateEstimatedCompletion(orderData) {
    const now = new Date();
    let hoursToAdd = 24; // Default 24 hours
    
    switch (orderData.order_type || determineOrderType(orderData)) {
        case 'rush':
            hoursToAdd = 4;
            break;
        case 'wedding_party':
            hoursToAdd = 72;
            break;
        case 'bundle':
            hoursToAdd = 48;
            break;
        case 'custom':
            hoursToAdd = 96;
            break;
        default:
            hoursToAdd = 24;
    }
    
    return new Date(now.getTime() + (hoursToAdd * 60 * 60 * 1000)).toISOString();
}

function calculateOrderAnalytics(orders) {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
    const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const lastMonth = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    const todayOrders = orders.filter(o => new Date(o.created_at) >= today);
    const yesterdayOrders = orders.filter(o => {
        const created = new Date(o.created_at);
        return created >= yesterday && created < today;
    });
    const weekOrders = orders.filter(o => new Date(o.created_at) >= lastWeek);
    const monthOrders = orders.filter(o => new Date(o.created_at) >= lastMonth);
    
    return {
        overview: {
            total_orders: orders.length,
            today_orders: todayOrders.length,
            yesterday_orders: yesterdayOrders.length,
            week_orders: weekOrders.length,
            month_orders: monthOrders.length,
            growth_rate: yesterdayOrders.length > 0 ? 
                ((todayOrders.length - yesterdayOrders.length) / yesterdayOrders.length * 100).toFixed(2) : 0
        },
        status_breakdown: getStatusBreakdown(orders),
        revenue_analytics: getRevenueAnalytics(orders),
        source_breakdown: getSourceBreakdown(orders),
        processing_times: getProcessingTimes(orders)
    };
}

function getStatusBreakdown(orders) {
    const breakdown = {};
    orders.forEach(order => {
        breakdown[order.status] = (breakdown[order.status] || 0) + 1;
    });
    return breakdown;
}

function getRevenueAnalytics(orders) {
    const totalRevenue = orders.reduce((sum, order) => sum + (parseFloat(order.total_amount) || 0), 0);
    const paidOrders = orders.filter(o => ['paid', 'completed', 'shipped', 'delivered'].includes(o.payment_status));
    const paidRevenue = paidOrders.reduce((sum, order) => sum + (parseFloat(order.total_amount) || 0), 0);
    
    return {
        total_revenue: totalRevenue,
        paid_revenue: paidRevenue,
        average_order_value: orders.length > 0 ? (totalRevenue / orders.length).toFixed(2) : 0,
        pending_revenue: totalRevenue - paidRevenue
    };
}

function getSourceBreakdown(orders) {
    const breakdown = { stripe: 0, catalog: 0, mixed: 0, unknown: 0 };
    orders.forEach(order => {
        const source = order.source || 'unknown';
        if (breakdown.hasOwnProperty(source)) {
            breakdown[source]++;
        } else {
            breakdown.unknown++;
        }
    });
    return breakdown;
}

function getProcessingTimes(orders) {
    const completedOrders = orders.filter(o => o.delivered_at && o.created_at);
    const processingTimes = completedOrders.map(order => {
        const created = new Date(order.created_at);
        const delivered = new Date(order.delivered_at);
        return (delivered.getTime() - created.getTime()) / (1000 * 60 * 60 * 24); // Days
    });
    
    return {
        average_days: processingTimes.length > 0 ? 
            (processingTimes.reduce((sum, time) => sum + time, 0) / processingTimes.length).toFixed(2) : 0,
        fastest_days: processingTimes.length > 0 ? Math.min(...processingTimes).toFixed(2) : 0,
        slowest_days: processingTimes.length > 0 ? Math.max(...processingTimes).toFixed(2) : 0
    };
}

async function executeAutomationRule(rule, supabaseUrl, headers) {
    // Simple automation rule execution - can be expanded based on rule types
    const { conditions, actions } = rule;
    
    // This is a simplified implementation - in production you'd have more sophisticated rule engine
    if (rule.rule_type === 'priority_assignment') {
        // Example: Auto-assign high priority to large orders
        const response = await fetch(
            `${supabaseUrl}/rest/v1/order_processing_queue?total_amount=gte.${conditions.min_amount}&priority_level=eq.standard`,
            { headers }
        );
        
        if (response.ok) {
            const orders = await response.json();
            for (const order of orders) {
                await fetch(`${supabaseUrl}/rest/v1/order_processing_queue?id=eq.${order.id}`, {
                    method: 'PATCH',
                    headers,
                    body: JSON.stringify({ priority_level: actions.new_priority })
                });
            }
            return { processed: orders.length };
        }
    }
    
    return { processed: 0 };
}