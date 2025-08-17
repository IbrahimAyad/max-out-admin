import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Badge } from '../../ui/badge';
import { Users, UserCheck, UserX, TrendingUp, Heart, Star, Crown, ShoppingBag, ArrowRight, Target } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ScatterChart, Scatter, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, PieChart, Pie, Cell } from 'recharts';

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

  const segments = data?.segments || [];
  const productAffinity = data?.product_affinity || {
    style_leaders: { count: 0, percentage: 0, avg_core_purchases: 0, total_core_value: 0 },
    cross_buyers: { count: 0, conversion_rate: 0 },
    product_loyalty: { core_only: 0, catalog_only: 0, mixed: 0 }
  };
  const behaviorInsights = data?.behavior_insights || [];
  const metrics = data?.metrics || {
    total_customers: 0,
    active_customers: 0,
    churn_risk: 0,
    core_penetration: 0,
    cross_sell_rate: 0
  };

  // Style Leaders Data
  const styleLeadersData = [
    {
      type: 'VIP Style Leaders',
      count: segments.find((s: any) => s.name === 'VIP Style Leaders')?.size || 0,
      characteristics: 'High Core Product Affinity',
      color: '#8B5CF6',
      icon: Crown,
      priority: 'Highest Value'
    },
    {
      type: 'Core Customers', 
      count: segments.find((s: any) => s.name === 'Core Customers')?.size || 0,
      characteristics: 'Core Product Buyers',
      color: '#7C3AED',
      icon: Target,
      priority: 'High Value'
    },
    {
      type: 'Cross-Buyers',
      count: segments.find((s: any) => s.name === 'Cross-Buyers')?.size || 0,
      characteristics: 'Mixed Portfolio',
      color: '#10B981',
      icon: ArrowRight,
      priority: 'Growth Potential'
    }
  ];

  // Customer Journey Data
  const customerJourneyData = [
    {
      stage: 'Catalog Only',
      customers: productAffinity.product_loyalty.catalog_only,
      type: 'Entry Point',
      color: '#06B6D4'
    },
    {
      stage: 'Cross-Buyers',
      customers: productAffinity.product_loyalty.mixed,
      type: 'Conversion',
      color: '#10B981'
    },
    {
      stage: 'Core Only',
      customers: productAffinity.product_loyalty.core_only,
      type: 'Premium',
      color: '#8B5CF6'
    }
  ];

  const getSegmentColor = (segment: string) => {
    switch (segment) {
      case 'VIP Style Leaders': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'Core Customers': return 'bg-purple-50 text-purple-700 border-purple-100';
      case 'Cross-Buyers': return 'bg-green-100 text-green-800 border-green-200';
      case 'Regular Buyers': return 'bg-cyan-100 text-cyan-800 border-cyan-200';
      case 'New Customers': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'At-Risk': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getSegmentIcon = (segment: string) => {
    switch (segment) {
      case 'VIP Style Leaders': return Crown;
      case 'Core Customers': return Target;
      case 'Cross-Buyers': return ArrowRight;
      case 'Regular Buyers': return Users;
      case 'New Customers': return UserCheck;
      case 'At-Risk': return UserX;
      default: return Users;
    }
  };

  const COLORS = ['#8B5CF6', '#10B981', '#06B6D4', '#F59E0B', '#EF4444', '#6B7280'];

  return (
    <div className="space-y-6">
      {/* Dual Product Customer Overview */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Customers
            </CardTitle>
            <Users className="h-5 w-5 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{metrics.total_customers}</div>
            <p className="text-xs text-gray-500">Dual product architecture</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Style Leaders
            </CardTitle>
            <Crown className="h-5 w-5 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-900">{productAffinity.style_leaders.count}</div>
            <p className="text-xs text-purple-600">{productAffinity.style_leaders.percentage?.toFixed(1) || 0}% of customers</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Cross-Sell Rate
            </CardTitle>
            <ArrowRight className="h-5 w-5 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-900">{metrics.cross_sell_rate?.toFixed(1) || 0}%</div>
            <p className="text-xs text-green-600">Catalog → Core conversion</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Core Penetration
            </CardTitle>
            <Target className="h-5 w-5 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-900">{metrics.core_penetration?.toFixed(1) || 0}%</div>
            <p className="text-xs text-purple-600">Premium product reach</p>
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
            <div className="text-2xl font-bold text-red-900">{metrics.churn_risk?.toFixed(1) || 0}%</div>
            <p className="text-xs text-red-600">At-risk customers</p>
          </CardContent>
        </Card>
      </div>

      {/* Style Leaders Analysis */}
      <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-purple-900 flex items-center space-x-2">
            <Crown className="h-6 w-6 text-purple-600" />
            <span>Style Leaders Intelligence</span>
            <Badge className="bg-purple-600 text-white">Premium Customer Analysis</Badge>
          </CardTitle>
          <p className="text-sm text-purple-700">High-value customers who drive Core Product adoption and style trends</p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {styleLeadersData.map((leader, index) => {
              const IconComponent = leader.icon;
              return (
                <div key={index} className="bg-white rounded-lg p-4 border border-purple-200 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <IconComponent className="h-5 w-5" style={{ color: leader.color }} />
                      <span className="font-semibold text-gray-900">{leader.type}</span>
                    </div>
                    <Badge variant="outline" className={leader.type === 'VIP Style Leaders' ? 'border-purple-500 text-purple-700' : leader.type === 'Core Customers' ? 'border-purple-400 text-purple-600' : 'border-green-500 text-green-700'}>
                      {leader.priority}
                    </Badge>
                  </div>
                  <div className="text-2xl font-bold mb-2" style={{ color: leader.color }}>
                    {leader.count}
                  </div>
                  <p className="text-sm text-gray-600">{leader.characteristics}</p>
                </div>
              );
            })}
          </div>
          
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white rounded-lg p-4 border border-purple-200">
              <h4 className="font-semibold text-purple-900 mb-2">Style Leader Impact</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-purple-700">Avg Core Purchases:</span>
                  <span className="font-medium text-purple-900">
                    {productAffinity.style_leaders.avg_core_purchases?.toFixed(1) || 0}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-purple-700">Total Core Value:</span>
                  <span className="font-medium text-purple-900">
                    ${productAffinity.style_leaders.total_core_value?.toLocaleString() || 0}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg p-4 border border-purple-200">
              <h4 className="font-semibold text-purple-900 mb-2">Cross-Selling Success</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-purple-700">Cross-Buyers:</span>
                  <span className="font-medium text-purple-900">
                    {productAffinity.cross_buyers.count}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-purple-700">Conversion Rate:</span>
                  <span className="font-medium text-purple-900">
                    {productAffinity.cross_buyers.conversion_rate?.toFixed(1) || 0}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Customer Journey Flow */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900">
              Customer Journey Flow
            </CardTitle>
            <p className="text-sm text-gray-600">Progression from Catalog discovery to Core purchases</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {customerJourneyData.map((stage, index) => (
                <div key={index} className="flex items-center space-x-4">
                  <div 
                    className="w-4 h-4 rounded-full flex-shrink-0"
                    style={{ backgroundColor: stage.color }}
                  ></div>
                  <div className="flex-1">
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-gray-900">{stage.stage}</span>
                      <div className="flex items-center space-x-2">
                        <span className="text-lg font-bold" style={{ color: stage.color }}>
                          {stage.customers}
                        </span>
                        <Badge variant="outline" className={stage.stage === 'Core Only' ? 'border-purple-500 text-purple-700' : stage.stage === 'Cross-Buyers' ? 'border-green-500 text-green-700' : 'border-cyan-500 text-cyan-700'}>
                          {stage.type}
                        </Badge>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                      <div 
                        className="h-2 rounded-full"
                        style={{ 
                          backgroundColor: stage.color, 
                          width: `${Math.max(10, (stage.customers / Math.max(...customerJourneyData.map(s => s.customers))) * 100)}%` 
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900">
              Product Loyalty Distribution
            </CardTitle>
            <p className="text-sm text-gray-600">Customer preferences by product type</p>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={customerJourneyData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="customers"
                  >
                    {customerJourneyData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: any, name, props) => [
                      `${value} customers`, 
                      props.payload.stage
                    ]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Customer Segments */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900">
            Dual Product Customer Segments
          </CardTitle>
          <p className="text-sm text-gray-600">Segmentation based on Core and Catalog product purchasing behavior</p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {segments.map((segment: any, index: number) => {
              const IconComponent = getSegmentIcon(segment.name);
              return (
                <div key={index} className={`p-4 border-2 rounded-lg hover:shadow-md transition-all ${getSegmentColor(segment.name)}`}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <IconComponent className="h-5 w-5" />
                      <span className="font-semibold">{segment.name}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      {segment.growth > 0 ? (
                        <TrendingUp className="h-4 w-4 text-green-500" />
                      ) : segment.growth < 0 ? (
                        <TrendingUp className="h-4 w-4 text-red-500 rotate-180" />
                      ) : null}
                      <span className={`text-sm font-medium ${
                        segment.growth > 0 ? 'text-green-600' : 
                        segment.growth < 0 ? 'text-red-600' : 'text-gray-600'
                      }`}>
                        {Math.abs(segment.growth)}%
                      </span>
                    </div>
                  </div>
                  
                  <div className="space-y-2 mb-3">
                    <div className="flex justify-between">
                      <span className="text-sm opacity-80">Size:</span>
                      <span className="text-sm font-medium">{segment.size}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm opacity-80">Avg. Value:</span>
                      <span className="text-sm font-medium">${segment.avg_value?.toFixed(0) || 0}</span>
                    </div>
                    {segment.product_preference && (
                      <div className="flex justify-between">
                        <span className="text-sm opacity-80">Preference:</span>
                        <span className="text-sm font-medium">{segment.product_preference}</span>
                      </div>
                    )}
                    {segment.weight && (
                      <div className="flex justify-between">
                        <span className="text-sm opacity-80">Weight:</span>
                        <Badge variant="outline" className="text-xs h-5">{segment.weight}</Badge>
                      </div>
                    )}
                  </div>
                  
                  <div>
                    <p className="text-xs opacity-70 mb-1">Characteristics:</p>
                    <div className="flex flex-wrap gap-1">
                      {segment.characteristics?.map((char: string, i: number) => (
                        <span key={i} className="px-2 py-1 text-xs bg-white bg-opacity-50 rounded">
                          {char}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* AI Behavioral Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
            <Heart className="h-5 w-5 text-red-500" />
            <span>AI Behavioral Insights</span>
          </CardTitle>
          <p className="text-sm text-gray-600">Dual product architecture customer behavior analysis</p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {behaviorInsights.length > 0 ? behaviorInsights.map((insight: any, index: number) => (
              <div key={index} className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <Badge variant={insight.impact === 'High' ? 'destructive' : 'default'}>
                      {insight.impact} Impact
                    </Badge>
                    <Badge variant="outline">
                      {insight.confidence}% confidence
                    </Badge>
                    {insight.category && (
                      <Badge variant="secondary">
                        {insight.category}
                      </Badge>
                    )}
                  </div>
                  <Heart className="h-5 w-5 text-red-400" />
                </div>
                <p className="text-sm text-gray-700">{insight.insight}</p>
              </div>
            )) : (
              <div className="text-center py-8 text-gray-500">
                <p>No behavioral insights available yet.</p>
                <p className="text-sm">Data will appear as customers interact with both Core and Catalog products.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};