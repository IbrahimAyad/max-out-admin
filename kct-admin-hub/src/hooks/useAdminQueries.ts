import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { adminHubAPI } from '../lib/supabase'
import type { DashboardOverview, QuickStats, RecentActivity, AdminNotification } from '../types/admin'

export const useAdminQueries = () => {
  const queryClient = useQueryClient()

  // Dashboard overview
  const dashboardOverview = useQuery<{ success: boolean; data: DashboardOverview }>({
    queryKey: ['dashboard-overview'],
    queryFn: adminHubAPI.getDashboardOverview,
    refetchInterval: 30000, // Refresh every 30 seconds
  })

  // Quick stats
  const quickStats = useQuery<{ success: boolean; data: QuickStats }>({
    queryKey: ['quick-stats'],
    queryFn: adminHubAPI.getQuickStats,
    refetchInterval: 60000, // Refresh every minute
  })

  // Recent activity
  const recentActivity = useQuery<{ success: boolean; data: RecentActivity }>({
    queryKey: ['recent-activity'],
    queryFn: adminHubAPI.getRecentActivity,
    refetchInterval: 15000, // Refresh every 15 seconds
  })

  // Notifications
  const notifications = useQuery<{ success: boolean; data: AdminNotification[] }>({
    queryKey: ['notifications'],
    queryFn: () => adminHubAPI.getNotifications({ limit: 50 }),
    refetchInterval: 10000, // Refresh every 10 seconds
  })

  // Unread notifications only
  const unreadNotifications = useQuery<{ success: boolean; data: AdminNotification[] }>({
    queryKey: ['unread-notifications'],
    queryFn: () => adminHubAPI.getNotifications({ unread_only: true, limit: 20 }),
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