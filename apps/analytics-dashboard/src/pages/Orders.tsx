import { useState } from 'react'
import { useOrders } from '../hooks/useData'
import { 
  Search, 
  ShoppingBag, 
  Calendar,
  User,
  Package,
  CreditCard,
  Truck,
  Eye,
  Edit,
  ChevronLeft,
  ChevronRight,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react'

export default function Orders() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [dateRange, setDateRange] = useState('')
  const [sortBy, setSortBy] = useState('created_at')
  const limit = 20

  const { data, isLoading, error } = useOrders(page, limit, search, status, dateRange, sortBy)

  const statusOptions = [
    { value: 'pending', label: 'Pending', icon: Clock, color: 'bg-yellow-100 text-yellow-800' },
    { value: 'processing', label: 'Processing', icon: Package, color: 'bg-blue-100 text-blue-800' },
    { value: 'shipped', label: 'Shipped', icon: Truck, color: 'bg-purple-100 text-purple-800' },
    { value: 'delivered', label: 'Delivered', icon: CheckCircle, color: 'bg-green-100 text-green-800' },
    { value: 'cancelled', label: 'Cancelled', icon: XCircle, color: 'bg-red-100 text-red-800' },
  ]

  const dateRangeOptions = [
    { value: 'today', label: 'Today' },
    { value: 'week', label: 'This Week' },
    { value: 'month', label: 'This Month' },
    { value: 'quarter', label: 'This Quarter' },
    { value: 'year', label: 'This Year' }
  ]

  const sortOptions = [
    { value: 'created_at', label: 'Recently Created' },
    { value: 'updated_at', label: 'Recently Updated' },
    { value: 'total_amount', label: 'Order Value' },
    { value: 'customer_name', label: 'Customer Name' }
  ]

  if (isLoading) {
    return (
      <div className="space-y-6 pb-safe">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Orders</h2>
            <p className="text-sm text-gray-500">Manage customer orders</p>
          </div>
        </div>
        
        {/* Loading skeleton */}
        <div className="space-y-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="animate-pulse">
                <div className="flex items-center space-x-4">
                  <div className="h-12 w-12 bg-gray-200 rounded-lg"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/6"></div>
                  </div>
                  <div className="h-4 bg-gray-200 rounded w-1/8"></div>
                </div>
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
          <p className="text-red-800">Failed to load orders. Please try again.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-safe">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Orders</h2>
          <p className="text-sm text-gray-500">
            Manage customer orders ({data?.total || 0} orders)
          </p>
        </div>
        <div className="flex items-center space-x-2 text-sm text-gray-500">
          <Calendar className="h-4 w-4" />
          <span>Order management</span>
        </div>
      </div>

      {/* Order Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {statusOptions.map((statusOption) => {
          const count = data?.statusCounts?.[statusOption.value] || 0
          const Icon = statusOption.icon
          
          return (
            <div key={statusOption.value} className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center space-x-2 mb-2">
                <Icon className="h-4 w-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-600">{statusOption.label}</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{count}</p>
            </div>
          )
        })}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search orders, customers, or order IDs..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-black text-base"
                style={{ fontSize: '16px' }}
              />
            </div>
          </div>
          
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-2">
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-black text-base"
              style={{ fontSize: '16px' }}
            >
              <option value="">All Statuses</option>
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
            
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-black text-base"
              style={{ fontSize: '16px' }}
            >
              <option value="">All Time</option>
              {dateRangeOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
            
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-black text-base"
              style={{ fontSize: '16px' }}
            >
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Orders List */}
      <div className="space-y-4">
        {data?.orders?.map((order: any) => (
          <OrderCard key={order.id} order={order} />
        ))}
        
        {(!data?.orders || data.orders.length === 0) && (
          <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
            <ShoppingBag className="h-12 w-12 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-500 mb-1">No orders found</p>
            <p className="text-sm text-gray-400">
              {search || status || dateRange ? 'Try adjusting your filters' : 'Orders will appear here when customers make purchases'}
            </p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {data?.total && data.total > limit && (
        <div className="flex items-center justify-between bg-white px-4 py-3 border border-gray-200 rounded-lg">
          <div className="flex justify-between flex-1 sm:hidden">
            <button
              onClick={() => setPage(page - 1)}
              disabled={page === 1}
              className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 touch-manipulation"
            >
              Previous
            </button>
            <button
              onClick={() => setPage(page + 1)}
              disabled={!data.hasMore}
              className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 touch-manipulation"
            >
              Next
            </button>
          </div>
          <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Showing <span className="font-medium">{(page - 1) * limit + 1}</span> to{' '}
                <span className="font-medium">
                  {Math.min(page * limit, data.total)}
                </span>{' '}
                of <span className="font-medium">{data.total}</span> results
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                <button
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 touch-manipulation"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  onClick={() => setPage(page + 1)}
                  disabled={!data.hasMore}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 touch-manipulation"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Order Card Component
function OrderCard({ order }: { order: any }) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const statusOptions = [
    { value: 'pending', label: 'Pending', icon: Clock, color: 'bg-yellow-100 text-yellow-800' },
    { value: 'processing', label: 'Processing', icon: Package, color: 'bg-blue-100 text-blue-800' },
    { value: 'shipped', label: 'Shipped', icon: Truck, color: 'bg-purple-100 text-purple-800' },
    { value: 'delivered', label: 'Delivered', icon: CheckCircle, color: 'bg-green-100 text-green-800' },
    { value: 'cancelled', label: 'Cancelled', icon: XCircle, color: 'bg-red-100 text-red-800' },
  ]

  const getStatusConfig = (status: string) => {
    return statusOptions.find(option => option.value === status) || {
      value: status,
      label: status,
      icon: AlertCircle,
      color: 'bg-gray-100 text-gray-800'
    }
  }

  const statusConfig = getStatusConfig(order.status)
  const StatusIcon = statusConfig.icon

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <ShoppingBag className="h-5 w-5 text-blue-600" />
            </div>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-900">
              Order #{order.order_number || order.id}
            </h3>
            <div className="flex items-center space-x-4 mt-1">
              <div className="flex items-center space-x-1">
                <User className="h-3 w-3 text-gray-400" />
                <span className="text-xs text-gray-500">{order.customer_name || 'Guest'}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Calendar className="h-3 w-3 text-gray-400" />
                <span className="text-xs text-gray-500">{formatDate(order.created_at)}</span>
              </div>
            </div>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm font-semibold text-gray-900">
            {formatCurrency(order.total_amount)}
          </p>
          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${statusConfig.color}`}>
            <StatusIcon className="h-3 w-3 mr-1" />
            {statusConfig.label}
          </span>
        </div>
      </div>

      {/* Order Details */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-3 text-sm">
        <div>
          <p className="text-xs text-gray-500">Items</p>
          <p className="font-medium text-gray-900">{order.items_count || 0} items</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Payment</p>
          <div className="flex items-center space-x-1">
            <CreditCard className="h-3 w-3 text-gray-400" />
            <span className="font-medium text-gray-900">{order.payment_method || 'Card'}</span>
          </div>
        </div>
        <div>
          <p className="text-xs text-gray-500">Shipping</p>
          <div className="flex items-center space-x-1">
            <Truck className="h-3 w-3 text-gray-400" />
            <span className="font-medium text-gray-900">{order.shipping_method || 'Standard'}</span>
          </div>
        </div>
        <div>
          <p className="text-xs text-gray-500">Updated</p>
          <p className="font-medium text-gray-900">{formatDate(order.updated_at)}</p>
        </div>
      </div>

      {/* Order Items Preview */}
      {order.items && order.items.length > 0 && (
        <div className="mb-3">
          <p className="text-xs text-gray-500 mb-2">Items in this order</p>
          <div className="flex flex-wrap gap-1">
            {order.items.slice(0, 3).map((item: any, index: number) => (
              <span key={index} className="inline-flex items-center px-2 py-1 bg-gray-100 rounded text-xs text-gray-700">
                {item.product_name} {item.variant_info && `(${item.variant_info})`}
                {item.quantity > 1 && ` x${item.quantity}`}
              </span>
            ))}
            {order.items.length > 3 && (
              <span className="inline-flex items-center px-2 py-1 bg-gray-100 rounded text-xs text-gray-700">
                +{order.items.length - 3} more
              </span>
            )}
          </div>
        </div>
      )}

      {/* Shipping Address */}
      {order.shipping_address && (
        <div className="mb-3">
          <p className="text-xs text-gray-500 mb-1">Shipping to</p>
          <p className="text-xs text-gray-700">
            {order.shipping_address.city}, {order.shipping_address.state} {order.shipping_address.zip_code}
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
        <div className="flex items-center space-x-2">
          {order.tracking_number && (
            <span className="text-xs text-gray-500">
              Tracking: {order.tracking_number}
            </span>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <button className="inline-flex items-center px-2 py-1 border border-gray-300 rounded text-xs text-gray-700 hover:bg-gray-50 touch-manipulation">
            <Eye className="h-3 w-3 mr-1" />
            View
          </button>
          <button className="inline-flex items-center px-2 py-1 border border-gray-300 rounded text-xs text-gray-700 hover:bg-gray-50 touch-manipulation">
            <Edit className="h-3 w-3 mr-1" />
            Edit
          </button>
        </div>
      </div>
    </div>
  )
}