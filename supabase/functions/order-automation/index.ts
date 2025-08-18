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
        const { action, orderData, previousStatus } = await req.json();

        if (!action || !orderData) {
            throw new Error('Missing required parameters: action and orderData');
        }

        const supabaseUrl = Deno.env.get('SUPABASE_URL');
        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

        if (!supabaseUrl || !serviceRoleKey) {
            throw new Error('Supabase configuration missing');
        }

        const results = [];

        switch (action) {
            case 'order_created':
                // Send customer confirmation email
                const customerEmailResult = await fetch(`${supabaseUrl}/functions/v1/send-email`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        emailType: 'order_confirmation',
                        orderData
                    })
                });

                if (customerEmailResult.ok) {
                    results.push({ type: 'customer_confirmation', status: 'sent' });
                } else {
                    results.push({ type: 'customer_confirmation', status: 'failed', error: await customerEmailResult.text() });
                }

                // Send admin notification email
                const adminEmailResult = await fetch(`${supabaseUrl}/functions/v1/send-email`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        emailType: 'admin_new_order',
                        orderData
                    })
                });

                if (adminEmailResult.ok) {
                    results.push({ type: 'admin_notification', status: 'sent' });
                } else {
                    results.push({ type: 'admin_notification', status: 'failed', error: await adminEmailResult.text() });
                }
                break;

            case 'status_changed':
                const currentStatus = orderData.status;
                
                // Determine if email should be sent based on status change
                if (currentStatus === 'processing' && previousStatus === 'pending') {
                    // Order is being processed
                    const processingEmailResult = await fetch(`${supabaseUrl}/functions/v1/send-email`, {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${serviceRoleKey}`,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            emailType: 'order_processing',
                            orderData
                        })
                    });

                    if (processingEmailResult.ok) {
                        results.push({ type: 'processing_notification', status: 'sent' });
                    } else {
                        results.push({ type: 'processing_notification', status: 'failed', error: await processingEmailResult.text() });
                    }
                }
                
                if (currentStatus === 'shipped' && orderData.tracking_number) {
                    // Order has been shipped
                    const shippingEmailResult = await fetch(`${supabaseUrl}/functions/v1/send-email`, {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${serviceRoleKey}`,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            emailType: 'shipping_confirmation',
                            orderData,
                            trackingData: {
                                tracking_code: orderData.tracking_number,
                                carrier: orderData.carrier || 'USPS',
                                tracking_url: `https://tools.usps.com/go/TrackConfirmAction?qtc_tLabels1=${orderData.tracking_number}`
                            }
                        })
                    });

                    if (shippingEmailResult.ok) {
                        results.push({ type: 'shipping_confirmation', status: 'sent' });
                    } else {
                        results.push({ type: 'shipping_confirmation', status: 'failed', error: await shippingEmailResult.text() });
                    }
                }
                break;

            case 'shipping_label_created':
                if (orderData.tracking_number) {
                    const labelEmailResult = await fetch(`${supabaseUrl}/functions/v1/send-email`, {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${serviceRoleKey}`,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            emailType: 'shipping_confirmation',
                            orderData,
                            trackingData: {
                                tracking_code: orderData.tracking_number,
                                carrier: orderData.carrier || 'USPS',
                                tracking_url: `https://tools.usps.com/go/TrackConfirmAction?qtc_tLabels1=${orderData.tracking_number}`
                            }
                        })
                    });

                    if (labelEmailResult.ok) {
                        results.push({ type: 'shipping_label_created', status: 'sent' });
                    } else {
                        results.push({ type: 'shipping_label_created', status: 'failed', error: await labelEmailResult.text() });
                    }
                }
                break;

            default:
                throw new Error(`Unknown action: ${action}`);
        }

        return new Response(JSON.stringify({
            data: {
                success: true,
                action,
                results,
                order_id: orderData.id
            }
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Order automation error:', error);

        const errorResponse = {
            error: {
                code: 'ORDER_AUTOMATION_FAILED',
                message: error.message
            }
        };

        return new Response(JSON.stringify(errorResponse), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});