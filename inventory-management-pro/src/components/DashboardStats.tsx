import React from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Package,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  ShoppingCart,
  DollarSign,
  Archive,
  CheckCircle,
  Inbox
} from 'lucide-react'
import { vendorQueries } from '../lib/queries'

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
  onVendorInboxClick?: () => void
}

const DashboardStats: React.FC<DashboardStatsProps> = ({ data, loading, onVendorInboxClick }) => {
  // Fetch vendor inbox count
  const { data: vendorInboxData, isLoading: vendorInboxLoading } = useQuery({
    queryKey: ['vendor-inbox-count'],
    queryFn: vendorQueries.getVendorInboxCount,
    refetchInterval: 30000 // Refetch every 30 seconds
  })

  const stats = [
    {
      name: 'Total Products',
      value: data?.totalProducts || 0,
      change: '+4.75%',
      changeType: 'positive',
      icon: Package,
      color: 'bg-blue-500',
      clickable: false
    },
    {
      name: 'Active Products',
      value: data?.activeProducts || 0,
      change: '+12.02%',
      changeType: 'positive',
      icon: CheckCircle,
      color: 'bg-green-500',
      clickable: false
    },
    {
      name: 'Total Variants',
      value: data?.totalVariants || 0,
      change: '+2.15%',
      changeType: 'positive',
      icon: ShoppingCart,
      color: 'bg-purple-500',
      clickable: false
    },
    {
      name: 'Available Inventory',
      value: data?.availableInventory || 0,
      change: '-0.28%',
      changeType: 'negative',
      icon: Archive,
      color: 'bg-orange-500',
      clickable: false
    },
    {
      name: 'Low Stock Alerts',
      value: data?.lowStockVariants || 0,
      change: '+5.4%',
      changeType: 'negative',
      icon: AlertTriangle,
      color: 'bg-red-500',
      clickable: false
    },
    {
      name: 'Vendor Inbox',
      value: vendorInboxLoading ? 0 : (vendorInboxData?.inbox_count || 0),
      change: 'New Items',
      changeType: 'neutral',
      icon: Inbox,
      color: 'bg-indigo-500',
      clickable: true,
      onClick: onVendorInboxClick
    }
  ]

  if (loading || vendorInboxLoading) {
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
        const CardWrapper = stat.clickable ? 'button' : 'div'
        return (
          <CardWrapper
            key={stat.name}
            onClick={stat.clickable ? stat.onClick : undefined}
            className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 transition-all duration-200 ${
              stat.clickable 
                ? 'hover:shadow-md hover:bg-gray-50 cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2' 
                : 'hover:shadow-md'
            }`}
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
              {stat.clickable ? (
                <span className="text-sm font-medium text-indigo-600">
                  {stat.change}
                </span>
              ) : (
                <>
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
                </>
              )}
            </div>
          </CardWrapper>
        )
      })}
    </div>
  )
}

export default DashboardStats