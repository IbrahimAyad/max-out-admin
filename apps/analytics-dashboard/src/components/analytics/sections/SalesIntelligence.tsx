import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';
import { ArrowUp, ArrowDown, TrendingUp, Target, Zap, AlertTriangle, Crown, Package2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, ComposedChart, Area, Line } from 'recharts';

interface SalesIntelligenceProps {
  data: any;
  isLoading: boolean;
}

export const SalesIntelligence: React.FC<SalesIntelligenceProps> = ({ data, isLoading }) => {
  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card className="animate-pulse">
          <CardHeader>
            <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const optimizationScore = data?.optimization_score || 78;
  const productSplit = data?.product_split || {
    core_products: { count: 0, revenue: 0, revenue_percentage: 0, conversion_rate: 0, weight: '70%' },
    catalog_products: { count: 172, revenue: 0, revenue_percentage: 0, conversion_rate: 0, weight: '30%' }
  };
  const recommendations = data?.recommendations || [];
  const trends = data?.trends || [];
  const weightedRevenue = data?.weighted_revenue || 0;
  const totalRevenue = data?.revenue || 0;

  // Dual Product Architecture Data
  const productTypeData = [
    {
      type: 'Core Products',
      revenue: productSplit.core_products.revenue,
      percentage: productSplit.core_products.revenue_percentage,
      count: productSplit.core_products.count,
      conversion: productSplit.core_products.conversion_rate,
      weight: '70%',
      color: '#8B5CF6', // Premium purple
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-700',
      icon: Crown
    },
    {
      type: 'Catalog Products', 
      revenue: productSplit.catalog_products.revenue,
      percentage: productSplit.catalog_products.revenue_percentage,
      count: productSplit.catalog_products.count,
      conversion: productSplit.catalog_products.conversion_rate,
      weight: '30%',
      color: '#06B6D4', // Cyan to match ExecutiveOverview
      bgColor: 'bg-cyan-50',
      textColor: 'text-cyan-700',
      icon: Package2
    }
  ];

  const revenueComparisonData = [
    {
      name: 'Actual Revenue',
      core: productSplit.core_products.revenue,
      catalog: productSplit.catalog_products.revenue,
      total: totalRevenue
    },
    {
      name: 'Weighted Impact',
      core: productSplit.core_products.revenue * 0.7,
      catalog: productSplit.catalog_products.revenue * 0.3,
      total: weightedRevenue
    }
  ];

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-100';
    if (score >= 60) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'medium': return <Target className="h-4 w-4 text-yellow-500" />;
      default: return <Zap className="h-4 w-4 text-blue-500" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'destructive';
      case 'medium': return 'default';
      default: return 'secondary';
    }
  };

  const COLORS = ['#8B5CF6', '#3B82F6', '#10B981', '#F59E0B', '#EF4444'];

  return (
    <div className="space-y-6">
      {/* Dual Product Architecture Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Weighted Optimization Score */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-purple-600" />
              <span>Weighted Optimization Score</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <div className={`text-4xl font-bold px-4 py-3 rounded-lg ${getScoreColor(optimizationScore)} inline-block`}>
                {optimizationScore}%
              </div>
              <p className="text-sm text-gray-600 mt-2">Dual Product Performance</p>
              <p className="text-xs text-gray-500">Core: 70% • Catalog: 30%</p>
            </div>
          </CardContent>
        </Card>

        {/* Core Products Performance */}
        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-purple-900 flex items-center space-x-2">
              <Crown className="h-5 w-5 text-purple-600" />
              <span>Core Products</span>
              <Badge className="bg-purple-600 text-white">70% Weight</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-purple-700">Revenue</span>
                <span className="text-lg font-bold text-purple-900">
                  ${productSplit.core_products.revenue.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-purple-700">Share</span>
                <span className="text-lg font-bold text-purple-900">
                  {productSplit.core_products.revenue_percentage.toFixed(1)}%
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-purple-700">Products</span>
                <span className="text-lg font-bold text-purple-900">
                  {productSplit.core_products.count}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-purple-700">Conversion</span>
                <span className="text-lg font-bold text-purple-900">
                  {productSplit.core_products.conversion_rate.toFixed(1)}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Catalog Products Performance */}
        <Card className="bg-gradient-to-br from-cyan-50 to-cyan-100 border-cyan-200">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-cyan-900 flex items-center space-x-2">
              <Package2 className="h-5 w-5 text-cyan-600" />
              <span>Catalog Products</span>
              <Badge className="bg-cyan-600 text-white">30% Weight</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-cyan-700">Revenue</span>
                <span className="text-lg font-bold text-cyan-900">
                  ${productSplit.catalog_products.revenue.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-cyan-700">Share</span>
                <span className="text-lg font-bold text-cyan-900">
                  {productSplit.catalog_products.revenue_percentage.toFixed(1)}%
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-cyan-700">Products</span>
                <span className="text-lg font-bold text-cyan-900">
                  {productSplit.catalog_products.count}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-cyan-700">Conversion</span>
                <span className="text-lg font-bold text-cyan-900">
                  {productSplit.catalog_products.conversion_rate.toFixed(1)}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Analysis Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weighted Revenue Comparison */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900">
              Revenue vs Weighted Impact
            </CardTitle>
            <p className="text-sm text-gray-600">Actual vs strategically weighted performance (70/30 model)</p>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueComparisonData}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis 
                    dataKey="name" 
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
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #E5E7EB',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                    formatter={(value: any) => [`$${value.toLocaleString()}`, 'Value']}
                  />
                  <Bar dataKey="core" fill="#8B5CF6" name="Core Products" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="catalog" fill="#06B6D4" name="Catalog Products" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Product Type Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900">
              Product Architecture Overview
            </CardTitle>
            <p className="text-sm text-gray-600">Strategic importance and performance distribution</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {productTypeData.map((product, index) => {
                const IconComponent = product.icon;
                return (
                  <div key={index} className={`${product.bgColor} rounded-lg p-4 border-2 border-opacity-20`}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <IconComponent className={`h-6 w-6 ${product.textColor}`} />
                        <span className={`font-semibold ${product.textColor}`}>{product.type}</span>
                        <Badge className={product.type === 'Core Products' ? 'bg-purple-600 text-white' : 'bg-cyan-600 text-white'}>
                          {product.weight}
                        </Badge>
                      </div>
                      <span className={`text-lg font-bold ${product.textColor}`}>
                        {product.percentage.toFixed(1)}%
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className={`${product.textColor} opacity-70`}>Revenue</p>
                        <p className={`font-medium ${product.textColor}`}>
                          ${product.revenue.toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className={`${product.textColor} opacity-70`}>Products</p>
                        <p className={`font-medium ${product.textColor}`}>
                          {product.count}
                        </p>
                      </div>
                      <div>
                        <p className={`${product.textColor} opacity-70`}>Conversion</p>
                        <p className={`font-medium ${product.textColor}`}>
                          {product.conversion.toFixed(1)}%
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Trends */}
      {trends && trends.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900">
              Performance Trends
            </CardTitle>
            <p className="text-sm text-gray-600">Weighted performance metrics over time</p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {trends.map((trend: any, index: number) => (
                <div key={index} className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-900">{trend.metric}</span>
                    <div className="flex items-center space-x-1">
                      {trend.change > 0 ? (
                        <ArrowUp className="h-4 w-4 text-green-500" />
                      ) : trend.change < 0 ? (
                        <ArrowDown className="h-4 w-4 text-red-500" />
                      ) : null}
                      <span className={`text-sm font-medium ${
                        trend.change > 0 ? 'text-green-600' : 
                        trend.change < 0 ? 'text-red-600' : 'text-gray-600'
                      }`}>
                        {Math.abs(trend.change).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                  <p className="text-lg font-bold text-gray-900">
                    ${trend.value.toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-500">{trend.period}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* AI-Powered Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
            <Zap className="h-5 w-5 text-yellow-500" />
            <span>AI-Powered Dual Product Recommendations</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recommendations.length > 0 ? recommendations.map((rec: any, index: number) => (
              <div key={index} className="flex items-start space-x-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex-shrink-0">
                  {getPriorityIcon(rec.priority)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <Badge variant={getPriorityColor(rec.priority)}>
                      {rec.priority} impact
                    </Badge>
                    <span className="text-sm text-gray-500 capitalize">{rec.type}</span>
                    {rec.weight && (
                      <Badge variant="outline" className="text-xs">
                        Weight: {rec.weight}
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-gray-700 mb-2">{rec.description}</p>
                  {rec.action && (
                    <p className="text-xs text-blue-600 font-medium">{rec.action}</p>
                  )}
                  <div className="mt-3">
                    <Button size="sm" variant="outline">
                      Implement
                    </Button>
                  </div>
                </div>
              </div>
            )) : (
              <div className="text-center py-8 text-gray-500">
                <p>No recommendations available yet.</p>
                <p className="text-sm">Data will appear as the system processes more analytics.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};