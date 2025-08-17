import React from 'react'
import { useParams, Link } from 'react-router-dom'
import { useOrder, useUpdateOrderStatus } from '../hooks/useData'
import { 
  ArrowLeft, 
  Package, 
  User, 
  MapPin, 
  CreditCard, 
  Calendar,
  DollarSign,
  Truck,
  CheckCircle,
  Clock
} from 'lucide-react'
import { CDN_BASE_URL, getImageUrl } from '../lib/supabase'

export default function OrderDetails() {
  const { orderId } = useParams()
  const { data: order, isLoading, error } = useOrder(orderId!)
  const updateOrderStatus = useUpdateOrderStatus()

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'processing':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'shipped':
        return 'bg-purple-100 text-purple-800 border-purple-200'
      default:
        return 'bg-neutral-100 text-neutral-800 border-neutral-200'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5" />
      case 'processing':
        return <Clock className="h-5 w-5" />
      case 'shipped':
        return <Truck className="h-5 w-5" />
      default:
        return <Package className="h-5 w-5" />
    }
  }

  const handleStatusChange = async (newStatus: string) => {
    if (orderId) {
      try {
        await updateOrderStatus.mutateAsync({ orderId, status: newStatus })
      } catch (error) {
        // Error handling is done in the hook
      }
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-neutral-200 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="h-64 bg-neutral-200 rounded"></div>
              <div className="h-48 bg-neutral-200 rounded"></div>
            </div>
            <div className="space-y-6">
              <div className="h-48 bg-neutral-200 rounded"></div>
              <div className="h-32 bg-neutral-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">Failed to load order details. Please try again.</p>
        </div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="space-y-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800">Order not found.</p>
        </div>
      </div>
    )
  }

  const statuses = ['pending', 'processing', 'shipped', 'completed', 'cancelled']

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            to="/orders"
            className="inline-flex items-center p-2 border border-neutral-300 rounded-md text-neutral-400 hover:text-neutral-500 hover:bg-neutral-50"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-neutral-900">
              Order #{order.order_number}
            </h1>
            <p className="text-sm text-neutral-500">
              Placed on {formatDate(order.created_at)}
            </p>
          </div>
        </div>
        
        <div className={`flex items-center space-x-2 px-3 py-2 rounded-lg border ${
          getStatusColor(order.status)
        }`}>
          {getStatusIcon(order.status)}
          <span className="text-sm font-medium">
            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Items */}
          <div className="bg-white rounded-lg border border-neutral-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-neutral-200">
              <h3 className="text-lg font-medium text-neutral-900">Order Items</h3>
            </div>
            <div className="divide-y divide-neutral-200">
              {order.items && order.items.length > 0 ? (
                order.items.map((item: any) => (
                  <div key={item.id} className="p-6 flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      {/* For now, use placeholder since order_items doesn't have image URL */}
                      <div className="h-16 w-16 rounded-md bg-neutral-100 flex items-center justify-center">
                        <Package className="h-8 w-8 text-neutral-400" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-neutral-900">
                        {item.product_name}
                      </h4>
                      <p className="text-sm text-neutral-500">
                        SKU: {item.product_sku}
                      </p>
                      {item.size && (
                        <p className="text-xs text-neutral-500">
                          Size: {item.size}
                        </p>
                      )}
                      {item.color && (
                        <p className="text-xs text-neutral-500">
                          Color: {item.color}
                        </p>
                      )}
                      <p className="text-sm text-neutral-500">
                        Quantity: {item.quantity}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-neutral-900">
                        {formatCurrency(item.unit_price)}
                      </p>
                      <p className="text-xs text-neutral-500">
                        each
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-neutral-900">
                        {formatCurrency(item.line_total)}
                      </p>
                      <p className="text-xs text-neutral-500">
                        total
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-6 text-center text-neutral-500">
                  <Package className="h-12 w-12 mx-auto text-neutral-400 mb-2" />
                  <p>No items found for this order</p>
                </div>
              )}
            </div>
            
            {/* Order Total */}
            <div className="bg-neutral-50 px-6 py-4 border-t border-neutral-200">
              <div className="flex justify-between items-center">
                <span className="text-lg font-medium text-neutral-900">Total</span>
                <span className="text-lg font-bold text-neutral-900">
                  {formatCurrency(order.total_amount)}
                </span>
              </div>
            </div>
          </div>

          {/* Shipping Address */}
          {order.shipping_address && (
            <div className="bg-white rounded-lg border border-neutral-200 p-6">
              <div className="flex items-center space-x-2 mb-4">
                <MapPin className="h-5 w-5 text-neutral-400" />
                <h3 className="text-lg font-medium text-neutral-900">Shipping Address</h3>
              </div>
              <div className="text-sm text-neutral-700">
                <pre className="whitespace-pre-wrap font-sans">
                  {typeof order.shipping_address === 'string' 
                    ? order.shipping_address 
                    : JSON.stringify(order.shipping_address, null, 2)
                  }
                </pre>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Order Status */}
          <div className="bg-white rounded-lg border border-neutral-200 p-6">
            <h3 className="text-lg font-medium text-neutral-900 mb-4">Order Status</h3>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-neutral-700">
                Update Status
              </label>
              <select
                value={order.status}
                onChange={(e) => handleStatusChange(e.target.value)}
                disabled={updateOrderStatus.isPending}
                className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
              >
                {statuses.map((status) => (
                  <option key={status} value={status}>
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </option>
                ))}
              </select>
            </div>
            <div className="mt-4 text-xs text-neutral-500">
              Last updated: {formatDate(order.updated_at || order.created_at)}
            </div>
          </div>

          {/* Customer Info */}
          <div className="bg-white rounded-lg border border-neutral-200 p-6">
            <div className="flex items-center space-x-2 mb-4">
              <User className="h-5 w-5 text-neutral-400" />
              <h3 className="text-lg font-medium text-neutral-900">Customer</h3>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-neutral-900">{order.customer_email}</p>
              <Link
                to={`/customers?search=${encodeURIComponent(order.customer_email)}`}
                className="text-sm text-black hover:text-neutral-700 underline"
              >
                View customer profile
              </Link>
            </div>
          </div>

          {/* Payment Info */}
          <div className="bg-white rounded-lg border border-neutral-200 p-6">
            <div className="flex items-center space-x-2 mb-4">
              <CreditCard className="h-5 w-5 text-neutral-400" />
              <h3 className="text-lg font-medium text-neutral-900">Payment</h3>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-neutral-500">Subtotal:</span>
                <span className="text-sm text-neutral-900">
                  {formatCurrency(order.total_amount)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-neutral-500">Currency:</span>
                <span className="text-sm text-neutral-900">
                  {order.currency?.toUpperCase() || 'USD'}
                </span>
              </div>
              {order.stripe_payment_intent_id && (
                <div className="pt-2 border-t border-neutral-200">
                  <p className="text-xs text-neutral-500">
                    Stripe Payment ID: {order.stripe_payment_intent_id}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Order Timeline */}
          <div className="bg-white rounded-lg border border-neutral-200 p-6">
            <div className="flex items-center space-x-2 mb-4">
              <Calendar className="h-5 w-5 text-neutral-400" />
              <h3 className="text-lg font-medium text-neutral-900">Timeline</h3>
            </div>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0 w-2 h-2 bg-green-400 rounded-full"></div>
                <div>
                  <p className="text-sm font-medium text-neutral-900">Order Placed</p>
                  <p className="text-xs text-neutral-500">{formatDate(order.created_at)}</p>
                </div>
              </div>
              {order.updated_at && order.updated_at !== order.created_at && (
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0 w-2 h-2 bg-blue-400 rounded-full"></div>
                  <div>
                    <p className="text-sm font-medium text-neutral-900">Status Updated</p>
                    <p className="text-xs text-neutral-500">{formatDate(order.updated_at)}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}