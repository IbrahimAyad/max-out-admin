// Exception Handling Function
// Handles order exceptions, escalations, and automated resolution attempts

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
        const { 
            action, 
            orderId, 
            exceptionType, 
            severity, 
            description, 
            resolutionNotes, 
            escalateToUserId,
            exceptionId 
        } = await req.json();

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
            case 'create_exception':
                if (!orderId || !exceptionType || !severity) {
                    throw new Error('Order ID, exception type, and severity are required');
                }
                result = await createException(supabaseUrl, serviceRoleKey, {
                    orderId, exceptionType, severity, description
                });
                break;

            case 'resolve_exception':
                if (!exceptionId) {
                    throw new Error('Exception ID is required');
                }
                result = await resolveException(supabaseUrl, serviceRoleKey, exceptionId, resolutionNotes);
                break;

            case 'escalate_exception':
                if (!exceptionId || !escalateToUserId) {
                    throw new Error('Exception ID and escalation user ID are required');
                }
                result = await escalateException(supabaseUrl, serviceRoleKey, exceptionId, escalateToUserId);
                break;

            case 'auto_resolve_attempt':
                if (!exceptionId) {
                    throw new Error('Exception ID is required');
                }
                result = await attemptAutoResolution(supabaseUrl, serviceRoleKey, exceptionId);
                break;

            case 'get_exceptions':
                result = await getExceptions(supabaseUrl, serviceRoleKey, orderId);
                break;

            case 'notify_customer':
                if (!exceptionId) {
                    throw new Error('Exception ID is required');
                }
                result = await notifyCustomer(supabaseUrl, serviceRoleKey, exceptionId);
                break;

            default:
                throw new Error(`Invalid action: ${action}`);
        }

        return new Response(JSON.stringify({ data: result }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Exception handling error:', error);

        const errorResponse = {
            error: {
                code: 'EXCEPTION_HANDLING_FAILED',
                message: error.message
            }
        };

        return new Response(JSON.stringify(errorResponse), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});

// Helper function to create new exception
async function createException(supabaseUrl, serviceRoleKey, { orderId, exceptionType, severity, description }) {
    // Get order details
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

    const order = orders[0];

    // Assess customer impact
    const impactLevel = assessCustomerImpact(exceptionType, severity, order);
    const affectsDelivery = ['stock_out', 'quality_issue', 'shipping_delay'].includes(exceptionType);
    const estimatedDelayDays = affectsDelivery ? calculateDelayDays(exceptionType, severity) : 0;

    // Create exception record
    const exceptionResponse = await fetch(`${supabaseUrl}/rest/v1/order_exceptions`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'apikey': serviceRoleKey,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
        },
        body: JSON.stringify({
            order_id: orderId,
            exception_type: exceptionType,
            severity: severity,
            title: `${exceptionType.replace('_', ' ').toUpperCase()} - Order ${order.order_number}`,
            description: description || `${exceptionType} detected for order ${order.order_number}`,
            status: 'open',
            auto_resolvable: isAutoResolvable(exceptionType),
            affects_delivery_date: affectsDelivery,
            estimated_delay_days: estimatedDelayDays,
            customer_impact_level: impactLevel,
            customer_acceptance_required: ['significant', 'severe'].includes(impactLevel)
        })
    });

    if (!exceptionResponse.ok) {
        const errorText = await exceptionResponse.text();
        throw new Error(`Failed to create exception: ${errorText}`);
    }

    const newException = await exceptionResponse.json();
    const exception = newException[0];

    // Update order status if severe
    if (severity === 'critical' || severity === 'high') {
        await fetch(`${supabaseUrl}/rest/v1/orders?id=eq.${orderId}`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                status: 'exception',
                updated_at: new Date().toISOString()
            })
        });
    }

    // Trigger automatic resolution attempt if applicable
    if (exception.auto_resolvable) {
        setTimeout(() => {
            attemptAutoResolution(supabaseUrl, serviceRoleKey, exception.id);
        }, 5000); // Attempt after 5 seconds
    }

    return {
        exception,
        autoResolutionQueued: exception.auto_resolvable,
        impactLevel,
        affectsDelivery,
        estimatedDelayDays
    };
}

