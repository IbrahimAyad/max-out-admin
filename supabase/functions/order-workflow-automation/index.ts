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
        const { action, orderId, automationType, parameters } = await req.json();
        
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
            case 'process_payment_confirmation': {
                // Handle successful payment processing
                const order = await getOrderDetails(orderId, supabaseUrl, headers);
                if (!order) {
                    throw new Error('Order not found');
                }

                // Update order status
                await updateOrderStatus(orderId, 'payment_confirmed', 'Payment successfully processed', supabaseUrl, headers);
                
                // Create priority queue entry if it doesn't exist
                await ensurePriorityQueueEntry(order, supabaseUrl, headers);
                
                // Send payment confirmation email
                await triggerCustomerCommunication(orderId, 'payment_confirmation', null, 'Payment confirmed', supabaseUrl, headers);
                
                // Start processing workflow
                await initiateProcessingWorkflow(order, supabaseUrl, headers);
                
                return new Response(JSON.stringify({ 
                    data: { 
                        success: true, 
                        orderId, 
                        status: 'payment_confirmed',
                        nextSteps: ['processing_queue_entry', 'customer_notification_sent', 'workflow_initiated']
                    } 
                }), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
            }

            case 'intelligent_order_routing': {
                // Smart routing based on order characteristics
                const order = await getOrderDetails(orderId, supabaseUrl, headers);
                if (!order) {
                    throw new Error('Order not found');
                }

                const routingDecision = await makeRoutingDecision(order, supabaseUrl, headers);
                
                // Update order with processor assignment
                if (routingDecision.assignedProcessor) {
                    await fetch(`${supabaseUrl}/rest/v1/orders?id=eq.${orderId}`, {
                        method: 'PATCH',
                        headers,
                        body: JSON.stringify({ 
                            assigned_processor_id: routingDecision.assignedProcessor,
                            estimated_processing_time: routingDecision.estimatedTime
                        })
                    });
                }

                // Update priority queue
                await fetch(`${supabaseUrl}/rest/v1/order_priority_queue?order_id=eq.${orderId}`, {
                    method: 'PATCH',
                    headers,
                    body: JSON.stringify({
                        assigned_to_user_id: routingDecision.assignedProcessor,
                        queue_status: 'assigned',
                        assigned_at: new Date().toISOString(),
                        estimated_completion: routingDecision.estimatedCompletion
                    })
                });

                return new Response(JSON.stringify({ 
                    data: routingDecision 
                }), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
            }

            case 'bundle_order_processing': {
                // Handle bundle orders (suits, wedding packages, etc.)
                const order = await getOrderDetails(orderId, supabaseUrl, headers);
                const bundleItems = await getBundleItems(orderId, supabaseUrl, headers);
                
                // Process each bundle as a cohesive unit
                const bundleGroups = groupItemsByBundle(bundleItems);
                const bundleResults = [];

                for (const [bundleType, items] of Object.entries(bundleGroups)) {
                    const bundleResult = await processBundleGroup(bundleType, items, order, supabaseUrl, headers);
                    bundleResults.push(bundleResult);
                }

                // Update order with bundle processing info
                await fetch(`${supabaseUrl}/rest/v1/orders?id=eq.${orderId}`, {
                    method: 'PATCH',
                    headers,
                    body: JSON.stringify({ 
                        processing_notes: `Bundle processing initiated: ${bundleResults.length} bundles`,
                        updated_at: new Date().toISOString()
                    })
                });

                return new Response(JSON.stringify({ 
                    data: { bundleResults, totalBundles: bundleResults.length } 
                }), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
            }

            case 'wedding_party_coordination': {
                // Special handling for wedding party orders
                const order = await getOrderDetails(orderId, supabaseUrl, headers);
                
                // Find related orders in the same wedding party
                const relatedOrders = await fetch(
                    `${supabaseUrl}/rest/v1/orders?group_order_id=eq.${order.group_order_id || orderId}&select=*`,
                    { headers }
                );
                
                const weddingPartyOrders = await relatedOrders.json();
                
                // Coordinate processing timelines
                const coordinationPlan = await createWeddingCoordinationPlan(weddingPartyOrders, supabaseUrl, headers);
                
                // Update all orders with coordination information
                for (const relatedOrder of weddingPartyOrders) {
                    await fetch(`${supabaseUrl}/rest/v1/orders?id=eq.${relatedOrder.id}`, {
                        method: 'PATCH',
                        headers,
                        body: JSON.stringify({
                            estimated_delivery_date: coordinationPlan.targetDeliveryDate,
                            processing_notes: `Wedding party coordination: ${coordinationPlan.partySize} orders`,
                            updated_at: new Date().toISOString()
                        })
                    });
                }

                return new Response(JSON.stringify({ 
                    data: coordinationPlan 
                }), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
            }

            case 'exception_handling': {
                // Handle order exceptions and escalations
                const exceptionData = parameters;
                
                // Create exception record
                const exceptionResponse = await fetch(`${supabaseUrl}/rest/v1/order_exceptions`, {
                    method: 'POST',
                    headers: { ...headers, 'Prefer': 'return=representation' },
                    body: JSON.stringify({
                        order_id: orderId,
                        exception_type: exceptionData.type,
                        exception_severity: exceptionData.severity || 'medium',
                        exception_description: exceptionData.description,
                        affects_delivery_date: exceptionData.affectsDelivery || false,
                        estimated_delay_days: exceptionData.delayDays || 0,
                        customer_impact_level: exceptionData.customerImpact || 'moderate',
                        resolution_status: 'open'
                    })
                });

                const exception = await exceptionResponse.json();
                
                // Auto-escalate critical exceptions
                if (exceptionData.severity === 'critical') {
                    await escalateException(exception[0].id, supabaseUrl, headers);
                }
                
                // Notify customer if required
                if (exceptionData.notifyCustomer) {
                    await triggerCustomerCommunication(
                        orderId, 
                        'exception_alert', 
                        exceptionData.customerMessage,
                        'Exception occurred',
                        supabaseUrl, 
                        headers
                    );
                }

                return new Response(JSON.stringify({ 
                    data: { exceptionId: exception[0].id, status: 'created' } 
                }), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
            }

            case 'quality_assurance_workflow': {
                // Trigger quality assurance checks
                const order = await getOrderDetails(orderId, supabaseUrl, headers);
                const qualityChecks = await performQualityChecks(order, supabaseUrl, headers);
                
                // Update order status based on quality results
                const allPassed = qualityChecks.every(check => check.passed);
                const newStatus = allPassed ? 'packaging' : 'quality_check';
                
                await updateOrderStatus(orderId, newStatus, 
                    allPassed ? 'Quality checks passed' : 'Quality issues require attention',
                    supabaseUrl, headers
                );

                return new Response(JSON.stringify({ 
                    data: { qualityChecks, allPassed, newStatus } 
                }), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
            }

            default:
                throw new Error(`Unknown automation action: ${action}`);
        }

    } catch (error) {
        console.error('Order workflow automation error:', error);
        
        return new Response(JSON.stringify({
            error: {
                code: 'WORKFLOW_AUTOMATION_ERROR',
                message: error.message
            }
        }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});

// Helper functions
async function getOrderDetails(orderId, supabaseUrl, headers) {
    const response = await fetch(`${supabaseUrl}/rest/v1/orders?id=eq.${orderId}&select=*,order_items(*)`, { headers });
    const orders = await response.json();
    return orders[0] || null;
}

async function updateOrderStatus(orderId, newStatus, notes, supabaseUrl, headers) {
    await fetch(`${supabaseUrl}/rest/v1/orders?id=eq.${orderId}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ 
            order_status: newStatus,
            updated_at: new Date().toISOString()
        })
    });

    // Create status history entry
    await fetch(`${supabaseUrl}/rest/v1/order_status_history`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
            order_id: orderId,
            new_status: newStatus,
            status_notes: notes,
            changed_by_system: true,
            automated_action_triggered: true
        })
    });
}

async function triggerCustomerCommunication(orderId, type, customMessage, reason, supabaseUrl, headers) {
    // Call customer communication function
    await fetch(`${supabaseUrl}/functions/v1/customer-communication`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
            orderId,
            communicationType: type,
            customMessage,
            triggerReason: reason
        })
    });
}

async function ensurePriorityQueueEntry(order, supabaseUrl, headers) {
    const existingEntry = await fetch(
        `${supabaseUrl}/rest/v1/order_priority_queue?order_id=eq.${order.id}`,
        { headers }
    );
    
    const entries = await existingEntry.json();
    
    if (entries.length === 0) {
        await fetch(`${supabaseUrl}/rest/v1/order_priority_queue`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
                order_id: order.id,
                queue_position: 1,
                priority_score: calculatePriorityScore(order),
                queue_type: 'processing',
                customer_tier: order.total_amount > 5000 ? 'vip' : order.total_amount > 1000 ? 'premium' : 'standard',
                queue_status: 'waiting'
            })
        });
    }
}

async function initiateProcessingWorkflow(order, supabaseUrl, headers) {
    // Start the intelligent processing workflow
    await fetch(`${supabaseUrl}/functions/v1/order-workflow-automation`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
            action: 'intelligent_order_routing',
            orderId: order.id
        })
    });
}

async function makeRoutingDecision(order, supabaseUrl, headers) {
    // Smart routing logic based on order characteristics
    const decision = {
        assignedProcessor: null,
        estimatedTime: 48, // hours
        estimatedCompletion: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
        routingReason: 'Standard processing'
    };

    if (order.is_rush_order) {
        decision.estimatedTime = 24;
        decision.routingReason = 'Rush order - expedited processing';
    }

    if (order.total_amount > 3000) {
        decision.routingReason = 'High-value order - premium processing';
    }

    if (order.is_group_order) {
        decision.estimatedTime = 72;
        decision.routingReason = 'Group order - coordination required';
    }

    return decision;
}

async function getBundleItems(orderId, supabaseUrl, headers) {
    const response = await fetch(
        `${supabaseUrl}/rest/v1/order_items?order_id=eq.${orderId}&is_bundle_item=eq.true`,
        { headers }
    );
    return await response.json();
}

function groupItemsByBundle(items) {
    return items.reduce((groups, item) => {
        const bundleType = item.bundle_type || 'standard';
        if (!groups[bundleType]) groups[bundleType] = [];
        groups[bundleType].push(item);
        return groups;
    }, {});
}

async function processBundleGroup(bundleType, items, order, supabaseUrl, headers) {
    return {
        bundleType,
        itemCount: items.length,
        estimatedTime: items.length * 6, // 6 hours per item
        specialRequirements: bundleType === 'wedding_package' ? 'Coordination required' : 'Standard processing'
    };
}

async function createWeddingCoordinationPlan(orders, supabaseUrl, headers) {
    const partySize = orders.length;
    const maxProcessingTime = Math.max(...orders.map(o => o.estimated_processing_time || 48));
    
    return {
        partySize,
        targetDeliveryDate: new Date(Date.now() + (maxProcessingTime + 24) * 60 * 60 * 1000).toISOString(),
        coordinationNotes: `Wedding party of ${partySize} orders - synchronized delivery`,
        processingStrategy: 'parallel_with_coordination'
    };
}

async function escalateException(exceptionId, supabaseUrl, headers) {
    await fetch(`${supabaseUrl}/rest/v1/order_exceptions?id=eq.${exceptionId}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({
            escalation_required: true,
            escalated_at: new Date().toISOString(),
            escalation_reason: 'Critical severity exception'
        })
    });
}

async function performQualityChecks(order, supabaseUrl, headers) {
    // Simulate quality checks based on order characteristics
    const checks = [
        { name: 'Size Verification', passed: true },
        { name: 'Color Match', passed: true },
        { name: 'Craftsmanship', passed: Math.random() > 0.1 }, // 90% pass rate
        { name: 'Packaging', passed: true }
    ];

    if (order.is_rush_order) {
        checks.push({ name: 'Rush Order Verification', passed: Math.random() > 0.05 });
    }

    return checks;
}

function calculatePriorityScore(order) {
    let score = 100;
    if (order.total_amount > 5000) score += 50;
    if (order.is_rush_order) score += 100;
    if (order.is_group_order) score += 75;
    return Math.min(500, score);
}