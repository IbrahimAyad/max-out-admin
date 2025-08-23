import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';
import { TrendingUp, Globe, Target, Shield, Zap, Award, Crown, Package2, DollarSign, Users } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, LineChart, Line, ComposedChart } from 'recharts';

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
  const productMarketAnalysis = data?.product_market_analysis || {
    core_products: {
      revenue: 0,
      market_share: 0,
      growth_rate: 0,
      market_size: 5000000,
      position: 'Premium/Luxury Segment',
      weight: '70%'
    },
    catalog_products: {
      revenue: 0,
      market_share: 0,
      growth_rate: 0,
      market_size: 8000000,
      position: 'Accessible/Entry Segment',
      weight: '30%'
    },
    combined_metrics: {
      total_revenue: 0,
      weighted_revenue: 0,
      overall_market_share: 0,
      revenue_split: { core_percentage: 0, catalog_percentage: 0 }
    }
  };
  const marketTrends = data?.market_trends || [];
  const opportunities = data?.opportunities || [];
  const threats = data?.threats || [];
  const marketShareData = data?.market_share_data || [];

  // Dual market positioning data
  const marketPositioning = [
    {
      segment: 'Premium/Luxury',
      kct_share: productMarketAnalysis.core_products.market_share,
      market_size: productMarketAnalysis.core_products.market_size,
      revenue: productMarketAnalysis.core_products.revenue,
      weight: '70%',
      color: '#8B5CF6',
      icon: Crown
    },
    {
      segment: 'Accessible/Entry',
      kct_share: productMarketAnalysis.catalog_products.market_share,
      market_size: productMarketAnalysis.catalog_products.market_size,
      revenue: productMarketAnalysis.catalog_products.revenue,
      weight: '30%',
      color: '#06B6D4',
      icon: Package2
    }
  ];

  // Enhanced competitive factors for radar
  const competitiveFactors = [
    { metric: 'Core Product Quality', kct: 92, industry_avg: 75, competitor_best: 88 },
    { metric: 'Premium Positioning', kct: 85, industry_avg: 60, competitor_best: 92 },
    { metric: 'Catalog Accessibility', kct: 78, industry_avg: 82, competitor_best: 85 },
    { metric: 'Cross-Selling Success', kct: 68, industry_avg: 45, competitor_best: 72 },
    { metric: 'Style Leadership', kct: 82, industry_avg: 55, competitor_best: 78 },
    { metric: 'Digital Experience', kct: 76, industry_avg: 70, competitor_best: 88 }
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
      {/* Dual Product Market Position Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Weighted Position
            </CardTitle>
            <Award className="h-5 w-5 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{competitivePosition}%</div>
            <p className="text-xs text-gray-500">70/30 weighted strength</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Overall Market Share
            </CardTitle>
            <Target className="h-5 w-5 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {productMarketAnalysis.combined_metrics.overall_market_share.toFixed(1)}%
            </div>
            <p className="text-xs text-gray-500">Combined positioning</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Weighted Revenue
            </CardTitle>
            <DollarSign className="h-5 w-5 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              ${(productMarketAnalysis.combined_metrics.weighted_revenue / 1000).toFixed(0)}k
            </div>
            <p className="text-xs text-gray-500">Strategic importance</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Risk Assessment
            </CardTitle>
            <Shield className="h-5 w-5 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">Balanced</div>
            <p className="text-xs text-gray-500">Dual market exposure</p>
          </CardContent>
        </Card>
      </div>

      {/* Dual Market Positioning Analysis */}
      <Card className="bg-gradient-to-br from-gray-50 to-purple-50 border-purple-200">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900">
            Dual Product Market Positioning
          </CardTitle>
          <p className="text-sm text-gray-600">Strategic positioning across premium and accessible market segments</p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {marketPositioning.map((segment, index) => {
              const IconComponent = segment.icon;
              return (
                <div key={index} className="bg-white rounded-lg p-6 border-2 border-opacity-20 shadow-sm" style={{ borderColor: segment.color }}>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <IconComponent className="h-6 w-6" style={{ color: segment.color }} />
                      <span className="text-lg font-semibold text-gray-900">{segment.segment}</span>
                    </div>
                    <Badge className={segment.segment.includes('Premium') ? 'bg-purple-600 text-white' : 'bg-cyan-600 text-white'}>
                      {segment.weight}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-gray-600">Market Share</p>
                      <p className="text-2xl font-bold" style={{ color: segment.color }}>
                        {segment.kct_share.toFixed(1)}%
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Revenue</p>
                      <p className="text-lg font-bold" style={{ color: segment.color }}>
                        ${segment.revenue.toLocaleString()}
                      </p>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Market Size:</span>
                      <span className="text-sm font-medium">${(segment.market_size / 1000000).toFixed(1)}M</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Position:</span>
                      <span className="text-sm font-medium">{segment.segment}</span>
                    </div>
                  </div>
                  
                  {/* Market share visualization */}
                  <div className="mt-4">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="h-2 rounded-full transition-all duration-300"
                        style={{ 
                          backgroundColor: segment.color, 
                          width: `${Math.max(5, segment.kct_share * 2)}%` 
                        }}
                      ></div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Market penetration visualization</p>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Market Share Trend with Dual Products */}
      {marketShareData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900">
              Market Share Growth by Product Type
            </CardTitle>
            <p className="text-sm text-gray-600">Core vs Catalog product market share evolution</p>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={marketShareData}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis 
                    dataKey="period" 
                    className="text-sm text-gray-600"
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis 
                    className="text-sm text-gray-600"
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(value) => `${value.toFixed(1)}%`}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #E5E7EB',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                    formatter={(value: any, name: string) => {
                      const labels: any = {
                        core_share: 'Core Market Share',
                        catalog_share: 'Catalog Market Share',
                        total_share: 'Total Market Share'
                      };
                      return [`${value?.toFixed(1)}%`, labels[name] || name];
                    }}
                  />
                  <Bar dataKey="core_share" fill="#8B5CF6" name="Core Share" />
                  <Bar dataKey="catalog_share" fill="#06B6D4" name="Catalog Share" />
                  <Line 
                    type="monotone" 
                    dataKey="total_share" 
                    stroke="#10B981" 
                    strokeWidth={3}
                    dot={{ fill: '#10B981', strokeWidth: 2, r: 4 }}
                    name="Total Share"
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Enhanced Competitive Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900">
            Dual Product Competitive Analysis
          </CardTitle>
          <p className="text-sm text-gray-600">Performance across Core and Catalog product capabilities</p>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={competitiveFactors}>
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
                  stroke="#8B5CF6" 
                  fill="#8B5CF6" 
                  fillOpacity={0.3}
                  strokeWidth={3}
                />
                <Radar 
                  name="Industry Average" 
                  dataKey="industry_avg" 
                  stroke="#6B7280" 
                  fill="#6B7280" 
                  fillOpacity={0.1}
                  strokeWidth={1}
                />
                <Radar 
                  name="Best Competitor" 
                  dataKey="competitor_best" 
                  stroke="#EF4444" 
                  fill="#EF4444" 
                  fillOpacity={0.1}
                  strokeWidth={2}
                />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 flex items-center justify-center space-x-6 text-sm">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-purple-500 rounded"></div>
              <span>KCT Menswear</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-gray-500 rounded"></div>
              <span>Industry Average</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-red-500 rounded"></div>
              <span>Best Competitor</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Enhanced Market Trends & Opportunities */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900">
              Dual Product Market Trends
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {marketTrends.length > 0 ? marketTrends.map((trend: any, index: number) => (
                <div key={index} className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-900">{trend.trend}</h4>
                    <div className="flex items-center space-x-2">
                      <Badge className={getConfidenceColor(trend.confidence)}>
                        {trend.confidence}%
                      </Badge>
                      {trend.weight && (
                        <Badge variant="outline">{trend.weight}</Badge>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{trend.impact}</p>
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-2 text-gray-500">
                      <Globe className="h-3 w-3" />
                      <span>{trend.timeline}</span>
                    </div>
                    {trend.product_focus && (
                      <span className="text-gray-600 font-medium">{trend.product_focus}</span>
                    )}
                  </div>
                </div>
              )) : (
                <div className="text-center py-8 text-gray-500">
                  <p>Market trends will appear as data is analyzed.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900">
              Strategic Opportunities
            </CardTitle>
            <p className="text-sm text-gray-600">Product-specific growth opportunities</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {opportunities.length > 0 ? opportunities.map((opp: any, index: number) => {
                const isCore = opp.product_focus === 'Core Products';
                const isCatalog = opp.product_focus === 'Catalog Products';
                
                return (
                  <div key={index} className={`p-4 border-2 rounded-lg ${
                    isCore ? 'border-purple-200 bg-purple-50' :
                    isCatalog ? 'border-cyan-200 bg-cyan-50' :
                    'border-gray-200 bg-gray-50'
                  }`}>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-gray-900">{opp.opportunity}</h4>
                      <div className="flex items-center space-x-2">
                        <span className={`text-sm font-medium ${getDifficultyColor(opp.difficulty)}`}>
                          {opp.difficulty}
                        </span>
                        {opp.weight && (
                          <Badge className={isCore ? 'bg-purple-600 text-white' : isCatalog ? 'bg-cyan-600 text-white' : 'bg-gray-600 text-white'}>
                            {opp.weight}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                      <div>
                        <p className="text-gray-500">Potential Value</p>
                        <p className="font-medium text-green-600">
                          ${opp.potential_value?.toLocaleString() || 0}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500">Timeline</p>
                        <p className="font-medium">{opp.timeline}</p>
                      </div>
                    </div>
                    {opp.product_focus && (
                      <div className="text-xs text-gray-600 mb-2">
                        Focus: {opp.product_focus}
                      </div>
                    )}
                    <Button size="sm" variant="outline">
                      Analyze Further
                    </Button>
                  </div>
                );
              }) : (
                <div className="text-center py-8 text-gray-500">
                  <p>Strategic opportunities will appear as market analysis progresses.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Threat Assessment */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900">
            Dual Product Threat Assessment
          </CardTitle>
          <p className="text-sm text-gray-600">Risk analysis across Core and Catalog product segments</p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {threats.length > 0 ? threats.map((threat: any, index: number) => (
              <div key={index} className="p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-gray-900">{threat.threat}</h4>
                  <div className="flex items-center space-x-2">
                    <Badge className={getRiskColor(threat.risk_level)}>
                      {threat.risk_level} Risk
                    </Badge>
                    <span className="text-sm text-gray-600">{threat.probability}%</span>
                    {threat.weight_impact && (
                      <Badge variant="outline">{threat.weight_impact}</Badge>
                    )}
                  </div>
                </div>
                <div className="bg-gray-50 p-3 rounded mb-2">
                  <p className="text-sm text-gray-700">
                    <strong>Mitigation:</strong> {threat.mitigation}
                  </p>
                </div>
                {threat.affects && (
                  <div className="text-xs text-gray-600">
                    <strong>Affects:</strong> {threat.affects}
                  </div>
                )}
              </div>
            )) : (
              <div className="text-center py-8 text-gray-500">
                <p>Threat assessment will update as market conditions are monitored.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};