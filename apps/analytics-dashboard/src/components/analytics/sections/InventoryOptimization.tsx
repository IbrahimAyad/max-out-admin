import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';
import { Package, AlertTriangle, TrendingDown, TrendingUp, Clock, CheckCircle, Crown, Database, Layers } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, ComposedChart } from 'recharts';

interface InventoryOptimizationProps {
  data: any;
  isLoading: boolean;
}

export const InventoryOptimization: React.FC<InventoryOptimizationProps> = ({ data, isLoading }) => {
  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card className="animate-pulse">
          <CardHeader>
            <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          </CardHeader>
          <CardContent>
            <div className="h-32 bg-gray-200 rounded"></div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const optimizationScore = data?.optimization_score || 73;
  const productInventoryAnalysis = data?.product_inventory_analysis || {
    core_products: {
      count: 0,
      inventory_management: 'Stripe Platform',
      avg_sales_velocity: 0,
      performance_score: 0,
      revenue_contribution: 0,
      weight: '70%'
    },
    catalog_products: {
      count: 172,
      inventory_management: 'Supabase Database',
      low_stock_count: 0,
      out_of_stock_count: 0,
      stock_health_score: 0,
      revenue_contribution: 0,
      weight: '30%'
    },
    combined_metrics: {
      total_products: 172,
      weighted_optimization_score: 73,
      total_revenue: 0,
      revenue_split: { core_percentage: 0, catalog_percentage: 0 }
    }
  };
  const recommendations = data?.recommendations || [];
  const alerts = data?.alerts || [];
  const turnoverAnalysis = data?.turnover_analysis || [];
  const abcDistribution = data?.abc_distribution || [];

  // Dual platform inventory data
  const inventoryPlatforms = [
    {
      name: 'Core Products',
      platform: 'Stripe Platform',
      count: productInventoryAnalysis.core_products.count,
      management: 'API-Based',
      performance: productInventoryAnalysis.core_products.performance_score,
      weight: '70%',
      color: '#8B5CF6',
      icon: Crown,
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200',
      textColor: 'text-purple-900'
    },
    {
      name: 'Catalog Products',
      platform: 'Supabase Database',
      count: productInventoryAnalysis.catalog_products.count,
      management: 'Direct Control',
      performance: productInventoryAnalysis.catalog_products.stock_health_score,
      weight: '30%',
      color: '#06B6D4',
      icon: Database,
      bgColor: 'bg-cyan-50',
      borderColor: 'border-cyan-200',
      textColor: 'text-cyan-900'
    }
  ];

  // Enhanced turnover data with platform distinction
  const enhancedTurnoverData = turnoverAnalysis.map((item: any) => ({
    ...item,
    category: item.category,
    turnover: item.turnover,
    target: item.target,
    efficiency: item.efficiency,
    management: item.management || 'Mixed',
    weight: item.weight || 'Balanced'
  }));

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return <AlertTriangle className="h-5 w-5 text-red-500" />;
      case 'warning': return <Clock className="h-5 w-5 text-yellow-500" />;
      case 'info': return <CheckCircle className="h-5 w-5 text-blue-500" />;
      default: return <Package className="h-5 w-5 text-gray-500" />;
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-100';
    if (score >= 60) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getProductTypeColor = (productType: string) => {
    if (productType?.includes('Core')) return 'bg-purple-50 border-purple-200 text-purple-900';
    if (productType?.includes('Catalog')) return 'bg-cyan-50 border-cyan-200 text-cyan-900';
    return 'bg-gray-50 border-gray-200 text-gray-900';
  };

  return (
    <div className="space-y-6">
      {/* Dual Platform Inventory Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
              <Layers className="h-5 w-5 text-purple-600" />
              <span>Weighted Optimization</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className={`text-3xl font-bold px-4 py-2 rounded-lg ${getScoreColor(optimizationScore)}`}>
                {optimizationScore}%
              </div>
              <Package className="h-8 w-8 text-purple-600" />
            </div>
            <p className="text-sm text-gray-600 mt-2">
              Core: 70% • Catalog: 30%
            </p>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900">
              Dual Platform Inventory Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {inventoryPlatforms.map((platform, index) => {
                const IconComponent = platform.icon;
                return (
                  <div key={index} className={`p-4 rounded-lg border-2 ${platform.bgColor} ${platform.borderColor}`}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <IconComponent className="h-5 w-5" style={{ color: platform.color }} />
                        <span className={`font-semibold ${platform.textColor}`}>{platform.name}</span>
                      </div>
                      <Badge className={platform.name === 'Core Products' ? 'bg-purple-600 text-white' : 'bg-cyan-600 text-white'}>
                        {platform.weight}
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className={`text-sm ${platform.textColor} opacity-80`}>Products:</span>
                        <span className={`font-medium ${platform.textColor}`}>{platform.count}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className={`text-sm ${platform.textColor} opacity-80`}>Platform:</span>
                        <span className={`font-medium ${platform.textColor}`}>{platform.management}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className={`text-sm ${platform.textColor} opacity-80`}>Performance:</span>
                        <span className={`font-medium ${platform.textColor}`}>{platform.performance.toFixed(0)}%</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Alerts with Product Type Context */}
      {alerts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900">
              Inventory Alerts
            </CardTitle>
            <p className="text-sm text-gray-600">Critical notifications across both inventory platforms</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {alerts.map((alert: any, index: number) => (
                <div key={index} className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg">
                  {getSeverityIcon(alert.severity)}
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{alert.message}</p>
                    <div className="flex items-center space-x-2 mt-1">
                      <p className="text-xs text-gray-500 capitalize">{alert.type?.replace('_', ' ')}</p>
                      {alert.affects && (
                        <Badge variant="outline" className="text-xs">
                          {alert.affects}
                        </Badge>
                      )}
                      {alert.weight_impact && (
                        <Badge variant="secondary" className="text-xs">
                          {alert.weight_impact}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <Button size="sm" variant="outline">
                    Review
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Enhanced Turnover Analysis */}
      {enhancedTurnoverData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900">
              Dual Platform Turnover Analysis
            </CardTitle>
            <p className="text-sm text-gray-600">Performance across Stripe and Supabase inventory systems</p>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={enhancedTurnoverData}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis 
                    dataKey="category" 
                    className="text-sm text-gray-600"
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis 
                    className="text-sm text-gray-600"
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #E5E7EB',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                    formatter={(value: any, name: string, props: any) => {
                      const item = props.payload;
                      return [
                        value,
                        name,
                        `Management: ${item.management || 'Mixed'}`,
                        `Weight: ${item.weight || 'Balanced'}`
                      ];
                    }}
                  />
                  <Bar dataKey="turnover" fill="#8B5CF6" radius={[4, 4, 0, 0]} name="Actual Turnover" />
                  <Bar dataKey="target" fill="#06B6D4" radius={[4, 4, 0, 0]} name="Target Turnover" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
              {enhancedTurnoverData.slice(0, 3).map((item: any, index: number) => (
                <div key={index} className="text-center p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm font-medium text-gray-900">{item.category}</p>
                  <p className={`text-lg font-bold ${item.efficiency >= 100 ? 'text-green-600' : 'text-red-600'}`}>
                    {item.efficiency}%
                  </p>
                  <div className="flex justify-center space-x-2 mt-1">
                    <Badge variant="outline" className="text-xs">{item.weight}</Badge>
                    <Badge variant="secondary" className="text-xs">{item.management}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Enhanced ABC Analysis & Revenue Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {abcDistribution.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900">
                Enhanced ABC Distribution
              </CardTitle>
              <p className="text-sm text-gray-600">Product classification with dual architecture context</p>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={abcDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {abcDistribution.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: any, name: string, props: any) => [
                        `${value}%`, 
                        props.payload.category,
                        props.payload.description
                      ]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 space-y-2">
                {abcDistribution.map((item: any, index: number) => (
                  <div key={index} className="flex items-center justify-between text-sm p-2 bg-gray-50 rounded">
                    <div className="flex items-center space-x-2">
                      <div 
                        className="w-3 h-3 rounded"
                        style={{ backgroundColor: item.color }}
                      ></div>
                      <span className="font-medium">{item.category}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-medium">{item.value}% value</span>
                      <span className="text-gray-500 ml-2">({item.count}% count)</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900">
              Revenue Impact Analysis
            </CardTitle>
            <p className="text-sm text-gray-600">Weighted revenue contribution by product type</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <Crown className="h-5 w-5 text-purple-600" />
                    <span className="font-semibold text-purple-900">Core Products</span>
                  </div>
                  <Badge className="bg-purple-600 text-white">70% Weight</Badge>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-purple-700">Revenue Contribution</p>
                    <p className="text-lg font-bold text-purple-900">
                      ${productInventoryAnalysis.core_products.revenue_contribution.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-purple-700">Performance Score</p>
                    <p className="text-lg font-bold text-purple-900">
                      {productInventoryAnalysis.core_products.performance_score.toFixed(0)}%
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="bg-cyan-50 border border-cyan-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <Database className="h-5 w-5 text-cyan-600" />
                    <span className="font-semibold text-cyan-900">Catalog Products</span>
                  </div>
                  <Badge className="bg-cyan-600 text-white">30% Weight</Badge>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-cyan-700">Revenue Contribution</p>
                    <p className="text-lg font-bold text-cyan-900">
                      ${productInventoryAnalysis.catalog_products.revenue_contribution.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-cyan-700">Stock Health Score</p>
                    <p className="text-lg font-bold text-cyan-900">
                      {productInventoryAnalysis.catalog_products.stock_health_score.toFixed(0)}%
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-gray-900">Total Weighted Performance</span>
                  <Badge variant="outline">{productInventoryAnalysis.combined_metrics.weighted_optimization_score}%</Badge>
                </div>
                <div className="text-sm text-gray-600">
                  Combined optimization score across both inventory platforms
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Optimization Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900">
            AI Dual Platform Recommendations
          </CardTitle>
          <p className="text-sm text-gray-600">Platform-specific optimization strategies</p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recommendations.length > 0 ? recommendations.map((rec: any, index: number) => {
              const stockDiff = rec.optimal_stock ? rec.optimal_stock - rec.current_stock : 0;
              const isIncrease = stockDiff > 0;
              const isCore = rec.product_type === 'Core Product';
              
              return (
                <div key={index} className={`p-4 border-2 rounded-lg hover:bg-gray-50 transition-colors ${
                  getProductTypeColor(rec.product_type)
                }`}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-start space-x-3">
                      {isCore ? <Crown className="h-5 w-5 text-purple-600 mt-0.5" /> : 
                       <Database className="h-5 w-5 text-cyan-600 mt-0.5" />}
                      <div>
                        <h4 className="font-medium text-gray-900">{rec.product}</h4>
                        <p className="text-sm text-gray-600 mt-1">{rec.reason}</p>
                        <div className="flex items-center space-x-2 mt-2">
                          <Badge variant="outline" className="text-xs">
                            {rec.product_type || 'Standard Product'}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {rec.inventory_management || 'Supabase'}
                          </Badge>
                          {rec.weight && (
                            <Badge className={isCore ? 'bg-purple-600 text-white' : 'bg-cyan-600 text-white'}>
                              {rec.weight}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <Badge className={getPriorityColor(rec.priority)}>
                      {rec.priority} priority
                    </Badge>
                  </div>
                  
                  {rec.current_stock !== undefined && rec.optimal_stock && (
                    <div className="grid grid-cols-3 gap-4 mb-3 text-sm">
                      <div>
                        <p className="text-gray-500">Current Stock</p>
                        <p className="font-medium">{rec.current_stock} units</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Optimal Stock</p>
                        <p className="font-medium">{rec.optimal_stock} units</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Difference</p>
                        <div className="flex items-center space-x-1">
                          {isIncrease ? (
                            <TrendingUp className="h-4 w-4 text-red-500" />
                          ) : (
                            <TrendingDown className="h-4 w-4 text-green-500" />
                          )}
                          <span className={`font-medium ${
                            isIncrease ? 'text-red-600' : 'text-green-600'
                          }`}>
                            {Math.abs(stockDiff)} units
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {rec.sales_velocity !== undefined && (
                    <div className="mb-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Sales Velocity:</span>
                        <span className="font-medium">{rec.sales_velocity} units/month</span>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-700">{rec.action}</p>
                    <div className="space-x-2">
                      <Button size="sm" variant="outline">
                        Schedule
                      </Button>
                      <Button size="sm">
                        Apply Now
                      </Button>
                    </div>
                  </div>
                </div>
              );
            }) : (
              <div className="text-center py-8 text-gray-500">
                <p>No optimization recommendations available yet.</p>
                <p className="text-sm">Recommendations will appear as inventory data is analyzed.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};