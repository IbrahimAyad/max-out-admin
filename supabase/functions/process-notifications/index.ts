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
        console.log('Processing notifications...');
        
        // Get Supabase credentials
        const supabaseUrl = Deno.env.get('SUPABASE_URL');
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
        const sendGridKey = Deno.env.get('SENDGRID_API_KEY');
        const emailFrom = Deno.env.get('EMAIL_FROM') || 'admin@kctmenswear.com';
        
        if (!supabaseUrl || !supabaseKey) {
            throw new Error('Missing Supabase environment variables');
        }

        // Get pending notifications that need email processing
        const notificationsResponse = await fetch(`${supabaseUrl}/rest/v1/admin_notifications?email_sent=eq.false&select=*`, {
            headers: {
                'Authorization': `Bearer ${supabaseKey}`,
                'apikey': supabaseKey
            }
        });

        if (!notificationsResponse.ok) {
            throw new Error('Failed to fetch notifications');
        }

        const notifications = await notificationsResponse.json();
        console.log(`Found ${notifications.length} notifications to process`);

        const processedCount = {
            sent: 0,
            failed: 0,
            skipped: 0
        };

        // Process each notification
        for (const notification of notifications) {
            try {
                // Send email if SendGrid is configured
                if (sendGridKey) {
                    const emailData = {
                        personalizations: [{
                            to: [{ email: emailFrom }],
                            subject: `[KCT Admin] ${notification.title}`
                        }],
                        from: { email: emailFrom, name: 'KCT Menswear Admin' },
                        content: [{
                            type: 'text/html',
                            value: generateEmailContent(notification)
                        }]
                    };

                    const emailResponse = await fetch('https://api.sendgrid.com/v3/mail/send', {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${sendGridKey}`,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(emailData)
                    });

                    if (emailResponse.ok) {
                        processedCount.sent++;
                        console.log(`Email sent for notification ${notification.id}`);
                    } else {
                        console.error(`Failed to send email for notification ${notification.id}`);
                        processedCount.failed++;
                    }
                }

                // Mark email as sent
                await fetch(`${supabaseUrl}/rest/v1/admin_notifications?id=eq.${notification.id}`, {
                    method: 'PATCH',
                    headers: {
                        'Authorization': `Bearer ${supabaseKey}`,
                        'Content-Type': 'application/json',
                        'apikey': supabaseKey
                    },
                    body: JSON.stringify({
                        email_sent: true,
                        email_sent_at: new Date().toISOString(),
                        updated_at: new Date().toISOString()
                    })
                });

            } catch (error) {
                console.error(`Error processing notification ${notification.id}:`, error);
                processedCount.failed++;
            }
        }

        return new Response(JSON.stringify({
            success: true,
            processed: processedCount,
            message: `Processed ${notifications.length} notifications`
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Notification processing error:', error);
        
        return new Response(JSON.stringify({
            success: false,
            error: {
                code: 'NOTIFICATION_PROCESSING_ERROR',
                message: error.message || 'Failed to process notifications'
            }
        }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});

function generateEmailContent(notification) {
    const data = notification.data || {};
    
    let content = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: #000; color: white; padding: 20px; text-align: center;">
            <h1 style="margin: 0; font-size: 24px;">KCT Menswear</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.8;">Admin Notification</p>
        </div>
        
        <div style="background: #f8f9fa; padding: 20px; border-left: 4px solid ${getPriorityColor(notification.priority)};">
            <h2 style="margin: 0 0 10px 0; color: #333;">${notification.title}</h2>
            <p style="margin: 0; color: #666; font-size: 16px;">${notification.message}</p>
        </div>
        
        <div style="padding: 20px; background: white;">
            <p><strong>Created:</strong> ${new Date(notification.created_at).toLocaleString()}</p>
        </div>
    </div>
    `;
    
    return content;
}

function getPriorityColor(priority) {
    switch (priority) {
        case 'urgent': return '#dc3545';
        case 'high': return '#fd7e14';
        case 'normal': return '#0d6efd';
        case 'low': return '#6c757d';
        default: return '#0d6efd';
    }
}
