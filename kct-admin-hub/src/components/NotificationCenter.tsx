import { useEffect, useState } from 'react'
import { Bell, BellRing, X, CheckCheck, AlertTriangle, Info, AlertCircle } from 'lucide-react'
import { useAdminQueries } from '../hooks/useAdminQueries'
import { useSoundNotification } from '../hooks/useSoundNotification'
import { subscribeToNotifications } from '../lib/supabase'
import type { AdminNotification } from '../types/admin'

interface NotificationCenterProps {
  isOpen: boolean
  onClose: () => void
}

export function NotificationCenter({ isOpen, onClose }: NotificationCenterProps) {
  const { notifications, unreadNotifications, markNotificationRead, markAllNotificationsRead } = useAdminQueries()
  const { playNotificationSound } = useSoundNotification()
  const [lastNotificationId, setLastNotificationId] = useState<string | null>(null)

  // Subscribe to real-time notifications
  useEffect(() => {
    const subscription = subscribeToNotifications((payload: any) => {
      const newNotification = payload.new as AdminNotification
      
      // Play sound for new notifications
      if (newNotification.id !== lastNotificationId) {
        playNotificationSound()
        setLastNotificationId(newNotification.id)
        
        // Show browser notification if permission granted
        if (Notification.permission === 'granted') {
          new Notification(`KCT Admin: ${newNotification.title}`, {
            body: newNotification.message,
            icon: '/kct-logo.ico',
            tag: newNotification.id
          })
        }
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [playNotificationSound, lastNotificationId])

  // Request notification permission on mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }, [])

  const handleMarkAsRead = (notificationId: string) => {
    markNotificationRead.mutate(notificationId)
  }

  const handleMarkAllAsRead = () => {
    markAllNotificationsRead.mutate()
  }

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return <AlertTriangle className="w-4 h-4 text-red-500" />
      case 'high':
        return <AlertCircle className="w-4 h-4 text-orange-500" />
      case 'normal':
        return <Info className="w-4 h-4 text-blue-500" />
      default:
        return <Info className="w-4 h-4 text-gray-500" />
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'border-l-red-500 bg-red-50'
      case 'high':
        return 'border-l-orange-500 bg-orange-50'
      case 'normal':
        return 'border-l-blue-500 bg-blue-50'
      default:
        return 'border-l-gray-500 bg-gray-50'
    }
  }

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 1) return 'Just now'
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`
    
    const diffInHours = Math.floor(diffInMinutes / 60)
    if (diffInHours < 24) return `${diffInHours}h ago`
    
    const diffInDays = Math.floor(diffInHours / 24)
    return `${diffInDays}d ago`
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-end">
      <div className="bg-white w-full max-w-md h-full shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-black text-white p-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <BellRing className="w-5 h-5" />
            <h2 className="text-lg font-semibold">Notifications</h2>
            {unreadNotifications.data?.data.length > 0 && (
              <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                {unreadNotifications.data.data.length}
              </span>
            )}
          </div>
          <div className="flex items-center space-x-2">
            {unreadNotifications.data?.data.length > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="text-gray-300 hover:text-white transition-colors"
                title="Mark all as read"
              >
                <CheckCheck className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={onClose}
              className="text-gray-300 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto">
          {notifications.isLoading ? (
            <div className="p-4 text-center text-gray-500">
              Loading notifications...
            </div>
          ) : notifications.data?.data.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <Bell className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No notifications yet</p>
            </div>
          ) : (
            <div className="space-y-2 p-4">
              {notifications.data?.data.map((notification) => (
                <div
                  key={notification.id}
                  className={`border-l-4 p-4 rounded-r-lg transition-all duration-200 ${
                    notification.is_read
                      ? 'bg-gray-50 border-l-gray-300'
                      : getPriorityColor(notification.priority)
                  } ${!notification.is_read ? 'shadow-sm' : ''}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        {getPriorityIcon(notification.priority)}
                        <h3 className={`font-medium text-sm ${
                          notification.is_read ? 'text-gray-600' : 'text-gray-900'
                        }`}>
                          {notification.title}
                        </h3>
                        {!notification.is_read && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full" />
                        )}
                      </div>
                      <p className={`text-sm mb-2 ${
                        notification.is_read ? 'text-gray-500' : 'text-gray-700'
                      }`}>
                        {notification.message}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-400">
                          {formatTimeAgo(notification.created_at)}
                        </span>
                        {!notification.is_read && (
                          <button
                            onClick={() => handleMarkAsRead(notification.id)}
                            className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                          >
                            Mark as read
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}