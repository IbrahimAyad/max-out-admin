import React, { useState, useEffect } from 'react';
import { Order, OrderStatus, OrderPriority, ProductSource, CORE_PRODUCTS_CONFIG } from '../../config/orders';
import { supabase } from '../../lib/supabase';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { TrendingUp, Package, Users, DollarSign, Clock, AlertTriangle, Crown, Star } from 'lucide-react';

interface CoreProductsIntegrationProps {
  orders: Order[];
}

interface CoreProductsData {
  product_architecture: {
    core_products: {
      count: number;
      weight: number;
      revenue: number;
      orders: number;
    };
    catalog_products: {
      count: number;
      weight: number;
      revenue: number;
      orders: number;
    };
    total_revenue: number;
    weighted_revenue: number;
  };
  customer_intelligence: {
    style_leaders: {
      count: number;
      profiles: any[];
      avg_order_value: number;
    };
    segments: {
      core_focused: { count: number; percentage: string };
      catalog_focused: { count: number; percentage: string };
      hybrid_buyers: { count: number; percentage: string };
    };
  };
  revenue_analytics: {
    core_share: string;
    catalog_share: string;
    weighted_performance: {
      score: number;
      interpretation: string;
    };
  };
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

export function CoreProductsIntegration({ orders }: CoreProductsIntegrationProps) {
  const [coreProductsData, setCoreProductsData] = useState<CoreProductsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCoreProductsData();
  }, []);

  const fetchCoreProductsData = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke('core-products-integration');
      
      if (error) throw error;
      
      setCoreProductsData(data.data);
    } catch (err) {
      console.error('Error fetching core products data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch core products data');
    } finally {
      setLoading(false);
    }
  };

  // Calculate local statistics from orders
  const localStats = React.useMemo(() => {
    const coreOrders = orders.filter(order => 
      order.order_items?.some(item => item.product_source === ProductSource.CORE_STRIPE)
    );
    const catalogOrders = orders.filter(order => 
      order.order_items?.some(item => item.product_source === ProductSource.CATALOG_SUPABASE)
    );
    
    const coreRevenue = coreOrders.reduce((sum, order) => sum + order.total_amount, 0);
    const catalogRevenue = catalogOrders.reduce((sum, order) => sum + order.total_amount, 0);
    
    return {
      coreOrders: coreOrders.length,
      catalogOrders: catalogOrders.length,
      coreRevenue,
      catalogRevenue,
      totalRevenue: coreRevenue + catalogRevenue,
      avgCoreOrderValue: coreOrders.length > 0 ? coreRevenue / coreOrders.length : 0,
      avgCatalogOrderValue: catalogOrders.length > 0 ? catalogRevenue / catalogOrders.length : 0
    };
  }, [orders]);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Core Products Data</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchCoreProductsData}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const architectureData = [
    {
      name: 'Core Products (Stripe)',
      orders: coreProductsData?.product_architecture.core_products.orders || localStats.coreOrders,
      revenue: coreProductsData?.product_architecture.core_products.revenue || localStats.coreRevenue,
      weight: CORE_PRODUCTS_CONFIG.WEIGHT,
      color: '#3B82F6'
    },
    {
      name: 'Catalog Products (Supabase)',
      orders: coreProductsData?.product_architecture.catalog_products.orders || localStats.catalogOrders,
      revenue: coreProductsData?.product_architecture.catalog_products.revenue || localStats.catalogRevenue,
      weight: 1 - CORE_PRODUCTS_CONFIG.WEIGHT,
      color: '#10B981'
    }
  ];

  const revenueShareData = [
    {
      name: 'Core Products',
      value: parseFloat(coreProductsData?.revenue_analytics.core_share || '0'),
      revenue: coreProductsData?.product_architecture.core_products.revenue || localStats.coreRevenue
    },
    {
      name: 'Catalog Products',
      value: parseFloat(coreProductsData?.revenue_analytics.catalog_share || '0'),
      revenue: coreProductsData?.product_architecture.catalog_products.revenue || localStats.catalogRevenue
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg shadow-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-2">Dual Product Architecture</h2>
            <p className="text-blue-100">
              Intelligent management of 66 Core Products (Stripe) + 150+ Catalog Products (Supabase)
            </p>
          </div>
          <Crown className="h-12 w-12 text-yellow-300" />
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Package className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Core Products Orders</p>
              <p className="text-2xl font-bold text-gray-900">
                {coreProductsData?.product_architecture.core_products.orders || localStats.coreOrders}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <DollarSign className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Core Revenue</p>
              <p className="text-2xl font-bold text-gray-900">
                ${((coreProductsData?.product_architecture.core_products.revenue || localStats.coreRevenue) / 1000).toFixed(1)}K
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Users className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Style Leaders</p>
              <p className="text-2xl font-bold text-gray-900">
                {coreProductsData?.customer_intelligence.style_leaders.count || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <TrendingUp className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Weighted Performance</p>
              <p className="text-2xl font-bold text-gray-900">
                {coreProductsData?.revenue_analytics.weighted_performance.score.toFixed(1) || '0.0'}%
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Revenue Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue Share</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={revenueShareData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={120}
                paddingAngle={5}
                dataKey="value"
              >
                {revenueShareData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => [`${value}%`, 'Share']} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Product Architecture Comparison</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={architectureData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
              <YAxis />
              <Tooltip 
                formatter={(value, name) => {
                  if (name === 'orders') return [value, 'Orders'];
                  if (name === 'revenue') return [`$${(value as number / 1000).toFixed(1)}K`, 'Revenue'];
                  return [value, name];
                }}
              />
              <Legend />
              <Bar dataKey="orders" fill="#3B82F6" name="Orders" />
              <Bar dataKey="revenue" fill="#10B981" name="Revenue" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Customer Intelligence */}
      {coreProductsData?.customer_intelligence && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Customer Intelligence</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="border rounded-lg p-4">
              <div className="flex items-center mb-2">
                <Star className="h-5 w-5 text-yellow-500 mr-2" />
                <span className="font-medium text-gray-900">Core-Focused Customers</span>
              </div>
              <div className="text-2xl font-bold text-blue-600">
                {coreProductsData.customer_intelligence.segments.core_focused.count}
              </div>
              <div className="text-sm text-gray-600">
                {coreProductsData.customer_intelligence.segments.core_focused.percentage}% of total
              </div>
            </div>

            <div className="border rounded-lg p-4">
              <div className="flex items-center mb-2">
                <Package className="h-5 w-5 text-green-500 mr-2" />
                <span className="font-medium text-gray-900">Catalog-Focused</span>
              </div>
              <div className="text-2xl font-bold text-green-600">
                {coreProductsData.customer_intelligence.segments.catalog_focused.count}
              </div>
              <div className="text-sm text-gray-600">
                {coreProductsData.customer_intelligence.segments.catalog_focused.percentage}% of total
              </div>
            </div>

            <div className="border rounded-lg p-4">
              <div className="flex items-center mb-2">
                <Crown className="h-5 w-5 text-purple-500 mr-2" />
                <span className="font-medium text-gray-900">Hybrid Buyers</span>
              </div>
              <div className="text-2xl font-bold text-purple-600">
                {coreProductsData.customer_intelligence.segments.hybrid_buyers.count}
              </div>
              <div className="text-sm text-gray-600">
                {coreProductsData.customer_intelligence.segments.hybrid_buyers.percentage}% of total
              </div>
            </div>
          </div>

          {/* Style Leaders */}
          {coreProductsData.customer_intelligence.style_leaders.profiles.length > 0 && (
            <div className="mt-6">
              <h4 className="text-md font-semibold text-gray-900 mb-3">Top Style Leaders</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {coreProductsData.customer_intelligence.style_leaders.profiles.slice(0, 6).map((leader, index) => (
                  <div key={index} className="border rounded-lg p-3 bg-gray-50">
                    <div className="font-medium text-gray-900">{leader.email}</div>
                    <div className="text-sm text-gray-600">
                      Total Value: ${leader.totalValue.toFixed(2)}
                    </div>
                    <div className="text-sm text-gray-600">
                      Core Orders: {leader.coreOrders} | Catalog: {leader.catalogOrders}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Strategic Insights */}
      <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Strategic Insights</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Core Products Strategy</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• 70% weight in dual architecture emphasizes premium positioning</li>
              <li>• Focus on suits, tuxedos, and formal wear drives higher AOV</li>
              <li>• Style leaders show strong preference for Core Products</li>
              <li>• Bundle offerings increase average order value significantly</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Optimization Opportunities</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Convert catalog customers to Core Products through styling</li>
              <li>• Develop more wedding party packages for group orders</li>
              <li>• Implement personalized recommendations based on purchase history</li>
              <li>• Create loyalty programs for hybrid buyers</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}