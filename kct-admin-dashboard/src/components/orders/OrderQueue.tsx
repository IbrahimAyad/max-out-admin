import React from 'react';
import { Clock, AlertTriangle, Calendar, User } from 'lucide-react';
import { Order, PriorityLevel, OrderStatus, DASHBOARD_CONFIG } from '../../config/orders';

interface OrderQueueProps {
  orders: Order[];
  onOrderSelect: (order: Order) => void;
  onStatusUpdate: (orderId: string, status: any) => void;
  onPriorityUpdate: (orderId: string, priority: PriorityLevel) => void;
}

export function OrderQueue({ orders, onOrderSelect, onStatusUpdate, onPriorityUpdate }: OrderQueueProps) {
  const queuedOrders = orders.filter(order => 
    [OrderStatus.PENDING, OrderStatus.PROCESSING].includes(order.status)
  ).sort((a, b) => {
    // Sort by priority first, then by creation date
    const priorityOrder = {
      'urgent': 1, 'wedding': 2, 'rush': 3, 'high': 4, 'medium': 5, 'low': 6
    };
    const aPriority = priorityOrder[a.priority_level as keyof typeof priorityOrder] || 5;
    const bPriority = priorityOrder[b.priority_level as keyof typeof priorityOrder] || 5;
    
    if (aPriority !== bPriority) {
      return aPriority - bPriority;
    }
    
    return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
  });

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) return `${diffDays}d ago`;
    if (diffHours > 0) return `${diffHours}h ago`;
    if (diffMins > 0) return `${diffMins}m ago`;
    return 'Just now';
  };

  const getPriorityColor = (priority?: PriorityLevel) => {
    if (!priority) return DASHBOARD_CONFIG.PRIORITY_COLORS[PriorityLevel.MEDIUM];
    return DASHBOARD_CONFIG.PRIORITY_COLORS[priority] || DASHBOARD_CONFIG.PRIORITY_COLORS[PriorityLevel.MEDIUM];
  };

  const getStatusColor = (status: string) => {
    const statusColors: Record<string, string> = {
      'pending': 'bg-yellow-100 text-yellow-800',
      'processing': 'bg-blue-100 text-blue-800',
      'confirmed': 'bg-green-100 text-green-800'
    };
    return statusColors[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center">
            <Clock className="h-5 w-5 mr-2 text-blue-500" />
            Order Queue
          </h2>
          <span className="text-sm text-gray-500">
            {queuedOrders.length} orders pending
          </span>
        </div>
      </div>

      <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
        {queuedOrders.length === 0 ? (
          <div className="px-6 py-8 text-center text-gray-500">
            <Clock className="h-8 w-8 mx-auto mb-2 text-gray-400" />
            <p>No orders in queue</p>
          </div>
        ) : (
          queuedOrders.map((order) => (
            <div 
              key={order.id}
              className="px-6 py-4 hover:bg-gray-50 cursor-pointer transition-colors"
              onClick={() => onOrderSelect(order)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-3 mb-2">
                    <span className="text-sm font-medium text-gray-900">
                      #{order.id.slice(-8)}
                    </span>
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
                  </div>
                  
                  <div className="flex items-center text-sm text-gray-600 mb-1">
                    <User className="h-4 w-4 mr-1" />
                    {order.customer?.first_name} {order.customer?.last_name}
                  </div>
                  
                  <div className="flex items-center text-sm text-gray-500">
                    <Calendar className="h-4 w-4 mr-1" />
                    {formatTimeAgo(order.created_at)}
                  </div>
                </div>
                
                <div className="flex flex-col items-end">
                  <span className="text-lg font-semibold text-gray-900">
                    ${order.total_amount?.toFixed(2) || '0.00'}
                  </span>
                  {order.priority_level && ['urgent', 'wedding', 'rush'].includes(order.priority_level) && (
                    <AlertTriangle className="h-4 w-4 text-red-500 mt-1" />
                  )}
                </div>
              </div>

              {order.special_instructions && (
                <div className="mt-2 text-xs text-gray-600 bg-gray-50 p-2 rounded">
                  {order.special_instructions}
                </div>
              )}

              <div className="mt-3 flex items-center space-x-2">
                <select 
                  className="text-xs border border-gray-300 rounded px-2 py-1"
                  value={order.status}
                  onChange={(e) => {
                    e.stopPropagation();
                    onStatusUpdate(order.id, e.target.value);
                  }}
                >
                  <option value="pending">Pending</option>
                  <option value="processing">Processing</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="shipped">Shipped</option>
                </select>
                
                <select 
                  className="text-xs border border-gray-300 rounded px-2 py-1"
                  value={order.priority_level || 'medium'}
                  onChange={(e) => {
                    e.stopPropagation();
                    onPriorityUpdate(order.id, e.target.value as PriorityLevel);
                  }}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                  <option value="wedding">Wedding</option>
                  <option value="rush">Rush</option>
                </select>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}