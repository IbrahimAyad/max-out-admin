import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  Users,
  ShoppingBag,
  AlertTriangle
} from 'lucide-react';

interface ExecutiveOverviewProps {
  timeframe: string;
}

const ExecutiveOverview: React.FC<ExecutiveOverviewProps> = ({ timeframe }) => {
  // Fetch AI-powered insights from real API
  const { data: insights, isLoading, error } = useQuery({
    queryKey: ['executive-insights', timeframe],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('analytics-proxy', {
        body: {
          endpoint: '/executive/overview',
          params: { timeframe }
        }
      });
      
      if (error) throw error;
      return data;
    },
    retry: false,
    refetchOnWindowFocus: false
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-6">
        <div className="flex items-center">
          <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400 mr-3" />
          <div>
            <h3 className="text-lg font-semibold text-red-900 dark:text-red-300">Failed to Load Executive Overview</h3>
            <p className="text-red-700 dark:text-red-400 mt-1">
              Unable to connect to analytics service. Please check your connection and try again.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!insights?.data) {
    return (
      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl p-6">
        <div className="flex items-center">
          <AlertTriangle className="h-6 w-6 text-amber-600 dark:text-amber-400 mr-3" />
          <div>
            <h3 className="text-lg font-semibold text-amber-900 dark:text-amber-300">No Analytics Data Available</h3>
            <p className="text-amber-700 dark:text-amber-400 mt-1">
              Analytics service is available but no data was returned. This may be normal for new businesses.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const kpis = insights.data.kpi_summary;
  const alerts = insights.data.alerts || [];
  const recommendations = insights.data.recommendations || [];

  return (
    <div className="space-y-8">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Revenue</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                ${kpis?.revenue?.current?.toLocaleString() || '0'}
              </p>
              <p className="text-sm text-emerald-600 dark:text-emerald-400 mt-1">
                +{kpis?.revenue?.growth || 0}% from last period
              </p>
            </div>
            <div className="p-3 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl">
              <DollarSign className="h-8 w-8 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Orders</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {kpis?.orders?.current?.toLocaleString() || '0'}
              </p>
              <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">
                +{kpis?.orders?.growth || 0}% from last period
              </p>
            </div>
            <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl">
              <ShoppingBag className="h-8 w-8 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Customers</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {kpis?.customers?.current?.toLocaleString() || '0'}
              </p>
              <p className="text-sm text-purple-600 dark:text-purple-400 mt-1">
                +{kpis?.customers?.growth || 0}% from last period
              </p>
            </div>
            <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl">
              <Users className="h-8 w-8 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Profit Margin</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {((kpis?.profit_margin?.current || 0) * 100).toFixed(1)}%
              </p>
              <p className="text-sm text-orange-600 dark:text-orange-400 mt-1">
                +{kpis?.profit_margin?.growth || 0}% from last period
              </p>
            </div>
            <div className="p-3 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl">
              <TrendingUp className="h-8 w-8 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Alerts & Recommendations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Alerts */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
            <AlertTriangle className="h-6 w-6 text-amber-500 mr-2" />
            Business Alerts
          </h3>
          {alerts.length > 0 ? (
            <div className="space-y-4">
              {alerts.map((alert: any, index: number) => (
                <div key={index} className={`p-4 rounded-xl border-l-4 ${
                  alert.type === 'opportunity'
                    ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-500'
                    : alert.type === 'warning'
                    ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-500'
                    : 'bg-red-50 dark:bg-red-900/20 border-red-500'
                }`}>
                  <h4 className={`font-semibold ${
                    alert.type === 'opportunity'
                      ? 'text-emerald-800 dark:text-emerald-300'
                      : alert.type === 'warning'
                      ? 'text-amber-800 dark:text-amber-300'
                      : 'text-red-800 dark:text-red-300'
                  }`}>
                    {alert.title}
                  </h4>
                  <p className={`text-sm mt-1 ${
                    alert.type === 'opportunity'
                      ? 'text-emerald-700 dark:text-emerald-400'
                      : alert.type === 'warning'
                      ? 'text-amber-700 dark:text-amber-400'
                      : 'text-red-700 dark:text-red-400'
                  }`}>
                    {alert.description}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400 text-center py-8">No active alerts at this time.</p>
          )}
        </div>

        {/* AI Recommendations */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
            <BarChart3 className="h-6 w-6 text-blue-500 mr-2" />
            AI Recommendations
          </h3>
          {recommendations.length > 0 ? (
            <div className="space-y-4">
              {recommendations.map((rec: any, index: number) => (
                <div key={index} className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border border-blue-100 dark:border-blue-800">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-semibold text-blue-900 dark:text-blue-300">{rec.title}</h4>
                      <p className="text-sm text-blue-700 dark:text-blue-400 mt-1">{rec.description}</p>
                      <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-2 font-medium">
                        {rec.estimated_impact}
                      </p>
                    </div>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      rec.priority === 'high'
                        ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                        : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                    }`}>
                      {rec.priority} priority
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400 text-center py-8">No recommendations available.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export { ExecutiveOverview };