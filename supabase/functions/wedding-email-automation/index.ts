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
        const supabaseUrl = Deno.env.get('SUPABASE_URL');
        const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
        const sendGridApiKey = Deno.env.get('SENDGRID_API_KEY');
        const fromEmail = Deno.env.get('SENDGRID_FROM_EMAIL') || 'weddings@kctmenswear.com';

        if (!supabaseUrl || !supabaseAnonKey || !sendGridApiKey) {
            throw new Error('Environment configuration missing');
        }

        const url = new URL(req.url);
        const method = req.method;

        // Email templates for different wedding events
        const emailTemplates = {
            wedding_welcome: {
                subject: 'Welcome to Your KCT Wedding Experience!',
                template: (data) => `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h1 style="color: #1e40af;">Welcome to KCT Menswear!</h1>
                        <p>Dear ${data.coupleName},</p>
                        <p>Congratulations on your upcoming wedding! We're excited to help you and your wedding party look their absolute best on your special day.</p>
                        <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
                            <h3>Your Wedding Details:</h3>
                            <p><strong>Wedding Date:</strong> ${new Date(data.weddingDate).toLocaleDateString()}</p>
                            <p><strong>Wedding Code:</strong> ${data.weddingCode}</p>
                            <p><strong>Party Size:</strong> ${data.partySize} members</p>
                        </div>
                        <h3>Next Steps:</h3>
                        <ol>
                            <li>Invite your wedding party members through the portal</li>
                            <li>Each member will receive their own invitation with measurement instructions</li>
                            <li>Our team will coordinate outfits and ensure perfect fits</li>
                            <li>We'll handle delivery coordination for your entire party</li>
                        </ol>
                        <p style="text-align: center; margin: 30px 0;">
                            <a href="${data.portalUrl}" style="background: #1e40af; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px;">Access Your Wedding Portal</a>
                        </p>
                        <p>Best regards,<br>The KCT Menswear Wedding Team</p>
                    </div>
                `
            },
            groomsmen_invitation: {
                subject: 'You\'re Invited to Join the Wedding Party!',
                template: (data) => `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h1 style="color: #1e40af;">Wedding Party Invitation</h1>
                        <p>Dear ${data.memberName},</p>
                        <p>You've been invited to join ${data.coupleName}'s wedding party! We're excited to help you look your best for their special day.</p>
                        <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
                            <h3>Wedding Details:</h3>
                            <p><strong>Wedding Date:</strong> ${new Date(data.weddingDate).toLocaleDateString()}</p>
                            <p><strong>Your Role:</strong> ${data.role}</p>
                            <p><strong>Venue:</strong> ${data.venueName || 'TBD'}</p>
                        </div>
                        <div style="background: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0;">
                            <p><strong>Your Invitation Code:</strong> <span style="font-family: monospace; font-size: 18px; font-weight: bold;">${data.inviteCode}</span></p>
                        </div>
                        <h3>What's Next:</h3>
                        <ol>
                            <li>Click the link below to access your personal portal</li>
                            <li>Enter your invitation code to get started</li>
                            <li>Submit your measurements using our guided system</li>
                            <li>Review and approve your assigned outfit</li>
                        </ol>
                        <p style="text-align: center; margin: 30px 0;">
                            <a href="${data.groomsmenPortalUrl}" style="background: #1e40af; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px;">Join Wedding Party</a>
                        </p>
                        <p>Questions? Reply to this email or contact our wedding coordination team.</p>
                        <p>Best regards,<br>The KCT Menswear Team</p>
                    </div>
                `
            },
            measurement_reminder: {
                subject: 'Measurement Submission Reminder - Action Required',
                template: (data) => `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h1 style="color: #d97706;">Measurement Reminder</h1>
                        <p>Dear ${data.memberName},</p>
                        <p>We haven't received your measurements yet for ${data.coupleName}'s wedding. To ensure your perfect fit, please submit them as soon as possible.</p>
                        <div style="background: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0;">
                            <h3>⏰ Time Sensitive:</h3>
                            <p><strong>Wedding Date:</strong> ${new Date(data.weddingDate).toLocaleDateString()}</p>
                            <p><strong>Days Remaining:</strong> ${data.daysUntilWedding}</p>
                            <p><strong>Deadline:</strong> ${new Date(data.measurementDeadline).toLocaleDateString()}</p>
                        </div>
                        <h3>Quick Measurement Guide:</h3>
                        <ul>
                            <li>Use our guided measurement tool in your portal</li>
                            <li>Have someone help you for accuracy</li>
                            <li>Take photos if you're unsure about any measurements</li>
                            <li>Our system provides instant size recommendations</li>
                        </ul>
                        <p style="text-align: center; margin: 30px 0;">
                            <a href="${data.measurementUrl}" style="background: #d97706; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px;">Submit Measurements Now</a>
                        </p>
                        <p><em>Need help? Contact us immediately - we're here to assist!</em></p>
                        <p>Best regards,<br>The KCT Menswear Team</p>
                    </div>
                `
            },
            order_confirmation: {
                subject: 'Wedding Order Confirmed - Delivery Details Inside',
                template: (data) => `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h1 style="color: #059669;">Order Confirmed!</h1>
                        <p>Dear ${data.customerName},</p>
                        <p>Great news! Your wedding party order has been confirmed and is now in production.</p>
                        <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0;">
                            <h3>Order Summary:</h3>
                            <p><strong>Order ID:</strong> ${data.orderId}</p>
                            <p><strong>Wedding Date:</strong> ${new Date(data.weddingDate).toLocaleDateString()}</p>
                            <p><strong>Total Items:</strong> ${data.itemCount}</p>
                            <p><strong>Total Amount:</strong> $${data.totalAmount}</p>
                            ${data.groupDiscount > 0 ? `<p><strong>Group Discount:</strong> ${data.groupDiscount}% ($${data.discountAmount} saved!)</p>` : ''}
                        </div>
                        <h3>Delivery Information:</h3>
                        <p><strong>Estimated Delivery:</strong> ${new Date(data.deliveryDate).toLocaleDateString()}</p>
                        <p><strong>Delivery Method:</strong> ${data.deliveryMethod}</p>
                        ${data.trackingNumbers ? `<p><strong>Tracking Numbers:</strong> ${data.trackingNumbers.join(', ')}</p>` : ''}
                        <div style="background: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0;">
                            <p><strong>Important:</strong> All items will be delivered ${data.daysBeforeWedding} days before your wedding to ensure adequate time for any final adjustments.</p>
                        </div>
                        <p style="text-align: center; margin: 30px 0;">
                            <a href="${data.orderTrackingUrl}" style="background: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px;">Track Your Order</a>
                        </p>
                        <p>Thank you for choosing KCT Menswear for your special day!</p>
                        <p>Best regards,<br>The KCT Menswear Team</p>
                    </div>
                `
            },
            wedding_day_prep: {
                subject: 'Your Big Day is Here! Final Preparation Guide',
                template: (data) => `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h1 style="color: #7c3aed;">It's Wedding Day! 🎉</h1>
                        <p>Dear ${data.coupleName},</p>
                        <p>Congratulations! Today is your special day, and we're honored to have been part of your wedding journey.</p>
                        <div style="background: #faf5ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
                            <h3>Final Reminders:</h3>
                            <ul>
                                <li>All outfits should be steamed or pressed this morning</li>
                                <li>Check that all accessories are included (ties, pocket squares, cufflinks)</li>
                                <li>Assign a groomsman to help with any last-minute adjustments</li>
                                <li>Take photos of the full wedding party in their KCT outfits!</li>
                            </ul>
                        </div>
                        <div style="background: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
                            <h3>Need Last-Minute Help?</h3>
                            <p><strong>Emergency Contact:</strong> ${data.emergencyPhone}</p>
                            <p><strong>Store Location:</strong> ${data.storeAddress}</p>
                            <p>We're here to help make your day perfect!</p>
                        </div>
                        <p>Wishing you a lifetime of happiness together!</p>
                        <p>With love and best wishes,<br>The Entire KCT Menswear Team</p>
                        <div style="text-align: center; margin: 30px 0;">
                            <p style="font-style: italic;">"Looking good is the best revenge... and the best wedding gift to yourself!"</p>
                        </div>
                    </div>
                `
            }
        };

        if (method === 'POST' && url.pathname.endsWith('/send')) {
            // Send individual email
            const { emailType, recipientEmail, data, customSubject, customTemplate } = await req.json();

            if (!emailType || !recipientEmail) {
                throw new Error('Email type and recipient email are required');
            }

            const template = emailTemplates[emailType];
            if (!template && !customTemplate) {
                throw new Error(`Unknown email template: ${emailType}`);
            }

            const subject = customSubject || template?.subject || 'Wedding Update from KCT Menswear';
            const htmlContent = customTemplate || template.template(data || {});

            const emailData = {
                personalizations: [{
                    to: [{ email: recipientEmail, name: data?.recipientName || '' }],
                    subject: subject
                }],
                from: { email: fromEmail, name: 'KCT Menswear Wedding Team' },
                content: [{
                    type: 'text/html',
                    value: htmlContent
                }]
            };

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
                throw new Error(`SendGrid API error: ${errorText}`);
            }

            // Log email sent
            await fetch(`${supabaseUrl}/rest/v1/wedding_communications`, {
                method: 'POST',
                headers: {
                    'apikey': supabaseAnonKey,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    wedding_id: data?.weddingId || null,
                    sender_type: 'system',
                    recipient_types: ['email'],
                    message_type: emailType,
                    subject: subject,
                    message: `Automated email sent: ${emailType}`,
                    sent_via: { email: true, sendgrid: true },
                    sent_at: new Date().toISOString(),
                    created_at: new Date().toISOString()
                })
            });

            return new Response(JSON.stringify({
                data: {
                    success: true,
                    emailType,
                    recipient: recipientEmail,
                    subject,
                    sentAt: new Date().toISOString()
                }
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });

        } else if (method === 'POST' && url.pathname.endsWith('/send-batch')) {
            // Send batch emails for wedding events
            const { emailType, recipients, data: templateData } = await req.json();

            if (!emailType || !recipients || !Array.isArray(recipients)) {
                throw new Error('Email type and recipients array are required');
            }

            const template = emailTemplates[emailType];
            if (!template) {
                throw new Error(`Unknown email template: ${emailType}`);
            }

            const results = [];
            
            for (const recipient of recipients) {
                try {
                    const personalizedData = { ...templateData, ...recipient.data };
                    const htmlContent = template.template(personalizedData);

                    const emailData = {
                        personalizations: [{
                            to: [{ email: recipient.email, name: recipient.name || '' }],
                            subject: template.subject
                        }],
                        from: { email: fromEmail, name: 'KCT Menswear Wedding Team' },
                        content: [{
                            type: 'text/html',
                            value: htmlContent
                        }]
                    };

                    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${sendGridApiKey}`,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(emailData)
                    });

                    if (response.ok) {
                        results.push({ email: recipient.email, status: 'sent' });
                    } else {
                        const errorText = await response.text();
                        results.push({ email: recipient.email, status: 'failed', error: errorText });
                    }

                    // Small delay to avoid rate limiting
                    await new Promise(resolve => setTimeout(resolve, 100));
                } catch (error) {
                    results.push({ email: recipient.email, status: 'failed', error: error.message });
                }
            }

            return new Response(JSON.stringify({
                data: {
                    emailType,
                    totalSent: results.filter(r => r.status === 'sent').length,
                    totalFailed: results.filter(r => r.status === 'failed').length,
                    results
                }
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });

        } else if (method === 'POST' && url.pathname.endsWith('/schedule-automation')) {
            // Schedule automated email sequences
            const { weddingId, automationType, scheduleDate } = await req.json();

            if (!weddingId || !automationType) {
                throw new Error('Wedding ID and automation type are required');
            }

            // Define automation sequences
            const automationSequences = {
                groomsmen_invitations: {
                    trigger: 'immediate',
                    emails: [
                        { type: 'groomsmen_invitation', delay: 0 },
                        { type: 'measurement_reminder', delay: 7 }, // 7 days later
                        { type: 'measurement_reminder', delay: 14 } // 14 days later if not completed
                    ]
                },
                pre_wedding: {
                    trigger: 'timeline_based',
                    emails: [
                        { type: 'order_confirmation', delay: -21 }, // 21 days before wedding
                        { type: 'delivery_notification', delay: -7 }, // 7 days before
                        { type: 'wedding_day_prep', delay: -1 } // 1 day before
                    ]
                }
            };

            const sequence = automationSequences[automationType];
            if (!sequence) {
                throw new Error(`Unknown automation type: ${automationType}`);
            }

            // Store automation schedule in database
            const automationData = {
                wedding_id: weddingId,
                automation_type: automationType,
                sequence_config: sequence,
                scheduled_date: scheduleDate || new Date().toISOString(),
                status: 'scheduled',
                created_at: new Date().toISOString()
            };

            // For demo purposes, we'll store this in wedding_communications with a special type
            await fetch(`${supabaseUrl}/rest/v1/wedding_communications`, {
                method: 'POST',
                headers: {
                    'apikey': supabaseAnonKey,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    wedding_id: weddingId,
                    sender_type: 'system',
                    message_type: 'automation_scheduled',
                    subject: `Email automation scheduled: ${automationType}`,
                    message: JSON.stringify(automationData),
                    created_at: new Date().toISOString()
                })
            });

            return new Response(JSON.stringify({
                data: {
                    automationType,
                    weddingId,
                    sequence,
                    scheduledDate: scheduleDate || new Date().toISOString(),
                    message: 'Email automation scheduled successfully'
                }
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });

        } else {
            return new Response(JSON.stringify({
                error: {
                    code: 'METHOD_NOT_ALLOWED',
                    message: 'Method not allowed'
                }
            }), {
                status: 405,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

    } catch (error) {
        console.error('Wedding email automation error:', error);

        const errorResponse = {
            error: {
                code: 'EMAIL_AUTOMATION_ERROR',
                message: error.message
            }
        };

        return new Response(JSON.stringify(errorResponse), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});