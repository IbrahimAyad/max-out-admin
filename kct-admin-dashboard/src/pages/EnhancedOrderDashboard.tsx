import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Order, OrderStatus, OrderPriority, ProductSource } from '../config/orders';
import { CoreProductsIntegration } from '../components/analytics/CoreProductsIntegration';
import { AdvancedOrderQueue } from '../components/orders/AdvancedOrderQueue';
import { OrderDetailsView } from '../components/orders/OrderDetailsView';
import { 
  TrendingUp, Package, Users, DollarSign, Clock, AlertTriangle, 
  Crown, Star, RefreshCw, BarChart3, Settings, Bell
} from 'lucide-react';

interface DashboardStats {
  totalOrders: number;
  pendingOrders: number;
  processingOrders: number;
  completedOrders: number;
  totalRevenue: number;
  coreProductsRevenue: number;
  catalogProductsRevenue: number;
  rushOrders: number;
  groupOrders: number;
  exceptions: number;
  avgProcessingTime: number;
  customerSatisfaction: number;
}

export default function EnhancedOrderDashboard() {
  const [activeView, setActiveView] = useState<'overview' | 'queue' | 'analytics' | 'core-products'>('overview');
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchDashboardData();
    
    // Set up real-time subscriptions
    const ordersSubscription = supabase
      .channel('orders_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'orders' },
        () => {
          fetchDashboardData();
        }
      )
      .subscribe();

    return () => {
      ordersSubscription.unsubscribe();
    };
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch orders with items
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (*)
        `)
        .order('created_at', { ascending: false })
        .limit(500);

      if (ordersError) throw ordersError;

      const ordersArray = ordersData || [];
      setOrders(ordersArray);

      // Calculate statistics
      const calculatedStats = calculateStats(ordersArray);
      setStats(calculatedStats);

    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (ordersArray: Order[]): DashboardStats => {
    const totalOrders = ordersArray.length;
    const pendingOrders = ordersArray.filter(o => o.order_status === OrderStatus.PENDING_PAYMENT).length;
    const processingOrders = ordersArray.filter(o => 
      [OrderStatus.PROCESSING, OrderStatus.IN_PRODUCTION, OrderStatus.QUALITY_CHECK].includes(o.order_status)
    ).length;
    const completedOrders = ordersArray.filter(o => 
      [OrderStatus.COMPLETED, OrderStatus.DELIVERED].includes(o.order_status)
    ).length;
    
    const totalRevenue = ordersArray.reduce((sum, order) => sum + order.total_amount, 0);
    
    const coreProductsOrders = ordersArray.filter(order => 
      order.order_items?.some(item => item.product_source === ProductSource.CORE_STRIPE)
    );
    const catalogProductsOrders = ordersArray.filter(order => 
      order.order_items?.some(item => item.product_source === ProductSource.CATALOG_SUPABASE)
    );
    
    const coreProductsRevenue = coreProductsOrders.reduce((sum, order) => sum + order.total_amount, 0);
    const catalogProductsRevenue = catalogProductsOrders.reduce((sum, order) => sum + order.total_amount, 0);
    
    const rushOrders = ordersArray.filter(o => o.is_rush_order).length;
    const groupOrders = ordersArray.filter(o => o.is_group_order).length;
    
    // Mock data for some stats that would come from other tables
    const exceptions = Math.floor(totalOrders * 0.05); // 5% exception rate
    const avgProcessingTime = 48; // hours
    const customerSatisfaction = 4.6; // out of 5
    
    return {
      totalOrders,
      pendingOrders,
      processingOrders,
      completedOrders,
      totalRevenue,
      coreProductsRevenue,
      catalogProductsRevenue,
      rushOrders,
      groupOrders,
      exceptions,
      avgProcessingTime,
      customerSatisfaction
    };
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchDashboardData();
    setRefreshing(false);
  };

  const handleOrderSelect = (order: Order) => {
    setSelectedOrder(order);
  };

  const handleCloseOrderDetails = () => {
    setSelectedOrder(null);
  };

  const handleStatusUpdate = async (orderId: string, status: OrderStatus) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ order_status: status, updated_at: new Date().toISOString() })
        .eq('id', orderId);

      if (error) throw error;
      
      // Refresh data
      await fetchDashboardData();
    } catch (error) {
      console.error('Error updating order status:', error);
    }
  };

  const handlePriorityUpdate = async (orderId: string, priority: OrderPriority) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ order_priority: priority, updated_at: new Date().toISOString() })
        .eq('id', orderId);

      if (error) throw error;
      
      // Refresh data
      await fetchDashboardData();
    } catch (error) {
      console.error('Error updating order priority:', error);
    }
  };

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

  const views = [
    { id: 'overview', name: 'Overview', icon: BarChart3 },
    { id: 'queue', name: 'Order Queue', icon: Package, count: orders.filter(o => [OrderStatus.PENDING_PAYMENT, OrderStatus.PAYMENT_CONFIRMED].includes(o.order_status)).length },
    { id: 'core-products', name: 'Core Products', icon: Crown },
    { id: 'analytics', name: 'Analytics', icon: TrendingUp }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Order Processing Workflow</h1>
                <p className="mt-1 text-lg text-gray-600">
                  Intelligent management of Core Products (Stripe) + Catalog Products (Supabase)
                </p>
              </div>
              
              <div className="flex items-center space-x-4">
                {/* Key Metrics */}
                {stats && (
                  <>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-blue-600">{stats.totalOrders}</div>
                      <div className="text-sm text-gray-600">Total Orders</div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-green-600">${(stats.totalRevenue / 1000).toFixed(1)}K</div>
                      <div className="text-sm text-gray-600">Total Revenue</div>
                    </div>
                  </>
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
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {views.map((view) => {
              const Icon = view.icon;
              return (
                <button
                  key={view.id}
                  onClick={() => setActiveView(view.id as any)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                    activeView === view.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <Icon className="h-4 w-4" />
                    <span>{view.name}</span>
                    {view.count !== undefined && (
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        activeView === view.id ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {view.count}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeView === 'overview' && stats && (
          <div className="space-y-6">
            {/* Key Performance Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Package className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Processing Orders</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.processingOrders}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {((stats.processingOrders / stats.totalOrders) * 100).toFixed(1)}% of total
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <DollarSign className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Core Products Revenue</p>
                    <p className="text-2xl font-bold text-gray-900">${(stats.coreProductsRevenue / 1000).toFixed(1)}K</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {((stats.coreProductsRevenue / stats.totalRevenue) * 100).toFixed(1)}% of total
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <Clock className="h-6 w-6 text-red-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Rush Orders</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.rushOrders}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Avg {stats.avgProcessingTime}h processing
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Users className="h-6 w-6 text-purple-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Group Orders</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.groupOrders}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Wedding parties & events
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Dual Architecture Overview */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg shadow-lg p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold mb-2">Core Products (Stripe)</h3>
                    <p className="text-blue-100 mb-4">Premium formal wear with 70% revenue weight</p>
                    <div className="space-y-2">
                      <div className="text-3xl font-bold">${(stats.coreProductsRevenue / 1000).toFixed(1)}K</div>
                      <div className="text-sm text-blue-100">Revenue from suits, tuxedos, and formal wear</div>
                    </div>
                  </div>
                  <Crown className="h-16 w-16 text-blue-200" />
                </div>
              </div>

              <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg shadow-lg p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold mb-2">Catalog Products (Supabase)</h3>
                    <p className="text-green-100 mb-4">Diverse inventory with 30% revenue weight</p>
                    <div className="space-y-2">
                      <div className="text-3xl font-bold">${(stats.catalogProductsRevenue / 1000).toFixed(1)}K</div>
                      <div className="text-sm text-green-100">Revenue from casual wear and accessories</div>
                    </div>
                  </div>
                  <Package className="h-16 w-16 text-green-200" />
                </div>
              </div>
            </div>

            {/* Performance Indicators */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">System Performance</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">{stats.customerSatisfaction}</div>
                  <div className="text-sm text-gray-600 mt-1">Customer Satisfaction (5.0 scale)</div>
                  <div className="flex justify-center mt-2">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className={`h-4 w-4 ${
                        i < Math.floor(stats.customerSatisfaction) ? 'text-yellow-400 fill-current' : 'text-gray-300'
                      }`} />
                    ))}
                  </div>
                </div>
                
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">{stats.avgProcessingTime}h</div>
                  <div className="text-sm text-gray-600 mt-1">Average Processing Time</div>
                  <div className="text-xs text-green-600 mt-1">15% faster than industry avg</div>
                </div>
                
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-600">{stats.exceptions}</div>
                  <div className="text-sm text-gray-600 mt-1">Open Exceptions</div>
                  <div className="text-xs text-red-600 mt-1">5% exception rate</div>
                </div>
              </div>
            </div>

            {/* Recent Orders Preview */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">Recent Orders</h3>
                  <button
                    onClick={() => setActiveView('queue')}
                    className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                  >
                    View all orders →
                  </button>
                </div>
              </div>
              <div className="p-6">
                <div className="space-y-3">
                  {orders.slice(0, 5).map((order) => (
                    <div key={order.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                      <div className="flex items-center space-x-3">
                        <button
                          onClick={() => handleOrderSelect(order)}
                          className="font-medium text-blue-600 hover:text-blue-800"
                        >
                          {order.order_number}
                        </button>
                        <span className="text-sm text-gray-600">{order.customer_name}</span>
                      </div>
                      
                      <div className="flex items-center space-x-4">
                        <span className="text-sm font-medium text-gray-900">
                          ${order.total_amount.toFixed(2)}
                        </span>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          order.order_status === OrderStatus.COMPLETED ? 'bg-green-100 text-green-800' :
                          order.order_status === OrderStatus.PROCESSING ? 'bg-blue-100 text-blue-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {order.order_status.replace('_', ' ').toUpperCase()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeView === 'queue' && (
          <AdvancedOrderQueue
            orders={orders}
            onOrderSelect={handleOrderSelect}
            onStatusUpdate={handleStatusUpdate}
            onPriorityUpdate={handlePriorityUpdate}
          />
        )}

        {activeView === 'core-products' && (
          <CoreProductsIntegration orders={orders} />
        )}

        {activeView === 'analytics' && (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Advanced Analytics</h3>
            <p className="text-gray-600">Advanced analytics features coming soon...</p>
          </div>
        )}
      </div>

      {/* Order Details Modal */}
      {selectedOrder && (
        <OrderDetailsView
          order={selectedOrder}
          orderItems={selectedOrder.order_items || []}
          communications={[]} // This would be fetched from the communications table
          onClose={handleCloseOrderDetails}
          onStatusUpdate={handleStatusUpdate}
          onAddCommunication={() => {}} // This would add a communication log
        />
      )}
    </div>
  );
}