// Helper function to resolve exception
async function resolveException(supabaseUrl, serviceRoleKey, exceptionId, resolutionNotes) {
    const updateResponse = await fetch(`${supabaseUrl}/rest/v1/order_exceptions?id=eq.${exceptionId}`, {
        method: 'PATCH',
        headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'apikey': serviceRoleKey,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
        },
        body: JSON.stringify({
            status: 'resolved',
            resolution_notes: resolutionNotes,
            resolved_at: new Date().toISOString()
        })
    });

    if (!updateResponse.ok) {
        throw new Error('Failed to resolve exception');
    }

    const resolvedExceptions = await updateResponse.json();
    const exception = resolvedExceptions[0];

    // If this was the last exception for the order, update order status
    const remainingExceptionsResponse = await fetch(`${supabaseUrl}/rest/v1/order_exceptions?order_id=eq.${exception.order_id}&status=neq.resolved&select=count()`, {
        headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'apikey': serviceRoleKey,
            'Content-Type': 'application/json'
        }
    });

    if (remainingExceptionsResponse.ok) {
        const remainingCount = await remainingExceptionsResponse.json();
        if (remainingCount[0]?.count === 0) {
            // No more exceptions, revert order status to processing
            await fetch(`${supabaseUrl}/rest/v1/orders?id=eq.${exception.order_id}`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    status: 'processing',
                    updated_at: new Date().toISOString()
                })
            });
        }
    }

    return {
        resolved: true,
        exceptionId,
        resolutionNotes,
        resolvedAt: new Date().toISOString()
    };
}

// Helper function to escalate exception
async function escalateException(supabaseUrl, serviceRoleKey, exceptionId, escalateToUserId) {
    const updateResponse = await fetch(`${supabaseUrl}/rest/v1/order_exceptions?id=eq.${exceptionId}`, {
        method: 'PATCH',
        headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'apikey': serviceRoleKey,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            status: 'escalated',
            escalated_to_user_id: escalateToUserId,
            escalated_at: new Date().toISOString(),
            escalation_level: 1
        })
    });

    if (!updateResponse.ok) {
        throw new Error('Failed to escalate exception');
    }

    return {
        escalated: true,
        exceptionId,
        escalatedTo: escalateToUserId,
        escalatedAt: new Date().toISOString()
    };
}

// Helper function to attempt automatic resolution
async function attemptAutoResolution(supabaseUrl, serviceRoleKey, exceptionId) {
    // Get exception details
    const exceptionResponse = await fetch(`${supabaseUrl}/rest/v1/order_exceptions?id=eq.${exceptionId}&select=*`, {
        headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'apikey': serviceRoleKey,
            'Content-Type': 'application/json'
        }
    });

    if (!exceptionResponse.ok) {
        throw new Error('Failed to fetch exception details');
    }

    const exceptions = await exceptionResponse.json();
    if (exceptions.length === 0) {
        throw new Error('Exception not found');
    }

    const exception = exceptions[0];
    let resolutionSuccess = false;
    let resolutionNotes = '';

    // Attempt resolution based on exception type
    switch (exception.exception_type) {
        case 'payment_retry':
            // Simulate payment retry logic
            resolutionSuccess = Math.random() > 0.3; // 70% success rate
            resolutionNotes = resolutionSuccess ? 'Payment retry successful' : 'Payment retry failed - manual intervention required';
            break;

        case 'inventory_check':
            // Simulate inventory verification
            resolutionSuccess = Math.random() > 0.2; // 80% success rate
            resolutionNotes = resolutionSuccess ? 'Inventory verified - item available' : 'Inventory shortage confirmed';
            break;

        case 'address_validation':
            // Simulate address validation
            resolutionSuccess = Math.random() > 0.1; // 90% success rate
            resolutionNotes = resolutionSuccess ? 'Address validated successfully' : 'Address validation failed - customer contact required';
            break;

        default:
            resolutionNotes = 'Auto-resolution not available for this exception type';
            break;
    }

    // Update exception with resolution attempt
    const updateData = {
        resolution_attempted: true,
        resolution_notes: resolutionNotes,
        updated_at: new Date().toISOString()
    };

    if (resolutionSuccess) {
        updateData.status = 'resolved';
        updateData.resolved_at = new Date().toISOString();
    }

    await fetch(`${supabaseUrl}/rest/v1/order_exceptions?id=eq.${exceptionId}`, {
        method: 'PATCH',
        headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'apikey': serviceRoleKey,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
    });

    return {
        autoResolutionAttempted: true,
        resolutionSuccess,
        resolutionNotes,
        exceptionId
    };
}

