// Order Status Update Function
// Handles intelligent order status updates and automated workflow triggers

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
        const { orderId, newStatus, statusReason, notes, processorId } = await req.json();

        if (!orderId || !newStatus) {
            throw new Error('Order ID and new status are required');
        }

        // Get environment variables
        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
        const supabaseUrl = Deno.env.get('SUPABASE_URL');

        if (!serviceRoleKey || !supabaseUrl) {
            throw new Error('Supabase configuration missing');
        }

        // Get current order details
        const orderResponse = await fetch(`${supabaseUrl}/rest/v1/orders?id=eq.${orderId}&select=*`, {
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey,
                'Content-Type': 'application/json'
            }
        });

        if (!orderResponse.ok) {
            throw new Error('Failed to fetch order details');
        }

        const orders = await orderResponse.json();
        if (orders.length === 0) {
            throw new Error('Order not found');
        }

        const currentOrder = orders[0];
        const previousStatus = currentOrder.status;

        // Calculate processing duration
        const processingDuration = previousStatus ? 
            Math.floor((new Date().getTime() - new Date(currentOrder.updated_at).getTime()) / (1000 * 60)) : 0;

        // Update order status
        const updateResponse = await fetch(`${supabaseUrl}/rest/v1/orders?id=eq.${orderId}`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey,
                'Content-Type': 'application/json',
                'Prefer': 'return=representation'
            },
            body: JSON.stringify({
                status: newStatus,
                updated_at: new Date().toISOString(),
                ...(processorId && { assigned_processor_id: processorId }),
                ...(newStatus === 'processing' && { processed_at: new Date().toISOString() }),
                ...(newStatus === 'shipped' && { shipped_at: new Date().toISOString() }),
                ...(newStatus === 'delivered' && { delivered_at: new Date().toISOString() })
            })
        });

        if (!updateResponse.ok) {
            const errorText = await updateResponse.text();
            throw new Error(`Failed to update order: ${errorText}`);
        }

        const updatedOrder = await updateResponse.json();

        // Record status change in history
        const historyResponse = await fetch(`${supabaseUrl}/rest/v1/order_status_history`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                order_id: orderId,
                previous_status: previousStatus,
                new_status: newStatus,
                status_reason: statusReason || 'Status updated via system',
                status_notes: notes,
                changed_by_system: !processorId,
                processing_duration: processingDuration,
                ...(processorId && { changed_by_user_id: processorId })
            })
        });

        if (!historyResponse.ok) {
            console.error('Failed to record status history:', await historyResponse.text());
        }

        // Trigger automated actions based on status
        const automationTasks = [];

        // Update priority queue status
        if (newStatus === 'processing') {
            automationTasks.push(
                fetch(`${supabaseUrl}/rest/v1/order_priority_queue?order_id=eq.${orderId}`, {
                    method: 'PATCH',
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'apikey': serviceRoleKey,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        queue_status: 'in_progress',
                        started_processing_at: new Date().toISOString(),
                        ...(processorId && { assigned_to_user_id: processorId })
                    })
                })
            );
        }

        // Trigger customer communication
        const communicationType = {
            'payment_confirmed': 'payment_confirmation',
            'processing': 'processing_update',
            'shipped': 'shipping_notification',
            'delivered': 'delivery_confirmation'
        }[newStatus];

        if (communicationType) {
            automationTasks.push(
                fetch(`${supabaseUrl}/functions/v1/customer-communication`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        orderId,
                        communicationType,
                        triggerReason: `Status changed to ${newStatus}`
                    })
                })
            );
        }

        // Execute automation tasks
        await Promise.allSettled(automationTasks);

        // Calculate intelligent routing for next stage
        let routingDecision = null;
        if (newStatus === 'processing') {
            const routingResponse = await fetch(`${supabaseUrl}/rest/v1/rpc/route_order_intelligently`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ p_order_id: orderId })
            });

            if (routingResponse.ok) {
                routingDecision = await routingResponse.text();
                routingDecision = routingDecision.replace(/"/g, ''); // Remove quotes
            }
        }

        return new Response(JSON.stringify({
            data: {
                order: updatedOrder[0],
                previousStatus,
                newStatus,
                processingDuration,
                routingDecision,
                automationsTriggered: automationTasks.length
            }
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Order status update error:', error);

        const errorResponse = {
            error: {
                code: 'ORDER_STATUS_UPDATE_FAILED',
                message: error.message
            }
        };

        return new Response(JSON.stringify(errorResponse), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});