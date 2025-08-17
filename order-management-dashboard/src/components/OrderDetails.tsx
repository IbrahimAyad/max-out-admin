import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { LoadingSpinner } from './LoadingSpinner'
import type { Order, OrderItem } from '../types/order'
import { formatDate, formatCurrency, getStatusColor, getPriorityColor, getStatusLabel, getPriorityLabel } from '../utils/formatting'
import toast from 'react-hot-toast'

interface OrderDetailsProps {
  order: Order
  onBack: () => void
  onStatusUpdate: (orderId: string, newStatus: string) => void
}

export function OrderDetails({ order, onBack, onStatusUpdate }: OrderDetailsProps) {
  const [orderItems, setOrderItems] = useState<OrderItem[]>([])
  const [loading, setLoading] = useState(true)
  const [updatingStatus, setUpdatingStatus] = useState(false)
  const [notes, setNotes] = useState(order.processing_notes || '')
  const [savingNotes, setSavingNotes] = useState(false)

  // Fetch order items
  useEffect(() => {
    const fetchOrderItems = async () => {
      try {
        const { data, error } = await supabase
          .from('order_items')
          .select('*')
          .eq('order_id', order.id)
          .order('created_at', { ascending: true })
        
        if (error) {
          console.error('Error fetching order items:', error)
          toast.error('Failed to fetch order items')
          return
        }
        
        setOrderItems(data || [])
      } catch (error) {
        console.error('Error:', error)
        toast.error('An error occurred while fetching order items')
      } finally {
        setLoading(false)
      }
    }

    fetchOrderItems()
  }, [order.id])

  // Handle status update
  const handleStatusUpdate = async (newStatus: string) => {
    setUpdatingStatus(true)
    try {
      await onStatusUpdate(order.id, newStatus)
    } finally {
      setUpdatingStatus(false)
    }
  }

  // Save processing notes
  const saveNotes = async () => {
    setSavingNotes(true)
    try {
      const { error } = await supabase
        .from('orders')
        .update({ 
          processing_notes: notes,
          updated_at: new Date().toISOString()
        })
        .eq('id', order.id)
      
      if (error) {
        console.error('Error saving notes:', error)
        toast.error('Failed to save notes')
        return
      }
      
      toast.success('Notes saved successfully')
    } catch (error) {
      console.error('Error:', error)
      toast.error('An error occurred while saving notes')
    } finally {
      setSavingNotes(false)
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={onBack}
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Orders
        </button>
        
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Order {order.order_number}
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Created {formatDate(order.created_at)}
            </p>
          </div>
          
          <div className="mt-4 lg:mt-0 flex items-center gap-4">
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.order_status)}`}>
              {getStatusLabel(order.order_status)}
            </span>
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getPriorityColor(order.order_priority)}`}>
              {getPriorityLabel(order.order_priority)}
            </span>
            {order.is_rush_order && (
              <span className="text-red-500 text-sm">
                🔥 Rush Order
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Order Items and Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Items */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Items</h2>
            {loading ? (
              <div className="flex justify-center py-8">
                <LoadingSpinner />
              </div>
            ) : orderItems.length > 0 ? (
              <div className="space-y-4">
                {orderItems.map((item) => (
                  <div key={item.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="text-sm font-medium text-gray-900">
                          {item.product_name}
                        </h3>
                        {item.product_sku && (
                          <p className="text-xs text-gray-500 mt-1">SKU: {item.product_sku}</p>
                        )}
                        {item.product_description && (
                          <p className="text-sm text-gray-600 mt-1">{item.product_description}</p>
                        )}
                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                          {item.size && <span>Size: {item.size}</span>}
                          {item.color && <span>Color: {item.color}</span>}
                          {item.material && <span>Material: {item.material}</span>}
                        </div>
                        {item.is_bundle_item && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 mt-2">
                            Bundle Item
                          </span>
                        )}
                      </div>
                      <div className="ml-4 text-right">
                        <p className="text-sm font-medium text-gray-900">
                          {formatCurrency(item.total_price, order.currency)}
                        </p>
                        <p className="text-xs text-gray-500">
                          Qty: {item.quantity} × {formatCurrency(item.unit_price, order.currency)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No items found for this order.</p>
            )}
          </div>

          {/* Special Instructions */}
          {order.special_instructions && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Special Instructions</h2>
              <p className="text-gray-700 whitespace-pre-wrap">{order.special_instructions}</p>
            </div>
          )}

          {/* Processing Notes */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Processing Notes</h2>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Add processing notes..."
            />
            <button
              onClick={saveNotes}
              disabled={savingNotes}
              className="mt-3 inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {savingNotes ? (
                <LoadingSpinner className="w-4 h-4 mr-2" />
              ) : null}
              Save Notes
            </button>
          </div>
        </div>

        {/* Right Column - Order Summary and Actions */}
        <div className="space-y-6">
          {/* Status Management */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Status Management</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Order Status
                </label>
                <select
                  value={order.order_status}
                  onChange={(e) => handleStatusUpdate(e.target.value)}
                  disabled={updatingStatus}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                >
                  <option value="pending_payment">Pending Payment</option>
                  <option value="payment_confirmed">Payment Confirmed</option>
                  <option value="processing">Processing</option>
                  <option value="in_production">In Production</option>
                  <option value="quality_check">Quality Check</option>
                  <option value="packaging">Packaging</option>
                  <option value="shipped">Shipped</option>
                  <option value="out_for_delivery">Out for Delivery</option>
                  <option value="delivered">Delivered</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="refunded">Refunded</option>
                  <option value="on_hold">On Hold</option>
                  <option value="exception">Exception</option>
                </select>
              </div>
            </div>
          </div>

          {/* Customer Information */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Customer Information</h2>
            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium text-gray-700">Name</p>
                <p className="text-sm text-gray-900">{order.customer_name}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">Email</p>
                <p className="text-sm text-gray-900">{order.customer_email}</p>
              </div>
              {order.customer_phone && (
                <div>
                  <p className="text-sm font-medium text-gray-700">Phone</p>
                  <p className="text-sm text-gray-900">{order.customer_phone}</p>
                </div>
              )}
            </div>
          </div>

          {/* Shipping Information */}
          {(order.shipping_address_line1 || order.tracking_number) && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Shipping Information</h2>
              <div className="space-y-3">
                {order.shipping_address_line1 && (
                  <div>
                    <p className="text-sm font-medium text-gray-700">Shipping Address</p>
                    <div className="text-sm text-gray-900">
                      <p>{order.shipping_address_line1}</p>
                      {order.shipping_address_line2 && <p>{order.shipping_address_line2}</p>}
                      <p>
                        {order.shipping_city}, {order.shipping_state} {order.shipping_postal_code}
                      </p>
                      {order.shipping_country && <p>{order.shipping_country}</p>}
                    </div>
                  </div>
                )}
                {order.tracking_number && (
                  <div>
                    <p className="text-sm font-medium text-gray-700">Tracking Number</p>
                    <p className="text-sm text-gray-900">{order.tracking_number}</p>
                    {order.shipping_carrier && (
                      <p className="text-xs text-gray-500">via {order.shipping_carrier}</p>
                    )}
                  </div>
                )}
                {order.estimated_delivery_date && (
                  <div>
                    <p className="text-sm font-medium text-gray-700">Estimated Delivery</p>
                    <p className="text-sm text-gray-900">{formatDate(order.estimated_delivery_date)}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Order Summary */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal</span>
                <span className="text-gray-900">{formatCurrency(order.subtotal_amount, order.currency)}</span>
              </div>
              {order.tax_amount && order.tax_amount > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Tax</span>
                  <span className="text-gray-900">{formatCurrency(order.tax_amount, order.currency)}</span>
                </div>
              )}
              {order.shipping_amount && order.shipping_amount > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Shipping</span>
                  <span className="text-gray-900">{formatCurrency(order.shipping_amount, order.currency)}</span>
                </div>
              )}
              {order.discount_amount && order.discount_amount > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Discount</span>
                  <span className="text-red-600">-{formatCurrency(order.discount_amount, order.currency)}</span>
                </div>
              )}
              <div className="border-t border-gray-200 pt-2 mt-2">
                <div className="flex justify-between">
                  <span className="font-medium text-gray-900">Total</span>
                  <span className="font-medium text-gray-900">{formatCurrency(order.total_amount, order.currency)}</span>
                </div>
              </div>
            </div>
            
            {order.payment_method && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="text-sm text-gray-600">Payment Method: {order.payment_method}</p>
                {order.payment_status && (
                  <p className="text-sm text-gray-600">Payment Status: {order.payment_status}</p>
                )}
                {order.stripe_payment_intent_id && (
                  <p className="text-xs text-gray-500 mt-1">
                    Stripe ID: {order.stripe_payment_intent_id}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}