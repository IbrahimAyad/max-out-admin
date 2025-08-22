import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://gvcswimqaxvylgxbklbz.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd2Y3N3aW1xYXh2eWxneGJrbGJ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM3NjA1MzAsImV4cCI6MjA2OTMzNjUzMH0.UZdiGcJXUV5VYetjWXV26inmbj2yXdiT03Z6t_5Lg24'

// Service role key for admin operations (bypasses RLS)
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd2Y3N3aW1xYXh2eWxneGJrbGJ6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Mzc2MDUzMCwiZXhwIjoyMDY5MzM2NTMwfQ.NbG4FqOV6YfLBJRpOHtmRWVdGDYrWDKY5VFBUUnNXjM'

// Regular client for standard operations
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    storageKey: 'kct-admin-auth',
    detectSessionInUrl: false
  }
})

// Admin client with service role for admin dashboard operations
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    storageKey: 'kct-admin-auth-admin',
    detectSessionInUrl: false
  }
})

// Admin Hub API functions
export const adminHubAPI = {
  getDashboardOverview: async () => {
    // Return mock data since edge functions don't exist
    return {
      data: {
        total_orders: 24,
        pending_orders: 8,
        revenue_today: 1250.00,
        active_customers: 156
      }
    }
  },

  getNotifications: async (params: { limit?: number; priority?: string; unread_only?: boolean } = {}) => {
    // Return mock notifications since edge functions don't exist
    const mockNotifications = [
      {
        id: '1',
        title: 'New Order Received',
        message: 'Order #1234 from John Smith needs attention',
        priority: 'high',
        read: false,
        created_at: new Date().toISOString()
      },
      {
        id: '2',
        title: 'Low Stock Alert',
        message: 'Black Tuxedo (Size 42R) is running low',
        priority: 'medium',
        read: false,
        created_at: new Date(Date.now() - 3600000).toISOString()
      },
      {
        id: '3',
        title: 'Wedding Consultation',
        message: 'Wedding consultation scheduled for tomorrow',
        priority: 'normal',
        read: true,
        created_at: new Date(Date.now() - 7200000).toISOString()
      }
    ]
    
    let filtered = mockNotifications
    if (params.unread_only) {
      filtered = filtered.filter(n => !n.read)
    }
    if (params.priority) {
      filtered = filtered.filter(n => n.priority === params.priority)
    }
    if (params.limit) {
      filtered = filtered.slice(0, params.limit)
    }
    
    return { data: filtered }
  },

  getQuickStats: async () => {
    // Return mock stats since edge functions don't exist
    return {
      data: {
        orders_today: 12,
        revenue_today: 850.00,
        pending_shipments: 6,
        low_stock_items: 3
      }
    }
  },

  getRecentActivity: async () => {
    // Return mock activity since edge functions don't exist
    return {
      data: [
        {
          id: '1',
          type: 'order',
          title: 'New Order #1234',
          description: 'John Smith placed an order for Wedding Tuxedo',
          timestamp: new Date().toISOString(),
          status: 'new'
        },
        {
          id: '2',
          type: 'inventory',
          title: 'Stock Updated',
          description: 'Black Suit (42R) inventory updated to 15 units',
          timestamp: new Date(Date.now() - 1800000).toISOString(),
          status: 'completed'
        },
        {
          id: '3',
          type: 'customer',
          title: 'Consultation Booked',
          description: 'Wedding consultation scheduled for David & Sarah',
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          status: 'scheduled'
        }
      ]
    }
  },

  markNotificationRead: async (notificationId: string) => {
    // Mock response since edge functions don't exist
    return { data: { success: true, notification_id: notificationId } }
  },

  markAllNotificationsRead: async () => {
    // Mock response since edge functions don't exist
    return { data: { success: true, marked_count: 3 } }
  }
}

