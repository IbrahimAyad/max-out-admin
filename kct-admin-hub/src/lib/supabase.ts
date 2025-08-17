import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://gvcswimqaxvylgxbklbz.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd2Y3N3aW1xYXh2eWxneGJrbGJ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM3NjA1MzAsImV4cCI6MjA2OTMzNjUzMH0.UZdiGcJXUV5VYetjWXV26inmbj2yXdiT03Z6t_5Lg24'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Admin Hub API functions
export const adminHubAPI = {
  getDashboardOverview: async () => {
    const { data, error } = await supabase.functions.invoke('admin-hub-api/dashboard-overview', {
      method: 'GET'
    })
    if (error) throw error
    return data
  },

  getNotifications: async (params: { limit?: number; priority?: string; unread_only?: boolean } = {}) => {
    const searchParams = new URLSearchParams()
    if (params.limit) searchParams.append('limit', params.limit.toString())
    if (params.priority) searchParams.append('priority', params.priority)
    if (params.unread_only) searchParams.append('unread_only', 'true')
    
    const { data, error } = await supabase.functions.invoke(`admin-hub-api/notifications?${searchParams.toString()}`, {
      method: 'GET'
    })
    if (error) throw error
    return data
  },

  getQuickStats: async () => {
    const { data, error } = await supabase.functions.invoke('admin-hub-api/quick-stats', {
      method: 'GET'
    })
    if (error) throw error
    return data
  },

  getRecentActivity: async () => {
    const { data, error } = await supabase.functions.invoke('admin-hub-api/recent-activity', {
      method: 'GET'
    })
    if (error) throw error
    return data
  },

  markNotificationRead: async (notificationId: string) => {
    const { data, error } = await supabase.functions.invoke('admin-hub-api/mark-notification-read', {
      method: 'POST',
      body: { notification_id: notificationId }
    })
    if (error) throw error
    return data
  },

  markAllNotificationsRead: async () => {
    const { data, error } = await supabase.functions.invoke('admin-hub-api/mark-all-notifications-read', {
      method: 'POST'
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