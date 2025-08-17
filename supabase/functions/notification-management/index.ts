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
        console.log('Notification management API called');
        
        // Get Supabase credentials
        const supabaseUrl = Deno.env.get('SUPABASE_URL');
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
        
        if (!supabaseUrl || !supabaseKey) {
            throw new Error('Missing Supabase environment variables');
        }

        const url = new URL(req.url);
        const action = url.searchParams.get('action');
        const notificationId = url.searchParams.get('id');
        
        switch (action) {
            case 'mark_read':
                if (!notificationId) {
                    throw new Error('Notification ID required for mark_read action');
                }
                
                const markReadResponse = await fetch(`${supabaseUrl}/rest/v1/rpc/mark_notification_read`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${supabaseKey}`,
                        'Content-Type': 'application/json',
                        'apikey': supabaseKey
                    },
                    body: JSON.stringify({ notification_id: notificationId })
                });
                
                return new Response(JSON.stringify({
                    success: true,
                    message: 'Notification marked as read'
                }), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
            
            case 'mark_all_read':
                const markAllReadResponse = await fetch(`${supabaseUrl}/rest/v1/admin_notifications?is_read=eq.false`, {
                    method: 'PATCH',
                    headers: {
                        'Authorization': `Bearer ${supabaseKey}`,
                        'Content-Type': 'application/json',
                        'apikey': supabaseKey
                    },
                    body: JSON.stringify({
                        is_read: true,
                        read_at: new Date().toISOString(),
                        updated_at: new Date().toISOString()
                    })
                });
                
                return new Response(JSON.stringify({
                    success: true,
                    message: 'All notifications marked as read'
                }), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
            
            case 'get_stats':
                const statsResponse = await fetch(`${supabaseUrl}/rest/v1/admin_notifications?select=type,is_read,priority,created_at`, {
                    headers: {
                        'Authorization': `Bearer ${supabaseKey}`,
                        'apikey': supabaseKey
                    }
                });
                
                if (!statsResponse.ok) {
                    throw new Error('Failed to fetch notification stats');
                }
                
                const notifications = await statsResponse.json();
                
                const stats = {
                    total: notifications.length,
                    unread: notifications.filter(n => !n.is_read).length,
                    by_type: {},
                    by_priority: {},
                    today: 0
                };
                
                const today = new Date().toDateString();
                
                notifications.forEach(n => {
                    // Count by type
                    stats.by_type[n.type] = (stats.by_type[n.type] || 0) + 1;
                    
                    // Count by priority
                    stats.by_priority[n.priority] = (stats.by_priority[n.priority] || 0) + 1;
                    
                    // Count today's notifications
                    if (new Date(n.created_at).toDateString() === today) {
                        stats.today++;
                    }
                });
                
                return new Response(JSON.stringify({
                    success: true,
                    stats: stats
                }), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
            
            case 'test_notification':
                // Create a test notification for development
                const testData = await req.json().catch(() => ({}));
                
                const testNotification = {
                    type: testData.type || 'new_order',
                    title: testData.title || 'Test Notification',
                    message: testData.message || 'This is a test notification from the admin system',
                    priority: testData.priority || 'normal',
                    data: testData.data || {
                        order_number: 'TEST-001',
                        customer_name: 'Test Customer',
                        total_amount: 99.99,
                        test: true
                    }
                };
                
                const createResponse = await fetch(`${supabaseUrl}/rest/v1/admin_notifications`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${supabaseKey}`,
                        'Content-Type': 'application/json',
                        'apikey': supabaseKey,
                        'Prefer': 'return=representation'
                    },
                    body: JSON.stringify(testNotification)
                });
                
                if (!createResponse.ok) {
                    throw new Error('Failed to create test notification');
                }
                
                const createdNotification = await createResponse.json();
                
                return new Response(JSON.stringify({
                    success: true,
                    notification: createdNotification[0],
                    message: 'Test notification created'
                }), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
            
            default:
                throw new Error(`Unknown action: ${action}`);
        }

    } catch (error) {
        console.error('Notification management error:', error);
        
        return new Response(JSON.stringify({
            success: false,
            error: {
                code: 'NOTIFICATION_MANAGEMENT_ERROR',
                message: error.message || 'Failed to perform notification action'
            }
        }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});
