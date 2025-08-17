import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useQuery } from '@tanstack/react-query';

// PostHog integration for user behavior analytics
const POSTHOG_API_KEY = 'phc_your_api_key_here'; // This would be configured as env var

export interface AnalyticsData {
  executive: any;
  sales: any;
  customer: any;
  predictive: any;
  inventory: any;
  market: any;
  posthog?: any;
}

export const useAnalytics = () => {
  const [timeframe, setTimeframe] = useState('30d');
  const [refreshInterval, setRefreshInterval] = useState(300000); // 5 minutes

  // Executive Overview Analytics - Real Supabase + KCT API data
  const { data: executiveData, isLoading: executiveLoading, error: executiveError, refetch: refetchExecutive } = useQuery({
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

  // Sales Intelligence - Real business data analysis
  const { data: salesData, isLoading: salesLoading, refetch: refetchSales } = useQuery({
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

  // Customer Analytics - Real customer segmentation
  const { data: customerData, isLoading: customerLoading, refetch: refetchCustomer } = useQuery({
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

  // Predictive Analytics - Real trend-based predictions
  const { data: predictiveData, isLoading: predictiveLoading, refetch: refetchPredictive } = useQuery({
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

  // Inventory Optimization - Real inventory analysis
  const { data: inventoryData, isLoading: inventoryLoading, refetch: refetchInventory } = useQuery({
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

  // Market Intelligence - Real market analysis
  const { data: marketData, isLoading: marketLoading, refetch: refetchMarket } = useQuery({
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

  // PostHog User Behavior Analytics
  const { data: posthogData, isLoading: posthogLoading } = useQuery({
    queryKey: ['analytics', 'posthog', timeframe],
    queryFn: async () => {
      // Simulated PostHog data - in production this would be real PostHog API calls
      return {
        page_views: {
          total: 15420,
          unique: 8945,
          bounce_rate: 0.34,
          avg_session_duration: 245 // seconds
        },
        user_behavior: {
          most_viewed_pages: [
            { page: '/products', views: 5230, conversion_rate: 0.12 },
            { page: '/product-details', views: 3850, conversion_rate: 0.18 },
            { page: '/checkout', views: 1450, conversion_rate: 0.78 },
            { page: '/analytics', views: 890, conversion_rate: 0.95 }
          ],
          user_journey: {
            avg_pages_per_session: 4.2,
            most_common_path: 'Home → Products → Product Details → Checkout',
            dropoff_points: ['Checkout - Payment', 'Product Details - Add to Cart']
          }
        },
        ecommerce_tracking: {
          total_transactions: 342,
          revenue: 89750,
          avg_order_value: 262.43,
          cart_abandonment_rate: 0.68,
          checkout_completion_rate: 0.82
        },
        real_time: {
          current_active_users: 23,
          users_last_30_min: 67,
          top_current_pages: ['/products', '/checkout', '/analytics']
        }
      };
    },
    staleTime: 60000 // Refresh every minute for real-time data
  });

  const isLoading = executiveLoading || salesLoading || customerLoading || 
                    predictiveLoading || inventoryLoading || marketLoading || posthogLoading;

  const refreshAnalytics = () => {
    // Manually refresh all analytics data
    refetchExecutive();
    refetchSales();
    refetchCustomer();
    refetchPredictive();
    refetchInventory();
    refetchMarket();
  };

  return {
    data: {
      executive: executiveData?.data,
      sales: salesData?.data,
      customer: customerData?.data,
      predictive: predictiveData?.data,
      inventory: inventoryData?.data,
      market: marketData?.data,
      posthog: posthogData
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