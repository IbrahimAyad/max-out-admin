import React from 'react'
import {
  Package,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  ShoppingCart,
  DollarSign,
  Archive,
  CheckCircle
} from 'lucide-react'

interface DashboardStatsProps {
  data?: {
    totalProducts: number
    activeProducts: number
    totalVariants: number
    totalInventory: number
    availableInventory: number
    lowStockVariants: number
    productsByStatus: {
      active: number
      draft: number
      archived: number
    }
  }
  loading: boolean
}

const DashboardStats: React.FC<DashboardStatsProps> = ({ data, loading }) => {
  const stats = [
    {
      name: 'Total Products',
      value: data?.totalProducts || 0,
      change: '+4.75%',
      changeType: 'positive',
      icon: Package,
      color: 'bg-blue-500'
    },
    {
      name: 'Active Products',
      value: data?.activeProducts || 0,
      change: '+12.02%',
      changeType: 'positive',
      icon: CheckCircle,
      color: 'bg-green-500'
    },
    {
      name: 'Total Variants',
      value: data?.totalVariants || 0,
      change: '+2.15%',
      changeType: 'positive',
      icon: ShoppingCart,
      color: 'bg-purple-500'
    },
    {
      name: 'Available Inventory',
      value: data?.availableInventory || 0,
      change: '-0.28%',
      changeType: 'negative',
      icon: Archive,
      color: 'bg-orange-500'
    },
    {
      name: 'Low Stock Alerts',
      value: data?.lowStockVariants || 0,
      change: '+5.4%',
      changeType: 'negative',
      icon: AlertTriangle,
      color: 'bg-red-500'
    },
    {
      name: 'Draft Products',
      value: data?.productsByStatus?.draft || 0,
      change: '+1.3%',
      changeType: 'neutral',
      icon: TrendingUp,
      color: 'bg-yellow-500'
    }
  ]

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="animate-pulse">
              <div className="flex items-center justify-between">
                <div className="h-4 bg-gray-200 rounded w-20"></div>
                <div className="h-8 w-8 bg-gray-200 rounded"></div>
              </div>
              <div className="mt-2">
                <div className="h-8 bg-gray-200 rounded w-16"></div>
              </div>
              <div className="mt-2">
                <div className="h-3 bg-gray-200 rounded w-12"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      {stats.map((stat) => {
        const Icon = stat.icon
        return (
          <div
            key={stat.name}
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200"
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {stat.value.toLocaleString()}
                </p>
              </div>
              <div className={`${stat.color} p-3 rounded-lg`}>
                <Icon className="h-6 w-6 text-white" />
              </div>
            </div>
            <div className="mt-4 flex items-center">
              <span
                className={`text-sm font-medium ${
                  stat.changeType === 'positive'
                    ? 'text-green-600'
                    : stat.changeType === 'negative'
                    ? 'text-red-600'
                    : 'text-gray-600'
                }`}
              >
                {stat.changeType === 'positive' ? (
                  <TrendingUp className="h-4 w-4 inline mr-1" />
                ) : stat.changeType === 'negative' ? (
                  <TrendingDown className="h-4 w-4 inline mr-1" />
                ) : null}
                {stat.change}
              </span>
              <span className="text-sm text-gray-500 ml-2">vs last month</span>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default DashboardStats