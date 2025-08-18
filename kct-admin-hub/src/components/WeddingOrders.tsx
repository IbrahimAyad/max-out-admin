import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Package, TrendingUp, Clock, CheckCircle, AlertTriangle, DollarSign, ExternalLink } from 'lucide-react'
import { weddingAPI } from '../lib/supabase'

interface WeddingOrdersProps {
  weddingId: string
}

export function WeddingOrders({ weddingId }: WeddingOrdersProps) {
  const [statusFilter, setStatusFilter] = useState('all')

  // Get wedding orders
  const { data: weddingOrders } = useQuery({
    queryKey: ['wedding-orders', weddingId],
    queryFn: () => weddingAPI.getWedding(weddingId, { include_orders: true })
  })

  const orders = weddingOrders?.data?.orders || []
  const orderSummary = weddingOrders?.data?.order_summary || {
    total_orders: 0,
    total_revenue: 0,
    pending_orders: 0,
    completed_orders: 0,
    average_order_value: 0
  }

  const filteredOrders = orders.filter(order => 
    statusFilter === 'all' || order.status === statusFilter
  )

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800', label: 'Pending' },
      confirmed: { color: 'bg-blue-100 text-blue-800', label: 'Confirmed' },
      production: { color: 'bg-purple-100 text-purple-800', label: 'Production' },
      shipping: { color: 'bg-indigo-100 text-indigo-800', label: 'Shipping' },
      delivered: { color: 'bg-green-100 text-green-800', label: 'Delivered' },
      cancelled: { color: 'bg-red-100 text-red-800', label: 'Cancelled' }
    }
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${config.color}`}>
        {config.label}
      </span>
    )
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Order Management</h3>
        <button className="bg-black text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-gray-800 transition-colors">
          <ExternalLink className="w-4 h-4" />
          <span>View in Order System</span>
        </button>
      </div>

      {/* Order Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Orders</p>
              <p className="text-2xl font-bold text-gray-900">{orderSummary.total_orders}</p>
            </div>
            <Package className="w-8 h-8 text-blue-600" />
          </div>
        </div>
        
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(orderSummary.total_revenue)}</p>
            </div>
            <DollarSign className="w-8 h-8 text-green-600" />
          </div>
        </div>
        
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending Orders</p>
              <p className="text-2xl font-bold text-gray-900">{orderSummary.pending_orders}</p>
            </div>
            <Clock className="w-8 h-8 text-orange-600" />
          </div>
        </div>
        
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Avg Order Value</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(orderSummary.average_order_value)}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-purple-600" />
          </div>
        </div>
      </div>

      {/* Order Filters */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-center space-x-4">
          <label className="text-sm font-medium text-gray-700">Filter by Status:</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-black focus:border-transparent"
          >
            <option value="all">All Orders</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="production">Production</option>
            <option value="shipping">Shipping</option>
            <option value="delivered">Delivered</option>
          </select>
        </div>
      </div>

      {/* Orders List */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h4 className="text-lg font-semibold text-gray-900">Wedding Orders</h4>
        </div>
        
        {filteredOrders.length === 0 ? (
          <div className="p-6 text-center">
            <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h4 className="text-lg font-medium text-gray-900 mb-2">No orders found</h4>
            <p className="text-gray-600">
              {statusFilter !== 'all' ? 'No orders match the selected filter' : 'No orders have been placed yet'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredOrders.map((order) => (
              <div key={order.id} className="p-6 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="bg-gray-100 text-gray-600 w-12 h-12 rounded-lg flex items-center justify-center">
                      <Package className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h5 className="text-lg font-semibold text-gray-900">Order #{order.order_number}</h5>
                        {getStatusBadge(order.status)}
                      </div>
                      <p className="text-gray-600">{order.customer_name}</p>
                      <p className="text-sm text-gray-500">
                        {order.items_count} items • Placed {formatDate(order.created_at)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <p className="text-lg font-bold text-gray-900">{formatCurrency(order.total_amount)}</p>
                    <p className="text-sm text-gray-500">Expected delivery: {formatDate(order.expected_delivery)}</p>
                    {order.shipping_address && (
                      <p className="text-xs text-gray-400 mt-1">
                        {order.shipping_address.city}, {order.shipping_address.state}
                      </p>
                    )}
                  </div>
                </div>
                
                {/* Order Items Preview */}
                {order.items && order.items.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <div className="flex items-center space-x-4">
                      <p className="text-sm font-medium text-gray-700">Items:</p>
                      <div className="flex flex-wrap gap-2">
                        {order.items.slice(0, 3).map((item, index) => (
                          <span key={index} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                            {item.product_name} ({item.size})
                          </span>
                        ))}
                        {order.items.length > 3 && (
                          <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                            +{order.items.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Payment Summary */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h4 className="text-lg font-semibold text-gray-900 mb-4">Payment Summary</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-800">Payments Received</p>
                <p className="text-xl font-bold text-green-900">{formatCurrency(orderSummary.payments_received || 0)}</p>
              </div>
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
          
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-yellow-800">Pending Payments</p>
                <p className="text-xl font-bold text-yellow-900">{formatCurrency(orderSummary.pending_payments || 0)}</p>
              </div>
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
          
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-800">Overdue Payments</p>
                <p className="text-xl font-bold text-red-900">{formatCurrency(orderSummary.overdue_payments || 0)}</p>
              </div>
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}