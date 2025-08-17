// Priority Queue Management Function
// Handles intelligent order queue management and optimization

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
        const { action, orderId, queueType, assignToUserId } = await req.json();

        if (!action) {
            throw new Error('Action is required');
        }

        // Get environment variables
        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
        const supabaseUrl = Deno.env.get('SUPABASE_URL');

        if (!serviceRoleKey || !supabaseUrl) {
            throw new Error('Supabase configuration missing');
        }

        let result = {};

        switch (action) {
            case 'reorder_queue':
                // Reorder queue based on priority scores
                result = await reorderQueue(supabaseUrl, serviceRoleKey, queueType || 'processing');
                break;

            case 'assign_next':
                // Assign next order in queue to processor
                if (!assignToUserId) {
                    throw new Error('User ID is required for assignment');
                }
                result = await assignNextOrder(supabaseUrl, serviceRoleKey, assignToUserId, queueType || 'processing');
                break;

            case 'update_priority':
                // Recalculate and update priority for specific order
                if (!orderId) {
                    throw new Error('Order ID is required for priority update');
                }
                result = await updateOrderPriority(supabaseUrl, serviceRoleKey, orderId);
                break;

            case 'get_queue_status':
                // Get current queue status and metrics
                result = await getQueueStatus(supabaseUrl, serviceRoleKey, queueType || 'processing');
                break;

            case 'escalate_order':
                // Escalate order to higher priority
                if (!orderId) {
                    throw new Error('Order ID is required for escalation');
                }
                result = await escalateOrder(supabaseUrl, serviceRoleKey, orderId);
                break;

            default:
                throw new Error(`Invalid action: ${action}`);
        }

        return new Response(JSON.stringify({ data: result }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Priority queue management error:', error);

        const errorResponse = {
            error: {
                code: 'QUEUE_MANAGEMENT_FAILED',
                message: error.message
            }
        };

        return new Response(JSON.stringify(errorResponse), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});

// Helper function to reorder queue by priority
async function reorderQueue(supabaseUrl, serviceRoleKey, queueType) {
    // Get all waiting orders in queue, ordered by priority score
    const queueResponse = await fetch(`${supabaseUrl}/rest/v1/order_priority_queue?queue_type=eq.${queueType}&queue_status=eq.waiting&order=priority_score.desc`, {
        headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'apikey': serviceRoleKey,
            'Content-Type': 'application/json'
        }
    });

    if (!queueResponse.ok) {
        throw new Error('Failed to fetch queue items');
    }

    const queueItems = await queueResponse.json();

    // Update queue positions
    const updatePromises = queueItems.map((item, index) => {
        return fetch(`${supabaseUrl}/rest/v1/order_priority_queue?id=eq.${item.id}`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                queue_position: index + 1,
                updated_at: new Date().toISOString()
            })
        });
    });

    await Promise.all(updatePromises);

    return {
        reorderedItems: queueItems.length,
        queueType,
        timestamp: new Date().toISOString()
    };
}

// Helper function to assign next order to processor
async function assignNextOrder(supabaseUrl, serviceRoleKey, userId, queueType) {
    // Get next order in queue
    const nextOrderResponse = await fetch(`${supabaseUrl}/rest/v1/order_priority_queue?queue_type=eq.${queueType}&queue_status=eq.waiting&order=queue_position.asc&limit=1`, {
        headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'apikey': serviceRoleKey,
            'Content-Type': 'application/json'
        }
    });

    if (!nextOrderResponse.ok) {
        throw new Error('Failed to fetch next order');
    }

    const nextOrders = await nextOrderResponse.json();
    if (nextOrders.length === 0) {
        return {
            assigned: false,
            message: 'No orders in queue'
        };
    }

    const nextOrder = nextOrders[0];

    // Assign order to processor
    const assignResponse = await fetch(`${supabaseUrl}/rest/v1/order_priority_queue?id=eq.${nextOrder.id}`, {
        method: 'PATCH',
        headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'apikey': serviceRoleKey,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            queue_status: 'assigned',
            assigned_to_user_id: userId,
            assigned_at: new Date().toISOString(),
            auto_assigned: true
        })
    });

    if (!assignResponse.ok) {
        throw new Error('Failed to assign order');
    }

    // Update order with assigned processor
    await fetch(`${supabaseUrl}/rest/v1/orders?id=eq.${nextOrder.order_id}`, {
        method: 'PATCH',
        headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'apikey': serviceRoleKey,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            assigned_processor_id: userId
        })
    });

    return {
        assigned: true,
        orderId: nextOrder.order_id,
        queuePosition: nextOrder.queue_position,
        priorityScore: nextOrder.priority_score,
        assignedTo: userId
    };
}

