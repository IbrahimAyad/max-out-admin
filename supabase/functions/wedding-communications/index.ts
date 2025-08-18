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
        const { action, message_data, wedding_id, member_id, filters } = await req.json();
        
        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
        const supabaseUrl = Deno.env.get('SUPABASE_URL');
        const sendGridApiKey = Deno.env.get('SENDGRID_API_KEY');
        
        if (!serviceRoleKey || !supabaseUrl) {
            throw new Error('Supabase configuration missing');
        }

        const headers = {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'apikey': serviceRoleKey,
            'Content-Type': 'application/json'
        };

        switch (action) {
            case 'send_message': {
                // Determine recipients
                let recipientIds = [];
                if (message_data.recipient_types) {
                    recipientIds = await getRecipientsByType(
                        wedding_id,
                        message_data.recipient_types,
                        supabaseUrl,
                        headers
                    );
                } else if (message_data.recipient_ids) {
                    recipientIds = message_data.recipient_ids;
                }

                // Create message record
                const messageRecord = {
                    wedding_id: wedding_id,
                    sender_id: message_data.sender_id,
                    sender_type: message_data.sender_type || 'coordinator',
                    recipient_ids: recipientIds,
                    recipient_types: message_data.recipient_types || [],
                    message_type: message_data.message_type || 'announcement',
                    subject: message_data.subject,
                    message: message_data.message,
                    html_message: message_data.html_message,
                    attachments: message_data.attachments || [],
                    sent_via: message_data.channels || ['email'],
                    email_template_id: message_data.email_template_id,
                    thread_id: message_data.thread_id,
                    reply_to_id: message_data.reply_to_id,
                    scheduled_for: message_data.scheduled_for,
                    sent_at: message_data.scheduled_for ? null : new Date().toISOString()
                };

                const response = await fetch(`${supabaseUrl}/rest/v1/wedding_communications`, {
                    method: 'POST',
                    headers: { ...headers, 'Prefer': 'return=representation' },
                    body: JSON.stringify(messageRecord)
                });

                if (!response.ok) {
                    throw new Error(`Failed to create message: ${await response.text()}`);
                }

                const message = await response.json();
                
                // Send via selected channels
                const deliveryResults = await deliverMessage(
                    message[0],
                    recipientIds,
                    supabaseUrl,
                    headers,
                    sendGridApiKey
                );

                return new Response(JSON.stringify({ 
                    data: {
                        message: message[0],
                        delivery_results: deliveryResults,
                        recipients_count: recipientIds.length
                    }
                }), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
            }

            case 'get_messages': {
                let query = `wedding_id=eq.${wedding_id}`;
                
                if (filters?.member_id) {
                    query += `&or=(sender_id.eq.${filters.member_id},recipient_ids.cs.["${filters.member_id}"])`;
                }
                
                if (filters?.thread_id) {
                    query += `&thread_id=eq.${filters.thread_id}`;
                }
                
                if (filters?.message_type) {
                    query += `&message_type=eq.${filters.message_type}`;
                }
                
                query += '&order=created_at.desc';
                
                if (filters?.limit) {
                    query += `&limit=${filters.limit}`;
                }

                const response = await fetch(
                    `${supabaseUrl}/rest/v1/wedding_communications?${query}&select=*,sender:sender_id(display_name,email)`,
                    { headers }
                );

                if (!response.ok) {
                    throw new Error(`Failed to fetch messages: ${await response.text()}`);
                }

                const messages = await response.json();
                
                return new Response(JSON.stringify({ data: messages }), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
            }

            case 'mark_as_read': {
                const messageId = message_data.message_id;
                const userId = message_data.user_id;
                
                // Get current read status
                const messageResponse = await fetch(
                    `${supabaseUrl}/rest/v1/wedding_communications?id=eq.${messageId}`,
                    { headers }
                );
                
                if (!messageResponse.ok) {
                    throw new Error('Message not found');
                }
                
                const messages = await messageResponse.json();
                const message = messages[0];
                
                const readBy = message.read_by || {};
                readBy[userId] = new Date().toISOString();

                const updateResponse = await fetch(`${supabaseUrl}/rest/v1/wedding_communications?id=eq.${messageId}`, {
                    method: 'PATCH',
                    headers,
                    body: JSON.stringify({
                        read_by: readBy
                    })
                });

                if (!updateResponse.ok) {
                    throw new Error(`Failed to mark as read: ${await updateResponse.text()}`);
                }

                return new Response(JSON.stringify({ data: { success: true } }), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
            }

            case 'send_bulk_reminders': {
                const reminderType = message_data.reminder_type; // 'measurements', 'outfit_selection', 'payment'
                const templateData = message_data.template_data || {};
                
                // Get party members needing reminders
                const membersToRemind = await getMembersNeedingReminders(
                    wedding_id,
                    reminderType,
                    supabaseUrl,
                    headers
                );
                
                const reminderResults = [];
                
                for (const member of membersToRemind) {
                    try {
                        const personalizedMessage = await generatePersonalizedReminder(
                            member,
                            reminderType,
                            templateData
                        );
                        
                        const messageRecord = {
                            wedding_id: wedding_id,
                            sender_type: 'system',
                            recipient_ids: [member.user_id].filter(Boolean),
                            message_type: 'reminder',
                            subject: personalizedMessage.subject,
                            message: personalizedMessage.message,
                            html_message: personalizedMessage.html_message,
                            sent_via: ['email'],
                            sent_at: new Date().toISOString()
                        };
                        
                        const messageResponse = await fetch(`${supabaseUrl}/rest/v1/wedding_communications`, {
                            method: 'POST',
                            headers: { ...headers, 'Prefer': 'return=representation' },
                            body: JSON.stringify(messageRecord)
                        });
                        
                        if (messageResponse.ok) {
                            const message = await messageResponse.json();
                            
                            // Send email
                            if (sendGridApiKey && member.email) {
                                await sendReminderEmail(
                                    member,
                                    personalizedMessage,
                                    sendGridApiKey
                                );
                            }
                            
                            // Update member reminder count
                            await fetch(`${supabaseUrl}/rest/v1/wedding_party_members?id=eq.${member.id}`, {
                                method: 'PATCH',
                                headers,
                                body: JSON.stringify({
                                    reminder_count: (member.reminder_count || 0) + 1,
                                    last_reminder_sent: new Date().toISOString(),
                                    updated_at: new Date().toISOString()
                                })
                            });
                            
                            reminderResults.push({
                                member_id: member.id,
                                success: true,
                                message_id: message[0].id
                            });
                        } else {
                            reminderResults.push({
                                member_id: member.id,
                                success: false,
                                error: 'Failed to create message'
                            });
                        }
                    } catch (error) {
                        reminderResults.push({
                            member_id: member.id,
                            success: false,
                            error: error.message
                        });
                    }
                }

                return new Response(JSON.stringify({ 
                    data: {
                        reminders_sent: reminderResults.filter(r => r.success).length,
                        total_attempts: reminderResults.length,
                        results: reminderResults
                    }
                }), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
            }

            case 'get_unread_count': {
                const userId = filters?.user_id;
                
                if (!userId) {
                    throw new Error('User ID is required');
                }
                
                // Get messages where user is a recipient but hasn't read
                const response = await fetch(
                    `${supabaseUrl}/rest/v1/wedding_communications?wedding_id=eq.${wedding_id}&recipient_ids.cs.["${userId}"]&select=id,read_by`,
                    { headers }
                );
                
                if (!response.ok) {
                    throw new Error('Failed to fetch messages');
                }
                
                const messages = await response.json();
                const unreadCount = messages.filter(msg => {
                    const readBy = msg.read_by || {};
                    return !readBy[userId];
                }).length;

                return new Response(JSON.stringify({ 
                    data: {
                        unread_count: unreadCount,
                        total_messages: messages.length
                    }
                }), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
            }

            case 'create_announcement': {
                const announcementData = message_data.announcement_data;
                
                // Get all party members for the wedding
                const membersResponse = await fetch(
                    `${supabaseUrl}/rest/v1/wedding_party_members?wedding_id=eq.${wedding_id}&select=user_id,email,first_name`,
                    { headers }
                );
                
                if (!membersResponse.ok) {
                    throw new Error('Failed to fetch party members');
                }
                
                const members = await membersResponse.json();
                const recipientIds = members.map(m => m.user_id).filter(Boolean);
                
                const messageRecord = {
                    wedding_id: wedding_id,
                    sender_id: announcementData.sender_id,
                    sender_type: 'couple',
                    recipient_ids: recipientIds,
                    recipient_types: ['all_party'],
                    message_type: 'announcement',
                    subject: announcementData.subject,
                    message: announcementData.message,
                    html_message: announcementData.html_message,
                    sent_via: ['email', 'in_app'],
                    sent_at: new Date().toISOString()
                };
                
                const response = await fetch(`${supabaseUrl}/rest/v1/wedding_communications`, {
                    method: 'POST',
                    headers: { ...headers, 'Prefer': 'return=representation' },
                    body: JSON.stringify(messageRecord)
                });
                
                if (!response.ok) {
                    throw new Error(`Failed to create announcement: ${await response.text()}`);
                }
                
                const message = await response.json();
                
                // Send to all party members
                const deliveryResults = await deliverMessage(
                    message[0],
                    recipientIds,
                    supabaseUrl,
                    headers,
                    sendGridApiKey
                );

                return new Response(JSON.stringify({ 
                    data: {
                        announcement: message[0],
                        delivery_results: deliveryResults,
                        recipients_count: recipientIds.length
                    }
                }), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
            }

            case 'get_communication_analytics': {
                // Get message statistics for the wedding
                const messagesResponse = await fetch(
                    `${supabaseUrl}/rest/v1/wedding_communications?wedding_id=eq.${wedding_id}`,
                    { headers }
                );
                
                if (!messagesResponse.ok) {
                    throw new Error('Failed to fetch messages');
                }
                
                const messages = await messagesResponse.json();
                
                const analytics = calculateCommunicationAnalytics(messages);

                return new Response(JSON.stringify({ data: analytics }), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
            }

            default:
                throw new Error(`Unknown action: ${action}`);
        }

    } catch (error) {
        console.error('Wedding communications error:', error);
        
        return new Response(JSON.stringify({
            error: {
                code: 'WEDDING_COMMUNICATIONS_ERROR',
                message: error.message
            }
        }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});

// Helper functions
async function getRecipientsByType(weddingId, recipientTypes, supabaseUrl, headers) {
    const recipientIds = [];
    
    for (const type of recipientTypes) {
        switch (type) {
            case 'all_party': {
                const response = await fetch(
                    `${supabaseUrl}/rest/v1/wedding_party_members?wedding_id=eq.${weddingId}&select=user_id`,
                    { headers }
                );
                if (response.ok) {
                    const members = await response.json();
                    recipientIds.push(...members.map(m => m.user_id).filter(Boolean));
                }
                break;
            }
            case 'couple_only': {
                const response = await fetch(
                    `${supabaseUrl}/rest/v1/weddings?id=eq.${weddingId}&select=primary_customer_id,partner_customer_id`,
                    { headers }
                );
                if (response.ok) {
                    const weddings = await response.json();
                    const wedding = weddings[0];
                    if (wedding.primary_customer_id) recipientIds.push(wedding.primary_customer_id);
                    if (wedding.partner_customer_id) recipientIds.push(wedding.partner_customer_id);
                }
                break;
            }
            case 'groomsmen': {
                const response = await fetch(
                    `${supabaseUrl}/rest/v1/wedding_party_members?wedding_id=eq.${weddingId}&role=in.(groomsman,best_man)&select=user_id`,
                    { headers }
                );
                if (response.ok) {
                    const members = await response.json();
                    recipientIds.push(...members.map(m => m.user_id).filter(Boolean));
                }
                break;
            }
        }
    }
    
    // Remove duplicates
    return [...new Set(recipientIds)];
}

async function deliverMessage(message, recipientIds, supabaseUrl, headers, sendGridApiKey) {
    const deliveryResults = {
        email: { success: 0, failed: 0 },
        in_app: { success: recipientIds.length, failed: 0 },
        sms: { success: 0, failed: 0 }
    };
    
    // Get recipient details
    if (recipientIds.length > 0) {
        const recipientsResponse = await fetch(
            `${supabaseUrl}/rest/v1/user_profiles?user_id=in.(${recipientIds.join(',')})&select=user_id,email,display_name,phone`,
            { headers }
        );
        
        if (recipientsResponse.ok) {
            const recipients = await recipientsResponse.json();
            
            // Send emails
            if (message.sent_via.includes('email') && sendGridApiKey) {
                for (const recipient of recipients) {
                    if (recipient.email) {
                        try {
                            await sendCommunicationEmail(
                                recipient,
                                message,
                                sendGridApiKey
                            );
                            deliveryResults.email.success++;
                        } catch (error) {
                            console.error(`Failed to send email to ${recipient.email}:`, error);
                            deliveryResults.email.failed++;
                        }
                    }
                }
            }
        }
    }
    
    return deliveryResults;
}

async function getMembersNeedingReminders(weddingId, reminderType, supabaseUrl, headers) {
    let statusFilter = '';
    
    switch (reminderType) {
        case 'measurements':
            statusFilter = '&measurements_status=eq.pending';
            break;
        case 'outfit_selection':
            statusFilter = '&outfit_status=eq.pending';
            break;
        case 'payment':
            statusFilter = '&payment_status=eq.pending';
            break;
        default:
            statusFilter = '&overall_completion_percentage=lt.100';
    }
    
    const response = await fetch(
        `${supabaseUrl}/rest/v1/wedding_party_members?wedding_id=eq.${weddingId}${statusFilter}&select=*`,
        { headers }
    );
    
    if (!response.ok) {
        throw new Error('Failed to fetch members');
    }
    
    return await response.json();
}

async function generatePersonalizedReminder(member, reminderType, templateData) {
    const templates = {
        measurements: {
            subject: `Measurements Needed - ${member.first_name}, Let's Get You Fitted!`,
            message: `Hi ${member.first_name}! We're excited to help you look your best for the wedding. Please submit your measurements so we can ensure a perfect fit for your outfit.`,
            html_message: generateReminderHTML(member, 'measurements', templateData)
        },
        outfit_selection: {
            subject: `Time to Choose Your Perfect Outfit - ${member.first_name}`,
            message: `Hi ${member.first_name}! Your curated outfit options are ready for review. Please take a look and make your selection.`,
            html_message: generateReminderHTML(member, 'outfit_selection', templateData)
        },
        payment: {
            subject: `Payment Required - ${member.first_name}, Almost Done!`,
            message: `Hi ${member.first_name}! Your outfit is selected and ready to order. Please complete your payment to finalize everything.`,
            html_message: generateReminderHTML(member, 'payment', templateData)
        }
    };
    
    return templates[reminderType] || templates.measurements;
}

function generateReminderHTML(member, reminderType, templateData) {
    const baseStyles = `
        <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #1f2937 0%, #374151 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: white; padding: 30px; border-radius: 0 0 8px 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
            .button { display: inline-block; background: #1f2937; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .footer { text-align: center; color: #666; margin-top: 20px; font-size: 14px; }
        </style>
    `;
    
    const actionButtons = {
        measurements: '<a href="#" class="button">Submit Measurements</a>',
        outfit_selection: '<a href="#" class="button">View Outfit Options</a>',
        payment: '<a href="#" class="button">Complete Payment</a>'
    };
    
    return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <title>Wedding Party Reminder</title>
            ${baseStyles}
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>KCT Menswear</h1>
                    <p>Wedding Party Coordination</p>
                </div>
                <div class="content">
                    <h2>Hi ${member.first_name}!</h2>
                    <p>This is a friendly reminder about your wedding party coordination progress.</p>
                    <p>Role: <strong>${member.role}</strong></p>
                    ${actionButtons[reminderType] || ''}
                    <p>If you have any questions, please don't hesitate to reach out to our team.</p>
                </div>
                <div class="footer">
                    <p>&copy; 2025 KCT Menswear - Premium Wedding Party Coordination</p>
                </div>
            </div>
        </body>
        </html>
    `;
}

async function sendReminderEmail(member, messageContent, sendGridApiKey) {
    const emailData = {
        personalizations: [{
            to: [{ email: member.email, name: `${member.first_name} ${member.last_name}` }],
            subject: messageContent.subject
        }],
        from: {
            email: 'noreply@kctmenswear.com',
            name: 'KCT Menswear'
        },
        content: [{
            type: 'text/html',
            value: messageContent.html_message
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
        throw new Error(`SendGrid error: ${await response.text()}`);
    }
}

async function sendCommunicationEmail(recipient, message, sendGridApiKey) {
    const emailData = {
        personalizations: [{
            to: [{ email: recipient.email, name: recipient.display_name }],
            subject: message.subject
        }],
        from: {
            email: 'noreply@kctmenswear.com',
            name: 'KCT Menswear'
        },
        content: [{
            type: 'text/html',
            value: message.html_message || message.message
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
        throw new Error(`SendGrid error: ${await response.text()}`);
    }
}

function calculateCommunicationAnalytics(messages) {
    const now = new Date();
    const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    const totalMessages = messages.length;
    const recentMessages = messages.filter(m => new Date(m.created_at) >= last7Days).length;
    const monthlyMessages = messages.filter(m => new Date(m.created_at) >= last30Days).length;
    
    const messageTypes = {};
    const senderTypes = {};
    
    messages.forEach(msg => {
        messageTypes[msg.message_type] = (messageTypes[msg.message_type] || 0) + 1;
        senderTypes[msg.sender_type] = (senderTypes[msg.sender_type] || 0) + 1;
    });
    
    // Calculate read rates
    const messagesWithReads = messages.filter(m => m.read_by && Object.keys(m.read_by).length > 0);
    const readRate = totalMessages > 0 ? (messagesWithReads.length / totalMessages) * 100 : 0;
    
    return {
        total_messages: totalMessages,
        recent_messages_7d: recentMessages,
        monthly_messages_30d: monthlyMessages,
        message_types: messageTypes,
        sender_types: senderTypes,
        read_rate_percentage: Math.round(readRate),
        average_messages_per_day: monthlyMessages / 30,
        most_active_type: Object.keys(messageTypes).reduce((a, b) => messageTypes[a] > messageTypes[b] ? a : b, 'none')
    };
}