import React from 'react'
import type { Order } from '../types/order'
import { formatDate, formatCurrency, getStatusColor, getPriorityColor, getStatusLabel, getPriorityLabel } from '../utils/formatting'

interface OrdersTableProps {
  orders: Order[]
  onOrderSelect: (order: Order) => void
  onStatusUpdate: (orderId: string, newStatus: string) => void
}

export function OrdersTable({ orders, onOrderSelect, onStatusUpdate }: OrdersTableProps) {
  if (orders.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-12 text-center">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No orders found</h3>
          <p className="mt-1 text-sm text-gray-500">
            No orders match your current filters.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Order
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Customer
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Priority
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Total
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {orders.map((order) => (
              <tr key={order.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {order.order_number}
                    </div>
                    {order.stripe_payment_intent_id && (
                      <div className="text-xs text-gray-500">
                        {order.stripe_payment_intent_id.substring(0, 20)}...
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {order.customer_name}
                    </div>
                    <div className="text-sm text-gray-500">
                      {order.customer_email}
                    </div>
                    {order.customer_phone && (
                      <div className="text-xs text-gray-400">
                        {order.customer_phone}
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.order_status)}`}>
                    {getStatusLabel(order.order_status)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(order.order_priority)}`}>
                      {getPriorityLabel(order.order_priority)}
                    </span>
                    {order.is_rush_order && (
                      <span className="ml-2 text-red-500 text-xs" title="Rush Order">
                        🔥
                      </span>
                    )}
                    {order.is_group_order && (
                      <span className="ml-1 text-purple-500 text-xs" title="Group Order">
                        👥
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {formatCurrency(order.total_amount, order.currency)}
                  </div>
                  {order.payment_status && (
                    <div className="text-xs text-gray-500">
                      {order.payment_status}
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {formatDate(order.created_at)}
                  </div>
                  {order.estimated_delivery_date && (
                    <div className="text-xs text-gray-500">
                      Est: {formatDate(order.estimated_delivery_date)}
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onOrderSelect(order)}
                      className="text-indigo-600 hover:text-indigo-900"
                    >
                      View
                    </button>
                    <select
                      value={order.order_status}
                      onChange={(e) => onStatusUpdate(order.id, e.target.value)}
                      className="text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
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
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}