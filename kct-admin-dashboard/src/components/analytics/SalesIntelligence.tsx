import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import {
  TrendingUp,
  TrendingDown,
  ExternalLink,
  DollarSign
} from 'lucide-react';

interface SalesIntelligenceProps {
  timeframe: string;
}

const SalesIntelligence: React.FC<SalesIntelligenceProps> = ({ timeframe }) => {
  const { data: salesData, isLoading } = useQuery({
    queryKey: ['sales-intelligence', timeframe],
    queryFn: async () => {
      try {
        const { data, error } = await supabase.functions.invoke('sales-optimization', {
          body: {
            timeframe,
            metrics: ['revenue', 'conversion', 'trends']
          }
        });
        
        if (error) throw error;
        return data;
      } catch (error) {
        console.error('Sales Intelligence API Error:', error);
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
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  const data = salesData?.data || salesData;

  return (
    <div className="space-y-8">
      {/* Revenue Analysis */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
          <DollarSign className="h-6 w-6 text-emerald-500 mr-2" />
          Revenue Analysis
        </h3>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <div className="text-center p-6 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-xl">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Total Revenue</p>
              <p className="text-4xl font-bold text-emerald-600 dark:text-emerald-400">
                ${data?.revenue_analysis?.total_revenue?.toLocaleString() || '0'}
              </p>
              <div className="flex items-center justify-center mt-2">
                <TrendingUp className="h-4 w-4 text-emerald-500 mr-1" />
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                  +{data?.revenue_analysis?.growth_rate || 0}%
                </span>
              </div>
            </div>
          </div>
          
          <div className="lg:col-span-2">
            <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Top Revenue Products</h4>
            <div className="space-y-3">
              {data?.revenue_analysis?.top_products?.map((product: any, index: number) => (
                <div key={index} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{product.name}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      ${product.revenue?.toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="h-4 w-4 text-emerald-500" />
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                      +{product.growth}%
                    </span>
                  </div>
                </div>
              )) || []}
            </div>
          </div>
        </div>
      </div>

      {/* Conversion Metrics */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
          <ExternalLink className="h-6 w-6 text-blue-500 mr-2" />
          Conversion Metrics
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Overall Rate</p>
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {((data?.conversion_metrics?.overall_rate || 0) * 100).toFixed(1)}%
            </p>
          </div>
          
          <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Email Campaigns</p>
            <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {((data?.conversion_metrics?.email_campaigns || 0) * 100).toFixed(1)}%
            </p>
          </div>
          
          <div className="text-center p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Organic Traffic</p>
            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {((data?.conversion_metrics?.organic_traffic || 0) * 100).toFixed(1)}%
            </p>
          </div>
          
          <div className="text-center p-4 bg-orange-50 dark:bg-orange-900/20 rounded-xl">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Paid Ads</p>
            <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
              {((data?.conversion_metrics?.paid_ads || 0) * 100).toFixed(1)}%
            </p>
          </div>
        </div>
      </div>

      {/* Sales Trends & Optimization */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Sales Trends */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
            <TrendingUp className="h-6 w-6 text-indigo-500 mr-2" />
            Sales Trends
          </h3>
          
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Peak Hours</h4>
              <div className="flex flex-wrap gap-2">
                {data?.sales_trends?.peak_hours?.map((hour: string, index: number) => (
                  <span key={index} className="px-3 py-1 bg-indigo-100 dark:bg-indigo-900/20 text-indigo-800 dark:text-indigo-300 rounded-full text-sm font-medium">
                    {hour}
                  </span>
                )) || []}
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Best Days</h4>
              <div className="flex flex-wrap gap-2">
                {data?.sales_trends?.best_days?.map((day: string, index: number) => (
                  <span key={index} className="px-3 py-1 bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300 rounded-full text-sm font-medium">
                    {day}
                  </span>
                )) || []}
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Seasonal Insights</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {data?.sales_trends?.seasonal_patterns || 'No data available'}
              </p>
            </div>
          </div>
        </div>

        {/* Optimization Opportunities */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
            <TrendingUp className="h-6 w-6 text-amber-500 mr-2" />
            Optimization Opportunities
          </h3>
          
          <div className="space-y-4">
            {data?.optimization_opportunities?.map((opp: any, index: number) => (
              <div key={index} className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-xl border border-amber-100 dark:border-amber-800">
                <h4 className="font-semibold text-amber-900 dark:text-amber-300 mb-2">{opp.area}</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600 dark:text-gray-400">Current</p>
                    <p className="font-medium text-gray-900 dark:text-white">{opp.current_performance}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 dark:text-gray-400">Potential</p>
                    <p className="font-medium text-gray-900 dark:text-white">{opp.potential_improvement}</p>
                  </div>
                </div>
                <p className="text-emerald-600 dark:text-emerald-400 font-semibold mt-2 text-sm">
                  Impact: {opp.estimated_revenue_impact}
                </p>
              </div>
            )) || []}
          </div>
        </div>
      </div>
    </div>
  );
};

export { SalesIntelligence };