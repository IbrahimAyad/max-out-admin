import { Clock, ShoppingBag, Bell } from 'lucide-react'
import { useAdminQueries } from '../hooks/useAdminQueries'
import type { Order, AdminNotification } from '../types/admin'

export function RecentActivity() {
  const { recentActivity } = useAdminQueries()

  const formatCurrency = (amount: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(parseFloat(amount))
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

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'text-green-600 bg-green-100'
      case 'processing':
        return 'text-blue-600 bg-blue-100'
      case 'pending':
      case 'pending_payment':
        return 'text-orange-600 bg-orange-100'
      case 'cancelled':
        return 'text-red-600 bg-red-100'
      default:
        return 'text-gray-600 bg-gray-100'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'text-red-600'
      case 'high':
        return 'text-orange-600'
      case 'normal':
        return 'text-blue-600'
      default:
        return 'text-gray-600'
    }
  }

  if (recentActivity.isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gray-200 rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                  <div className="h-3 bg-gray-200 rounded w-1/2" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  const activityData = recentActivity.data?.data
  const recentOrders = activityData?.recentOrders || []
  const recentNotifications = activityData?.recentNotifications || []

  // Combine and sort activities by timestamp
  const allActivities = [
    ...recentOrders.map(order => ({
      type: 'order' as const,
      id: order.id,
      timestamp: order.created_at,
      data: order
    })),
    ...recentNotifications.map(notification => ({
      type: 'notification' as const,
      id: notification.id,
      timestamp: notification.created_at,
      data: notification
    }))
  ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 10)

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
        <Clock className="w-5 h-5 mr-2" />
        Recent Activity
      </h3>
      
      {allActivities.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <Clock className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p>No recent activity</p>
        </div>
      ) : (
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {allActivities.map((activity) => (
            <div key={`${activity.type}-${activity.id}`} className="flex items-start space-x-3 pb-3 border-b border-gray-100 last:border-b-0">
              <div className="flex-shrink-0">
                {activity.type === 'order' ? (
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <ShoppingBag className="w-4 h-4 text-blue-600" />
                  </div>
                ) : (
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                    <Bell className="w-4 h-4 text-purple-600" />
                  </div>
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                {activity.type === 'order' ? (
                  <div>
                    <p className="text-sm font-medium text-gray-900 truncate">
                      Order {(activity.data as Order).order_number}
                    </p>
                    <p className="text-sm text-gray-600">
                      {(activity.data as Order).customer_name || (activity.data as Order).customer_email || 'Guest Customer'} • {formatCurrency((activity.data as Order).total_amount)}
                    </p>
                    <div className="flex items-center justify-between mt-1">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor((activity.data as Order).status)}`}>
                        {(activity.data as Order).status.replace('_', ' ')}
                      </span>
                      <span className="text-xs text-gray-500">
                        {formatTimeAgo(activity.timestamp)}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div>
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {(activity.data as AdminNotification).title}
                    </p>
                    <p className="text-sm text-gray-600 truncate">
                      {(activity.data as AdminNotification).message}
                    </p>
                    <div className="flex items-center justify-between mt-1">
                      <span className={`text-xs font-medium ${getPriorityColor((activity.data as AdminNotification).priority)}`}>
                        {(activity.data as AdminNotification).priority.toUpperCase()}
                      </span>
                      <span className="text-xs text-gray-500">
                        {formatTimeAgo(activity.timestamp)}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}