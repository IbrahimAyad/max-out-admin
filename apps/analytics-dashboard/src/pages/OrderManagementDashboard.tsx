import React, { useState } from 'react';
import { useOrders } from '../hooks/useOrders';
import { Order, OrderStatus } from '../config/orders';
import { RefreshCw, AlertTriangle, Package } from 'lucide-react';

export default function OrderManagementDashboard() {
  const {
    orders,
    loading,
    error,
    refreshOrders,
    updateOrderStatus,
    updatePriority,
    getOrdersByStatus,
    getHighPriorityOrders
  } = useOrders();

  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshOrders();
    setRefreshing(false);
  };

  // Calculate dashboard stats
  const pendingOrders = getOrdersByStatus(OrderStatus.PENDING_PAYMENT);
  const processingOrders = getOrdersByStatus(OrderStatus.PROCESSING);
  const highPriorityOrders = getHighPriorityOrders();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-500" />
          <p className="text-gray-600">Loading order management dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="h-8 w-8 mx-auto mb-4 text-red-500" />
          <p className="text-red-600 mb-4">Error loading dashboard: {error}</p>
          <button
            onClick={handleRefresh}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Dashboard Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Order Management Dashboard</h1>
                <p className="mt-1 text-sm text-gray-600">
                  Intelligent order processing and workflow management
                </p>
              </div>
              
              <div className="flex items-center space-x-4">
                {/* High Priority Alert */}
                {highPriorityOrders.length > 0 && (
                  <div className="flex items-center space-x-2 bg-red-50 px-3 py-2 rounded-lg">
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                    <span className="text-sm font-medium text-red-700">
                      {highPriorityOrders.length} high priority orders
                    </span>
                  </div>
                )}
                
                {/* Refresh Button */}
                <button
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:bg-blue-400 transition-colors"
                >
                  <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                  <span>Refresh</span>
                </button>
              </div>
            </div>
            
            {/* Quick Stats */}
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="flex items-center">
                  <div className="text-2xl font-bold text-blue-600">{orders.length}</div>
                  <div className="ml-2 text-sm text-blue-600">Total Orders</div>
                </div>
              </div>
              <div className="bg-yellow-50 rounded-lg p-4">
                <div className="flex items-center">
                  <div className="text-2xl font-bold text-yellow-600">{pendingOrders.length}</div>
                  <div className="ml-2 text-sm text-yellow-600">Pending</div>
                </div>
              </div>
              <div className="bg-green-50 rounded-lg p-4">
                <div className="flex items-center">
                  <div className="text-2xl font-bold text-green-600">{processingOrders.length}</div>
                  <div className="ml-2 text-sm text-green-600">Processing</div>
                </div>
              </div>
              <div className="bg-red-50 rounded-lg p-4">
                <div className="flex items-center">
                  <div className="text-2xl font-bold text-red-600">{highPriorityOrders.length}</div>
                  <div className="ml-2 text-sm text-red-600">High Priority</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Recent Orders</h3>
          </div>
          <div className="p-6">
            {orders.length === 0 ? (
              <div className="text-center py-8">
                <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Orders Found</h3>
                <p className="text-gray-600">Orders will appear here once customers start placing them.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {orders.slice(0, 10).map((order) => (
                  <div key={order.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold text-gray-900">{order.order_number}</h4>
                        <p className="text-sm text-gray-600">
                          {order.customer_name} • {order.customer_email}
                        </p>
                        <p className="text-sm text-gray-500">
                          Created: {new Date(order.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-semibold text-gray-900">
                          ${order.total_amount?.toFixed(2) || '0.00'}
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-gray-600">
                            Status: {order.status?.replace('_', ' ').toUpperCase()}
                          </span>
                          {order.is_rush_order && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              RUSH
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}