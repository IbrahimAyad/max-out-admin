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
        const url = new URL(req.url);
        const endpoint = url.pathname.split('/').pop();
        
        const supabaseUrl = Deno.env.get('SUPABASE_URL');
        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
        
        if (!supabaseUrl || !serviceRoleKey) {
            throw new Error('Supabase configuration missing');
        }

        const headers = {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'apikey': serviceRoleKey,
            'Content-Type': 'application/json'
        };

        switch (endpoint) {
            case 'dashboard-overview':
                return await getDashboardOverview(supabaseUrl, headers, corsHeaders);
            case 'notifications':
                return await getNotifications(supabaseUrl, headers, corsHeaders, url);
            case 'quick-stats':
                return await getQuickStats(supabaseUrl, headers, corsHeaders);
            case 'recent-activity':
                return await getRecentActivity(supabaseUrl, headers, corsHeaders);
            case 'mark-notification-read':
                return await markNotificationRead(req, supabaseUrl, headers, corsHeaders);
            case 'mark-all-notifications-read':
                return await markAllNotificationsRead(supabaseUrl, headers, corsHeaders);
            default:
                throw new Error(`Unknown endpoint: ${endpoint}`);
        }

    } catch (error) {
        console.error('Admin hub API error:', error);
        
        return new Response(JSON.stringify({
            success: false,
            error: {
                code: 'ADMIN_HUB_ERROR',
                message: error.message || 'Failed to process request'
            }
        }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});

async function getDashboardOverview(supabaseUrl, headers, corsHeaders) {
    // Get today's date range
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1).toISOString();

    // Get today's orders
    const ordersResponse = await fetch(
        `${supabaseUrl}/rest/v1/orders?created_at=gte.${startOfDay}&created_at=lt.${endOfDay}&select=id,total_amount,status,payment_status,created_at`,
        { headers }
    );
    
    const todayOrders = await ordersResponse.json();
    
    // Calculate today's revenue
    const todayRevenue = todayOrders
        .filter(order => order.payment_status === 'paid' || order.status === 'completed')
        .reduce((sum, order) => sum + parseFloat(order.total_amount || 0), 0);
    
    // Get pending orders count
    const pendingOrdersResponse = await fetch(
        `${supabaseUrl}/rest/v1/orders?status=in.(pending,pending_payment,processing)&select=id`,
        { headers }
    );
    const pendingOrders = await pendingOrdersResponse.json();
    
    // Get unread notifications count
    const notificationsResponse = await fetch(
        `${supabaseUrl}/rest/v1/admin_notifications?is_read=eq.false&select=id,priority`,
        { headers }
    );
    const unreadNotifications = await notificationsResponse.json();
    
    // Get urgent notifications count
    const urgentCount = unreadNotifications.filter(n => n.priority === 'urgent').length;
    
    // Get low stock alerts
    const lowStockResponse = await fetch(
        `${supabaseUrl}/rest/v1/admin_notifications?type=eq.low_stock&is_read=eq.false&select=id`,
        { headers }
    );
    const lowStockAlerts = await lowStockResponse.json();
    
    const overview = {
        todayRevenue: todayRevenue,
        todayOrdersCount: todayOrders.length,
        pendingOrdersCount: pendingOrders.length,
        unreadNotificationsCount: unreadNotifications.length,
        urgentNotificationsCount: urgentCount,
        lowStockAlertsCount: lowStockAlerts.length,
        lastUpdated: new Date().toISOString()
    };

    return new Response(JSON.stringify({
        success: true,
        data: overview
    }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
}

async function getNotifications(supabaseUrl, headers, corsHeaders, url) {
    const limit = url.searchParams.get('limit') || '20';
    const priority = url.searchParams.get('priority');
    const unreadOnly = url.searchParams.get('unread_only') === 'true';
    
    let query = `${supabaseUrl}/rest/v1/admin_notifications?order=created_at.desc&limit=${limit}`;
    
    if (priority) {
        query += `&priority=eq.${priority}`;
    }
    
    if (unreadOnly) {
        query += `&is_read=eq.false`;
    }
    
    const response = await fetch(query, { headers });
    const notifications = await response.json();

    return new Response(JSON.stringify({
        success: true,
        data: notifications
    }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
}

async function getQuickStats(supabaseUrl, headers, corsHeaders) {
    // Get this week's date range
    const today = new Date();
    const startOfWeek = new Date(today.getFullYear(), today.getMonth(), today.getDate() - today.getDay());
    const endOfWeek = new Date(startOfWeek.getTime() + 7 * 24 * 60 * 60 * 1000);
    
    // Get this week's orders
    const ordersResponse = await fetch(
        `${supabaseUrl}/rest/v1/orders?created_at=gte.${startOfWeek.toISOString()}&created_at=lt.${endOfWeek.toISOString()}&select=total_amount,status,payment_status`,
        { headers }
    );
    const weekOrders = await ordersResponse.json();
    
    // Calculate weekly revenue
    const weeklyRevenue = weekOrders
        .filter(order => order.payment_status === 'paid' || order.status === 'completed')
        .reduce((sum, order) => sum + parseFloat(order.total_amount || 0), 0);
    
    // Get total customers
    const customersResponse = await fetch(
        `${supabaseUrl}/rest/v1/customers?select=id`,
        { headers }
    );
    const customers = await customersResponse.json();
    
    // Get processing queue status
    const queueResponse = await fetch(
        `${supabaseUrl}/rest/v1/order_processing_queue?queue_status=eq.pending&select=id`,
        { headers }
    );
    const queueItems = await queueResponse.json();
    
    const stats = {
        weeklyRevenue: weeklyRevenue,
        weeklyOrdersCount: weekOrders.length,
        totalCustomers: customers.length,
        processingQueueLength: queueItems.length
    };

    return new Response(JSON.stringify({
        success: true,
        data: stats
    }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
}

async function getRecentActivity(supabaseUrl, headers, corsHeaders) {
    // Get recent orders
    const ordersResponse = await fetch(
        `${supabaseUrl}/rest/v1/orders?order=created_at.desc&limit=10&select=id,order_number,customer_name,customer_email,total_amount,status,created_at`,
        { headers }
    );
    const recentOrders = await ordersResponse.json();
    
    // Get recent notifications
    const notificationsResponse = await fetch(
        `${supabaseUrl}/rest/v1/admin_notifications?order=created_at.desc&limit=10&select=id,type,title,message,priority,created_at,is_read`,
        { headers }
    );
    const recentNotifications = await notificationsResponse.json();
    
    const activity = {
        recentOrders: recentOrders,
        recentNotifications: recentNotifications
    };

    return new Response(JSON.stringify({
        success: true,
        data: activity
    }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
}

async function markNotificationRead(req, supabaseUrl, headers, corsHeaders) {
    const { notification_id } = await req.json();
    
    if (!notification_id) {
        throw new Error('Notification ID is required');
    }
    
    const response = await fetch(
        `${supabaseUrl}/rest/v1/admin_notifications?id=eq.${notification_id}`,
        {
            method: 'PATCH',
            headers,
            body: JSON.stringify({
                is_read: true,
                read_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            })
        }
    );
    
    if (!response.ok) {
        throw new Error('Failed to mark notification as read');
    }

    return new Response(JSON.stringify({
        success: true,
        message: 'Notification marked as read'
    }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
}

async function markAllNotificationsRead(supabaseUrl, headers, corsHeaders) {
    const response = await fetch(
        `${supabaseUrl}/rest/v1/admin_notifications?is_read=eq.false`,
        {
            method: 'PATCH',
            headers,
            body: JSON.stringify({
                is_read: true,
                read_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            })
        }
    );
    
    if (!response.ok) {
        throw new Error('Failed to mark all notifications as read');
    }

    return new Response(JSON.stringify({
        success: true,
        message: 'All notifications marked as read'
    }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
}