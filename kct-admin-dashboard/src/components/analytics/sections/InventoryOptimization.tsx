import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';
import { Package, AlertTriangle, TrendingDown, TrendingUp, Clock, CheckCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';

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
  
  const recommendations = data?.recommendations || [
    {
      product: 'Premium Wool Suits',
      current_stock: 23,
      optimal_stock: 45,
      action: 'Increase stock by 22 units',
      priority: 'high',
      reason: 'High demand expected, seasonal trend'
    },
    {
      product: 'Cotton Dress Shirts',
      current_stock: 156,
      optimal_stock: 120,
      action: 'Reduce stock by 36 units',
      priority: 'medium',
      reason: 'Overstocked, slow moving'
    },
    {
      product: 'Leather Accessories',
      current_stock: 89,
      optimal_stock: 75,
      action: 'Maintain current levels',
      priority: 'low',
      reason: 'Well balanced stock levels'
    },
    {
      product: 'Winter Outerwear',
      current_stock: 12,
      optimal_stock: 67,
      action: 'Critical restock needed',
      priority: 'high',
      reason: 'Approaching winter season'
    }
  ];

  const alerts = data?.alerts || [
    {
      type: 'stockout_risk',
      message: '3 products at risk of stockout within 2 weeks',
      severity: 'critical'
    },
    {
      type: 'overstock',
      message: '5 products showing overstock patterns',
      severity: 'warning'
    },
    {
      type: 'seasonal_prep',
      message: 'Winter collection needs restocking by September 15th',
      severity: 'info'
    }
  ];

  const turnoverData = [
    { category: 'Suits', turnover: 4.2, target: 5.0, efficiency: 84 },
    { category: 'Shirts', turnover: 6.1, target: 6.0, efficiency: 102 },
    { category: 'Accessories', turnover: 8.3, target: 7.5, efficiency: 111 },
    { category: 'Outerwear', turnover: 2.8, target: 4.0, efficiency: 70 },
    { category: 'Footwear', turnover: 5.4, target: 5.5, efficiency: 98 }
  ];

  const abcAnalysis = [
    { category: 'A-Class', value: 65, count: 25, color: '#10B981' },
    { category: 'B-Class', value: 25, count: 35, color: '#F59E0B' },
    { category: 'C-Class', value: 10, count: 40, color: '#EF4444' }
  ];

  const stockLevels = [
    { month: 'Jul', optimal: 450000, actual: 420000 },
    { month: 'Aug', optimal: 480000, actual: 465000 },
    { month: 'Sep', optimal: 520000, actual: 510000 },
    { month: 'Oct', optimal: 580000, actual: 545000 },
    { month: 'Nov', optimal: 650000, actual: 620000 },
    { month: 'Dec', optimal: 720000, actual: 685000 }
  ];

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

  return (
    <div className="space-y-6">
      {/* Optimization Score & Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900">
              Optimization Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className={`text-3xl font-bold px-4 py-2 rounded-lg ${getScoreColor(optimizationScore)}`}>
                {optimizationScore}%
              </div>
              <Package className="h-8 w-8 text-blue-600" />
            </div>
            <p className="text-sm text-gray-600 mt-2">
              Based on turnover, demand patterns, and holding costs
            </p>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900">
              System Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {alerts.map((alert, index) => (
                <div key={index} className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg">
                  {getSeverityIcon(alert.severity)}
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{alert.message}</p>
                    <p className="text-xs text-gray-500 capitalize">{alert.type.replace('_', ' ')}</p>
                  </div>
                  <Button size="sm" variant="outline">
                    Review
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Inventory Turnover Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900">
            Inventory Turnover Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={turnoverData}>
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
                />
                <Bar dataKey="turnover" fill="#3B82F6" radius={[4, 4, 0, 0]} name="Actual Turnover" />
                <Bar dataKey="target" fill="#10B981" radius={[4, 4, 0, 0]} name="Target Turnover" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 grid grid-cols-1 md:grid-cols-5 gap-4">
            {turnoverData.map((item, index) => (
              <div key={index} className="text-center p-2 bg-gray-50 rounded">
                <p className="text-xs text-gray-600">{item.category}</p>
                <p className={`text-sm font-medium ${
                  item.efficiency >= 100 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {item.efficiency}%
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ABC Analysis & Stock Optimization */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900">
              ABC Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={abcAnalysis}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {abcAnalysis.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: any, name: string) => [`${value}%`, 'Value Share']}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 space-y-2">
              {abcAnalysis.map((item, index) => (
                <div key={index} className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-2">
                    <div 
                      className="w-3 h-3 rounded"
                      style={{ backgroundColor: item.color }}
                    ></div>
                    <span>{item.category} Items</span>
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

        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900">
              Stock Level Optimization
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={stockLevels}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis 
                    dataKey="month" 
                    className="text-sm text-gray-600"
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis 
                    className="text-sm text-gray-600"
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(value) => `$${value / 1000}k`}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #E5E7EB',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                    formatter={(value: any) => [`$${value.toLocaleString()}`, '']}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="optimal" 
                    stroke="#10B981" 
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    name="Optimal Level"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="actual" 
                    stroke="#3B82F6" 
                    strokeWidth={2}
                    name="Current Level"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Optimization Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900">
            AI Optimization Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recommendations.map((rec, index) => {
              const stockDiff = rec.optimal_stock - rec.current_stock;
              const isIncrease = stockDiff > 0;
              
              return (
                <div key={index} className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-medium text-gray-900">{rec.product}</h4>
                      <p className="text-sm text-gray-600 mt-1">{rec.reason}</p>
                    </div>
                    <Badge className={getPriorityColor(rec.priority)}>
                      {rec.priority} priority
                    </Badge>
                  </div>
                  
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
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};