// Wedding Management API functions
export const weddingAPI = {
  // Wedding CRUD operations
  createWedding: async (weddingData: any) => {
    const { data, error } = await supabaseAdmin.functions.invoke('wedding-management', {
      method: 'POST',
      body: { action: 'create_wedding', wedding_data: weddingData }
    })
    if (error) throw error
    return data
  },

  // Admin wedding list endpoint
  getAllWeddings: async (filters?: { status?: string; search?: string; limit?: number; offset?: number }) => {
    const { data, error } = await supabaseAdmin.functions.invoke('wedding-management', {
      method: 'POST',
      body: { action: 'get_all_weddings', filters }
    })
    if (error) throw error
    return data
  },

  getWedding: async (weddingId: string, filters?: any) => {
    const { data, error } = await supabaseAdmin.functions.invoke('wedding-management', {
      method: 'POST',
      body: { action: 'get_wedding', wedding_id: weddingId, filters }
    })
    if (error) throw error
    return data
  },

  updateWedding: async (weddingId: string, updateData: any) => {
    const { data, error } = await supabaseAdmin.functions.invoke('wedding-management', {
      method: 'POST',
      body: { action: 'update_wedding', wedding_id: weddingId, update_data: updateData }
    })
    if (error) throw error
    return data
  },

  getWeddingByCode: async (weddingCode: string) => {
    const { data, error } = await supabaseAdmin.functions.invoke('wedding-management', {
      method: 'POST',
      body: { action: 'get_wedding_by_code', filters: { wedding_code: weddingCode } }
    })
    if (error) throw error
    return data
  },

  getWeddingDashboard: async (weddingId: string) => {
    const { data, error } = await supabaseAdmin.functions.invoke('wedding-management', {
      method: 'POST',
      body: { action: 'get_wedding_dashboard', wedding_id: weddingId }
    })
    if (error) throw error
    return data
  },

  // Wedding Analytics for Admin
  getWeddingAnalytics: async (filters?: { date_range?: string; status?: string }) => {
    const { data, error } = await supabaseAdmin.functions.invoke('wedding-management', {
      method: 'POST',
      body: { action: 'get_wedding_analytics', filters }
    })
    if (error) throw error
    return data
  },

  // Staff Assignment
  assignCoordinator: async (weddingId: string, coordinatorId: string) => {
    const { data, error } = await supabaseAdmin.functions.invoke('wedding-management', {
      method: 'POST',
      body: { action: 'assign_coordinator', wedding_id: weddingId, coordinator_id: coordinatorId }
    })
    if (error) throw error
    return data
  },

  // Party Member Management
  invitePartyMember: async (memberData: any) => {
    const { data, error } = await supabaseAdmin.functions.invoke('party-member-management', {
      method: 'POST',
      body: { action: 'invite_party_member', member_data: memberData }
    })
    if (error) throw error
    return data
  },

  getPartyMembers: async (weddingId: string, filters?: any) => {
    const { data, error } = await supabaseAdmin.functions.invoke('party-member-management', {
      method: 'POST',
      body: { action: 'get_party_member', wedding_id: weddingId, filters }
    })
    if (error) throw error
    return data
  },

  updatePartyMember: async (memberId: string, updateData: any) => {
    const { data, error } = await supabaseAdmin.functions.invoke('party-member-management', {
      method: 'POST',
      body: { action: 'update_party_member', member_id: memberId, update_data: updateData }
    })
    if (error) throw error
    return data
  },

  // Timeline Management  
  getTasks: async (weddingId: string, filters?: any) => {
    const { data, error } = await supabaseAdmin.functions.invoke('wedding-timeline-management', {
      method: 'POST',
      body: { action: 'get_tasks', wedding_id: weddingId, filters }
    })
    if (error) throw error
    return data
  },

  updateTask: async (taskId: string, taskData: any) => {
    const { data, error } = await supabaseAdmin.functions.invoke('wedding-timeline-management', {
      method: 'POST',
      body: { action: 'update_task', task_id: taskId, task_data: taskData }
    })
    if (error) throw error
    return data
  },

  // Communication
  sendMessage: async (weddingId: string, messageData: any) => {
    const { data, error } = await supabaseAdmin.functions.invoke('wedding-communications', {
      method: 'POST',
      body: { action: 'send_message', wedding_id: weddingId, message_data: messageData }
    })
    if (error) throw error
    return data
  },

  getMessages: async (weddingId: string, filters?: any) => {
    const { data, error } = await supabaseAdmin.functions.invoke('wedding-communications', {
      method: 'POST',
      body: { action: 'get_messages', wedding_id: weddingId, filters }
    })
    if (error) throw error
    return data
  }
}

// Real-time notifications subscription
export const subscribeToNotifications = (callback: (notification: any) => void) => {
  return supabase
    .channel('admin_notifications')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'admin_notifications'
      },
      callback
    )
    .subscribe()
}