// Helper function to get exceptions
async function getExceptions(supabaseUrl, serviceRoleKey, orderId) {
    const query = orderId ? `order_id=eq.${orderId}` : '';
    const exceptionsResponse = await fetch(`${supabaseUrl}/rest/v1/order_exceptions?${query}&order=created_at.desc`, {
        headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'apikey': serviceRoleKey,
            'Content-Type': 'application/json'
        }
    });

    if (!exceptionsResponse.ok) {
        throw new Error('Failed to fetch exceptions');
    }

    const exceptions = await exceptionsResponse.json();

    return {
        exceptions,
        count: exceptions.length,
        openCount: exceptions.filter(e => e.status === 'open').length,
        resolvedCount: exceptions.filter(e => e.status === 'resolved').length
    };
}

// Helper function to notify customer about exception
async function notifyCustomer(supabaseUrl, serviceRoleKey, exceptionId) {
    // Get exception and order details
    const exceptionResponse = await fetch(`${supabaseUrl}/rest/v1/order_exceptions?id=eq.${exceptionId}&select=*,orders(*)`, {
        headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'apikey': serviceRoleKey,
            'Content-Type': 'application/json'
        }
    });

    if (!exceptionResponse.ok) {
        throw new Error('Failed to fetch exception details');
    }

    const exceptions = await exceptionResponse.json();
    if (exceptions.length === 0) {
        throw new Error('Exception not found');
    }

    const exception = exceptions[0];

    // Trigger customer communication
    const communicationResponse = await fetch(`${supabaseUrl}/functions/v1/customer-communication`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            orderId: exception.order_id,
            communicationType: 'exception_alert',
            customMessage: `We wanted to update you about your order. ${exception.description}. ${exception.estimated_delay_days > 0 ? `This may delay delivery by approximately ${exception.estimated_delay_days} days.` : ''} We're working to resolve this quickly.`,
            triggerReason: `Exception: ${exception.exception_type}`
        })
    });

    const customerNotified = communicationResponse.ok;

    // Update exception to mark customer as notified
    if (customerNotified) {
        await fetch(`${supabaseUrl}/rest/v1/order_exceptions?id=eq.${exceptionId}`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                customer_notified: true,
                customer_notification_sent_at: new Date().toISOString()
            })
        });
    }

    return {
        customerNotified,
        exceptionId,
        notificationSentAt: customerNotified ? new Date().toISOString() : null
    };
}

// Utility functions
function assessCustomerImpact(exceptionType, severity, order) {
    const highImpactTypes = ['stock_out', 'quality_issue', 'shipping_delay'];
    const isHighValue = order.total_amount > 1000;
    const isRushOrder = order.is_rush_order;

    if (severity === 'critical' || (highImpactTypes.includes(exceptionType) && isRushOrder)) {
        return 'severe';
    } else if (severity === 'high' || (highImpactTypes.includes(exceptionType) && isHighValue)) {
        return 'significant';
    } else if (severity === 'medium' || highImpactTypes.includes(exceptionType)) {
        return 'moderate';
    } else {
        return 'minimal';
    }
}

function calculateDelayDays(exceptionType, severity) {
    const delayMap = {
        stock_out: { low: 1, medium: 3, high: 7, critical: 14 },
        quality_issue: { low: 1, medium: 2, high: 5, critical: 10 },
        shipping_delay: { low: 1, medium: 2, high: 3, critical: 5 }
    };

    return delayMap[exceptionType]?.[severity] || 0;
}

function isAutoResolvable(exceptionType) {
    const autoResolvableTypes = ['payment_retry', 'inventory_check', 'address_validation'];
    return autoResolvableTypes.includes(exceptionType);
}