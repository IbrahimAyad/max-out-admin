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
        const { emailType, orderData, trackingData, customData } = await req.json();

        // Get SendGrid configuration
        const sendGridApiKey = Deno.env.get('SENDGRID_API_KEY');
        const fromEmail = Deno.env.get('FROM_EMAIL') || 'noreply@kctmenswear.com';
        const adminEmail = Deno.env.get('ADMIN_EMAIL') || 'KCTMenswear@gmail.com';

        if (!sendGridApiKey) {
            throw new Error('SendGrid API key not configured');
        }

        // Get email template based on type
        const emailContent = getEmailTemplate(emailType, {
            order: orderData,
            tracking: trackingData,
            custom: customData
        });

        if (!emailContent) {
            throw new Error(`Unknown email type: ${emailType}`);
        }

        // Prepare SendGrid request
        const emailData = {
            personalizations: [{
                to: [{ email: emailContent.to }],
                subject: emailContent.subject
            }],
            from: {
                email: fromEmail,
                name: 'KCT Menswear'
            },
            content: [{
                type: 'text/html',
                value: emailContent.html
            }]
        };

        // Send email via SendGrid
        const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${sendGridApiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(emailData)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`SendGrid API error: ${response.status} - ${errorText}`);
        }

        // Log email send to database
        const supabaseUrl = Deno.env.get('SUPABASE_URL');
        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

        if (supabaseUrl && serviceRoleKey) {
            await fetch(`${supabaseUrl}/rest/v1/email_logs`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email_type: emailType,
                    recipient: emailContent.to,
                    subject: emailContent.subject,
                    order_id: orderData?.id || null,
                    tracking_number: trackingData?.tracking_code || null,
                    status: 'sent',
                    sent_at: new Date().toISOString()
                })
            });
        }

        return new Response(JSON.stringify({
            data: {
                success: true,
                message: 'Email sent successfully',
                emailType,
                recipient: emailContent.to
            }
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Email sending error:', error);

        const errorResponse = {
            error: {
                code: 'EMAIL_SEND_FAILED',
                message: error.message
            }
        };

        return new Response(JSON.stringify(errorResponse), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});

// Email template generator function
function getEmailTemplate(emailType: string, data: any) {
    const { order, tracking, custom } = data;
    
    const baseStyles = `
        <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f8f9fa; }
            .container { max-width: 600px; margin: 0 auto; background-color: white; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
            .header { background: linear-gradient(135deg, #1f2937 0%, #374151 100%); color: white; padding: 40px 30px; text-align: center; }
            .header h1 { margin: 0; font-size: 28px; font-weight: 700; letter-spacing: 2px; }
            .content { padding: 40px 30px; }
            .order-summary { background-color: #f8f9fa; border-radius: 8px; padding: 20px; margin: 20px 0; }
            .order-item { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e9ecef; }
            .order-item:last-child { border-bottom: none; }
            .total { font-weight: bold; font-size: 18px; color: #1f2937; }
            .button { display: inline-block; background: linear-gradient(135deg, #1f2937 0%, #374151 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; }
            .footer { background-color: #f8f9fa; padding: 30px; text-align: center; color: #6b7280; border-top: 1px solid #e9ecef; }
            .tracking-info { background-color: #f0f9ff; border: 1px solid #bae6fd; border-radius: 8px; padding: 20px; margin: 20px 0; }
            .status-badge { display: inline-block; background-color: #10b981; color: white; padding: 5px 15px; border-radius: 20px; font-size: 12px; font-weight: 600; text-transform: uppercase; }
        </style>
    `;

    switch (emailType) {
        case 'order_confirmation':
            if (!order) return null;
            return {
                to: order.customer_email,
                subject: `Order Confirmation #${order.id} - KCT Menswear`,
                html: `
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <meta charset="utf-8">
                        <title>Order Confirmation</title>
                        ${baseStyles}
                    </head>
                    <body>
                        <div class="container">
                            <div class="header">
                                <h1>KCT MENSWEAR</h1>
                                <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Premium Menswear Collection</p>
                            </div>
                            <div class="content">
                                <h2 style="color: #1f2937; margin-bottom: 20px;">Thank you for your order!</h2>
                                <p>Dear ${order.customer_name || 'Valued Customer'},</p>
                                <p>We've received your order and are preparing it for shipment. You'll receive a shipping confirmation email with tracking information once your order ships.</p>
                                
                                <div class="order-summary">
                                    <h3 style="margin-top: 0; color: #1f2937;">Order Details</h3>
                                    <div class="order-item">
                                        <span><strong>Order Number:</strong></span>
                                        <span>#${order.id}</span>
                                    </div>
                                    <div class="order-item">
                                        <span><strong>Order Date:</strong></span>
                                        <span>${new Date(order.created_at).toLocaleDateString()}</span>
                                    </div>
                                    <div class="order-item">
                                        <span><strong>Status:</strong></span>
                                        <span class="status-badge">${order.status || 'Confirmed'}</span>
                                    </div>
                                    <div class="order-item total">
                                        <span>Total:</span>
                                        <span>$${(order.total_price || 0).toFixed(2)}</span>
                                    </div>
                                </div>

                                <div style="margin: 30px 0;">
                                    <h3 style="color: #1f2937;">Shipping Address</h3>
                                    <p style="margin: 5px 0;">${order.shipping_address || 'Address on file'}</p>
                                </div>

                                <p>If you have any questions about your order, please don't hesitate to contact us at ${Deno.env.get('ADMIN_EMAIL') || 'KCTMenswear@gmail.com'}.</p>
                                
                                <a href="#" class="button">Track Your Order</a>
                            </div>
                            <div class="footer">
                                <p>&copy; 2025 KCT Menswear. All rights reserved.</p>
                                <p>Premium menswear for the modern gentleman.</p>
                            </div>
                        </div>
                    </body>
                    </html>
                `
            };

        case 'shipping_confirmation':
            if (!order || !tracking) return null;
            return {
                to: order.customer_email,
                subject: `Your KCT Menswear Order Has Shipped! - Tracking #${tracking.tracking_code}`,
                html: `
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <meta charset="utf-8">
                        <title>Shipping Confirmation</title>
                        ${baseStyles}
                    </head>
                    <body>
                        <div class="container">
                            <div class="header">
                                <h1>KCT MENSWEAR</h1>
                                <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Your Order Has Shipped!</p>
                            </div>
                            <div class="content">
                                <h2 style="color: #1f2937; margin-bottom: 20px;">📦 Your order is on its way!</h2>
                                <p>Dear ${order.customer_name || 'Valued Customer'},</p>
                                <p>Great news! Your KCT Menswear order has been shipped and is on its way to you.</p>
                                
                                <div class="tracking-info">
                                    <h3 style="margin-top: 0; color: #0369a1;">Tracking Information</h3>
                                    <div class="order-item">
                                        <span><strong>Tracking Number:</strong></span>
                                        <span>${tracking.tracking_code}</span>
                                    </div>
                                    <div class="order-item">
                                        <span><strong>Carrier:</strong></span>
                                        <span>${tracking.carrier || 'Standard Shipping'}</span>
                                    </div>
                                    <div class="order-item">
                                        <span><strong>Estimated Delivery:</strong></span>
                                        <span>${tracking.estimated_delivery_date || 'Within 3-5 business days'}</span>
                                    </div>
                                </div>

                                <div class="order-summary">
                                    <h3 style="margin-top: 0; color: #1f2937;">Order Summary</h3>
                                    <div class="order-item">
                                        <span><strong>Order Number:</strong></span>
                                        <span>#${order.id}</span>
                                    </div>
                                    <div class="order-item total">
                                        <span>Total:</span>
                                        <span>$${(order.total_price || 0).toFixed(2)}</span>
                                    </div>
                                </div>

                                <a href="${tracking.tracking_url || '#'}" class="button">Track Your Package</a>
                                
                                <p>You'll receive an email notification when your package is delivered. If you have any questions, please contact us at ${Deno.env.get('ADMIN_EMAIL') || 'KCTMenswear@gmail.com'}.</p>
                            </div>
                            <div class="footer">
                                <p>&copy; 2025 KCT Menswear. All rights reserved.</p>
                                <p>Premium menswear for the modern gentleman.</p>
                            </div>
                        </div>
                    </body>
                    </html>
                `
            };

        case 'delivery_confirmation':
            if (!order || !tracking) return null;
            return {
                to: order.customer_email,
                subject: `Your KCT Menswear Order Has Been Delivered! - Order #${order.id}`,
                html: `
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <meta charset="utf-8">
                        <title>Delivery Confirmation</title>
                        ${baseStyles}
                    </head>
                    <body>
                        <div class="container">
                            <div class="header">
                                <h1>KCT MENSWEAR</h1>
                                <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Order Delivered Successfully!</p>
                            </div>
                            <div class="content">
                                <h2 style="color: #1f2937; margin-bottom: 20px;">🎉 Your order has been delivered!</h2>
                                <p>Dear ${order.customer_name || 'Valued Customer'},</p>
                                <p>We're excited to let you know that your KCT Menswear order has been successfully delivered!</p>
                                
                                <div class="order-summary">
                                    <h3 style="margin-top: 0; color: #1f2937;">Delivery Details</h3>
                                    <div class="order-item">
                                        <span><strong>Order Number:</strong></span>
                                        <span>#${order.id}</span>
                                    </div>
                                    <div class="order-item">
                                        <span><strong>Delivered On:</strong></span>
                                        <span>${new Date().toLocaleDateString()}</span>
                                    </div>
                                    <div class="order-item">
                                        <span><strong>Tracking Number:</strong></span>
                                        <span>${tracking.tracking_code}</span>
                                    </div>
                                </div>

                                <div style="background-color: #f0f9ff; border-radius: 8px; padding: 20px; margin: 30px 0;">
                                    <h3 style="margin-top: 0; color: #0369a1;">How did we do?</h3>
                                    <p>We'd love to hear about your experience with KCT Menswear. Your feedback helps us continue to provide exceptional service.</p>
                                    <a href="#" class="button" style="background: linear-gradient(135deg, #0369a1 0%, #0284c7 100%);">Leave a Review</a>
                                </div>

                                <p>Thank you for choosing KCT Menswear. We look forward to serving you again soon!</p>
                                
                                <p style="font-size: 14px; color: #6b7280; margin-top: 30px;">If you didn't receive your package or have any concerns, please contact us immediately at ${Deno.env.get('ADMIN_EMAIL') || 'KCTMenswear@gmail.com'}.</p>
                            </div>
                            <div class="footer">
                                <p>&copy; 2025 KCT Menswear. All rights reserved.</p>
                                <p>Premium menswear for the modern gentleman.</p>
                            </div>
                        </div>
                    </body>
                    </html>
                `
            };

        case 'admin_new_order':
            if (!order) return null;
            return {
                to: Deno.env.get('ADMIN_EMAIL') || 'KCTMenswear@gmail.com',
                subject: `🔔 New Order Received - #${order.id} ($${(order.total_price || 0).toFixed(2)})`,
                html: `
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <meta charset="utf-8">
                        <title>New Order Alert</title>
                        ${baseStyles}
                    </head>
                    <body>
                        <div class="container">
                            <div class="header">
                                <h1>KCT MENSWEAR</h1>
                                <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Admin Dashboard Alert</p>
                            </div>
                            <div class="content">
                                <h2 style="color: #1f2937; margin-bottom: 20px;">🛍️ New Order Received!</h2>
                                <p>A new order has been placed and requires processing.</p>
                                
                                <div class="order-summary">
                                    <h3 style="margin-top: 0; color: #1f2937;">Order Information</h3>
                                    <div class="order-item">
                                        <span><strong>Order ID:</strong></span>
                                        <span>#${order.id}</span>
                                    </div>
                                    <div class="order-item">
                                        <span><strong>Customer:</strong></span>
                                        <span>${order.customer_name || 'N/A'}</span>
                                    </div>
                                    <div class="order-item">
                                        <span><strong>Email:</strong></span>
                                        <span>${order.customer_email || 'N/A'}</span>
                                    </div>
                                    <div class="order-item">
                                        <span><strong>Order Date:</strong></span>
                                        <span>${new Date(order.created_at).toLocaleString()}</span>
                                    </div>
                                    <div class="order-item total">
                                        <span>Order Total:</span>
                                        <span>$${(order.total_price || 0).toFixed(2)}</span>
                                    </div>
                                </div>

                                <a href="https://loald6o3171u.space.minimax.io" class="button">View in Dashboard</a>
                                
                                <p style="font-size: 14px; color: #6b7280; margin-top: 30px;">Please process this order promptly to ensure customer satisfaction.</p>
                            </div>
                            <div class="footer">
                                <p>&copy; 2025 KCT Menswear Admin Dashboard</p>
                            </div>
                        </div>
                    </body>
                    </html>
                `
            };

        default:
            return null;
    }
}