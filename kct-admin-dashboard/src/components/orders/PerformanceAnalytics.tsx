import React from 'react';
import { BarChart3, TrendingUp, Clock, Zap, Users, CheckCircle } from 'lucide-react';
import { Order, ProcessingAnalytics } from '../../config/orders';

interface PerformanceAnalyticsProps {
  orders: Order[];
  analytics: ProcessingAnalytics[];
}

export function PerformanceAnalytics({ orders, analytics }: PerformanceAnalyticsProps) {
  // Calculate performance metrics
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const todayOrders = orders.filter(order => {
    const orderDate = new Date(order.created_at);
    return orderDate >= today;
  });

  const processedToday = orders.filter(order => {
    const updateDate = new Date(order.updated_at || order.created_at);
    return updateDate >= today && ['shipped', 'delivered'].includes(order.status);
  });

  const avgProcessingTime = analytics.length > 0 
    ? analytics.reduce((sum, a) => sum + a.stage_duration_minutes, 0) / analytics.length
    : 0;

  const automationRate = analytics.length > 0
    ? (analytics.filter(a => a.automated).length / analytics.length) * 100
    : 0;

  const processingEfficiency = processedToday.length > 0 && todayOrders.length > 0
    ? (processedToday.length / todayOrders.length) * 100
    : 0;

  const highPriorityOrders = orders.filter(order => 
    order.priority_level && ['urgent', 'wedding', 'rush', 'high'].includes(order.priority_level)
  );

  const completedHighPriority = highPriorityOrders.filter(order => 
    ['shipped', 'delivered'].includes(order.status)
  );

  const highPriorityCompletionRate = highPriorityOrders.length > 0
    ? (completedHighPriority.length / highPriorityOrders.length) * 100
    : 0;

  // Performance metrics for the cards
  const metrics = [
    {
      name: 'Orders Today',
      value: todayOrders.length,
      icon: BarChart3,
      color: 'text-blue-500',
      bgColor: 'bg-blue-50',
      change: '+12%',
      trend: 'up'
    },
    {
      name: 'Processed Today',
      value: processedToday.length,
      icon: CheckCircle,
      color: 'text-green-500',
      bgColor: 'bg-green-50',
      change: '+8%',
      trend: 'up'
    },
    {
      name: 'Avg Processing Time',
      value: `${Math.round(avgProcessingTime)}m`,
      icon: Clock,
      color: 'text-orange-500',
      bgColor: 'bg-orange-50',
      change: '-15%',
      trend: 'down'
    },
    {
      name: 'Automation Rate',
      value: `${Math.round(automationRate)}%`,
      icon: Zap,
      color: 'text-purple-500',
      bgColor: 'bg-purple-50',
      change: '+5%',
      trend: 'up'
    }
  ];

  // Processing stages analytics
  const stageAnalytics = analytics.reduce((acc, item) => {
    if (!acc[item.processing_stage]) {
      acc[item.processing_stage] = {
        count: 0,
        totalTime: 0,
        automated: 0
      };
    }
    acc[item.processing_stage].count++;
    acc[item.processing_stage].totalTime += item.stage_duration_minutes;
    if (item.automated) acc[item.processing_stage].automated++;
    return acc;
  }, {} as Record<string, { count: number; totalTime: number; automated: number }>);

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const getStageColor = (stage: string) => {
    const colors: Record<string, string> = {
      'validation': 'bg-yellow-100 text-yellow-800',
      'payment_verification': 'bg-blue-100 text-blue-800',
      'inventory_check': 'bg-orange-100 text-orange-800',
      'fulfillment': 'bg-green-100 text-green-800',
      'shipping': 'bg-purple-100 text-purple-800'
    };
    return colors[stage] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <div key={metric.name} className={`${metric.bgColor} rounded-lg p-6`}>
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Icon className={`h-6 w-6 ${metric.color}`} />
                </div>
                <div className="ml-4 flex-1">
                  <p className="text-sm font-medium text-gray-600">{metric.name}</p>
                  <div className="flex items-center">
                    <p className="text-2xl font-semibold text-gray-900">{metric.value}</p>
                    <span className={`ml-2 text-xs font-medium ${
                      metric.trend === 'up' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {metric.change}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Performance Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Processing Efficiency */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <TrendingUp className="h-5 w-5 mr-2 text-blue-500" />
            Processing Efficiency
          </h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600">Daily Completion Rate</span>
              <span className="text-2xl font-bold text-blue-600">
                {Math.round(processingEfficiency)}%
              </span>
            </div>
            
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${processingEfficiency}%` }}
              />
            </div>
            
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>Processed: {processedToday.length}</span>
              <span>Total: {todayOrders.length}</span>
            </div>
          </div>
        </div>

        {/* High Priority Performance */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <Users className="h-5 w-5 mr-2 text-red-500" />
            High Priority Orders
          </h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600">Completion Rate</span>
              <span className="text-2xl font-bold text-red-600">
                {Math.round(highPriorityCompletionRate)}%
              </span>
            </div>
            
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-red-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${highPriorityCompletionRate}%` }}
              />
            </div>
            
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>Completed: {completedHighPriority.length}</span>
              <span>Total: {highPriorityOrders.length}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Processing Stages Analytics */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Processing Stages Performance</h3>
        </div>
        
        <div className="p-6">
          {Object.keys(stageAnalytics).length === 0 ? (
            <div className="text-center py-8">
              <BarChart3 className="h-8 w-8 mx-auto mb-2 text-gray-400" />
              <p className="text-gray-500">No processing data available</p>
            </div>
          ) : (
            <div className="space-y-4">
              {Object.entries(stageAnalytics).map(([stage, data]) => {
                const avgTime = data.totalTime / data.count;
                const automationPercentage = (data.automated / data.count) * 100;
                
                return (
                  <div key={stage} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          getStageColor(stage)
                        }`}>
                          {stage.replace('_', ' ').toUpperCase()}
                        </span>
                        <span className="text-sm text-gray-600">{data.count} orders</span>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium text-gray-900">
                          Avg: {formatDuration(Math.round(avgTime))}
                        </div>
                        <div className="text-xs text-gray-500">
                          {Math.round(automationPercentage)}% automated
                        </div>
                      </div>
                    </div>
                    
                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                      <div 
                        className="bg-green-500 h-1.5 rounded-full transition-all duration-300"
                        style={{ width: `${automationPercentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Recent Activity Timeline */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Recent Processing Activity</h3>
        </div>
        
        <div className="p-6">
          {analytics.length === 0 ? (
            <div className="text-center py-8">
              <Clock className="h-8 w-8 mx-auto mb-2 text-gray-400" />
              <p className="text-gray-500">No recent activity</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {analytics.slice(0, 10).map((item) => (
                <div key={item.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                  <div className="flex items-center space-x-3">
                    <span className="text-sm font-medium text-gray-900">
                      #{item.order_id.slice(-8)}
                    </span>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      getStageColor(item.processing_stage)
                    }`}>
                      {item.processing_stage.replace('_', ' ')}
                    </span>
                    {item.automated && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        <Zap className="h-3 w-3 mr-1" />
                        Auto
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <span>{formatDuration(item.stage_duration_minutes)}</span>
                    <span>{new Date(item.created_at).toLocaleTimeString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}