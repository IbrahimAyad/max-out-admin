import React from 'react';
import { Package, User, MapPin, Calendar, DollarSign, Truck, MessageSquare, AlertCircle, Clock } from 'lucide-react';
import { Order, OrderItem, CommunicationLog, CommunicationType, DASHBOARD_CONFIG } from '../../config/orders';

interface OrderDetailsViewProps {
  order: Order | null;
  orderItems: OrderItem[];
  communications: CommunicationLog[];
  onClose: () => void;
  onStatusUpdate: (orderId: string, status: any) => void;
  onAddCommunication: (log: Omit<CommunicationLog, 'id'>) => void;
}

export function OrderDetailsView({ 
  order, 
  orderItems, 
  communications, 
  onClose, 
  onStatusUpdate,
  onAddCommunication 
}: OrderDetailsViewProps) {
  if (!order) return null;

  const orderCommunications = communications.filter(c => c.order_id === order.id);
  const totalItems = orderItems.reduce((sum, item) => sum + item.quantity, 0);
  const itemsSubtotal = orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const getStatusColor = (status: string) => {
    return DASHBOARD_CONFIG.STATUS_COLORS[status as keyof typeof DASHBOARD_CONFIG.STATUS_COLORS] || 'bg-gray-100 text-gray-800';
  };

  const getPriorityColor = (priority?: string) => {
    if (!priority) return 'bg-gray-100 text-gray-800';
    return DASHBOARD_CONFIG.PRIORITY_COLORS[priority as keyof typeof DASHBOARD_CONFIG.PRIORITY_COLORS] || 'bg-gray-100 text-gray-800';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const handleQuickMessage = (type: 'confirmation' | 'shipping' | 'delay') => {
    const messages = {
      confirmation: {
        subject: 'Order Confirmation',
        content: `Thank you for your order #${order.id.slice(-8)}. We have received your order and it is being processed.`
      },
      shipping: {
        subject: 'Shipping Update',
        content: `Your order #${order.id.slice(-8)} has been shipped and is on its way to you.`
      },
      delay: {
        subject: 'Order Delay Notification',
        content: `We apologize for the delay with your order #${order.id.slice(-8)}. We are working to resolve this and will update you soon.`
      }
    };

    const message = messages[type];
    onAddCommunication({
      order_id: order.id,
      customer_id: order.customer_id,
      communication_type: CommunicationType.EMAIL,
      direction: 'outbound',
      subject: message.subject,
      content: message.content,
      sent_at: new Date().toISOString()
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 sticky top-0 bg-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Order #{order.id.slice(-8)}
              </h2>
              <div className="flex items-center space-x-3 mt-1">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  getStatusColor(order.status)
                }`}>
                  {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                </span>
                {order.priority_level && (
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    getPriorityColor(order.priority_level)
                  }`}>
                    {order.priority_level.toUpperCase()}
                  </span>
                )}
                <span className="text-sm text-gray-500">
                  Created {formatDate(order.created_at)}
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-xl font-bold"
            >
              ×
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Customer Information */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-medium text-gray-900 mb-3 flex items-center">
                <User className="h-5 w-5 mr-2 text-blue-500" />
                Customer Information
              </h3>
              {order.customer && (
                <div className="space-y-2">
                  <p><span className="font-medium">Name:</span> {order.customer.first_name} {order.customer.last_name}</p>
                  <p><span className="font-medium">Email:</span> {order.customer.email}</p>
                  {order.customer.phone && (
                    <p><span className="font-medium">Phone:</span> {order.customer.phone}</p>
                  )}
                </div>
              )}
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-medium text-gray-900 mb-3 flex items-center">
                <DollarSign className="h-5 w-5 mr-2 text-green-500" />
                Order Summary
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Items ({totalItems}):</span>
                  <span>${itemsSubtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-semibold border-t pt-2">
                  <span>Total:</span>
                  <span>${order.total_amount?.toFixed(2) || '0.00'}</span>
                </div>
                <div className="text-sm text-gray-600">
                  <span className="font-medium">Source:</span> {order.source.toUpperCase()}
                </div>
              </div>
            </div>
          </div>

          {/* Addresses */}
          {(order.shipping_address || order.billing_address) && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {order.shipping_address && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-medium text-gray-900 mb-3 flex items-center">
                    <Truck className="h-5 w-5 mr-2 text-purple-500" />
                    Shipping Address
                  </h3>
                  <div className="text-sm text-gray-700">
                    {typeof order.shipping_address === 'string' 
                      ? order.shipping_address 
                      : JSON.stringify(order.shipping_address, null, 2)}
                  </div>
                </div>
              )}

              {order.billing_address && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-medium text-gray-900 mb-3 flex items-center">
                    <MapPin className="h-5 w-5 mr-2 text-orange-500" />
                    Billing Address
                  </h3>
                  <div className="text-sm text-gray-700">
                    {typeof order.billing_address === 'string' 
                      ? order.billing_address 
                      : JSON.stringify(order.billing_address, null, 2)}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Order Items */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-medium text-gray-900 mb-3 flex items-center">
              <Package className="h-5 w-5 mr-2 text-indigo-500" />
              Order Items
            </h3>
            <div className="space-y-3">
              {orderItems.length === 0 ? (
                <p className="text-gray-500">No items found for this order</p>
              ) : (
                orderItems.map((item) => (
                  <div key={item.id} className="flex items-center justify-between py-2 border-b border-gray-200 last:border-b-0">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{item.product_name}</p>
                      <p className="text-sm text-gray-600">Product ID: {item.product_id}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">${item.price.toFixed(2)} × {item.quantity}</p>
                      <p className="text-sm text-gray-600">${(item.price * item.quantity).toFixed(2)}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Special Instructions */}
          {order.special_instructions && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h3 className="text-lg font-medium text-gray-900 mb-2 flex items-center">
                <AlertCircle className="h-5 w-5 mr-2 text-yellow-500" />
                Special Instructions
              </h3>
              <p className="text-gray-700">{order.special_instructions}</p>
            </div>
          )}

          {/* Communication History */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-medium text-gray-900 mb-3 flex items-center">
              <MessageSquare className="h-5 w-5 mr-2 text-blue-500" />
              Communication History
            </h3>
            
            {/* Quick Actions */}
            <div className="mb-4 flex flex-wrap gap-2">
              <button
                onClick={() => handleQuickMessage('confirmation')}
                className="bg-blue-100 text-blue-700 px-3 py-1 rounded text-sm font-medium hover:bg-blue-200 transition-colors"
              >
                Send Confirmation
              </button>
              <button
                onClick={() => handleQuickMessage('shipping')}
                className="bg-green-100 text-green-700 px-3 py-1 rounded text-sm font-medium hover:bg-green-200 transition-colors"
              >
                Shipping Update
              </button>
              <button
                onClick={() => handleQuickMessage('delay')}
                className="bg-orange-100 text-orange-700 px-3 py-1 rounded text-sm font-medium hover:bg-orange-200 transition-colors"
              >
                Delay Notice
              </button>
            </div>

            <div className="space-y-3 max-h-64 overflow-y-auto">
              {orderCommunications.length === 0 ? (
                <p className="text-gray-500">No communications yet</p>
              ) : (
                orderCommunications.map((comm) => (
                  <div key={comm.id} className="bg-white rounded-lg p-3 border border-gray-200">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                          comm.direction === 'outbound' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                        }`}>
                          {comm.direction === 'outbound' ? 'Sent' : 'Received'}
                        </span>
                        <span className="text-xs text-gray-500">{comm.communication_type.toUpperCase()}</span>
                      </div>
                      <span className="text-xs text-gray-500">{formatDate(comm.sent_at)}</span>
                    </div>
                    <p className="font-medium text-sm text-gray-900 mb-1">{comm.subject}</p>
                    <p className="text-sm text-gray-600">{comm.content}</p>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="border-t border-gray-200 pt-4">
            <h3 className="text-lg font-medium text-gray-900 mb-3">Order Actions</h3>
            <div className="flex flex-wrap gap-3">
              <select 
                className="border border-gray-300 rounded-md px-3 py-2 text-sm"
                value={order.status}
                onChange={(e) => onStatusUpdate(order.id, e.target.value)}
              >
                <option value="pending">Pending</option>
                <option value="processing">Processing</option>
                <option value="confirmed">Confirmed</option>
                <option value="shipped">Shipped</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
                <option value="refunded">Refunded</option>
              </select>
              
              <button className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors">
                Print Order
              </button>
              
              <button className="bg-green-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-green-700 transition-colors">
                Export Data
              </button>
              
              <button className="bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-red-700 transition-colors">
                Create Exception
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}