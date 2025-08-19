import { TrendingUp, ShoppingCart, Clock, AlertTriangle, DollarSign, Users } from 'lucide-react'
import { useAdminQueries } from '../hooks/useAdminQueries'

export function DashboardOverview() {
  const { dashboardOverview, quickStats } = useAdminQueries()

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount || 0)
  }

  // Safely get data with defaults
  const overviewData = dashboardOverview.data?.data || {
    todayRevenue: 0,
    todayOrdersCount: 0,
    pendingOrdersCount: 0,
    urgentNotificationsCount: 0,
    lastUpdated: new Date().toISOString()
  }

  const statsData = quickStats.data?.data || {
    weeklyRevenue: 0,
    weeklyOrdersCount: 0,
    totalCustomers: 0,
    processingQueueLength: 0
  }

  const todayCards = [
    {
      title: "Today's Revenue",
      value: formatCurrency(overviewData.todayRevenue),
      icon: DollarSign,
      color: 'bg-green-500',
      textColor: 'text-green-600'
    },
    {
      title: "Today's Orders",
      value: String(overviewData.todayOrdersCount || 0),
      icon: ShoppingCart,
      color: 'bg-blue-500',
      textColor: 'text-blue-600'
    },
    {
      title: 'Pending Orders',
      value: String(overviewData.pendingOrdersCount || 0),
      icon: Clock,
      color: 'bg-orange-500',
      textColor: 'text-orange-600'
    },
    {
      title: 'Urgent Alerts',
      value: String(overviewData.urgentNotificationsCount || 0),
      icon: AlertTriangle,
      color: 'bg-red-500',
      textColor: 'text-red-600'
    }
  ]

  const weeklyCards = [
    {
      title: 'Weekly Revenue',
      value: formatCurrency(statsData.weeklyRevenue),
      icon: TrendingUp,
      color: 'bg-purple-500',
      textColor: 'text-purple-600'
    },
    {
      title: 'Weekly Orders',
      value: String(statsData.weeklyOrdersCount || 0),
      icon: ShoppingCart,
      color: 'bg-indigo-500',
      textColor: 'text-indigo-600'
    },
    {
      title: 'Total Customers',
      value: String(statsData.totalCustomers || 0),
      icon: Users,
      color: 'bg-teal-500',
      textColor: 'text-teal-600'
    },
    {
      title: 'Processing Queue',
      value: String(statsData.processingQueueLength || 0),
      icon: Clock,
      color: 'bg-amber-500',
      textColor: 'text-amber-600'
    }
  ]

  const isLoading = dashboardOverview.isLoading || quickStats.isLoading

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg shadow p-6 animate-pulse">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-24" />
                  <div className="h-6 bg-gray-200 rounded w-16" />
                </div>
                <div className="w-12 h-12 bg-gray-200 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg shadow p-6 animate-pulse">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-24" />
                  <div className="h-6 bg-gray-200 rounded w-16" />
                </div>
                <div className="w-12 h-12 bg-gray-200 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Today's Overview */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Today's Overview</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {todayCards.map((card) => {
            const IconComponent = card.icon
            return (
              <div key={card.title} className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow duration-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{card.title}</p>
                    <p className={`text-2xl font-bold ${card.textColor} mt-1`}>{card.value}</p>
                  </div>
                  <div className={`${card.color} text-white p-3 rounded-lg`}>
                    <IconComponent className="w-6 h-6" />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Weekly Performance */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Weekly Performance</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {weeklyCards.map((card) => {
            const IconComponent = card.icon
            return (
              <div key={card.title} className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow duration-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{card.title}</p>
                    <p className={`text-2xl font-bold ${card.textColor} mt-1`}>{card.value}</p>
                  </div>
                  <div className={`${card.color} text-white p-3 rounded-lg`}>
                    <IconComponent className="w-6 h-6" />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Last Updated */}
      {overviewData?.lastUpdated && (
        <div className="text-right">
          <p className="text-xs text-gray-500">
            Last updated: {new Date(overviewData.lastUpdated).toLocaleTimeString()}
          </p>
        </div>
      )}
    </div>
  )
}
