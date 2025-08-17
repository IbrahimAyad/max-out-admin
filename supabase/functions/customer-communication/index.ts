// Customer Communication Function
// Handles automated customer communications with KCT Knowledge API personalization

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
        const { orderId, communicationType, customMessage, recipientOverride, triggerReason } = await req.json();

        if (!orderId || !communicationType) {
            throw new Error('Order ID and communication type are required');
        }

        // Get environment variables
        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
        const supabaseUrl = Deno.env.get('SUPABASE_URL');
        const kctApiUrl = Deno.env.get('KCT_KNOWLEDGE_API_URL');
        const kctApiKey = Deno.env.get('KCT_KNOWLEDGE_API_KEY');

        if (!serviceRoleKey || !supabaseUrl) {
            throw new Error('Supabase configuration missing');
        }

        // Get order details with customer information
        const orderResponse = await fetch(`${supabaseUrl}/rest/v1/orders?id=eq.${orderId}&select=*,order_items(*)`, {
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
        const customerEmail = recipientOverride || order.customer_email || order.email;
        const customerName = order.customer_name;

        // Generate personalized content using KCT Knowledge API
        let personalizedContent = null;
        let kctRequestId = null;

        if (kctApiUrl && kctApiKey) {
            try {
                const kctResponse = await fetch(`${kctApiUrl}/personalize-communication`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${kctApiKey}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        customerEmail,
                        orderData: {
                            orderNumber: order.order_number,
                            totalAmount: order.total_amount,
                            items: order.order_items,
                            status: order.status,
                            isRushOrder: order.is_rush_order,
                            estimatedDelivery: order.estimated_delivery_date
                        },
                        communicationType
                    })
                });

                if (kctResponse.ok) {
                    const kctData = await kctResponse.json();
                    personalizedContent = kctData.data;
                    kctRequestId = kctData.requestId;
                }
            } catch (error) {
                console.warn('KCT API personalization failed:', error.message);
            }
        }

        // Generate message content based on communication type
        const messageTemplates = {
            order_confirmation: {
                subject: `Order Confirmation - ${order.order_number}`,
                content: `Dear ${customerName},\n\nThank you for your order! Your order ${order.order_number} has been confirmed and is being prepared for processing.\n\nOrder Details:\n- Order Number: ${order.order_number}\n- Total Amount: $${order.total_amount}\n- Items: ${order.order_items?.length || 0} items\n\nWe'll keep you updated on your order's progress.\n\nBest regards,\nKCT Menswear Team`
            },
            payment_confirmation: {
                subject: `Payment Confirmed - ${order.order_number}`,
                content: `Dear ${customerName},\n\nYour payment for order ${order.order_number} has been successfully processed.\n\nYour order is now in our processing queue and will be prepared shortly.\n\nThank you for choosing KCT Menswear!`
            },
            processing_update: {
                subject: `Order Update - ${order.order_number}`,
                content: `Dear ${customerName},\n\nGreat news! Your order ${order.order_number} is now being processed by our team.\n\n${order.is_rush_order ? 'As a rush order, this is receiving priority processing.' : ''}\n\nEstimated completion: ${order.estimated_delivery_date ? new Date(order.estimated_delivery_date).toLocaleDateString() : 'We\'ll update you soon'}\n\nBest regards,\nKCT Menswear Team`
            },
            shipping_notification: {
                subject: `Your Order Has Shipped - ${order.order_number}`,
                content: `Dear ${customerName},\n\nExcellent news! Your order ${order.order_number} has been shipped.\n\n${order.tracking_number ? `Tracking Number: ${order.tracking_number}\nCarrier: ${order.carrier || order.shipping_carrier || 'Standard Shipping'}\n\n` : ''}You can expect delivery ${order.estimated_delivery_date ? `on ${new Date(order.estimated_delivery_date).toLocaleDateString()}` : 'within the next few business days'}.\n\nThank you for your business!`
            },
            delivery_confirmation: {
                subject: `Order Delivered - ${order.order_number}`,
                content: `Dear ${customerName},\n\nYour order ${order.order_number} has been successfully delivered!\n\nWe hope you love your new items from KCT Menswear. If you have any questions or concerns, please don't hesitate to reach out.\n\nWe'd love to hear about your experience - consider leaving us a review!\n\nThank you for choosing KCT Menswear.`
            },
            exception_alert: {
                subject: `Important Update - ${order.order_number}`,
                content: `Dear ${customerName},\n\nWe wanted to inform you about an update regarding your order ${order.order_number}.\n\n${customMessage || 'We\'re working to resolve this quickly and will keep you updated.'}\n\nIf you have any questions, please contact our customer service team.\n\nThank you for your patience.`
            }
        };

        const template = messageTemplates[communicationType];
        if (!template) {
            throw new Error(`Invalid communication type: ${communicationType}`);
        }

        let finalSubject = template.subject;
        let finalContent = customMessage || template.content;

        // Apply personalized content if available
        if (personalizedContent) {
            finalSubject = personalizedContent.subject || finalSubject;
            finalContent = personalizedContent.content || finalContent;
        }

        // Simulate sending email (in real implementation, integrate with email service)
        const emailSent = true; // Placeholder for actual email sending logic
        const deliveryStatus = emailSent ? 'sent' : 'failed';

        // Log communication in database
        const logResponse = await fetch(`${supabaseUrl}/rest/v1/customer_communication_logs`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                order_id: orderId,
                customer_id: order.customer_id,
                communication_type: communicationType,
                communication_channel: 'email',
                subject: finalSubject,
                message_content: finalContent,
                personalized_content: personalizedContent,
                recipient_email: customerEmail,
                sent_at: emailSent ? new Date().toISOString() : null,
                delivery_status: deliveryStatus,
                is_automated: true,
                automation_trigger: triggerReason || 'System triggered',
                kct_knowledge_api_request_id: kctRequestId
            })
        });

        if (!logResponse.ok) {
            console.error('Failed to log communication:', await logResponse.text());
        }

        return new Response(JSON.stringify({
            data: {
                orderId,
                communicationType,
                recipient: customerEmail,
                subject: finalSubject,
                deliveryStatus,
                personalizedContent: !!personalizedContent,
                kctRequestId
            }
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Customer communication error:', error);

        const errorResponse = {
            error: {
                code: 'COMMUNICATION_FAILED',
                message: error.message
            }
        };

        return new Response(JSON.stringify(errorResponse), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});