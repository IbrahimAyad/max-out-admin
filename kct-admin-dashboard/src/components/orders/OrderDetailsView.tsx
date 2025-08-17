import React, { useState, useEffect } from 'react';
import { Order, OrderException, CommunicationLog, OrderStatus, OrderPriority } from '../../config/orders';
import { supabase } from '../../lib/supabase';
import { X, Mail, Phone, MessageSquare, Calendar, Clock, User, Package, AlertTriangle, CheckCircle, XCircle, Send } from 'lucide-react';

interface OrderDetailsViewProps {
  order: Order;
  orderItems: any[];
  communications: CommunicationLog[];
  onClose: () => void;
  onStatusUpdate: (orderId: string, status: OrderStatus) => void;
  onAddCommunication: (log: Omit<CommunicationLog, 'id'>) => void;
}

interface WorkflowAction {
  action: string;
  orderId: string;
  parameters?: any;
}

export function OrderDetailsView({
  order,
  orderItems,
  communications,
  onClose,
  onStatusUpdate,
  onAddCommunication
}: OrderDetailsViewProps) {
  const [activeTab, setActiveTab] = useState<'details' | 'items' | 'workflow' | 'communications' | 'history'>('details');
  const [exceptions, setExceptions] = useState<OrderException[]>([]);
  const [statusHistory, setStatusHistory] = useState<any[]>([]);
  const [newCommunication, setNewCommunication] = useState({ type: '', message: '' });
  const [loadingWorkflow, setLoadingWorkflow] = useState(false);
  const [workflowResults, setWorkflowResults] = useState<any>(null);

  useEffect(() => {
    fetchOrderDetails();
  }, [order.id]);

  const fetchOrderDetails = async () => {
    try {
      // Fetch exceptions
      const { data: exceptionsData } = await supabase
        .from('order_exceptions')
        .select('*')
        .eq('order_id', order.id)
        .order('created_at', { ascending: false });
      
      if (exceptionsData) {
        setExceptions(exceptionsData);
      }
      
      // Fetch status history
      const { data: historyData } = await supabase
        .from('order_status_history')
        .select('*')
        .eq('order_id', order.id)
        .order('created_at', { ascending: false });
      
      if (historyData) {
        setStatusHistory(historyData);
      }
    } catch (error) {
      console.error('Error fetching order details:', error);
    }
  };

  const executeWorkflowAction = async (action: WorkflowAction) => {
    try {
      setLoadingWorkflow(true);
      
      const { data, error } = await supabase.functions.invoke('order-workflow-automation', {
        body: action
      });

      if (error) throw error;
      
      setWorkflowResults(data);
      
      // Refresh order details
      await fetchOrderDetails();
    } catch (error) {
      console.error('Workflow action failed:', error);
    } finally {
      setLoadingWorkflow(false);
    }
  };

  const triggerCommunication = async () => {
    if (!newCommunication.type || !newCommunication.message) return;
    
    try {
      const { data, error } = await supabase.functions.invoke('customer-communication', {
        body: {
          orderId: order.id,
          communicationType: newCommunication.type,
          customMessage: newCommunication.message,
          triggerReason: 'Manual communication from admin'
        }
      });

      if (error) throw error;
      
      setNewCommunication({ type: '', message: '' });
      
      // Refresh communications
      await fetchOrderDetails();
    } catch (error) {
      console.error('Communication failed:', error);
    }
  };

  const getBundleGroups = () => {
    const bundles = orderItems.filter(item => item.is_bundle_item);
    const groups = bundles.reduce((acc, item) => {
      const bundleId = item.bundle_parent_id || item.id;
      if (!acc[bundleId]) {
        acc[bundleId] = {
          type: item.bundle_type,
          items: []
        };
      }
      acc[bundleId].items.push(item);
      return acc;
    }, {} as Record<string, { type: string; items: any[] }>);
    
    return Object.entries(groups);
  };

  const getProductSourceSummary = () => {
    const core = orderItems.filter(item => item.product_source === 'core_stripe').length;
    const catalog = orderItems.filter(item => item.product_source === 'catalog_supabase').length;
    return { core, catalog };
  };

  const tabs = [
    { id: 'details', name: 'Order Details', icon: Package },
    { id: 'items', name: 'Items', icon: Package, count: orderItems.length },
    { id: 'workflow', name: 'Workflow', icon: CheckCircle },
    { id: 'communications', name: 'Communications', icon: Mail, count: communications.length },
    { id: 'history', name: 'History', icon: Clock, count: statusHistory.length }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">{order.order_number}</h2>
              <p className="text-blue-100">
                {order.customer_name} • ${order.total_amount.toFixed(2)} • 
                {order.order_items?.length || 0} items
              </p>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Status and Priority */}
              <div className="text-right">
                <div className="text-sm text-blue-100">Status</div>
                <div className="font-semibold">
                  {order.order_status.replace('_', ' ').toUpperCase()}
                </div>
              </div>
              
              <div className="text-right">
                <div className="text-sm text-blue-100">Priority</div>
                <div className="font-semibold">
                  {order.order_priority.replace('_', ' ').toUpperCase()}
                </div>
              </div>
              
              <button
                onClick={onClose}
                className="p-2 hover:bg-white hover:bg-opacity-20 rounded-full transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
          </div>
          
          {/* Quick Status Indicators */}
          <div className="mt-4 flex items-center space-x-4">
            {order.is_rush_order && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-500 text-white">
                <Clock className="h-4 w-4 mr-1" />
                Rush Order
              </span>
            )}
            
            {order.is_group_order && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-500 text-white">
                <User className="h-4 w-4 mr-1" />
                Group Order
              </span>
            )}
            
            {exceptions.length > 0 && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-500 text-white">
                <AlertTriangle className="h-4 w-4 mr-1" />
                {exceptions.length} Exception{exceptions.length > 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <Icon className="h-4 w-4" />
                    <span>{tab.name}</span>
                    {tab.count !== undefined && (
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        activeTab === tab.id ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {tab.count}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 200px)' }}>
          {activeTab === 'details' && (
            <div className="space-y-6">
              {/* Customer Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Customer Details</h3>
                  <div className="space-y-2 text-sm">
                    <div><span className="font-medium">Name:</span> {order.customer_name}</div>
                    <div><span className="font-medium">Email:</span> {order.customer_email}</div>
                    {order.customer_phone && (
                      <div><span className="font-medium">Phone:</span> {order.customer_phone}</div>
                    )}
                  </div>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Order Summary</h3>
                  <div className="space-y-2 text-sm">
                    <div><span className="font-medium">Subtotal:</span> ${order.subtotal_amount.toFixed(2)}</div>
                    <div><span className="font-medium">Tax:</span> ${order.tax_amount.toFixed(2)}</div>
                    <div><span className="font-medium">Shipping:</span> ${order.shipping_amount.toFixed(2)}</div>
                    <div><span className="font-medium">Discount:</span> -${order.discount_amount.toFixed(2)}</div>
                    <hr className="my-2" />
                    <div className="text-lg font-semibold">
                      <span className="font-medium">Total:</span> ${order.total_amount.toFixed(2)}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Addresses */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Shipping Address</h3>
                  <div className="text-sm text-gray-600">
                    {order.shipping_address_line1}<br />
                    {order.shipping_address_line2 && <>{order.shipping_address_line2}<br /></>}
                    {order.shipping_city}, {order.shipping_state} {order.shipping_postal_code}<br />
                    {order.shipping_country}
                  </div>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Billing Address</h3>
                  <div className="text-sm text-gray-600">
                    {order.billing_address_line1 || order.shipping_address_line1}<br />
                    {(order.billing_address_line2 || order.shipping_address_line2) && 
                      <>{order.billing_address_line2 || order.shipping_address_line2}<br /></>
                    }
                    {order.billing_city || order.shipping_city}, {order.billing_state || order.shipping_state} {order.billing_postal_code || order.shipping_postal_code}<br />
                    {order.billing_country || order.shipping_country}
                  </div>
                </div>
              </div>
              
              {/* Special Instructions */}
              {order.special_instructions && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Special Instructions</h3>
                  <p className="text-sm text-gray-700">{order.special_instructions}</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'items' && (
            <div className="space-y-6">
              {/* Product Source Summary */}
              {(() => {
                const sourceSummary = getProductSourceSummary();
                return (
                  <div className="bg-blue-50 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Product Architecture</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-blue-600">Core Products:</span> {sourceSummary.core} items
                      </div>
                      <div>
                        <span className="font-medium text-green-600">Catalog Products:</span> {sourceSummary.catalog} items
                      </div>
                    </div>
                  </div>
                );
              })()}
              
              {/* Bundle Groups */}
              {(() => {
                const bundleGroups = getBundleGroups();
                return bundleGroups.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900">Bundle Groups</h3>
                    {bundleGroups.map(([bundleId, bundle], index) => (
                      <div key={bundleId} className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                        <h4 className="font-semibold text-purple-900 mb-2">
                          Bundle {index + 1}: {bundle.type || 'Standard Bundle'}
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                          {bundle.items.map((item, itemIndex) => (
                            <div key={itemIndex} className="bg-white rounded p-3 text-sm">
                              <div className="font-medium">{item.product_name}</div>
                              <div className="text-gray-600">
                                Qty: {item.quantity} • ${item.unit_price.toFixed(2)}
                              </div>
                              {item.size && <div className="text-gray-600">Size: {item.size}</div>}
                              {item.color && <div className="text-gray-600">Color: {item.color}</div>}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
              
              {/* Individual Items */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">All Items</h3>
                <div className="space-y-3">
                  {orderItems.map((item, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="font-semibold text-gray-900">{item.product_name}</div>
                          <div className="text-sm text-gray-600 mt-1">
                            {item.product_sku && <span>SKU: {item.product_sku} • </span>}
                            Source: {item.product_source === 'core_stripe' ? 'Core Product' : 'Catalog Product'}
                          </div>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2 text-sm">
                            <div><span className="font-medium">Quantity:</span> {item.quantity}</div>
                            <div><span className="font-medium">Unit Price:</span> ${item.unit_price.toFixed(2)}</div>
                            <div><span className="font-medium">Total:</span> ${item.total_price.toFixed(2)}</div>
                            <div>
                              <span className="font-medium">Status:</span> 
                              <span className={`ml-1 px-2 py-1 rounded-full text-xs ${
                                item.item_status === 'completed' ? 'bg-green-100 text-green-800' :
                                item.item_status === 'in_production' ? 'bg-blue-100 text-blue-800' :
                                'bg-yellow-100 text-yellow-800'
                              }`}>
                                {item.item_status?.replace('_', ' ').toUpperCase()}
                              </span>
                            </div>
                          </div>
                          
                          {(item.size || item.color || item.material) && (
                            <div className="mt-2 text-sm text-gray-600">
                              {item.size && <span>Size: {item.size} • </span>}
                              {item.color && <span>Color: {item.color} • </span>}
                              {item.material && <span>Material: {item.material}</span>}
                            </div>
                          )}
                          
                          {item.custom_measurements && (
                            <div className="mt-2 text-sm">
                              <span className="font-medium text-purple-700">Custom Measurements:</span>
                              <div className="text-gray-600">
                                {Object.entries(item.custom_measurements).map(([key, value]) => (
                                  <span key={key} className="mr-3">{key}: {value}</span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'workflow' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Payment Confirmation */}
                {order.order_status === OrderStatus.PENDING_PAYMENT && (
                  <button
                    onClick={() => executeWorkflowAction({
                      action: 'process_payment_confirmation',
                      orderId: order.id
                    })}
                    disabled={loadingWorkflow}
                    className="p-4 border-2 border-dashed border-blue-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
                  >
                    <CheckCircle className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                    <div className="text-sm font-medium text-gray-900">Process Payment</div>
                    <div className="text-xs text-gray-600 mt-1">Confirm payment and start workflow</div>
                  </button>
                )}
                
                {/* Intelligent Routing */}
                {order.order_status === OrderStatus.PAYMENT_CONFIRMED && (
                  <button
                    onClick={() => executeWorkflowAction({
                      action: 'intelligent_order_routing',
                      orderId: order.id
                    })}
                    disabled={loadingWorkflow}
                    className="p-4 border-2 border-dashed border-green-300 rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors"
                  >
                    <Package className="h-8 w-8 text-green-600 mx-auto mb-2" />
                    <div className="text-sm font-medium text-gray-900">Smart Routing</div>
                    <div className="text-xs text-gray-600 mt-1">Assign optimal processor</div>
                  </button>
                )}
                
                {/* Bundle Processing */}
                {getBundleGroups().length > 0 && (
                  <button
                    onClick={() => executeWorkflowAction({
                      action: 'bundle_order_processing',
                      orderId: order.id
                    })}
                    disabled={loadingWorkflow}
                    className="p-4 border-2 border-dashed border-purple-300 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-colors"
                  >
                    <Package className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                    <div className="text-sm font-medium text-gray-900">Process Bundles</div>
                    <div className="text-xs text-gray-600 mt-1">Coordinate bundle items</div>
                  </button>
                )}
                
                {/* Wedding Party Coordination */}
                {order.is_group_order && (
                  <button
                    onClick={() => executeWorkflowAction({
                      action: 'wedding_party_coordination',
                      orderId: order.id
                    })}
                    disabled={loadingWorkflow}
                    className="p-4 border-2 border-dashed border-pink-300 rounded-lg hover:border-pink-500 hover:bg-pink-50 transition-colors"
                  >
                    <User className="h-8 w-8 text-pink-600 mx-auto mb-2" />
                    <div className="text-sm font-medium text-gray-900">Group Coordination</div>
                    <div className="text-xs text-gray-600 mt-1">Sync wedding party orders</div>
                  </button>
                )}
                
                {/* Quality Assurance */}
                {[OrderStatus.IN_PRODUCTION, OrderStatus.QUALITY_CHECK].includes(order.order_status) && (
                  <button
                    onClick={() => executeWorkflowAction({
                      action: 'quality_assurance_workflow',
                      orderId: order.id
                    })}
                    disabled={loadingWorkflow}
                    className="p-4 border-2 border-dashed border-orange-300 rounded-lg hover:border-orange-500 hover:bg-orange-50 transition-colors"
                  >
                    <CheckCircle className="h-8 w-8 text-orange-600 mx-auto mb-2" />
                    <div className="text-sm font-medium text-gray-900">Quality Check</div>
                    <div className="text-xs text-gray-600 mt-1">Run quality assurance</div>
                  </button>
                )}
              </div>
              
              {/* Workflow Results */}
              {workflowResults && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-green-900 mb-2">Workflow Results</h3>
                  <pre className="text-sm text-green-800 whitespace-pre-wrap">
                    {JSON.stringify(workflowResults, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}

          {activeTab === 'communications' && (
            <div className="space-y-6">
              {/* Send New Communication */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Send Communication</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <select
                    value={newCommunication.type}
                    onChange={(e) => setNewCommunication({ ...newCommunication, type: e.target.value })}
                    className="border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select type...</option>
                    <option value="processing_update">Processing Update</option>
                    <option value="delay_notification">Delay Notification</option>
                    <option value="custom_message">Custom Message</option>
                  </select>
                  
                  <div className="md:col-span-2">
                    <textarea
                      value={newCommunication.message}
                      onChange={(e) => setNewCommunication({ ...newCommunication, message: e.target.value })}
                      placeholder="Enter message..."
                      rows={3}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
                
                <button
                  onClick={triggerCommunication}
                  disabled={!newCommunication.type || !newCommunication.message}
                  className="mt-3 flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:bg-blue-400 transition-colors"
                >
                  <Send className="h-4 w-4" />
                  <span>Send Communication</span>
                </button>
              </div>
              
              {/* Communication History */}
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-gray-900">Communication History</h3>
                {communications.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No communications yet
                  </div>
                ) : (
                  communications.map((comm, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <Mail className="h-4 w-4 text-blue-600" />
                            <span className="font-medium text-gray-900">
                              {comm.communication_type.replace('_', ' ').toUpperCase()}
                            </span>
                            <span className="text-sm text-gray-600">
                              via {comm.communication_channel}
                            </span>
                          </div>
                          
                          {comm.subject && (
                            <div className="text-sm font-medium text-gray-900 mb-1">
                              {comm.subject}
                            </div>
                          )}
                          
                          <div className="text-sm text-gray-700 mb-2">
                            {comm.message_content}
                          </div>
                          
                          <div className="text-xs text-gray-500">
                            {comm.sent_at ? `Sent: ${new Date(comm.sent_at).toLocaleString()}` : 'Not sent yet'}
                            {comm.delivery_status && ` • Status: ${comm.delivery_status}`}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === 'history' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Status History</h3>
              {statusHistory.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No status changes yet
                </div>
              ) : (
                <div className="space-y-3">
                  {statusHistory.map((history, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <span className="font-medium text-gray-900">
                            {history.new_status.replace('_', ' ').toUpperCase()}
                          </span>
                        </div>
                        <span className="text-sm text-gray-600">
                          {new Date(history.created_at).toLocaleString()}
                        </span>
                      </div>
                      
                      {history.status_notes && (
                        <div className="text-sm text-gray-700 mb-2">
                          {history.status_notes}
                        </div>
                      )}
                      
                      <div className="text-xs text-gray-500">
                        {history.changed_by_system ? 'System automated' : 'Manual change'}
                        {history.processing_duration && ` • Duration: ${history.processing_duration} minutes`}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}