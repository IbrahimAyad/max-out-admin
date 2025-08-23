import React, { useState, useEffect } from 'react';
import { Order, OrderStatus, OrderPriority, ProductSource, STATUS_COLORS, PRIORITY_COLORS } from '../../config/orders';
import { supabase } from '../../lib/supabase';
import { Clock, Crown, Users, Package, AlertTriangle, ArrowRight, Filter, Search, RefreshCw } from 'lucide-react';

interface AdvancedOrderQueueProps {
  orders: Order[];
  onOrderSelect: (order: Order) => void;
  onStatusUpdate: (orderId: string, status: OrderStatus) => void;
  onPriorityUpdate: (orderId: string, priority: OrderPriority) => void;
}

interface QueueFilters {
  status?: OrderStatus;
  priority?: OrderPriority;
  productSource?: ProductSource;
  isRushOrder?: boolean;
  isGroupOrder?: boolean;
  search?: string;
}

interface WorkflowAction {
  action: string;
  orderId: string;
  parameters?: any;
}

export function AdvancedOrderQueue({ orders, onOrderSelect, onStatusUpdate, onPriorityUpdate }: AdvancedOrderQueueProps) {
  const [filters, setFilters] = useState<QueueFilters>({});
  const [filteredOrders, setFilteredOrders] = useState<Order[]>(orders);
  const [processingAction, setProcessingAction] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    filterOrders();
  }, [orders, filters]);

  const filterOrders = () => {
    let filtered = [...orders];

    if (filters.status) {
      filtered = filtered.filter(order => order.order_status === filters.status);
    }

    if (filters.priority) {
      filtered = filtered.filter(order => order.order_priority === filters.priority);
    }

    if (filters.productSource) {
      filtered = filtered.filter(order => 
        order.order_items?.some(item => item.product_source === filters.productSource)
      );
    }

    if (filters.isRushOrder !== undefined) {
      filtered = filtered.filter(order => order.is_rush_order === filters.isRushOrder);
    }

    if (filters.isGroupOrder !== undefined) {
      filtered = filtered.filter(order => order.is_group_order === filters.isGroupOrder);
    }

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(order => 
        order.order_number.toLowerCase().includes(searchLower) ||
        order.customer_name.toLowerCase().includes(searchLower) ||
        order.customer_email.toLowerCase().includes(searchLower)
      );
    }

    // Sort by priority score and creation date
    filtered.sort((a, b) => {
      const priorityWeight = {
        [OrderPriority.RUSH]: 5,
        [OrderPriority.URGENT]: 4,
        [OrderPriority.WEDDING_PARTY]: 4,
        [OrderPriority.VIP_CUSTOMER]: 3,
        [OrderPriority.HIGH]: 2,
        [OrderPriority.NORMAL]: 1,
        [OrderPriority.LOW]: 0
      };
      
      const aPriority = priorityWeight[a.order_priority] || 0;
      const bPriority = priorityWeight[b.order_priority] || 0;
      
      if (aPriority !== bPriority) {
        return bPriority - aPriority;
      }
      
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    });

    setFilteredOrders(filtered);
  };

  const executeWorkflowAction = async (action: WorkflowAction) => {
    try {
      setProcessingAction(action.orderId);
      
      const { data, error } = await supabase.functions.invoke('order-workflow-automation', {
        body: action
      });

      if (error) throw error;
      
      // Refresh orders after action
      // This would typically be handled by the parent component
      console.log('Workflow action completed:', data);
    } catch (error) {
      console.error('Workflow action failed:', error);
    } finally {
      setProcessingAction(null);
    }
  };

  const getBundleInfo = (order: Order) => {
    if (!order.order_items) return null;
    
    const bundleItems = order.order_items.filter(item => item.is_bundle_item);
    if (bundleItems.length === 0) return null;
    
    const bundleTypes = [...new Set(bundleItems.map(item => item.bundle_type).filter(Boolean))];
    return {
      count: bundleItems.length,
      types: bundleTypes
    };
  };

  const getProductSourceInfo = (order: Order) => {
    if (!order.order_items) return { core: 0, catalog: 0 };
    
    const core = order.order_items.filter(item => item.product_source === ProductSource.CORE_STRIPE).length;
    const catalog = order.order_items.filter(item => item.product_source === ProductSource.CATALOG_SUPABASE).length;
    
    return { core, catalog };
  };

  const clearFilters = () => {
    setFilters({});
  };

  return (
    <div className="space-y-6">
      {/* Header with Search and Filters */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Intelligent Order Queue</h3>
            <p className="text-sm text-gray-600">
              {filteredOrders.length} orders • Sorted by priority and timing
            </p>
          </div>
          
          <div className="flex items-center space-x-3">
            {/* Search */}
            <div className="relative">
              <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search orders..."
                value={filters.search || ''}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            {/* Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center space-x-2 px-3 py-2 border rounded-md ${
                showFilters ? 'bg-blue-50 border-blue-300 text-blue-700' : 'border-gray-300 text-gray-700'
              } hover:bg-gray-50 transition-colors`}
            >
              <Filter className="h-4 w-4" />
              <span>Filters</span>
            </button>
            
            {Object.keys(filters).length > 0 && (
              <button
                onClick={clearFilters}
                className="text-sm text-gray-600 hover:text-gray-800 underline"
              >
                Clear filters
              </button>
            )}
          </div>
        </div>
        
        {/* Filter Panel */}
        {showFilters && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg border">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={filters.status || ''}
                  onChange={(e) => setFilters({ ...filters, status: e.target.value as OrderStatus || undefined })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Statuses</option>
                  {Object.values(OrderStatus).map(status => (
                    <option key={status} value={status}>{status.replace('_', ' ').toUpperCase()}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                <select
                  value={filters.priority || ''}
                  onChange={(e) => setFilters({ ...filters, priority: e.target.value as OrderPriority || undefined })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Priorities</option>
                  {Object.values(OrderPriority).map(priority => (
                    <option key={priority} value={priority}>{priority.replace('_', ' ').toUpperCase()}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Product Source</label>
                <select
                  value={filters.productSource || ''}
                  onChange={(e) => setFilters({ ...filters, productSource: e.target.value as ProductSource || undefined })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Sources</option>
                  <option value={ProductSource.CORE_STRIPE}>Core Products</option>
                  <option value={ProductSource.CATALOG_SUPABASE}>Catalog Products</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Rush Orders</label>
                <select
                  value={filters.isRushOrder === undefined ? '' : filters.isRushOrder.toString()}
                  onChange={(e) => setFilters({ 
                    ...filters, 
                    isRushOrder: e.target.value === '' ? undefined : e.target.value === 'true'
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Orders</option>
                  <option value="true">Rush Only</option>
                  <option value="false">Standard Only</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Group Orders</label>
                <select
                  value={filters.isGroupOrder === undefined ? '' : filters.isGroupOrder.toString()}
                  onChange={(e) => setFilters({ 
                    ...filters, 
                    isGroupOrder: e.target.value === '' ? undefined : e.target.value === 'true'
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Orders</option>
                  <option value="true">Group Only</option>
                  <option value="false">Individual Only</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Orders List */}
      <div className="space-y-4">
        {filteredOrders.map((order) => {
          const bundleInfo = getBundleInfo(order);
          const productSourceInfo = getProductSourceInfo(order);
          const isProcessing = processingAction === order.id;
          
          return (
            <div key={order.id} className="bg-white rounded-lg shadow hover:shadow-md transition-shadow">
              <div className="p-6">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  {/* Order Info */}
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <button
                        onClick={() => onOrderSelect(order)}
                        className="text-lg font-semibold text-blue-600 hover:text-blue-800 transition-colors"
                      >
                        {order.order_number}
                      </button>
                      
                      {/* Status Badge */}
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        STATUS_COLORS[order.order_status]
                      }`}>
                        {order.order_status.replace('_', ' ').toUpperCase()}
                      </span>
                      
                      {/* Priority Badge */}
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        PRIORITY_COLORS[order.order_priority]
                      }`}>
                        {order.order_priority.replace('_', ' ').toUpperCase()}
                      </span>
                      
                      {/* Special Order Indicators */}
                      {order.is_rush_order && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          <Clock className="h-3 w-3 mr-1" />
                          RUSH
                        </span>
                      )}
                      
                      {order.is_group_order && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                          <Users className="h-3 w-3 mr-1" />
                          GROUP
                        </span>
                      )}
                      
                      {bundleInfo && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          <Package className="h-3 w-3 mr-1" />
                          BUNDLE ({bundleInfo.count})
                        </span>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 text-sm text-gray-600">
                      <div>
                        <span className="font-medium">Customer:</span> {order.customer_name}
                      </div>
                      <div>
                        <span className="font-medium">Total:</span> ${order.total_amount.toFixed(2)}
                      </div>
                      <div>
                        <span className="font-medium">Items:</span> {order.order_items?.length || 0}
                      </div>
                      <div>
                        <span className="font-medium">Created:</span> {new Date(order.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    
                    {/* Product Source Info */}
                    <div className="mt-2 flex items-center space-x-4 text-sm">
                      {productSourceInfo.core > 0 && (
                        <span className="inline-flex items-center text-blue-600">
                          <Crown className="h-4 w-4 mr-1" />
                          {productSourceInfo.core} Core Products
                        </span>
                      )}
                      {productSourceInfo.catalog > 0 && (
                        <span className="inline-flex items-center text-green-600">
                          <Package className="h-4 w-4 mr-1" />
                          {productSourceInfo.catalog} Catalog Items
                        </span>
                      )}
                    </div>
                    
                    {/* Bundle Details */}
                    {bundleInfo && (
                      <div className="mt-2">
                        <span className="text-sm text-gray-600">
                          Bundle Types: {bundleInfo.types.join(', ')}
                        </span>
                      </div>
                    )}
                    
                    {/* Special Instructions */}
                    {order.special_instructions && (
                      <div className="mt-2">
                        <span className="text-sm text-gray-600">
                          <strong>Special Instructions:</strong> {order.special_instructions}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-2">
                    {/* Workflow Actions */}
                    {order.order_status === OrderStatus.PAYMENT_CONFIRMED && (
                      <button
                        onClick={() => executeWorkflowAction({
                          action: 'intelligent_order_routing',
                          orderId: order.id
                        })}
                        disabled={isProcessing}
                        className="flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-400 transition-colors"
                      >
                        {isProcessing ? <RefreshCw className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
                        <span>Route Order</span>
                      </button>
                    )}
                    
                    {bundleInfo && order.order_status === OrderStatus.PROCESSING && (
                      <button
                        onClick={() => executeWorkflowAction({
                          action: 'bundle_order_processing',
                          orderId: order.id
                        })}
                        disabled={isProcessing}
                        className="flex items-center space-x-2 px-3 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:bg-purple-400 transition-colors"
                      >
                        {isProcessing ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Package className="h-4 w-4" />}
                        <span>Process Bundle</span>
                      </button>
                    )}
                    
                    {order.is_group_order && (
                      <button
                        onClick={() => executeWorkflowAction({
                          action: 'wedding_party_coordination',
                          orderId: order.id
                        })}
                        disabled={isProcessing}
                        className="flex items-center space-x-2 px-3 py-2 bg-pink-600 text-white rounded-md hover:bg-pink-700 disabled:bg-pink-400 transition-colors"
                      >
                        {isProcessing ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Users className="h-4 w-4" />}
                        <span>Coordinate Group</span>
                      </button>
                    )}
                    
                    {/* View Details */}
                    <button
                      onClick={() => onOrderSelect(order)}
                      className="px-3 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                    >
                      View Details
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        
        {filteredOrders.length === 0 && (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Orders Found</h3>
            <p className="text-gray-600">
              {Object.keys(filters).length > 0 
                ? 'No orders match your current filters. Try adjusting your search criteria.'
                : 'No orders are currently in the queue.'
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
}