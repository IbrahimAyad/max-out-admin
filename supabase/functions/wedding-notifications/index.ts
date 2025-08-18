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
        const requestData = await req.json();
        const { notification_type, recipients, data } = requestData;

        if (!notification_type || !recipients || !Array.isArray(recipients)) {
            throw new Error('Missing required fields: notification_type, recipients array');
        }

        const sendgridApiKey = Deno.env.get('SENDGRID_API_KEY');
        if (!sendgridApiKey) {
            throw new Error('SendGrid API key not configured');
        }

        // Email templates for different notification types
        const templates = {
            measurement_reminder: {
                subject: 'Reminder: Please Submit Your Measurements',
                html: (data) => `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h2 style="color: #2C3E50;">Measurement Reminder</h2>
                        <p>Hi ${data.first_name},</p>
                        <p>This is a friendly reminder to submit your measurements for the upcoming wedding.</p>
                        <p><strong>Wedding:</strong> ${data.wedding_details?.venue_name || 'Wedding Event'}</p>
                        <p><strong>Date:</strong> ${data.wedding_details?.wedding_date || 'TBD'}</p>
                        <p><strong>Your Role:</strong> ${data.role}</p>
                        <a href="https://qs4j1oh0oweu.space.minimax.io?member=${data.party_member_id}" 
                           style="background-color: #E74C3C; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 20px 0;">
                            Submit Measurements Now
                        </a>
                        <p>Questions? Reply to this email or contact us directly.</p>
                    </div>
                `
            },
            fitting_scheduled: {
                subject: 'Your Fitting Appointment is Confirmed',
                html: (data) => `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h2 style="color: #27AE60;">Fitting Appointment Confirmed</h2>
                        <p>Hi ${data.first_name},</p>
                        <p>Your fitting appointment has been scheduled!</p>
                        <div style="background-color: #F8F9FA; padding: 15px; border-radius: 5px; margin: 20px 0;">
                            <p><strong>Date:</strong> ${data.fitting_date}</p>
                            <p><strong>Time:</strong> ${data.fitting_time}</p>
                            <p><strong>Location:</strong> ${data.fitting_location}</p>
                            <p><strong>Duration:</strong> 30-45 minutes</p>
                        </div>
                        <p>Please arrive 10 minutes early. Bring a photo ID and wear comfortable clothing.</p>
                        <p>Need to reschedule? Contact us at least 24 hours in advance.</p>
                    </div>
                `
            },
            order_status_update: {
                subject: 'Wedding Order Status Update',
                html: (data) => `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h2 style="color: #3498DB;">Order Status Update</h2>
                        <p>Hi ${data.first_name},</p>
                        <p>We have an update on your wedding order:</p>
                        <div style="background-color: #E8F5E8; padding: 15px; border-radius: 5px; margin: 20px 0;">
                            <p><strong>Status:</strong> ${data.status}</p>
                            <p><strong>Order ID:</strong> ${data.order_id}</p>
                            ${data.tracking_number ? `<p><strong>Tracking:</strong> ${data.tracking_number}</p>` : ''}
                            ${data.estimated_delivery ? `<p><strong>Est. Delivery:</strong> ${data.estimated_delivery}</p>` : ''}
                        </div>
                        <p>${data.message || 'Your order is progressing as scheduled.'}</p>
                        <a href="https://qs4j1oh0oweu.space.minimax.io?member=${data.party_member_id}" 
                           style="background-color: #3498DB; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 20px 0;">
                            View Order Details
                        </a>
                    </div>
                `
            }
        };

        const template = templates[notification_type];
        if (!template) {
            throw new Error(`Unknown notification type: ${notification_type}`);
        }

        const results = [];
        
        for (const recipient of recipients) {
            const { email, first_name, ...recipientData } = recipient;
            
            if (!email) {
                results.push({
                    email: 'unknown',
                    success: false,
                    error: 'Missing email address'
                });
                continue;
            }

            try {
                const emailResponse = await fetch('https://api.sendgrid.com/v3/mail/send', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${sendgridApiKey}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        from: {
                            email: 'notifications@kctmenswear.com',
                            name: 'KCT Menswear'
                        },
                        to: [{ email, name: first_name || '' }],
                        subject: template.subject,
                        html: template.html({ first_name, ...recipientData, ...data })
                    })
                });

                if (emailResponse.ok) {
                    results.push({
                        email,
                        success: true
                    });
                } else {
                    const errorText = await emailResponse.text();
                    results.push({
                        email,
                        success: false,
                        error: `SendGrid error: ${errorText}`
                    });
                }
            } catch (error) {
                results.push({
                    email,
                    success: false,
                    error: error.message
                });
            }
        }

        const successCount = results.filter(r => r.success).length;
        
        return new Response(JSON.stringify({
            success: true,
            notification_type,
            sent_count: successCount,
            total_count: recipients.length,
            results
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        const errorResponse = {
            error: {
                code: 'WEDDING_NOTIFICATIONS_ERROR',
                message: error.message
            }
        };

        return new Response(JSON.stringify(errorResponse), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});