import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import {
  BarChart3,
  TrendingUp,
  Calendar,
  Banknote,
  AlertTriangle
} from 'lucide-react';

interface PredictiveAnalyticsProps {
  timeframe: string;
}

const PredictiveAnalytics: React.FC<PredictiveAnalyticsProps> = ({ timeframe }) => {
  const { data: predictiveData, isLoading } = useQuery({
    queryKey: ['predictive-analytics', timeframe],
    queryFn: async () => {
      try {
        const { data, error } = await supabase.functions.invoke('predictive-analytics', {
          body: {
            prediction_type: 'revenue',
            horizon: '90d',
            confidence_level: 0.95
          }
        });
        
        if (error) throw error;
        return data;
      } catch (error) {
        console.error('Predictive Analytics API Error:', error);
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

  const data = predictiveData?.data || predictiveData;

  return (
    <div className="space-y-8">
      {/* Revenue Forecast */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
          <Banknote className="h-6 w-6 text-emerald-500 mr-2" />
          Revenue Forecast
        </h3>
        
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="text-center p-6 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-xl">
            <Calendar className="h-8 w-8 text-emerald-500 mx-auto mb-3" />
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Next 30 Days</p>
            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              ${(data?.revenue_forecast?.next_30_days || 0).toLocaleString()}
            </p>
          </div>
          
          <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl">
            <Calendar className="h-8 w-8 text-blue-500 mx-auto mb-3" />
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Next 60 Days</p>
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              ${(data?.revenue_forecast?.next_60_days || 0).toLocaleString()}
            </p>
          </div>
          
          <div className="text-center p-6 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl">
            <Calendar className="h-8 w-8 text-purple-500 mx-auto mb-3" />
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Next 90 Days</p>
            <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              ${(data?.revenue_forecast?.next_90_days || 0).toLocaleString()}
            </p>
          </div>
          
          <div className="text-center p-6 bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 rounded-xl">
            <TrendingUp className="h-8 w-8 text-orange-500 mx-auto mb-3" />
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Growth Rate</p>
            <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
              +{((data?.revenue_forecast?.growth_rate || 0) * 100).toFixed(1)}%
            </p>
          </div>
        </div>
        
        <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">90-Day Confidence Interval</p>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">
              Lower: ${(data?.revenue_forecast?.confidence_interval?.lower || 0).toLocaleString()}
            </span>
            <span className="text-gray-600 dark:text-gray-400">
              Upper: ${(data?.revenue_forecast?.confidence_interval?.upper || 0).toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* Demand Predictions */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
          <BarChart3 className="h-6 w-6 text-blue-500 mr-2" />
          Demand Predictions
        </h3>
        
        <div className="space-y-4">
          {data?.demand_predictions?.map((prediction: any, index: number) => {
            const trendColors = {
              increasing: 'text-emerald-600 dark:text-emerald-400',
              decreasing: 'text-red-600 dark:text-red-400',
              stable: 'text-blue-600 dark:text-blue-400'
            };
            
            return (
              <div key={index} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 dark:text-white">{prediction.product_category}</h4>
                  <div className="flex items-center space-x-4 mt-1">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Predicted: {prediction.predicted_demand} units
                    </span>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Confidence: {(prediction.confidence * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>
                
                <div className="text-right">
                  <p className={`font-semibold capitalize ${trendColors[prediction.trend as keyof typeof trendColors]}`}>
                    {prediction.trend}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Seasonality: {prediction.seasonality_factor}x
                  </p>
                </div>
              </div>
            );
          }) || []}
        </div>
      </div>

      {/* Risk Factors & Opportunities */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Risk Factors */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
            <AlertTriangle className="h-6 w-6 text-red-500 mr-2" />
            Risk Factors
          </h3>
          
          <div className="space-y-4">
            {data?.risk_factors?.map((risk: any, index: number) => (
              <div key={index} className="p-4 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-100 dark:border-red-800">
                <h4 className="font-semibold text-red-900 dark:text-red-300 mb-2">{risk.factor}</h4>
                <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                  <div>
                    <p className="text-gray-600 dark:text-gray-400">Probability</p>
                    <p className="font-medium text-red-700 dark:text-red-400">
                      {(risk.impact_probability * 100).toFixed(0)}%
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600 dark:text-gray-400">Revenue Impact</p>
                    <p className="font-medium text-red-700 dark:text-red-400">
                      {(risk.potential_revenue_impact * 100).toFixed(0)}%
                    </p>
                  </div>
                </div>
                <p className="text-xs text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 p-2 rounded">
                  <strong>Mitigation:</strong> {risk.mitigation_strategy}
                </p>
              </div>
            )) || []}
          </div>
        </div>

        {/* Opportunities */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
            <TrendingUp className="h-6 w-6 text-emerald-500 mr-2" />
            Growth Opportunities
          </h3>
          
          <div className="space-y-4">
            {data?.opportunities?.map((opportunity: any, index: number) => (
              <div key={index} className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-100 dark:border-emerald-800">
                <h4 className="font-semibold text-emerald-900 dark:text-emerald-300 mb-2">{opportunity.opportunity}</h4>
                <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                  <div>
                    <p className="text-gray-600 dark:text-gray-400">Probability</p>
                    <p className="font-medium text-emerald-700 dark:text-emerald-400">
                      {(opportunity.probability * 100).toFixed(0)}%
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600 dark:text-gray-400">Potential Uplift</p>
                    <p className="font-medium text-emerald-700 dark:text-emerald-400">
                      +{(opportunity.potential_uplift * 100).toFixed(0)}%
                    </p>
                  </div>
                </div>
                <p className="text-xs text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 p-2 rounded">
                  <strong>Recommendation:</strong> {opportunity.recommendation}
                </p>
              </div>
            )) || []}
          </div>
        </div>
      </div>
    </div>
  );
};

export { PredictiveAnalytics };