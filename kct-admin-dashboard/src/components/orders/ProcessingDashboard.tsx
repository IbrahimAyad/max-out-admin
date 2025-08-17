import React from 'react';
import { Activity, CheckCircle, Clock, AlertCircle, TrendingUp } from 'lucide-react';
import { Order, ProcessingAnalytics, OrderStatus } from '../../config/orders';

interface ProcessingDashboardProps {
  orders: Order[];
  analytics: ProcessingAnalytics[];
  onOrderSelect: (order: Order) => void;
}

export function ProcessingDashboard({ orders, analytics, onOrderSelect }: ProcessingDashboardProps) {
  const processingOrders = orders.filter(order => order.status === OrderStatus.PROCESSING);
  const completedToday = orders.filter(order => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const orderDate = new Date(order.updated_at || order.created_at);
    return orderDate >= today && [OrderStatus.SHIPPED, OrderStatus.DELIVERED].includes(order.status);
  });

  const avgProcessingTime = analytics.length > 0 
    ? analytics.reduce((sum, a) => sum + a.stage_duration_minutes, 0) / analytics.length
    : 0;

  const automationRate = analytics.length > 0
    ? (analytics.filter(a => a.automated).length / analytics.length) * 100
    : 0;

  const stats = [
    {
      name: 'Currently Processing',
      value: processingOrders.length,
      icon: Activity,
      color: 'text-blue-500'
    },
    {
      name: 'Completed Today',
      value: completedToday.length,
      icon: CheckCircle,
      color: 'text-green-500'
    },
    {
      name: 'Avg Processing Time',
      value: `${Math.round(avgProcessingTime)}m`,
      icon: Clock,
      color: 'text-orange-500'
    },
    {
      name: 'Automation Rate',
      value: `${Math.round(automationRate)}%`,
      icon: TrendingUp,
      color: 'text-purple-500'
    }
  ];

  const getProcessingStageColor = (stage: string) => {
    const colors: Record<string, string> = {
      'validation': 'bg-yellow-100 text-yellow-800',
      'payment_verification': 'bg-blue-100 text-blue-800',
      'inventory_check': 'bg-orange-100 text-orange-800',
      'fulfillment': 'bg-green-100 text-green-800',
      'shipping': 'bg-purple-100 text-purple-800'
    };
    return colors[stage] || 'bg-gray-100 text-gray-800';
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  return (
    <div className="space-y-6">
      {/* Statistics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.name} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Icon className={`h-6 w-6 ${stat.color}`} />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                  <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Currently Processing Orders */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center">
            <Activity className="h-5 w-5 mr-2 text-blue-500" />
            Currently Processing
          </h2>
        </div>

        <div className="divide-y divide-gray-200">
          {processingOrders.length === 0 ? (
            <div className="px-6 py-8 text-center text-gray-500">
              <Activity className="h-8 w-8 mx-auto mb-2 text-gray-400" />
              <p>No orders currently processing</p>
            </div>
          ) : (
            processingOrders.map((order) => {
              const orderAnalytics = analytics.filter(a => a.order_id === order.id);
              const latestStage = orderAnalytics[orderAnalytics.length - 1];
              
              return (
                <div 
                  key={order.id}
                  className="px-6 py-4 hover:bg-gray-50 cursor-pointer"
                  onClick={() => onOrderSelect(order)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <span className="text-sm font-medium text-gray-900">
                          #{order.id.slice(-8)}
                        </span>
                        <span className="text-sm text-gray-600">
                          {order.customer?.first_name} {order.customer?.last_name}
                        </span>
                        {latestStage && (
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            getProcessingStageColor(latestStage.processing_stage)
                          }`}>
                            {latestStage.processing_stage.replace('_', ' ').toUpperCase()}
                          </span>
                        )}
                      </div>
                      
                      {orderAnalytics.length > 0 && (
                        <div className="flex items-center text-xs text-gray-500 space-x-4">
                          <span>Stages: {orderAnalytics.length}</span>
                          <span>Duration: {formatDuration(
                            orderAnalytics.reduce((sum, a) => sum + a.stage_duration_minutes, 0)
                          )}</span>
                          <span>Automated: {orderAnalytics.filter(a => a.automated).length}/{orderAnalytics.length}</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="text-right">
                      <div className="text-lg font-semibold text-gray-900">
                        ${order.total_amount?.toFixed(2) || '0.00'}
                      </div>
                      {order.priority_level && ['urgent', 'wedding', 'rush'].includes(order.priority_level) && (
                        <AlertCircle className="h-4 w-4 text-red-500 mt-1 ml-auto" />
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Recent Processing Analytics */}
      {analytics.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Recent Processing Activity</h2>
          </div>
          
          <div className="divide-y divide-gray-200 max-h-64 overflow-y-auto">
            {analytics.slice(0, 10).map((item) => (
              <div key={item.id} className="px-6 py-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="text-sm font-medium text-gray-900">
                      #{item.order_id.slice(-8)}
                    </span>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      getProcessingStageColor(item.processing_stage)
                    }`}>
                      {item.processing_stage.replace('_', ' ')}
                    </span>
                    {item.automated && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Auto
                      </span>
                    )}
                  </div>
                  
                  <div className="text-sm text-gray-500">
                    {formatDuration(item.stage_duration_minutes)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}