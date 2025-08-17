import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { 
  TrendingUp,
  DollarSign,
  Users,
  BarChart3,
  Banknote,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import { ExecutiveOverview } from './ExecutiveOverview';
import { SalesIntelligence } from './SalesIntelligence';
import { CustomerInsights } from './CustomerInsights';
import { PredictiveAnalytics } from './PredictiveAnalytics';
import { InventoryOptimization } from './InventoryOptimization';
import { MarketIntelligence } from './MarketIntelligence';

type TabType = 'overview' | 'sales' | 'customers' | 'predictive' | 'inventory' | 'market';

interface AnalyticsMetrics {
  totalRevenue: number;
  revenueGrowth: number;
  totalOrders: number;
  ordersGrowth: number;
  totalCustomers: number;
  customersGrowth: number;
  averageOrderValue: number;
  aovGrowth: number;
}

const AnalyticsDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [timeframe, setTimeframe] = useState('30d');

  // Fetch basic metrics from Supabase
  const { data: metrics, isLoading: metricsLoading } = useQuery({
    queryKey: ['analytics-metrics', timeframe],
    queryFn: async (): Promise<AnalyticsMetrics> => {
      const { data: orders } = await supabase
        .from('orders')
        .select(`
          *,
          order_items(*),
          payments(*)
        `)
        .order('created_at', { ascending: false });

      const { data: customers } = await supabase
        .from('customers')
        .select('*')
        .order('created_at', { ascending: false });

      // Calculate metrics
      const totalRevenue = orders?.reduce((sum, order) => {
        const orderTotal = order.payments?.reduce((paySum: number, payment: any) => paySum + payment.amount, 0) || 0;
        return sum + orderTotal;
      }, 0) || 0;

      const totalOrders = orders?.length || 0;
      const totalCustomers = customers?.length || 0;
      const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

      // Mock growth calculations (would normally compare to previous period)
      return {
        totalRevenue,
        revenueGrowth: 12.5,
        totalOrders,
        ordersGrowth: 8.3,
        totalCustomers,
        customersGrowth: 15.2,
        averageOrderValue,
        aovGrowth: 5.7
      };
    }
  });

  const tabs = [
    { id: 'overview', name: 'Executive Overview', icon: BarChart3 },
    { id: 'sales', name: 'Sales Intelligence', icon: TrendingUp },
    { id: 'customers', name: 'Customer Insights', icon: Users },
    { id: 'predictive', name: 'Predictive Analytics', icon: Banknote },
    { id: 'inventory', name: 'Inventory Optimization', icon: DollarSign },
    { id: 'market', name: 'Market Intelligence', icon: BarChart3 }
  ];

  const renderMetricCard = (title: string, value: string, growth: number, icon: React.ComponentType<any>) => {
    const Icon = icon;
    const isPositive = growth >= 0;
    
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl">
              <Icon className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
            </div>
          </div>
          <div className={`flex items-center space-x-1 px-3 py-1 rounded-full text-sm font-medium ${
            isPositive 
              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-400'
              : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
          }`}>
            {isPositive ? (
              <ArrowUp className="h-4 w-4" />
            ) : (
              <ArrowDown className="h-4 w-4" />
            )}
            <span>{Math.abs(growth)}%</span>
          </div>
        </div>
      </div>
    );
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return <ExecutiveOverview timeframe={timeframe} />;
      case 'sales':
        return <SalesIntelligence timeframe={timeframe} />;
      case 'customers':
        return <CustomerInsights timeframe={timeframe} />;
      case 'predictive':
        return <PredictiveAnalytics timeframe={timeframe} />;
      case 'inventory':
        return <InventoryOptimization timeframe={timeframe} />;
      case 'market':
        return <MarketIntelligence timeframe={timeframe} />;
      default:
        return <ExecutiveOverview timeframe={timeframe} />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-blue-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">AI Analytics Dashboard</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">Advanced business intelligence powered by AI</p>
            </div>
            <div className="flex items-center space-x-4">
              <select
                value={timeframe}
                onChange={(e) => setTimeframe(e.target.value)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 3 months</option>
                <option value="1y">Last year</option>
              </select>
            </div>
          </div>
        </div>

        {/* Quick Metrics */}
        {metrics && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {renderMetricCard(
              'Total Revenue',
              `$${metrics.totalRevenue.toLocaleString()}`,
              metrics.revenueGrowth,
              DollarSign
            )}
            {renderMetricCard(
              'Total Orders',
              metrics.totalOrders.toLocaleString(),
              metrics.ordersGrowth,
              BarChart3
            )}
            {renderMetricCard(
              'Total Customers',
              metrics.totalCustomers.toLocaleString(),
              metrics.customersGrowth,
              Users
            )}
            {renderMetricCard(
              'Avg Order Value',
              `$${metrics.averageOrderValue.toFixed(2)}`,
              metrics.aovGrowth,
              TrendingUp
            )}
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 mb-8">
          <div className="flex overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as TabType)}
                  className={`flex items-center space-x-2 px-6 py-4 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span>{tab.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="transition-all duration-300">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;