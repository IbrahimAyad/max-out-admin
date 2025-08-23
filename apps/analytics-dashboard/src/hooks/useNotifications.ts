import { useState, useEffect, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase, supabaseAdmin } from '../lib/supabase'
import toast from 'react-hot-toast'

export interface AdminNotification {
  id: string
  type: 'new_order' | 'payment_received' | 'payment_failed' | 'order_status_change' | 'low_stock'
  title: string
  message: string
  order_id?: string
  customer_id?: string
  product_id?: string
  priority: 'low' | 'normal' | 'high' | 'urgent'
  data: Record<string, any>
  is_read: boolean
  read_at?: string
  sound_played: boolean
  delivery_methods: string[]
  email_sent: boolean
  email_sent_at?: string
  push_sent: boolean
  push_sent_at?: string
  created_at: string
  updated_at: string
}

export interface NotificationStats {
  total: number
  unread: number
  by_type: Record<string, number>
  by_priority: Record<string, number>
  today: number
}

export function useNotifications() {
  const queryClient = useQueryClient()
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [lastPlayedSound, setLastPlayedSound] = useState<string | null>(null)

  // Fetch notifications with real-time updates
  const notificationsQuery = useQuery({
    queryKey: ['admin-notifications'],
    queryFn: async (): Promise<AdminNotification[]> => {
      const { data, error } = await supabaseAdmin
        .from('admin_notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100)
      
      if (error) throw error
      return data || []
    },
    refetchInterval: 30000, // Fallback polling every 30 seconds
  })

  // Get notification stats
  const statsQuery = useQuery({
    queryKey: ['notification-stats'],
    queryFn: async (): Promise<NotificationStats> => {
      const { data, error } = await supabaseAdmin
        .from('admin_notifications')
        .select('type, is_read, priority, created_at')
      
      if (error) throw error
      
      const notifications = data || []
      const stats: NotificationStats = {
        total: notifications.length,
        unread: notifications.filter(n => !n.is_read).length,
        by_type: {},
        by_priority: {},
        today: 0
      }
      
      const today = new Date().toDateString()
      
      notifications.forEach((n: any) => {
        // Count by type
        stats.by_type[n.type] = (stats.by_type[n.type] || 0) + 1
        
        // Count by priority
        stats.by_priority[n.priority] = (stats.by_priority[n.priority] || 0) + 1
        
        // Count today's notifications
        if (new Date(n.created_at).toDateString() === today) {
          stats.today++
        }
      })
      
      return stats
    },
    refetchInterval: 30000,
  })

  // Mark notification as read
  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await supabaseAdmin
        .from('admin_notifications')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('id', notificationId)
      
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-notifications'] })
      queryClient.invalidateQueries({ queryKey: ['notification-stats'] })
    },
    onError: (error: any) => {
      toast.error('Failed to mark notification as read')
      console.error('Mark as read error:', error)
    }
  })

  // Mark all notifications as read
  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabaseAdmin
        .from('admin_notifications')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('is_read', false)
      
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-notifications'] })
      queryClient.invalidateQueries({ queryKey: ['notification-stats'] })
      toast.success('All notifications marked as read')
    },
    onError: (error: any) => {
      toast.error('Failed to mark all notifications as read')
      console.error('Mark all as read error:', error)
    }
  })

  // Delete notification
  const deleteNotificationMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await supabaseAdmin
        .from('admin_notifications')
        .delete()
        .eq('id', notificationId)
      
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-notifications'] })
      queryClient.invalidateQueries({ queryKey: ['notification-stats'] })
      toast.success('Notification deleted')
    },
    onError: (error: any) => {
      toast.error('Failed to delete notification')
      console.error('Delete notification error:', error)
    }
  })

  // Play notification sound
  const playNotificationSound = useCallback((type: string, priority: string) => {
    if (!soundEnabled) return
    
    let soundFile = 'notification.mp3' // Default sound
    
    // Different sounds for different types and priorities
    switch (type) {
      case 'new_order':
        soundFile = priority === 'urgent' || priority === 'high' ? 'new_order_urgent.mp3' : 'new_order.mp3'
        break
      case 'payment_received':
        soundFile = 'payment_success.mp3'
        break
      case 'payment_failed':
        soundFile = 'payment_failed.mp3'
        break
      case 'low_stock':
        soundFile = 'low_stock.mp3'
        break
      default:
        soundFile = 'notification.mp3'
    }
    
    try {
      const audio = new Audio(`/sounds/${soundFile}`)
      audio.volume = 0.5
      audio.play().catch(e => console.log('Audio play failed:', e))
      setLastPlayedSound(soundFile)
    } catch (error) {
      console.log('Audio error:', error)
    }
  }, [soundEnabled])

  // Real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel('admin-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'admin_notifications'
        },
        (payload) => {
          console.log('New notification received:', payload)
          const newNotification = payload.new as AdminNotification
          
          // Invalidate and refetch
          queryClient.invalidateQueries({ queryKey: ['admin-notifications'] })
          queryClient.invalidateQueries({ queryKey: ['notification-stats'] })
          
          // Show browser notification
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(`[KCT Admin] ${newNotification.title}`, {
              body: newNotification.message,
              icon: '/favicon.ico',
              tag: newNotification.id
            })
          }
          
          // Play sound
          playNotificationSound(newNotification.type, newNotification.priority)
          
          // Show toast notification
          const toastOptions = {
            duration: newNotification.priority === 'urgent' ? 10000 : 5000,
          }
          
          if (newNotification.priority === 'urgent') {
            toast.error(`${newNotification.title}: ${newNotification.message}`, toastOptions)
          } else if (newNotification.priority === 'high') {
            toast(`${newNotification.title}: ${newNotification.message}`, toastOptions)
          } else {
            toast.success(`${newNotification.title}: ${newNotification.message}`, toastOptions)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [queryClient, playNotificationSound])

  // Request notification permission on mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }, [])

  return {
    // Data
    notifications: notificationsQuery.data || [],
    stats: statsQuery.data || {
      total: 0,
      unread: 0,
      by_type: {},
      by_priority: {},
      today: 0
    },
    isLoading: notificationsQuery.isLoading || statsQuery.isLoading,
    error: notificationsQuery.error || statsQuery.error,
    
    // Actions
    markAsRead: markAsReadMutation.mutate,
    markAllAsRead: markAllAsReadMutation.mutate,
    deleteNotification: deleteNotificationMutation.mutate,
    
    // Sound settings
    soundEnabled,
    setSoundEnabled,
    lastPlayedSound,
    
    // Loading states
    isMarkingAsRead: markAsReadMutation.isPending,
    isMarkingAllAsRead: markAllAsReadMutation.isPending,
    isDeleting: deleteNotificationMutation.isPending
  }
}
