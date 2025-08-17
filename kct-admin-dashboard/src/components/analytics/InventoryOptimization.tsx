import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import {
  Package,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  Clock
} from 'lucide-react';

interface InventoryOptimizationProps {
  timeframe: string;
}

const InventoryOptimization: React.FC<InventoryOptimizationProps> = ({ timeframe }) => {
  const { data: inventoryData, isLoading } = useQuery({
    queryKey: ['inventory-optimization', timeframe],
    queryFn: async () => {
      try {
        const { data, error } = await supabase.functions.invoke('inventory-optimization', {
          body: {
            optimization_type: 'stock_levels',
            algorithms: ['abc_analysis', 'eoq', 'safety_stock'],
            constraints: {
              budget: 50000,
              storage: 1000,
              seasonality: true
            }
          }
        });
        
        if (error) throw error;
        return data;
      } catch (error) {
        console.error('Inventory Optimization API Error:', error);
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

  const data = inventoryData?.data || inventoryData;

  return (
    <div className="space-y-8">
      {/* Inventory Health Overview */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
          <Package className="h-6 w-6 text-blue-500 mr-2" />
          Inventory Health Overview
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Total Value</p>
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              ${(data?.inventory_health?.total_value || 0).toLocaleString()}
            </p>
          </div>
          
          <div className="text-center p-6 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-xl">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Turnover Rate</p>
            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {data?.inventory_health?.turnover_rate || 0}x
            </p>
          </div>
          
          <div className="text-center p-6 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-xl">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Stockout Risk</p>
            <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
              {((data?.inventory_health?.stockout_risk || 0) * 100).toFixed(1)}%
            </p>
          </div>
          
          <div className="text-center p-6 bg-gradient-to-br from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20 rounded-xl">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Overstock Value</p>
            <p className="text-2xl font-bold text-red-600 dark:text-red-400">
              ${(data?.inventory_health?.overstock_value || 0).toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {/* ABC Analysis */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
          <TrendingUp className="h-6 w-6 text-purple-500 mr-2" />
          ABC Analysis
        </h3>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* A Items */}
          <div className="p-6 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-bold text-purple-900 dark:text-purple-300">A Items (High Value)</h4>
              <span className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {data?.abc_analysis?.a_items?.count || 0}
              </span>
            </div>
            <p className="text-sm text-purple-700 dark:text-purple-400 mb-4">
              {((data?.abc_analysis?.a_items?.value_percentage || 0) * 100).toFixed(0)}% of total value
            </p>
            <div className="space-y-2">
              {data?.abc_analysis?.a_items?.products?.map((product: string, index: number) => (
                <div key={index} className="text-xs bg-white dark:bg-gray-700 text-purple-800 dark:text-purple-300 px-2 py-1 rounded">
                  {product}
                </div>
              )) || []}
            </div>
          </div>
          
          {/* B Items */}
          <div className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-bold text-blue-900 dark:text-blue-300">B Items (Medium Value)</h4>
              <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {data?.abc_analysis?.b_items?.count || 0}
              </span>
            </div>
            <p className="text-sm text-blue-700 dark:text-blue-400 mb-4">
              {((data?.abc_analysis?.b_items?.value_percentage || 0) * 100).toFixed(0)}% of total value
            </p>
            <div className="space-y-2">
              {data?.abc_analysis?.b_items?.products?.map((product: string, index: number) => (
                <div key={index} className="text-xs bg-white dark:bg-gray-700 text-blue-800 dark:text-blue-300 px-2 py-1 rounded">
                  {product}
                </div>
              )) || []}
            </div>
          </div>
          
          {/* C Items */}
          <div className="p-6 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-xl">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-bold text-emerald-900 dark:text-emerald-300">C Items (Low Value)</h4>
              <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                {data?.abc_analysis?.c_items?.count || 0}
              </span>
            </div>
            <p className="text-sm text-emerald-700 dark:text-emerald-400 mb-4">
              {((data?.abc_analysis?.c_items?.value_percentage || 0) * 100).toFixed(0)}% of total value
            </p>
            <div className="space-y-2">
              {data?.abc_analysis?.c_items?.products?.map((product: string, index: number) => (
                <div key={index} className="text-xs bg-white dark:bg-gray-700 text-emerald-800 dark:text-emerald-300 px-2 py-1 rounded">
                  {product}
                </div>
              )) || []}
            </div>
          </div>
        </div>
      </div>

      {/* Reorder Recommendations */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
          <Clock className="h-6 w-6 text-orange-500 mr-2" />
          Reorder Recommendations
        </h3>
        
        <div className="space-y-4">
          {data?.reorder_recommendations?.map((item: any, index: number) => {
            const urgencyColors = {
              high: 'border-red-500 bg-red-50 dark:bg-red-900/20',
              medium: 'border-amber-500 bg-amber-50 dark:bg-amber-900/20',
              low: 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
            };
            
            const urgencyTextColors = {
              high: 'text-red-800 dark:text-red-300',
              medium: 'text-amber-800 dark:text-amber-300',
              low: 'text-emerald-800 dark:text-emerald-300'
            };
            
            return (
              <div key={index} className={`p-6 rounded-xl border-l-4 ${urgencyColors[item.urgency as keyof typeof urgencyColors]}`}>
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h4 className="font-bold text-gray-900 dark:text-white text-lg">{item.product_name}</h4>
                    <p className={`text-sm font-medium ${urgencyTextColors[item.urgency as keyof typeof urgencyTextColors]}`}>
                      {item.urgency.toUpperCase()} PRIORITY
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Estimated Stockout</p>
                    <p className="font-semibold text-gray-900 dark:text-white">{item.estimated_stockout_date}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600 dark:text-gray-400">Current Stock</p>
                    <p className="font-semibold text-gray-900 dark:text-white">{item.current_stock}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 dark:text-gray-400">Optimal Stock</p>
                    <p className="font-semibold text-gray-900 dark:text-white">{item.optimal_stock}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 dark:text-gray-400">Reorder Qty</p>
                    <p className="font-semibold text-emerald-600 dark:text-emerald-400">{item.reorder_quantity}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 dark:text-gray-400">EOQ</p>
                    <p className="font-semibold text-gray-900 dark:text-white">{item.eoq}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 dark:text-gray-400">Safety Stock</p>
                    <p className="font-semibold text-gray-900 dark:text-white">{item.safety_stock}</p>
                  </div>
                </div>
              </div>
            );
          }) || []}
        </div>
      </div>

      {/* Optimization Insights */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
          <CheckCircle className="h-6 w-6 text-emerald-500 mr-2" />
          Optimization Insights
        </h3>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="text-center p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Potential Savings</p>
            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              ${(data?.optimization_insights?.potential_savings || 0).toLocaleString()}
            </p>
          </div>
          
          <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Inventory Reduction</p>
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {((data?.optimization_insights?.inventory_reduction || 0) * 100).toFixed(0)}%
            </p>
          </div>
          
          <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Service Level Improvement</p>
            <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              +{((data?.optimization_insights?.service_level_improvement || 0) * 100).toFixed(0)}%
            </p>
          </div>
        </div>
        
        <div>
          <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Recommended Actions</h4>
          <div className="space-y-2">
            {data?.optimization_insights?.recommended_actions?.map((action: string, index: number) => (
              <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <CheckCircle className="h-5 w-5 text-emerald-500 flex-shrink-0" />
                <span className="text-sm text-gray-700 dark:text-gray-300">{action}</span>
              </div>
            )) || []}
          </div>
        </div>
      </div>
    </div>
  );
};

export { InventoryOptimization };