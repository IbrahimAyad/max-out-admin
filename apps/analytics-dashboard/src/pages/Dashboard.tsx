import React from 'react'
import { useDashboardStats } from '../hooks/useData'
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  ShoppingCart, 
  Users, 
  Package, 
  AlertTriangle,
  Clock
} from 'lucide-react'
import { CDN_BASE_URL, getImageUrl } from '../lib/supabase'

export default function Dashboard() {
  const { data: stats, isLoading, error } = useDashboardStats()

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="md:flex md:items-center md:justify-between">
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-bold leading-7 text-neutral-900 sm:text-3xl sm:truncate">
              Dashboard
            </h2>
            <p className="mt-1 text-sm text-neutral-500">
              Welcome back! Here's what's happening with your business today.
            </p>
          </div>
        </div>
        
        {/* Loading skeleton */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg border border-neutral-200 p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-neutral-200 rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-neutral-200 rounded w-1/2 mb-2"></div>
                <div className="h-3 bg-neutral-200 rounded w-1/4"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
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
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'processing':
        return 'bg-blue-100 text-blue-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-neutral-100 text-neutral-800'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="md:flex md:items-center md:justify-between">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-neutral-900 sm:text-3xl sm:truncate">
            Dashboard
          </h2>
          <p className="mt-1 text-sm text-neutral-500">
            Welcome back! Here's what's happening with your business today.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {/* Today's Revenue */}
        <div className="bg-white rounded-lg border border-neutral-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-4 flex-1">
              <p className="text-sm font-medium text-neutral-500">Today's Revenue</p>
              <p className="text-2xl font-bold text-neutral-900">
                {formatCurrency(stats?.todayRevenue || 0)}
              </p>
              <div className="flex items-center mt-1">
                {stats?.revenueChange && stats.revenueChange > 0 ? (
                  <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
                )}
                <span className={`text-sm font-medium ${
                  stats?.revenueChange && stats.revenueChange > 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {stats?.revenueChange ? `${Math.abs(stats.revenueChange).toFixed(1)}%` : '0%'}
                </span>
                <span className="text-sm text-neutral-500 ml-1">vs yesterday</span>
              </div>
            </div>
          </div>
        </div>

        {/* Total Orders */}
        <div className="bg-white rounded-lg border border-neutral-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ShoppingCart className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-4 flex-1">
              <p className="text-sm font-medium text-neutral-500">Total Orders</p>
              <p className="text-2xl font-bold text-neutral-900">
                {stats?.totalOrders.toLocaleString() || 0}
              </p>
              <p className="text-sm text-neutral-500 mt-1">All time</p>
            </div>
          </div>
        </div>

        {/* Total Customers */}
        <div className="bg-white rounded-lg border border-neutral-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Users className="h-8 w-8 text-purple-600" />
            </div>
            <div className="ml-4 flex-1">
              <p className="text-sm font-medium text-neutral-500">Total Customers</p>
              <p className="text-2xl font-bold text-neutral-900">
                {stats?.totalCustomers.toLocaleString() || 0}
              </p>
              <p className="text-sm text-neutral-500 mt-1">Registered</p>
            </div>
          </div>
        </div>

        {/* Total Products */}
        <div className="bg-white rounded-lg border border-neutral-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Package className="h-8 w-8 text-orange-600" />
            </div>
            <div className="ml-4 flex-1">
              <p className="text-sm font-medium text-neutral-500">Total Products</p>
              <p className="text-2xl font-bold text-neutral-900">
                {stats?.totalProducts.toLocaleString() || 0}
              </p>
              <p className="text-sm text-neutral-500 mt-1">In catalog</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Recent Orders */}
        <div className="bg-white rounded-lg border border-neutral-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-neutral-900">Recent Orders</h3>
            <Clock className="h-5 w-5 text-neutral-400" />
          </div>
          <div className="space-y-4">
            {stats?.recentOrders && stats.recentOrders.length > 0 ? (
              stats.recentOrders.map((order: any) => (
                <div key={order.id} className="flex items-center justify-between py-3 border-b border-neutral-100 last:border-b-0">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-neutral-900">#{order.order_number}</p>
                    <p className="text-sm text-neutral-500">{order.customer_email}</p>
                    <p className="text-xs text-neutral-400">{formatDate(order.created_at)}</p>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="text-sm font-medium text-neutral-900">
                      {formatCurrency(order.total_amount)}
                    </span>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      getStatusColor(order.status)
                    }`}>
                      {order.status}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-neutral-500">No recent orders</p>
            )}
          </div>
        </div>

        {/* Low Stock Alert */}
        <div className="bg-white rounded-lg border border-neutral-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-neutral-900">Low Stock Alert</h3>
            <AlertTriangle className="h-5 w-5 text-amber-500" />
          </div>
          <div className="space-y-4">
            {stats?.lowStockProducts && stats.lowStockProducts.length > 0 ? (
              stats.lowStockProducts.map((variant: any) => (
                <div key={variant.id} className="flex items-center justify-between py-3 border-b border-neutral-100 last:border-b-0">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-neutral-900">
                      {variant.products?.name || 'Unknown Product'}
                    </p>
                    <p className="text-sm text-neutral-500">SKU: {variant.sku}</p>
                  </div>
                  <div className="flex items-center">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      variant.inventory_quantity === 0 
                        ? 'bg-red-100 text-red-800' 
                        : 'bg-amber-100 text-amber-800'
                    }`}>
                      {variant.inventory_quantity} left
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-neutral-500">All products are well stocked</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}