import React, { useState } from 'react';
import { useOrders } from '../hooks/useOrders';
import { Order, OrderStatus } from '../config/orders';
import { OrderQueue } from '../components/orders/OrderQueue';
import { ProcessingDashboard } from '../components/orders/ProcessingDashboard';
import { ExceptionManagement } from '../components/orders/ExceptionManagement';
import { OrderDetailsView } from '../components/orders/OrderDetailsView';
import { PerformanceAnalytics } from '../components/orders/PerformanceAnalytics';
import { CommunicationLogComponent } from '../components/orders/CommunicationLog';
import { RefreshCw, AlertTriangle } from 'lucide-react';

type DashboardTab = 'queue' | 'processing' | 'exceptions' | 'analytics' | 'communications';

export default function OrderManagementDashboard() {
  const {
    orders,
    exceptions,
    communications,
    analytics,
    loading,
    error,
    refreshOrders,
    updateOrderStatus,
    createException,
    resolveException,
    addCommunication,
    updatePriority,
    getOrderById,
    getOrdersByStatus,
    getHighPriorityOrders
  } = useOrders();

  const [activeTab, setActiveTab] = useState<DashboardTab>('queue');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshOrders();
    setRefreshing(false);
  };

  const handleOrderSelect = (order: Order) => {
    setSelectedOrder(order);
  };

  const handleCloseOrderDetails = () => {
    setSelectedOrder(null);
  };

  // Calculate dashboard stats
  const pendingOrders = getOrdersByStatus(OrderStatus.PENDING);
  const processingOrders = getOrdersByStatus(OrderStatus.PROCESSING);
  const highPriorityOrders = getHighPriorityOrders();
  const openExceptions = exceptions.filter(e => e.status === 'open' || e.status === 'in_progress');

  const tabs = [
    {
      id: 'queue' as DashboardTab,
      name: 'Order Queue',
      count: pendingOrders.length,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      id: 'processing' as DashboardTab,
      name: 'Processing',
      count: processingOrders.length,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      id: 'exceptions' as DashboardTab,
      name: 'Exceptions',
      count: openExceptions.length,
      color: 'text-red-600',
      bgColor: 'bg-red-50'
    },
    {
      id: 'analytics' as DashboardTab,
      name: 'Analytics',
      count: null,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      id: 'communications' as DashboardTab,
      name: 'Communications',
      count: communications.length,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50'
    }
  ];

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
                  <div className="text-2xl font-bold text-red-600">{openExceptions.length}</div>
                  <div className="ml-2 text-sm text-red-600">Exceptions</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-3 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                  activeTab === tab.id
                    ? `border-blue-500 ${tab.color}`
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <span>{tab.name}</span>
                  {tab.count !== null && (
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      activeTab === tab.id ? tab.bgColor : 'bg-gray-100 text-gray-600'
                    }`}>
                      {tab.count}
                    </span>
                  )}
                </div>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'queue' && (
          <OrderQueue
            orders={orders}
            onOrderSelect={handleOrderSelect}
            onStatusUpdate={updateOrderStatus}
            onPriorityUpdate={updatePriority}
          />
        )}
        
        {activeTab === 'processing' && (
          <ProcessingDashboard
            orders={orders}
            analytics={analytics}
            onOrderSelect={handleOrderSelect}
          />
        )}
        
        {activeTab === 'exceptions' && (
          <ExceptionManagement
            exceptions={exceptions}
            onResolveException={resolveException}
            onCreateException={createException}
          />
        )}
        
        {activeTab === 'analytics' && (
          <PerformanceAnalytics
            orders={orders}
            analytics={analytics}
          />
        )}
        
        {activeTab === 'communications' && (
          <CommunicationLogComponent
            communications={communications}
            onAddCommunication={addCommunication}
          />
        )}
      </div>

      {/* Order Details Modal */}
      {selectedOrder && (
        <OrderDetailsView
          order={selectedOrder}
          orderItems={selectedOrder.order_items || []}
          communications={communications.filter(c => c.order_id === selectedOrder.id)}
          onClose={handleCloseOrderDetails}
          onStatusUpdate={updateOrderStatus}
          onAddCommunication={addCommunication}
        />
      )}
    </div>
  );
}