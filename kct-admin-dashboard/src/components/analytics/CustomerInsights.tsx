import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import {
  Users,
  Heart,
  ShoppingBag,
  Trophy,
  AlertTriangle
} from 'lucide-react';

interface CustomerInsightsProps {
  timeframe: string;
}

const CustomerInsights: React.FC<CustomerInsightsProps> = ({ timeframe }) => {
  const { data: customerData, isLoading } = useQuery({
    queryKey: ['customer-insights', timeframe],
    queryFn: async () => {
      try {
        const { data, error } = await supabase.functions.invoke('customer-analytics', {
          body: {
            analysis_type: 'behavior',
            segment_criteria: ['purchase_frequency', 'value', 'recency'],
            timeframe
          }
        });
        
        if (error) throw error;
        return data;
      } catch (error) {
        console.error('Customer Insights API Error:', error);
        throw error;
      }
    }
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700">
            <div className="animate-pulse space-y-4">
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
              <div className="grid grid-cols-3 gap-4">
                {[1, 2, 3].map((j) => (
                  <div key={j} className="h-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  const data = customerData?.data || customerData;

  return (
    <div className="space-y-8">
      {/* Customer Segments */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
          <Users className="h-6 w-6 text-blue-500 mr-2" />
          Customer Segments
        </h3>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {data?.customer_segments?.map((segment: any, index: number) => {
            const colors = [
              'from-purple-500 to-pink-600',
              'from-blue-500 to-indigo-600',
              'from-emerald-500 to-teal-600'
            ];
            
            return (
              <div key={index} className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-6">
                <div className={`w-12 h-12 bg-gradient-to-br ${colors[index]} rounded-xl flex items-center justify-center mb-4`}>
                  {index === 0 && <Trophy className="h-6 w-6 text-white" />}
                  {index === 1 && <Heart className="h-6 w-6 text-white" />}
                  {index === 2 && <ShoppingBag className="h-6 w-6 text-white" />}
                </div>
                
                <h4 className="font-bold text-gray-900 dark:text-white text-lg mb-2">{segment.name}</h4>
                
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Count</p>
                    <p className="font-semibold text-gray-900 dark:text-white">{segment.count}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">AOV</p>
                    <p className="font-semibold text-gray-900 dark:text-white">${segment.avg_order_value}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">LTV</p>
                    <p className="font-semibold text-gray-900 dark:text-white">${segment.lifetime_value}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Retention</p>
                    <p className="font-semibold text-gray-900 dark:text-white">{(segment.retention_rate * 100).toFixed(0)}%</p>
                  </div>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Characteristics</p>
                  <div className="space-y-1">
                    {segment.characteristics?.map((char: string, charIndex: number) => (
                      <span key={charIndex} className="inline-block text-xs bg-white dark:bg-gray-600 text-gray-700 dark:text-gray-300 px-2 py-1 rounded mr-1 mb-1">
                        {char}
                      </span>
                    )) || []}
                  </div>
                </div>
              </div>
            );
          }) || []}
        </div>
      </div>

      {/* Behavior Insights & Churn Risk */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Behavior Insights */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
            <ShoppingBag className="h-6 w-6 text-green-500 mr-2" />
            Behavior Insights
          </h3>
          
          <div className="space-y-6">
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Peak Shopping Times</h4>
              <div className="space-y-2">
                {data?.behavior_insights?.peak_shopping_times?.map((time: string, index: number) => (
                  <div key={index} className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">{time}</span>
                  </div>
                )) || []}
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Preferred Categories</h4>
              <div className="flex flex-wrap gap-2">
                {data?.behavior_insights?.preferred_categories?.map((category: string, index: number) => (
                  <span key={index} className="px-3 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 rounded-full text-sm">
                    {category}
                  </span>
                )) || []}
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Device Usage</h4>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Mobile</span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {((data?.behavior_insights?.device_usage?.mobile || 0) * 100).toFixed(0)}%
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Desktop</span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {((data?.behavior_insights?.device_usage?.desktop || 0) * 100).toFixed(0)}%
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Tablet</span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {((data?.behavior_insights?.device_usage?.tablet || 0) * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Churn Risk */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
            <AlertTriangle className="h-6 w-6 text-amber-500 mr-2" />
            Churn Risk Analysis
          </h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border-l-4 border-red-500">
              <div>
                <p className="font-semibold text-red-800 dark:text-red-300">High Risk</p>
                <p className="text-sm text-red-700 dark:text-red-400">Immediate attention needed</p>
              </div>
              <p className="text-2xl font-bold text-red-600 dark:text-red-400">{data?.churn_risk?.high_risk || 0}</p>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border-l-4 border-amber-500">
              <div>
                <p className="font-semibold text-amber-800 dark:text-amber-300">Medium Risk</p>
                <p className="text-sm text-amber-700 dark:text-amber-400">Monitor closely</p>
              </div>
              <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{data?.churn_risk?.medium_risk || 0}</p>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border-l-4 border-emerald-500">
              <div>
                <p className="font-semibold text-emerald-800 dark:text-emerald-300">Low Risk</p>
                <p className="text-sm text-emerald-700 dark:text-emerald-400">Stable customers</p>
              </div>
              <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{data?.churn_risk?.low_risk || 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Satisfaction Metrics */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
          <Heart className="h-6 w-6 text-pink-500 mr-2" />
          Customer Satisfaction
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
          {Object.entries(data?.satisfaction_metrics || {}).map(([key, value]) => {
            const score = value as number;
            const percentage = (score / 5) * 100;
            
            return (
              <div key={key} className="text-center">
                <div className="relative w-20 h-20 mx-auto mb-3">
                  <svg className="w-20 h-20 transform -rotate-90" viewBox="0 0 36 36">
                    <path
                      className="text-gray-200 dark:text-gray-700"
                      stroke="currentColor"
                      strokeWidth="3"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    <path
                      className="text-pink-500"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeDasharray={`${percentage}, 100`}
                      strokeLinecap="round"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xl font-bold text-gray-900 dark:text-white">{score.toFixed(1)}</span>
                  </div>
                </div>
                <p className="text-sm font-medium text-gray-900 dark:text-white capitalize">
                  {key.replace(/_/g, ' ')}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export { CustomerInsights };