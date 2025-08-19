import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { adminHubAPI } from '../lib/supabase'
import type { DashboardOverview, QuickStats, RecentActivity, AdminNotification } from '../types/admin'

// Default data shapes to avoid undefined errors
const defaultDashboardData = {
  todayRevenue: 0,
  todayOrdersCount: 0,
  pendingOrdersCount: 0,
  unreadNotificationsCount: 0,
  urgentNotificationsCount: 0,
  lowStockAlertsCount: 0,
  lastUpdated: new Date().toISOString()
}

const defaultQuickStatsData = {
  weeklyRevenue: 0,
  weeklyOrdersCount: 0,
  totalCustomers: 0,
  processingQueueLength: 0
}

export const useAdminQueries = () => {
  const queryClient = useQueryClient()

  // Dashboard overview with fallback to default data
  const dashboardOverview = useQuery({
    queryKey: ['dashboard-overview'],
    queryFn: async () => {
      try {
        const result = await adminHubAPI.getDashboardOverview()
        // Ensure we have all required properties by merging with default
        return {
          data: {
            ...defaultDashboardData,
            ...(result?.data || {})
          }
        }
      } catch (error) {
        console.error('Error fetching dashboard overview:', error)
        return { data: defaultDashboardData }
      }
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  })

  // Quick stats with fallback
  const quickStats = useQuery({
    queryKey: ['quick-stats'],
    queryFn: async () => {
      try {
        const result = await adminHubAPI.getQuickStats()
        return {
          data: {
            ...defaultQuickStatsData,
            ...(result?.data || {})
          }
        }
      } catch (error) {
        console.error('Error fetching quick stats:', error)
        return { data: defaultQuickStatsData }
      }
    },
    refetchInterval: 60000, // Refresh every minute
  })

  // Recent activity with empty fallback
  const recentActivity = useQuery({
    queryKey: ['recent-activity'],
    queryFn: async () => {
      try {
        const result = await adminHubAPI.getRecentActivity()
        return result || { data: [] }
      } catch (error) {
        console.error('Error fetching recent activity:', error)
        return { data: [] }
      }
    },
    refetchInterval: 15000, // Refresh every 15 seconds
  })

  // Notifications with empty fallback
  const notifications = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      try {
        const result = await adminHubAPI.getNotifications({ limit: 50 })
        return result || { data: [] }
      } catch (error) {
        console.error('Error fetching notifications:', error)
        return { data: [] }
      }
    },
    refetchInterval: 10000, // Refresh every 10 seconds
  })

  // Unread notifications only with empty fallback
  const unreadNotifications = useQuery({
    queryKey: ['unread-notifications'],
    queryFn: async () => {
      try {
        const result = await adminHubAPI.getNotifications({ unread_only: true, limit: 20 })
        return result || { data: [] }
      } catch (error) {
        console.error('Error fetching unread notifications:', error)
        return { data: [] }
      }
    },
    refetchInterval: 5000, // Refresh every 5 seconds
  })

  // Mark notification as read
  const markNotificationRead = useMutation({
    mutationFn: adminHubAPI.markNotificationRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      queryClient.invalidateQueries({ queryKey: ['unread-notifications'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-overview'] })
    }
  })

  // Mark all notifications as read
  const markAllNotificationsRead = useMutation({
    mutationFn: adminHubAPI.markAllNotificationsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      queryClient.invalidateQueries({ queryKey: ['unread-notifications'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-overview'] })
    }
  })

  return {
    dashboardOverview,
    quickStats,
    recentActivity,
    notifications,
    unreadNotifications,
    markNotificationRead,
    markAllNotificationsRead
  }
}
