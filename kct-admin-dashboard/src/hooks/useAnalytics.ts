import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { useQuery } from '@tanstack/react-query';

export interface AnalyticsData {
  executive: {
    revenue: number;
    growth: number;
    orders: number;
    conversion: number;
    insights: string[];
  };
  sales: {
    optimization_score: number;
    recommendations: Array<{
      type: string;
      impact: string;
      description: string;
      priority: 'high' | 'medium' | 'low';
    }>;
    trends: Array<{
      metric: string;
      value: number;
      change: number;
      period: string;
    }>;
  };
  customer: {
    segments: Array<{
      name: string;
      size: number;
      value: number;
      growth: number;
      characteristics: string[];
    }>;
    behavior_insights: Array<{
      insight: string;
      confidence: number;
      impact: string;
    }>;
    churn_risk: number;
  };
  predictive: {
    revenue_forecast: Array<{
      period: string;
      predicted: number;
      confidence_lower: number;
      confidence_upper: number;
    }>;
    demand_forecast: Array<{
      product: string;
      predicted_demand: number;
      seasonality_factor: number;
    }>;
    recommendations: string[];
  };
  inventory: {
    optimization_score: number;
    recommendations: Array<{
      product: string;
      current_stock: number;
      optimal_stock: number;
      action: string;
      priority: 'high' | 'medium' | 'low';
    }>;
    alerts: Array<{
      type: string;
      message: string;
      severity: 'critical' | 'warning' | 'info';
    }>;
  };
  market: {
    competitive_position: number;
    market_trends: Array<{
      trend: string;
      impact: string;
      confidence: number;
    }>;
    opportunities: Array<{
      opportunity: string;
      potential_value: number;
      timeline: string;
    }>;
    threats: Array<{
      threat: string;
      risk_level: string;
      mitigation: string;
    }>;
  };
}

export const useAnalytics = () => {
  const [timeframe, setTimeframe] = useState('30d');
  const [refreshInterval, setRefreshInterval] = useState(300000); // 5 minutes

  // Executive Overview Analytics
  const { data: executiveData, isLoading: executiveLoading, error: executiveError } = useQuery({
    queryKey: ['analytics', 'executive', timeframe],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('sales-optimization', {
        body: { timeframe, metrics: ['revenue', 'conversion', 'trends'] }
      });
      if (error) throw error;
      return data;
    },
    staleTime: refreshInterval,
    refetchInterval: refreshInterval
  });

  // Sales Intelligence
  const { data: salesData, isLoading: salesLoading } = useQuery({
    queryKey: ['analytics', 'sales', timeframe],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('sales-optimization', {
        body: { timeframe, metrics: ['optimization', 'recommendations'] }
      });
      if (error) throw error;
      return data;
    },
    staleTime: refreshInterval
  });

  // Customer Analytics
  const { data: customerData, isLoading: customerLoading } = useQuery({
    queryKey: ['analytics', 'customer', timeframe],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('customer-analytics', {
        body: { 
          analysis_type: 'behavior',
          segment_criteria: ['purchase_frequency', 'value', 'recency'],
          timeframe 
        }
      });
      if (error) throw error;
      return data;
    },
    staleTime: refreshInterval
  });

  // Predictive Analytics
  const { data: predictiveData, isLoading: predictiveLoading } = useQuery({
    queryKey: ['analytics', 'predictive', timeframe],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('predictive-analytics', {
        body: { 
          prediction_type: 'revenue',
          horizon: '90d',
          confidence_level: 0.95 
        }
      });
      if (error) throw error;
      return data;
    },
    staleTime: refreshInterval
  });

  // Inventory Optimization
  const { data: inventoryData, isLoading: inventoryLoading } = useQuery({
    queryKey: ['analytics', 'inventory', timeframe],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('inventory-optimization', {
        body: { 
          optimization_type: 'stock_levels',
          algorithms: ['abc_analysis', 'eoq', 'safety_stock']
        }
      });
      if (error) throw error;
      return data;
    },
    staleTime: refreshInterval
  });

  // Market Intelligence
  const { data: marketData, isLoading: marketLoading } = useQuery({
    queryKey: ['analytics', 'market', timeframe],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('market-intelligence', {
        body: { 
          intelligence_type: 'competitive',
          market_segments: ['menswear', 'luxury', 'online'],
          analysis_depth: 'comprehensive'
        }
      });
      if (error) throw error;
      return data;
    },
    staleTime: refreshInterval
  });

  const isLoading = executiveLoading || salesLoading || customerLoading || 
                    predictiveLoading || inventoryLoading || marketLoading;

  const refreshAnalytics = () => {
    // Trigger manual refresh of all analytics data
    // This will be handled by React Query's refetch
  };

  return {
    data: {
      executive: executiveData?.data,
      sales: salesData?.data,
      customer: customerData?.data,
      predictive: predictiveData?.data,
      inventory: inventoryData?.data,
      market: marketData?.data
    },
    isLoading,
    error: executiveError,
    timeframe,
    setTimeframe,
    refreshInterval,
    setRefreshInterval,
    refreshAnalytics
  };
};