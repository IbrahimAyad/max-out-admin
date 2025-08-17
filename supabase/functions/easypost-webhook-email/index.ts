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
        const webhookData = await req.json();
        
        // Extract tracking information from EasyPost webhook
        const { 
            object: trackingObject,
            description,
            result
        } = webhookData;

        if (!trackingObject || trackingObject.object !== 'Tracker') {
            throw new Error('Invalid EasyPost tracking webhook data');
        }

        const {
            id: trackerId,
            tracking_code,
            status,
            status_detail,
            est_delivery_date,
            carrier,
            tracking_details
        } = trackingObject;

        // Get Supabase configuration
        const supabaseUrl = Deno.env.get('SUPABASE_URL');
        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

        if (!supabaseUrl || !serviceRoleKey) {
            throw new Error('Supabase configuration missing');
        }

        // Find the order associated with this tracking number
        const orderResponse = await fetch(`${supabaseUrl}/rest/v1/orders?tracking_number=eq.${tracking_code}`, {
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey
            }
        });

        if (!orderResponse.ok) {
            throw new Error('Failed to fetch order data');
        }

        const orders = await orderResponse.json();
        
        if (orders.length === 0) {
            console.log(`No order found for tracking number: ${tracking_code}`);
            return new Response(JSON.stringify({
                data: {
                    message: 'No order found for tracking number',
                    tracking_code
                }
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        const order = orders[0];

        // Determine email type based on tracking status
        let emailType = null;
        
        switch (status) {
            case 'pre_transit':
                emailType = 'shipping_confirmation';
                break;
            case 'in_transit':
                emailType = 'tracking_update';
                break;
            case 'delivered':
                emailType = 'delivery_confirmation';
                break;
            case 'out_for_delivery':
                emailType = 'out_for_delivery';
                break;
            case 'exception':
            case 'failure':
                emailType = 'delivery_exception';
                break;
            default:
                console.log(`Unhandled tracking status: ${status}`);
                break;
        }

        if (!emailType) {
            return new Response(JSON.stringify({
                data: {
                    message: 'No email action needed for this status',
                    status,
                    tracking_code
                }
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // Prepare tracking data for email
        const trackingData = {
            tracking_code,
            carrier,
            status,
            status_detail,
            estimated_delivery_date: est_delivery_date,
            tracking_url: `https://tools.usps.com/go/TrackConfirmAction?qtc_tLabels1=${tracking_code}`,
            latest_update: tracking_details && tracking_details.length > 0 
                ? tracking_details[tracking_details.length - 1] 
                : null
        };

        // Send email via our send-email function
        const emailResponse = await fetch(`${supabaseUrl}/functions/v1/send-email`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                emailType,
                orderData: order,
                trackingData
            })
        });

        if (!emailResponse.ok) {
            const errorText = await emailResponse.text();
            throw new Error(`Failed to send email: ${errorText}`);
        }

        // Update order status in database if delivered
        if (status === 'delivered') {
            await fetch(`${supabaseUrl}/rest/v1/orders?id=eq.${order.id}`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    status: 'delivered',
                    delivered_at: new Date().toISOString()
                })
            });
        }

        return new Response(JSON.stringify({
            data: {
                success: true,
                message: `Email sent for ${emailType}`,
                order_id: order.id,
                tracking_code,
                status
            }
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('EasyPost webhook email error:', error);

        const errorResponse = {
            error: {
                code: 'WEBHOOK_EMAIL_FAILED',
                message: error.message
            }
        };

        return new Response(JSON.stringify(errorResponse), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});