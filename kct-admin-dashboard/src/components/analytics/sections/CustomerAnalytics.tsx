import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Badge } from '../../ui/badge';
import { Users, UserCheck, UserX, TrendingUp, Heart, Star } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ScatterChart, Scatter, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';

interface CustomerAnalyticsProps {
  data: any;
  isLoading: boolean;
}

export const CustomerAnalytics: React.FC<CustomerAnalyticsProps> = ({ data, isLoading }) => {
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const segments = data?.segments || [
    {
      name: 'VIP Customers',
      size: 156,
      value: 2850,
      growth: 12,
      characteristics: ['High LTV', 'Frequent Purchases', 'Premium Preferences']
    },
    {
      name: 'Regular Buyers',
      size: 543,
      value: 890,
      growth: 8,
      characteristics: ['Seasonal Buyers', 'Price Conscious', 'Quality Focused']
    },
    {
      name: 'New Customers',
      size: 287,
      value: 450,
      growth: 25,
      characteristics: ['First Purchase', 'Research Heavy', 'Discount Sensitive']
    },
    {
      name: 'At-Risk',
      size: 89,
      value: 320,
      growth: -15,
      characteristics: ['Declining Engagement', 'Long Gaps', 'Support Issues']
    }
  ];

  const behaviorInsights = data?.behavior_insights || [
    {
      insight: 'VIP customers prefer shopping on weekends with 67% higher conversion rates',
      confidence: 94,
      impact: 'High'
    },
    {
      insight: 'Customers who view size guides are 3.2x more likely to complete purchases',
      confidence: 89,
      impact: 'Medium'
    },
    {
      insight: 'Email campaigns sent Tuesday-Thursday show 45% better engagement',
      confidence: 92,
      impact: 'High'
    }
  ];

  const clvData = [
    { segment: 'VIP', current: 2850, predicted: 3200, potential: 3800 },
    { segment: 'Regular', current: 890, predicted: 980, potential: 1250 },
    { segment: 'New', current: 450, predicted: 650, potential: 890 },
    { segment: 'At-Risk', current: 320, predicted: 280, potential: 450 }
  ];

  const satisfactionData = [
    { category: 'Product Quality', score: 4.6 },
    { category: 'Customer Service', score: 4.4 },
    { category: 'Delivery Speed', score: 4.2 },
    { category: 'Website Experience', score: 4.3 },
    { category: 'Value for Money', score: 4.1 },
    { category: 'Return Process', score: 4.5 }
  ];

  const churnRisk = data?.churn_risk || 12.5;

  const getSegmentColor = (segment: string) => {
    switch (segment) {
      case 'VIP Customers': return 'bg-purple-100 text-purple-800';
      case 'Regular Buyers': return 'bg-blue-100 text-blue-800';
      case 'New Customers': return 'bg-green-100 text-green-800';
      case 'At-Risk': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Customer Overview Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Customers
            </CardTitle>
            <Users className="h-5 w-5 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">1,075</div>
            <p className="text-xs text-gray-500">+8.2% from last month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Active Customers
            </CardTitle>
            <UserCheck className="h-5 w-5 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">986</div>
            <p className="text-xs text-gray-500">91.7% of total</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Churn Risk
            </CardTitle>
            <UserX className="h-5 w-5 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{churnRisk}%</div>
            <p className="text-xs text-gray-500">-2.1% improvement</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Avg. Satisfaction
            </CardTitle>
            <Star className="h-5 w-5 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">4.35</div>
            <p className="text-xs text-gray-500">Out of 5.0 stars</p>
          </CardContent>
        </Card>
      </div>

      {/* Customer Segments */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900">
            Customer Segments
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {segments.map((segment, index) => (
              <div key={index} className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <Badge className={getSegmentColor(segment.name)}>
                    {segment.name}
                  </Badge>
                  <div className="flex items-center space-x-1">
                    {segment.growth > 0 ? (
                      <TrendingUp className="h-4 w-4 text-green-500" />
                    ) : (
                      <TrendingUp className="h-4 w-4 text-red-500 rotate-180" />
                    )}
                    <span className={`text-sm font-medium ${
                      segment.growth > 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {Math.abs(segment.growth)}%
                    </span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Size:</span>
                    <span className="text-sm font-medium">{segment.size}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Avg. Value:</span>
                    <span className="text-sm font-medium">${segment.value}</span>
                  </div>
                  <div className="mt-3">
                    <p className="text-xs text-gray-500 mb-1">Characteristics:</p>
                    <div className="flex flex-wrap gap-1">
                      {segment.characteristics.map((char, i) => (
                        <span key={i} className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                          {char}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Customer Lifetime Value Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900">
              Customer Lifetime Value
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={clvData}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis 
                    dataKey="segment" 
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
                  <Bar dataKey="current" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="predicted" fill="#10B981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="potential" fill="#F59E0B" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900">
              Customer Satisfaction
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={satisfactionData}>
                  <PolarGrid />
                  <PolarAngleAxis 
                    dataKey="category" 
                    className="text-xs text-gray-600"
                    tick={{ fontSize: 10 }}
                  />
                  <PolarRadiusAxis 
                    angle={90} 
                    domain={[0, 5]} 
                    tick={false}
                  />
                  <Radar 
                    name="Score" 
                    dataKey="score" 
                    stroke="#3B82F6" 
                    fill="#3B82F6" 
                    fillOpacity={0.3}
                    strokeWidth={2}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Behavioral Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900">
            AI Behavioral Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {behaviorInsights.map((insight, index) => (
              <div key={index} className="p-4 border border-gray-200 rounded-lg">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <Badge variant={insight.impact === 'High' ? 'destructive' : 'default'}>
                      {insight.impact} Impact
                    </Badge>
                    <span className="text-sm text-gray-500">
                      {insight.confidence}% confidence
                    </span>
                  </div>
                  <Heart className="h-5 w-5 text-red-400" />
                </div>
                <p className="text-sm text-gray-700">{insight.insight}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};