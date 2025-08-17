import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Badge } from '../../ui/badge';
import { TrendingUp, TrendingDown, DollarSign, ShoppingBag, Users, Target, Crown, Package2 } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';

interface ExecutiveOverviewProps {
  data: any;
  isLoading: boolean;
}

export const ExecutiveOverview: React.FC<ExecutiveOverviewProps> = ({ data, isLoading }) => {
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="space-y-0 pb-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-full"></div>
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[...Array(2)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-6 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-64 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Extract dual-product data with fallbacks
  const coreProducts = data?.core_products || {};
  const catalogProducts = data?.catalog_products || {};
  const combined = data?.combined_metrics || {};
  
  const kpiData = [
    {
      title: 'Total Revenue (Weighted)',
      value: combined?.total_revenue || '$0',
      change: combined?.revenue_growth || 0,
      icon: DollarSign,
      color: 'text-green-600',
      breakdown: {
        core: coreProducts?.revenue || '$0',
        catalog: catalogProducts?.revenue || '$0'
      }
    },
    {
      title: 'Total Orders',
      value: combined?.total_orders || '0',
      change: combined?.order_growth || 0,
      icon: ShoppingBag,
      color: 'text-blue-600',
      breakdown: {
        core: coreProducts?.orders || '0',
        catalog: catalogProducts?.orders || '0'
      }
    },
    {
      title: 'Active Customers',
      value: combined?.active_customers || '0',
      change: combined?.customer_growth || 0,
      icon: Users,
      color: 'text-purple-600',
      breakdown: {
        core: coreProducts?.customers || '0',
        catalog: catalogProducts?.customers || '0'
      }
    },
    {
      title: 'Weighted Performance',
      value: `${combined?.performance_score || 0}`,
      change: combined?.performance_change || 0,
      icon: Target,
      color: 'text-orange-600',
      breakdown: {
        core: `${coreProducts?.score || 0} (70%)`,
        catalog: `${catalogProducts?.score || 0} (30%)`
      }
    }
  ];

  // Product distribution data for pie chart
  const productDistribution = [
    { name: 'Core Products', value: coreProducts?.revenue_value || 0, color: '#8B5CF6' },
    { name: 'Catalog Products', value: catalogProducts?.revenue_value || 0, color: '#06B6D4' }
  ];

  const trendData = data?.trend_data || [
    { date: '2025-01', core_revenue: 31500, catalog_revenue: 13500, core_orders: 42, catalog_orders: 78 },
    { date: '2025-02', core_revenue: 36400, catalog_revenue: 15600, core_orders: 47, catalog_orders: 88 },
    { date: '2025-03', core_revenue: 33600, catalog_revenue: 14400, core_orders: 45, catalog_orders: 83 },
    { date: '2025-04', core_revenue: 42700, catalog_revenue: 18300, core_orders: 54, catalog_orders: 101 },
    { date: '2025-05', core_revenue: 38500, catalog_revenue: 16500, core_orders: 50, catalog_orders: 92 },
    { date: '2025-06', core_revenue: 46900, catalog_revenue: 20100, core_orders: 58, catalog_orders: 110 }
  ];

  // Calculate combined revenue for trend chart
  const combinedTrendData = trendData.map(item => ({
    ...item,
    total_revenue: (item.core_revenue * 0.7) + (item.catalog_revenue * 0.3),
    total_orders: item.core_orders + item.catalog_orders
  }));

  return (
    <div className="space-y-6">
      {/* KPI Cards with Dual-Product Architecture */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpiData.map((kpi, index) => {
          const Icon = kpi.icon;
          const isPositive = kpi.change >= 0;
          
          return (
            <Card key={index} className="relative overflow-hidden hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  {kpi.title}
                </CardTitle>
                <Icon className={`h-5 w-5 ${kpi.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900 mb-2">
                  {kpi.value}
                </div>
                <div className="flex items-center space-x-1 mb-3">
                  {isPositive ? (
                    <TrendingUp className="h-4 w-4 text-green-500" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-500" />
                  )}
                  <span className={`text-sm font-medium ${
                    isPositive ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {Math.abs(kpi.change)}%
                  </span>
                  <span className="text-sm text-gray-500">vs last period</span>
                </div>
                
                {/* Product Breakdown */}
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="flex items-center space-x-1">
                      <Crown className="h-3 w-3 text-purple-500" />
                      <span className="text-gray-600">Core:</span>
                    </span>
                    <span className="font-medium text-purple-700">{kpi.breakdown.core}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="flex items-center space-x-1">
                      <Package2 className="h-3 w-3 text-cyan-500" />
                      <span className="text-gray-600">Catalog:</span>
                    </span>
                    <span className="font-medium text-cyan-700">{kpi.breakdown.catalog}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Product Architecture Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
              <DollarSign className="h-5 w-5 text-green-600" />
              <span>Revenue Distribution</span>
            </CardTitle>
            <p className="text-sm text-gray-600">Core Products vs Catalog Products</p>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={productDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {productDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number) => [
                      `$${value.toLocaleString()}`, 'Revenue'
                    ]}
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #E5E7EB',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center space-x-6 mt-4">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-purple-500 rounded"></div>
                <span className="text-sm text-gray-600">Core Products (70% weight)</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-cyan-500 rounded"></div>
                <span className="text-sm text-gray-600">Catalog Products (30% weight)</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Performance Comparison */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
              <Target className="h-5 w-5 text-orange-600" />
              <span>Performance Metrics</span>
            </CardTitle>
            <p className="text-sm text-gray-600">Core vs Catalog comparison</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg border border-purple-100">
                <div className="flex items-center space-x-2">
                  <Crown className="h-4 w-4 text-purple-600" />
                  <span className="font-medium text-purple-800">Core Products</span>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-purple-800">{coreProducts?.performance || '85%'}</div>
                  <div className="text-xs text-purple-600">Performance Score</div>
                </div>
              </div>
              
              <div className="flex justify-between items-center p-3 bg-cyan-50 rounded-lg border border-cyan-100">
                <div className="flex items-center space-x-2">
                  <Package2 className="h-4 w-4 text-cyan-600" />
                  <span className="font-medium text-cyan-800">Catalog Products</span>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-cyan-800">{catalogProducts?.performance || '72%'}</div>
                  <div className="text-xs text-cyan-600">Performance Score</div>
                </div>
              </div>
              
              <div className="flex justify-between items-center p-3 bg-gradient-to-r from-purple-50 to-cyan-50 rounded-lg border border-gray-200">
                <div className="flex items-center space-x-2">
                  <Target className="h-4 w-4 text-gray-700" />
                  <span className="font-medium text-gray-800">Weighted Average</span>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-gray-800">{combined?.weighted_performance || '81%'}</div>
                  <div className="text-xs text-gray-600">Combined Score</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Dual-Product Revenue Trend Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900">
            Dual-Product Revenue Trends
          </CardTitle>
          <p className="text-sm text-gray-600">Core Products vs Catalog Products performance over time</p>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="coreGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="catalogGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06B6D4" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#06B6D4" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis 
                  dataKey="date" 
                  className="text-sm text-gray-600"
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis 
                  className="text-sm text-gray-600"
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                />
                <Tooltip 
                  formatter={(value: number, name: string) => [
                    `$${value.toLocaleString()}`, 
                    name === 'core_revenue' ? 'Core Products' : 'Catalog Products'
                  ]}
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #E5E7EB',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="core_revenue" 
                  stackId="1"
                  stroke="#8B5CF6" 
                  strokeWidth={2}
                  fill="url(#coreGradient)"
                />
                <Area 
                  type="monotone" 
                  dataKey="catalog_revenue" 
                  stackId="1"
                  stroke="#06B6D4" 
                  strokeWidth={2}
                  fill="url(#catalogGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center space-x-6 mt-4">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-purple-500 rounded"></div>
              <span className="text-sm text-gray-600">Core Products Revenue</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-cyan-500 rounded"></div>
              <span className="text-sm text-gray-600">Catalog Products Revenue</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* AI-Powered Dual-Product Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900">
            AI-Powered Dual-Product Insights
          </CardTitle>
          <p className="text-sm text-gray-600">Advanced analytics with 70/30 weighted scoring</p>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {(data?.insights || [
              'Core Products are driving 70% of weighted revenue growth, with luxury menswear showing exceptional performance.',
              'The 70/30 weighting strategy optimally balances high-value Core Products with volume-driven Catalog sales.',
              'Core Product customers show 3.2x higher lifetime value, justifying the enhanced weighting model.',
              'Catalog Products provide essential market reach, contributing 45% of new customer acquisitions.',
              'Combined analytics suggest Core Products expansion could boost weighted performance by 15%.'
            ]).map((insight: string, index: number) => {
              const isCore = insight.toLowerCase().includes('core');
              const isCatalog = insight.toLowerCase().includes('catalog');
              const bgColor = isCore ? 'bg-purple-50 border-purple-100' : 
                              isCatalog ? 'bg-cyan-50 border-cyan-100' : 
                              'bg-blue-50 border-blue-100';
              const dotColor = isCore ? 'bg-purple-500' : 
                              isCatalog ? 'bg-cyan-500' : 
                              'bg-blue-500';
              
              return (
                <div key={index} className={`flex items-start space-x-3 p-4 rounded-lg border ${bgColor}`}>
                  <div className={`flex-shrink-0 w-2 h-2 ${dotColor} rounded-full mt-2`}></div>
                  <p className="text-sm text-gray-700 font-medium">{insight}</p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};