// Helper function to update order priority
async function updateOrderPriority(supabaseUrl, serviceRoleKey, orderId) {
    // Calculate new priority score
    const priorityResponse = await fetch(`${supabaseUrl}/rest/v1/rpc/calculate_priority_score`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'apikey': serviceRoleKey,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ p_order_id: orderId })
    });

    if (!priorityResponse.ok) {
        throw new Error('Failed to calculate priority score');
    }

    const newPriorityScore = await priorityResponse.json();

    // Update priority in queue
    const updateResponse = await fetch(`${supabaseUrl}/rest/v1/order_priority_queue?order_id=eq.${orderId}`, {
        method: 'PATCH',
        headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'apikey': serviceRoleKey,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            priority_score: newPriorityScore
        })
    });

    if (!updateResponse.ok) {
        throw new Error('Failed to update priority');
    }

    return {
        orderId,
        newPriorityScore,
        updated: true
    };
}

// Helper function to get queue status
async function getQueueStatus(supabaseUrl, serviceRoleKey, queueType) {
    const statusResponse = await fetch(`${supabaseUrl}/rest/v1/order_priority_queue?queue_type=eq.${queueType}&select=queue_status,count()&group=queue_status`, {
        headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'apikey': serviceRoleKey,
            'Content-Type': 'application/json'
        }
    });

    if (!statusResponse.ok) {
        throw new Error('Failed to fetch queue status');
    }

    const statusData = await statusResponse.json();

    // Get average processing time
    const avgTimeResponse = await fetch(`${supabaseUrl}/rest/v1/processing_analytics?select=total_fulfillment_minutes.avg()`, {
        headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'apikey': serviceRoleKey,
            'Content-Type': 'application/json'
        }
    });

    let avgProcessingTime = null;
    if (avgTimeResponse.ok) {
        const avgData = await avgTimeResponse.json();
        avgProcessingTime = avgData[0]?.avg || 0;
    }

    return {
        queueType,
        statusBreakdown: statusData,
        avgProcessingTimeMinutes: avgProcessingTime,
        timestamp: new Date().toISOString()
    };
}

// Helper function to escalate order
async function escalateOrder(supabaseUrl, serviceRoleKey, orderId) {
    // Get current queue item
    const queueResponse = await fetch(`${supabaseUrl}/rest/v1/order_priority_queue?order_id=eq.${orderId}`, {
        headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'apikey': serviceRoleKey,
            'Content-Type': 'application/json'
        }
    });

    if (!queueResponse.ok) {
        throw new Error('Failed to fetch queue item');
    }

    const queueItems = await queueResponse.json();
    if (queueItems.length === 0) {
        throw new Error('Order not found in queue');
    }

    const queueItem = queueItems[0];
    const newPriorityScore = queueItem.priority_score + 200; // Escalation boost

    // Update priority and mark for manual review
    const updateResponse = await fetch(`${supabaseUrl}/rest/v1/order_priority_queue?id=eq.${queueItem.id}`, {
        method: 'PATCH',
        headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'apikey': serviceRoleKey,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            priority_score: newPriorityScore,
            escalation_required: true,
            requires_manual_review: true,
            updated_at: new Date().toISOString()
        })
    });

    if (!updateResponse.ok) {
        throw new Error('Failed to escalate order');
    }

    return {
        orderId,
        escalated: true,
        oldPriorityScore: queueItem.priority_score,
        newPriorityScore,
        requiresManualReview: true
    };
}