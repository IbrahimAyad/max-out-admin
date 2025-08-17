import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';
import { ArrowUp, ArrowDown, TrendingUp, Target, Zap, AlertTriangle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

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
  const recommendations = data?.recommendations || [
    {
      type: 'pricing',
      impact: 'high',
      description: 'Adjust premium suit pricing by 8% to maximize revenue based on demand elasticity',
      priority: 'high'
    },
    {
      type: 'promotion',
      impact: 'medium',
      description: 'Launch targeted email campaign for accessories to increase cross-selling',
      priority: 'medium'
    },
    {
      type: 'inventory',
      impact: 'high',
      description: 'Increase stock for wool blazers by 35% before seasonal demand spike',
      priority: 'high'
    }
  ];

  const salesChannelData = [
    { channel: 'Online Store', revenue: 145000, orders: 342, conversion: 3.2 },
    { channel: 'Mobile App', revenue: 89000, orders: 256, conversion: 4.1 },
    { channel: 'In-Store', revenue: 67000, orders: 89, conversion: 12.5 }
  ];

  const productPerformance = [
    { category: 'Suits', revenue: 125000, growth: 15 },
    { category: 'Blazers', revenue: 89000, growth: 8 },
    { category: 'Shirts', revenue: 67000, growth: -3 },
    { category: 'Accessories', revenue: 45000, growth: 22 },
    { category: 'Outerwear', revenue: 34000, growth: 18 }
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

  const COLORS = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6'];

  return (
    <div className="space-y-6">
      {/* Optimization Score */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900">
            Sales Optimization Score
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className={`text-3xl font-bold px-4 py-2 rounded-lg ${getScoreColor(optimizationScore)}`}>
                {optimizationScore}%
              </div>
              <div>
                <p className="text-sm text-gray-600">Overall performance</p>
                <p className="text-xs text-gray-500">Based on AI analysis of 47 metrics</p>
              </div>
            </div>
            <TrendingUp className="h-8 w-8 text-green-500" />
          </div>
        </CardContent>
      </Card>

      {/* Sales Channel Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900">
            Sales Channel Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={salesChannelData}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis 
                  dataKey="channel" 
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
                <Bar dataKey="revenue" fill="#3B82F6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Product Category Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900">
              Product Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {productPerformance.map((product, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{product.category}</p>
                    <p className="text-sm text-gray-600">${product.revenue.toLocaleString()}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    {product.growth > 0 ? (
                      <ArrowUp className="h-4 w-4 text-green-500" />
                    ) : (
                      <ArrowDown className="h-4 w-4 text-red-500" />
                    )}
                    <span className={`text-sm font-medium ${
                      product.growth > 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {Math.abs(product.growth)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900">
              Revenue Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={productPerformance}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="revenue"
                  >
                    {productPerformance.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: any) => [`$${value.toLocaleString()}`, 'Revenue']}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AI Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900">
            AI-Powered Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recommendations.map((rec, index) => (
              <div key={index} className="flex items-start space-x-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex-shrink-0">
                  {getPriorityIcon(rec.priority)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <Badge variant={rec.priority === 'high' ? 'destructive' : rec.priority === 'medium' ? 'default' : 'secondary'}>
                      {rec.priority} impact
                    </Badge>
                    <span className="text-sm text-gray-500 capitalize">{rec.type}</span>
                  </div>
                  <p className="text-sm text-gray-700 mb-3">{rec.description}</p>
                  <Button size="sm" variant="outline">
                    Implement
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};