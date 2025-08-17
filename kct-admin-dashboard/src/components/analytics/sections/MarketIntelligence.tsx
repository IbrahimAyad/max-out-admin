import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';
import { TrendingUp, Globe, Target, Shield, Zap, Award } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, LineChart, Line } from 'recharts';

interface MarketIntelligenceProps {
  data: any;
  isLoading: boolean;
}

export const MarketIntelligence: React.FC<MarketIntelligenceProps> = ({ data, isLoading }) => {
  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card className="animate-pulse">
          <CardHeader>
            <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          </CardHeader>
          <CardContent>
            <div className="h-48 bg-gray-200 rounded"></div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const competitivePosition = data?.competitive_position || 73;
  
  const marketTrends = data?.market_trends || [
    {
      trend: 'Sustainable Fashion Growth',
      impact: 'High positive impact on premium positioning',
      confidence: 92,
      timeline: 'Next 12 months'
    },
    {
      trend: 'Direct-to-Consumer Shift',
      impact: 'Medium impact on distribution strategy',
      confidence: 87,
      timeline: 'Ongoing'
    },
    {
      trend: 'Personalization Demand',
      impact: 'High opportunity for custom tailoring',
      confidence: 89,
      timeline: 'Next 6 months'
    },
    {
      trend: 'Mobile Commerce Dominance',
      impact: 'Critical for mobile experience optimization',
      confidence: 96,
      timeline: 'Immediate'
    }
  ];

  const opportunities = data?.opportunities || [
    {
      opportunity: 'Luxury Casual Wear Expansion',
      potential_value: 450000,
      timeline: '6-12 months',
      difficulty: 'Medium'
    },
    {
      opportunity: 'Corporate Partnership Program',
      potential_value: 890000,
      timeline: '3-6 months',
      difficulty: 'High'
    },
    {
      opportunity: 'International Market Entry',
      potential_value: 1200000,
      timeline: '12-18 months',
      difficulty: 'High'
    },
    {
      opportunity: 'Subscription Service Model',
      potential_value: 320000,
      timeline: '4-8 months',
      difficulty: 'Low'
    }
  ];

  const threats = data?.threats || [
    {
      threat: 'Economic Recession Impact',
      risk_level: 'Medium',
      probability: 35,
      mitigation: 'Diversify price points, focus on value proposition'
    },
    {
      threat: 'Fast Fashion Competition',
      risk_level: 'High',
      probability: 78,
      mitigation: 'Emphasize quality and sustainability advantages'
    },
    {
      threat: 'Supply Chain Disruption',
      risk_level: 'Medium',
      probability: 42,
      mitigation: 'Multiple supplier relationships, local sourcing'
    },
    {
      threat: 'Changing Consumer Preferences',
      risk_level: 'High',
      probability: 65,
      mitigation: 'Agile design process, trend monitoring'
    }
  ];

  const competitorAnalysis = [
    { metric: 'Price Competitiveness', kct: 85, competitor1: 75, competitor2: 90, competitor3: 70 },
    { metric: 'Product Quality', kct: 92, competitor1: 85, competitor2: 78, competitor3: 88 },
    { metric: 'Brand Recognition', kct: 68, competitor1: 85, competitor2: 92, competitor3: 75 },
    { metric: 'Customer Service', kct: 89, competitor1: 78, competitor2: 72, competitor3: 84 },
    { metric: 'Online Presence', kct: 82, competitor1: 88, competitor2: 95, competitor3: 79 },
    { metric: 'Innovation', kct: 76, competitor1: 82, competitor2: 74, competitor3: 71 }
  ];

  const marketShare = [
    { period: 'Q1 2024', share: 3.2, revenue: 245000 },
    { period: 'Q2 2024', share: 3.8, revenue: 289000 },
    { period: 'Q3 2024', share: 4.1, revenue: 312000 },
    { period: 'Q4 2024', share: 4.6, revenue: 356000 },
    { period: 'Q1 2025', share: 5.2, revenue: 398000 },
    { period: 'Q2 2025', share: 5.8, revenue: 445000 }
  ];

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 90) return 'text-green-600 bg-green-100';
    if (confidence >= 75) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'High': return 'text-red-600 bg-red-100';
      case 'Medium': return 'text-yellow-600 bg-yellow-100';
      case 'Low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'High': return 'text-red-600';
      case 'Medium': return 'text-yellow-600';
      case 'Low': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="space-y-6">
      {/* Market Position Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Market Position
            </CardTitle>
            <Award className="h-5 w-5 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{competitivePosition}%</div>
            <p className="text-xs text-gray-500">Competitive strength</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Market Share
            </CardTitle>
            <Target className="h-5 w-5 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">5.8%</div>
            <p className="text-xs text-gray-500">+1.4% YoY growth</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Growth Rate
            </CardTitle>
            <TrendingUp className="h-5 w-5 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">24%</div>
            <p className="text-xs text-gray-500">Above industry average</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Risk Level
            </CardTitle>
            <Shield className="h-5 w-5 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">Medium</div>
            <p className="text-xs text-gray-500">Managed exposure</p>
          </CardContent>
        </Card>
      </div>

      {/* Market Share Trend */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900">
            Market Share Growth Trend
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={marketShare}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis 
                  dataKey="period" 
                  className="text-sm text-gray-600"
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis 
                  yAxisId="share"
                  className="text-sm text-gray-600"
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(value) => `${value}%`}
                />
                <YAxis 
                  yAxisId="revenue"
                  orientation="right"
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
                />
                <Line 
                  yAxisId="share"
                  type="monotone" 
                  dataKey="share" 
                  stroke="#3B82F6" 
                  strokeWidth={3}
                  dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
                  name="Market Share %"
                />
                <Line 
                  yAxisId="revenue"
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#10B981" 
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={{ fill: '#10B981', strokeWidth: 2, r: 3 }}
                  name="Revenue $"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Competitive Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900">
            Competitive Analysis Radar
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={competitorAnalysis}>
                <PolarGrid />
                <PolarAngleAxis 
                  dataKey="metric" 
                  className="text-xs text-gray-600"
                  tick={{ fontSize: 10 }}
                />
                <PolarRadiusAxis 
                  angle={90} 
                  domain={[0, 100]} 
                  tick={false}
                />
                <Radar 
                  name="KCT Menswear" 
                  dataKey="kct" 
                  stroke="#3B82F6" 
                  fill="#3B82F6" 
                  fillOpacity={0.3}
                  strokeWidth={2}
                />
                <Radar 
                  name="Competitor 1" 
                  dataKey="competitor1" 
                  stroke="#EF4444" 
                  fill="#EF4444" 
                  fillOpacity={0.1}
                  strokeWidth={1}
                />
                <Radar 
                  name="Competitor 2" 
                  dataKey="competitor2" 
                  stroke="#10B981" 
                  fill="#10B981" 
                  fillOpacity={0.1}
                  strokeWidth={1}
                />
                <Radar 
                  name="Competitor 3" 
                  dataKey="competitor3" 
                  stroke="#F59E0B" 
                  fill="#F59E0B" 
                  fillOpacity={0.1}
                  strokeWidth={1}
                />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 flex items-center justify-center space-x-6 text-sm">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-blue-500 rounded"></div>
              <span>KCT Menswear</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-red-500 rounded"></div>
              <span>Competitor 1</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded"></div>
              <span>Competitor 2</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-yellow-500 rounded"></div>
              <span>Competitor 3</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Market Trends & Opportunities */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900">
              Market Trends
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {marketTrends.map((trend, index) => (
                <div key={index} className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-900">{trend.trend}</h4>
                    <Badge className={getConfidenceColor(trend.confidence)}>
                      {trend.confidence}%
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{trend.impact}</p>
                  <div className="flex items-center space-x-2 text-xs text-gray-500">
                    <Globe className="h-3 w-3" />
                    <span>{trend.timeline}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900">
              Growth Opportunities
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {opportunities.map((opp, index) => (
                <div key={index} className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-900">{opp.opportunity}</h4>
                    <span className={`text-sm font-medium ${getDifficultyColor(opp.difficulty)}`}>
                      {opp.difficulty}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">Potential Value</p>
                      <p className="font-medium text-green-600">
                        ${opp.potential_value.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">Timeline</p>
                      <p className="font-medium">{opp.timeline}</p>
                    </div>
                  </div>
                  <Button size="sm" variant="outline" className="mt-3">
                    Analyze Further
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Threat Assessment */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900">
            Threat Assessment & Mitigation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {threats.map((threat, index) => (
              <div key={index} className="p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-gray-900">{threat.threat}</h4>
                  <div className="flex items-center space-x-2">
                    <Badge className={getRiskColor(threat.risk_level)}>
                      {threat.risk_level} Risk
                    </Badge>
                    <span className="text-sm text-gray-600">{threat.probability}%</span>
                  </div>
                </div>
                <div className="bg-gray-50 p-3 rounded">
                  <p className="text-sm text-gray-700">
                    <strong>Mitigation:</strong> {threat.mitigation}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};