import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Badge } from '../../ui/badge';
import { TrendingUp, TrendingDown, DollarSign, ShoppingBag, Users, Target } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

interface ExecutiveOverviewProps {
  data: any;
  isLoading: boolean;
}

export const ExecutiveOverview: React.FC<ExecutiveOverviewProps> = ({ data, isLoading }) => {
  if (isLoading) {
    return (
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
    );
  }

  const kpiData = [
    {
      title: 'Total Revenue',
      value: data?.revenue || '$0',
      change: data?.revenue_growth || 0,
      icon: DollarSign,
      color: 'text-green-600'
    },
    {
      title: 'Orders',
      value: data?.total_orders || '0',
      change: data?.order_growth || 0,
      icon: ShoppingBag,
      color: 'text-blue-600'
    },
    {
      title: 'Customers',
      value: data?.active_customers || '0',
      change: data?.customer_growth || 0,
      icon: Users,
      color: 'text-purple-600'
    },
    {
      title: 'Conversion Rate',
      value: `${data?.conversion_rate || 0}%`,
      change: data?.conversion_change || 0,
      icon: Target,
      color: 'text-orange-600'
    }
  ];

  const trendData = data?.trend_data || [
    { date: '2025-01', revenue: 45000, orders: 120 },
    { date: '2025-02', revenue: 52000, orders: 135 },
    { date: '2025-03', revenue: 48000, orders: 128 },
    { date: '2025-04', revenue: 61000, orders: 155 },
    { date: '2025-05', revenue: 55000, orders: 142 },
    { date: '2025-06', revenue: 67000, orders: 168 }
  ];

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpiData.map((kpi, index) => {
          const Icon = kpi.icon;
          const isPositive = kpi.change >= 0;
          
          return (
            <Card key={index} className="relative overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  {kpi.title}
                </CardTitle>
                <Icon className={`h-5 w-5 ${kpi.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900 mb-1">
                  {kpi.value}
                </div>
                <div className="flex items-center space-x-1">
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
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Revenue Trend Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900">
            Revenue & Orders Trend
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
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
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #E5E7EB',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#3B82F6" 
                  strokeWidth={2}
                  fill="url(#revenueGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* AI Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900">
            AI-Powered Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {(data?.insights || [
              'Revenue growth is accelerating, with luxury items driving 65% of the increase.',
              'Customer acquisition cost has decreased by 12% while retention improved by 8%.',
              'Seasonal trends suggest a 23% boost in Q4 performance based on historical data.'
            ]).map((insight: string, index: number) => (
              <div key={index} className="flex items-start space-x-3 p-4 bg-blue-50 rounded-lg border border-blue-100">
                <div className="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                <p className="text-sm text-gray-700 font-medium">{insight}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};