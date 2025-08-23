import { useDashboardStats } from '../hooks/useData'
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  ShoppingBag, 
  Users, 
  Package,
  Calendar,
  AlertTriangle,
  ChevronRight
} from 'lucide-react'

export default function Dashboard() {
  const { data: stats, isLoading, error } = useDashboardStats()

  if (isLoading) {
    return (
      <div className="space-y-6 pb-safe">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
            <p className="text-sm text-gray-500">Welcome back! Here's your business overview.</p>
          </div>
        </div>
        
        {/* Loading skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/3"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6 pb-safe">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">Failed to load dashboard data. Please try again.</p>
        </div>
      </div>
    )
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const formatPercentage = (value: number) => {
    const sign = value >= 0 ? '+' : ''
    return `${sign}${value.toFixed(1)}%`
  }

  const getChangeColor = (value: number) => {
    if (value > 0) return 'text-green-600'
    if (value < 0) return 'text-red-600'
    return 'text-gray-600'
  }

  const getChangeIcon = (value: number) => {
    if (value > 0) return TrendingUp
    if (value < 0) return TrendingDown
    return null
  }

  const statCards = [
    {
      title: 'Total Revenue',
      value: formatCurrency(stats?.revenue || 0),
      change: stats?.revenueChange || 0,
      icon: DollarSign,
      color: 'bg-green-50 border-green-200',
      iconColor: 'text-green-600'
    },
    {
      title: 'Orders',
      value: (stats?.orders || 0).toLocaleString(),
      change: stats?.ordersChange || 0,
      icon: ShoppingBag,
      color: 'bg-blue-50 border-blue-200',
      iconColor: 'text-blue-600'
    },
    {
      title: 'Customers',
      value: (stats?.customers || 0).toLocaleString(),
      change: stats?.customersChange || 0,
      icon: Users,
      color: 'bg-purple-50 border-purple-200',
      iconColor: 'text-purple-600'
    },
    {
      title: 'Products',
      value: (stats?.products || 0).toLocaleString(),
      change: stats?.productsChange || 0,
      icon: Package,
      color: 'bg-orange-50 border-orange-200',
      iconColor: 'text-orange-600'
    }
  ]

  return (
    <div className="space-y-6 pb-safe">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
          <p className="text-sm text-gray-500">
            Welcome back! Here's your business overview.
          </p>
        </div>
        <div className="flex items-center space-x-2 text-sm text-gray-500">
          <Calendar className="h-4 w-4" />
          <span>Last 30 days</span>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, index) => {
          const ChangeIcon = getChangeIcon(stat.change)
          return (
            <div key={index} className={`bg-white rounded-lg border p-4 hover:shadow-md transition-shadow touch-manipulation ${stat.color}`}>
              <div className="flex items-center justify-between mb-2">
                <div className={`p-2 rounded-lg ${stat.color}`}>
                  <stat.icon className={`h-5 w-5 ${stat.iconColor}`} />
                </div>
                {ChangeIcon && (
                  <ChangeIcon className={`h-4 w-4 ${getChangeColor(stat.change)}`} />
                )}
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 mb-1">{stat.value}</p>
                <p className="text-sm text-gray-600 mb-1">{stat.title}</p>
                <p className={`text-xs ${getChangeColor(stat.change)}`}>
                  {formatPercentage(stat.change)} from last month
                </p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <QuickActionCard
            title="View Products"
            description="Manage your product catalog"
            href="/products"
            icon={Package}
          />
          <QuickActionCard
            title="Recent Orders"
            description="Check latest customer orders"
            href="/orders"
            icon={ShoppingBag}
          />
          <QuickActionCard
            title="Customer Analytics"
            description="View customer insights"
            href="/customers"
            icon={Users}
          />
          <QuickActionCard
            title="Sales Reports"
            description="Analyze your sales data"
            href="/reports"
            icon={TrendingUp}
          />
          <QuickActionCard
            title="Analytics Dashboard"
            description="Detailed performance metrics"
            href="/analytics"
            icon={DollarSign}
          />
          <QuickActionCard
            title="Settings"
            description="Configure your account"
            href="/settings"
            icon={Calendar}
          />
        </div>
      </div>

      {/* Alerts Section */}
      {stats?.alerts && stats.alerts.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <AlertTriangle className="h-5 w-5 text-orange-500 mr-2" />
            Alerts & Notifications
          </h3>
          <div className="space-y-2">
            {stats.alerts.map((alert: any, index: number) => (
              <div key={index} className="flex items-center justify-between p-3 bg-orange-50 border border-orange-200 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-900">{alert.title}</p>
                  <p className="text-xs text-gray-600">{alert.description}</p>
                </div>
                <button className="text-orange-600 hover:text-orange-800 touch-manipulation">
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Activity */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
        {stats?.recentActivity && stats.recentActivity.length > 0 ? (
          <div className="space-y-3">
            {stats.recentActivity.map((activity: any, index: number) => (
              <div key={index} className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded-lg">
                <div className="flex-shrink-0">
                  <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <ShoppingBag className="h-4 w-4 text-blue-600" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900 truncate">{activity.description}</p>
                  <p className="text-xs text-gray-500">{activity.timestamp}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-sm">No recent activity to display.</p>
        )}
      </div>
    </div>
  )
}

// Quick Action Card Component
function QuickActionCard({ 
  title, 
  description, 
  href, 
  icon: Icon 
}: { 
  title: string
  description: string
  href: string
  icon: any
}) {
  const handleClick = () => {
    window.location.href = href
  }

  return (
    <button
      onClick={handleClick}
      className="text-left p-3 border border-gray-200 rounded-lg hover:shadow-md hover:border-gray-300 transition-all touch-manipulation"
    >
      <div className="flex items-center space-x-3">
        <div className="flex-shrink-0">
          <div className="h-8 w-8 bg-gray-100 rounded-lg flex items-center justify-center">
            <Icon className="h-4 w-4 text-gray-600" />
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">{title}</p>
          <p className="text-xs text-gray-500 truncate">{description}</p>
        </div>
        <ChevronRight className="h-4 w-4 text-gray-400" />
      </div>
    </button>
  )
}