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
    // Try the edge function first, fall back to direct DB access
    try {
      const { data, error } = await supabaseAdmin.functions.invoke('admin-hub-api/dashboard-overview', {
        method: 'GET'
      })
      if (error) throw error
      return data
    } catch (error) {
      // Fallback: return mock data for now
      return {
        data: {
          total_orders: 0,
          pending_orders: 0,
          revenue_today: 0,
          active_customers: 0
        }
      }
    }
  },

  getNotifications: async (params: { limit?: number; priority?: string; unread_only?: boolean } = {}) => {
    // Use the admin-hub-api Edge Function instead of direct database access
    try {
      let endpoint = 'admin-hub-api/notifications';
      const queryParams = new URLSearchParams();
      
      if (params.limit) {
        queryParams.append('limit', params.limit.toString());
      }
      if (params.priority) {
        queryParams.append('priority', params.priority);
      }
      if (params.unread_only) {
        queryParams.append('unread_only', 'true');
      }
      
      if (queryParams.toString()) {
        endpoint += '?' + queryParams.toString();
      }
      
      const { data, error } = await supabaseAdmin.functions.invoke(endpoint, {
        method: 'GET'
      });
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching notifications:', error);
      // Return empty array as fallback instead of throwing
      return { data: [] };
    }
  },

  getQuickStats: async () => {
    try {
      const { data, error } = await supabaseAdmin.functions.invoke('admin-hub-api/quick-stats', {
        method: 'GET'
      })
      if (error) throw error
      return data
    } catch (error) {
      // Fallback: return mock data
      return {
        data: {
          orders_today: 0,
          revenue_today: 0,
          pending_shipments: 0,
          low_stock_items: 0
        }
      }
    }
  },

  getRecentActivity: async () => {
    try {
      const { data, error } = await supabaseAdmin.functions.invoke('admin-hub-api/recent-activity', {
        method: 'GET'
      })
      if (error) throw error
      return data
    } catch (error) {
      // Fallback: return mock data
      return {
        data: []
      }
    }
  },

  markNotificationRead: async (notificationId: string) => {
    try {
      const { data, error } = await supabaseAdmin.functions.invoke('admin-hub-api/mark-notification-read', {
        method: 'POST',
        body: { notification_id: notificationId }
      });
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  },

  markAllNotificationsRead: async () => {
    try {
      const { data, error } = await supabaseAdmin.functions.invoke('admin-hub-api/mark-all-notifications-read', {
        method: 'POST'
      });
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
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