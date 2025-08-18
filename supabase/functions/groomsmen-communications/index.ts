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

        if (!supabaseUrl || !supabaseAnonKey) {
            throw new Error('Supabase configuration missing');
        }

        // Get user from auth header
        const authHeader = req.headers.get('authorization');
        if (!authHeader) {
            throw new Error('No authorization header');
        }

        const token = authHeader.replace('Bearer ', '');

        // Verify token and get user
        const userResponse = await fetch(`${supabaseUrl}/auth/v1/user`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'apikey': supabaseAnonKey
            }
        });

        if (!userResponse.ok) {
            throw new Error('Invalid token');
        }

        const userData = await userResponse.json();
        const userEmail = userData.email;

        // Get party member data
        const memberResponse = await fetch(`${supabaseUrl}/rest/v1/wedding_party_members?email=eq.${userEmail}&select=*`, {
            headers: {
                'apikey': supabaseAnonKey,
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!memberResponse.ok) {
            throw new Error('Failed to fetch party member data');
        }

        const members = await memberResponse.json();

        if (members.length === 0) {
            throw new Error('No wedding party membership found for this user');
        }

        const member = members[0];
        const url = new URL(req.url);
        const method = req.method;

        if (method === 'GET') {
            // Get communications for this member
            const page = parseInt(url.searchParams.get('page') || '1');
            const limit = parseInt(url.searchParams.get('limit') || '20');
            const offset = (page - 1) * limit;

            // Build query for communications where member is recipient
            const communicationsResponse = await fetch(`${supabaseUrl}/rest/v1/wedding_communications?wedding_id=eq.${member.wedding_id}&or=(recipient_ids.cs.["${member.id}"],recipient_types.cs.["all_party"],recipient_types.cs.["${member.role}"],recipient_types.cs.["party_member"])&select=*&order=created_at.desc&offset=${offset}&limit=${limit}`, {
                headers: {
                    'apikey': supabaseAnonKey,
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            const communications = communicationsResponse.ok ? await communicationsResponse.json() : [];

            // Process communications to add read status and format
            const processedCommunications = communications.map(comm => ({
                id: comm.id,
                weddingId: comm.wedding_id,
                senderId: comm.sender_id,
                senderType: comm.sender_type,
                messageType: comm.message_type,
                subject: comm.subject,
                message: comm.message,
                htmlMessage: comm.html_message,
                attachments: comm.attachments || [],
                isRead: !!(comm.read_by && comm.read_by[member.id]),
                sentAt: comm.sent_at,
                createdAt: comm.created_at,
                threadId: comm.thread_id,
                replyToId: comm.reply_to_id
            }));

            // Get unread count
            const unreadResponse = await fetch(`${supabaseUrl}/rest/v1/wedding_communications?wedding_id=eq.${member.wedding_id}&or=(recipient_ids.cs.["${member.id}"],recipient_types.cs.["all_party"],recipient_types.cs.["${member.role}"],recipient_types.cs.["party_member"])&select=id,read_by`, {
                headers: {
                    'apikey': supabaseAnonKey,
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            const allCommunications = unreadResponse.ok ? await unreadResponse.json() : [];
            const unreadCount = allCommunications.filter(comm => !(comm.read_by && comm.read_by[member.id])).length;

            return new Response(JSON.stringify({
                data: {
                    communications: processedCommunications,
                    pagination: {
                        page,
                        limit,
                        total: communications.length,
                        hasMore: communications.length === limit
                    },
                    unreadCount
                }
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });

        } else if (method === 'POST' && url.pathname.endsWith('/send')) {
            // Send new message
            const { recipientType, subject, message, replyToId, threadId } = await req.json();

            if (!message) {
                throw new Error('Message content is required');
            }

            // Determine recipients based on recipient type
            let recipientTypes = [];
            let recipientIds = [];

            switch (recipientType) {
                case 'coordinator':
                    recipientTypes = ['coordinator', 'admin'];
                    break;
                case 'couple':
                    recipientTypes = ['couple', 'primary_customer'];
                    break;
                case 'support':
                    recipientTypes = ['support', 'admin'];
                    break;
                default:
                    recipientTypes = ['coordinator', 'admin'];
            }

            const communicationData = {
                wedding_id: member.wedding_id,
                sender_id: member.id,
                sender_type: 'party_member',
                recipient_types: recipientTypes,
                recipient_ids: recipientIds,
                message_type: 'message',
                subject: subject || 'Message from Wedding Party Member',
                message: message,
                thread_id: threadId || null,
                reply_to_id: replyToId || null,
                sent_at: new Date().toISOString(),
                created_at: new Date().toISOString()
            };

            const sendResponse = await fetch(`${supabaseUrl}/rest/v1/wedding_communications`, {
                method: 'POST',
                headers: {
                    'apikey': supabaseAnonKey,
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    'Prefer': 'return=representation'
                },
                body: JSON.stringify(communicationData)
            });

            if (!sendResponse.ok) {
                const errorText = await sendResponse.text();
                throw new Error(`Failed to send message: ${errorText}`);
            }

            const sentMessage = await sendResponse.json();

            return new Response(JSON.stringify({
                data: {
                    message: sentMessage[0],
                    success: true,
                    statusMessage: 'Message sent successfully'
                }
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });

        } else if (method === 'POST' && url.pathname.endsWith('/mark-read')) {
            // Mark message as read
            const { messageId } = await req.json();

            if (!messageId) {
                throw new Error('Message ID is required');
            }

            // Get current message
            const messageResponse = await fetch(`${supabaseUrl}/rest/v1/wedding_communications?id=eq.${messageId}&select=*`, {
                headers: {
                    'apikey': supabaseAnonKey,
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            const messages = await messageResponse.json();

            if (messages.length === 0) {
                throw new Error('Message not found');
            }

            const message = messages[0];
            const readBy = message.read_by || {};
            readBy[member.id] = new Date().toISOString();

            // Update read status
            const updateResponse = await fetch(`${supabaseUrl}/rest/v1/wedding_communications?id=eq.${messageId}`, {
                method: 'PATCH',
                headers: {
                    'apikey': supabaseAnonKey,
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ read_by: readBy })
            });

            if (!updateResponse.ok) {
                const errorText = await updateResponse.text();
                throw new Error(`Failed to mark message as read: ${errorText}`);
            }

            return new Response(JSON.stringify({
                data: {
                    success: true,
                    message: 'Message marked as read'
                }
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });

        } else if (method === 'POST' && url.pathname.endsWith('/support-request')) {
            // Create support request
            const { category, priority, subject, description, attachments } = await req.json();

            if (!description) {
                throw new Error('Description is required for support requests');
            }

            const supportData = {
                wedding_id: member.wedding_id,
                sender_id: member.id,
                sender_type: 'party_member',
                recipient_types: ['support', 'admin'],
                message_type: 'support_request',
                subject: subject || `Support Request - ${category || 'General'}`,
                message: `Support Request from ${member.first_name} ${member.last_name}\n\nCategory: ${category || 'General'}\nPriority: ${priority || 'normal'}\n\nDescription:\n${description}`,
                attachments: attachments || [],
                sent_at: new Date().toISOString(),
                created_at: new Date().toISOString()
            };

            const supportResponse = await fetch(`${supabaseUrl}/rest/v1/wedding_communications`, {
                method: 'POST',
                headers: {
                    'apikey': supabaseAnonKey,
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    'Prefer': 'return=representation'
                },
                body: JSON.stringify(supportData)
            });

            if (!supportResponse.ok) {
                const errorText = await supportResponse.text();
                throw new Error(`Failed to create support request: ${errorText}`);
            }

            const supportRequest = await supportResponse.json();

            return new Response(JSON.stringify({
                data: {
                    supportRequest: supportRequest[0],
                    message: 'Support request submitted successfully. Our team will respond within 24 hours.'
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
        console.error('Groomsmen communications error:', error);

        const errorResponse = {
            error: {
                code: 'COMMUNICATIONS_ERROR',
                message: error.message
            }
        };

        return new Response(JSON.stringify(errorResponse), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});