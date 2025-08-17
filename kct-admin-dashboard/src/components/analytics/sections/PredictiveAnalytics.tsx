import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';
import { TrendingUp, Calendar, Target, AlertCircle, Brain, Zap, Crown, Package2, BarChart3, Layers, Database } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, ComposedChart, Bar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';

interface PredictiveAnalyticsProps {
  data: any;
  isLoading: boolean;
}

export const PredictiveAnalytics: React.FC<PredictiveAnalyticsProps> = ({ data, isLoading }) => {
  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card className="animate-pulse">
          <CardHeader>
            <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          </CardHeader>
          <CardContent>
            <div className="h-64 bg-gray-200 rounded"></div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const revenueForecast = data?.revenue_forecast || [];
  const demandForecast = data?.demand_forecast || [];
  const styleAffinityPatterns = data?.style_affinity_patterns || {
    core_product_trends: { high_value_preferences: [], seasonal_patterns: '' },
    catalog_product_trends: { entry_point_analysis: [], seasonal_patterns: '' },
    cross_category_insights: {}
  };
  const keyPredictions = data?.key_predictions || [];
  const recommendations = data?.recommendations || [];
  const trainingDataStructure = data?.training_data_structure || {
    core_product_weight: '70%',
    catalog_product_weight: '30%',
    total_data_points: 0,
    core_transactions: 0,
    catalog_transactions: 0,
    mixed_transactions: 0
  };

  // Enhanced revenue forecast with dual product data
  const enhancedRevenueData = revenueForecast.map((item: any) => ({
    ...item,
    period: item.period?.slice(-2) || 'N/A', // Show only month
    core_predicted: item.core_predicted || 0,
    catalog_predicted: item.catalog_predicted || 0,
    weighted_predicted: item.weighted_predicted || item.total_predicted || 0
  }));

  // Style affinity radar data
  const styleAffinityRadarData = [
    { category: 'Premium Quality', core: 95, catalog: 70 },
    { category: 'Style Innovation', core: 88, catalog: 45 },
    { category: 'Brand Loyalty', core: 92, catalog: 35 },
    { category: 'Price Sensitivity', core: 15, catalog: 85 },
    { category: 'Seasonal Trends', core: 25, catalog: 75 },
    { category: 'Cross-Selling', core: 60, catalog: 90 }
  ];

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 85) return 'text-green-600 bg-green-100';
    if (confidence >= 70) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getWeightColor = (weight: string) => {
    if (weight.includes('70%')) return 'bg-purple-100 text-purple-800 border-purple-200';
    if (weight.includes('30%')) return 'bg-blue-100 text-blue-800 border-blue-200';
    return 'bg-gray-100 text-gray-800 border-gray-200';
  };

  return (
    <div className="space-y-6">
      {/* Enhanced Key Predictions with Dual Product Architecture */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {keyPredictions.map((prediction: any, index: number) => (
          <Card key={index} className={prediction.weight?.includes('70%') ? 'border-purple-200 bg-purple-50' : 
                                      prediction.weight?.includes('30%') ? 'border-blue-200 bg-blue-50' : ''}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                {prediction.metric}
              </CardTitle>
              {prediction.weight?.includes('70%') ? <Crown className="h-5 w-5 text-purple-600" /> :
               prediction.weight?.includes('30%') ? <Package2 className="h-5 w-5 text-cyan-600" /> :
               <Brain className="h-5 w-5 text-gray-600" />}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900 mb-2">
                {prediction.prediction}
              </div>
              <div className="flex items-center space-x-1 mb-3">
                <Badge className={getConfidenceColor(prediction.confidence)}>
                  {prediction.confidence}% confidence
                </Badge>
                {prediction.weight && (
                  <Badge className={getWeightColor(prediction.weight)}>
                    {prediction.weight}
                  </Badge>
                )}
              </div>
              <Badge variant={prediction.impact === 'High' ? 'destructive' : 'default'} className="text-xs">
                {prediction.impact} impact
              </Badge>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Training Data Structure for Fashion Knowledge Base */}
      <Card className="bg-gradient-to-br from-indigo-50 to-purple-100 border-indigo-200">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-indigo-900 flex items-center space-x-2">
            <Database className="h-6 w-6 text-indigo-600" />
            <span>Fashion Knowledge Training Data Structure</span>
            <Badge className="bg-indigo-600 text-white">AI Learning Model</Badge>
          </CardTitle>
          <p className="text-sm text-indigo-700">Weighted data distribution for enhanced fashion intelligence predictions</p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Core Product Training Weight */}
            <div className="bg-white rounded-lg p-4 border border-purple-200 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <Crown className="h-5 w-5 text-purple-600" />
                  <span className="font-semibold text-purple-900">Core Products</span>
                </div>
                <Badge className="bg-purple-600 text-white">{trainingDataStructure.core_product_weight}</Badge>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-purple-700">Transactions:</span>
                  <span className="font-medium text-purple-900">{trainingDataStructure.core_transactions}</span>
                </div>
                <div className="text-xs text-purple-600">
                  Premium style patterns, high-value preferences, brand loyalty signals
                </div>
              </div>
            </div>

            {/* Catalog Product Training Weight */}
            <div className="bg-white rounded-lg p-4 border border-cyan-200 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <Package2 className="h-5 w-5 text-cyan-600" />
                  <span className="font-semibold text-cyan-900">Catalog Products</span>
                </div>
                <Badge className="bg-cyan-600 text-white">{trainingDataStructure.catalog_product_weight}</Badge>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-cyan-700">Transactions:</span>
                  <span className="font-medium text-cyan-900">{trainingDataStructure.catalog_transactions}</span>
                </div>
                <div className="text-xs text-cyan-600">
                  Entry-level patterns, discovery behaviors, conversion signals
                </div>
              </div>
            </div>

            {/* Mixed Training Data */}
            <div className="bg-white rounded-lg p-4 border border-green-200 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <Layers className="h-5 w-5 text-green-600" />
                  <span className="font-semibold text-green-900">Cross-Category</span>
                </div>
                <Badge className="bg-green-600 text-white">Strategic</Badge>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-green-700">Mixed Orders:</span>
                  <span className="font-medium text-green-900">{trainingDataStructure.mixed_transactions}</span>
                </div>
                <div className="text-xs text-green-600">
                  Cross-selling patterns, customer journey progression
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-4 bg-white rounded-lg p-4 border border-indigo-200">
            <div className="flex justify-between items-center">
              <span className="font-medium text-indigo-900">Total Training Data Points:</span>
              <span className="text-2xl font-bold text-indigo-900">{trainingDataStructure.total_data_points}</span>
            </div>
            <div className="text-sm text-indigo-600 mt-2">
              Optimized weighting ensures premium style intelligence while maintaining broad market applicability
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dual Product Revenue Forecast */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
            <TrendingUp className="h-5 w-5" />
            <span>Dual Product Revenue Forecast</span>
            <Badge variant="outline">6-Month Weighted Prediction</Badge>
          </CardTitle>
          <p className="text-sm text-gray-600">Core Products (70% weight) vs Catalog Products (30% weight) forecasting</p>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={enhancedRevenueData}>
                <defs>
                  <linearGradient id="coreGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0.05}/>
                  </linearGradient>
                  <linearGradient id="catalogGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06B6D4" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#06B6D4" stopOpacity={0.05}/>
                  </linearGradient>
                </defs>
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
                  tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
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
                      core_predicted: 'Core Products (70%)',
                      catalog_predicted: 'Catalog Products (30%)',
                      weighted_predicted: 'Weighted Total'
                    };
                    return [`$${value?.toLocaleString()}`, labels[name] || name];
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="core_predicted" 
                  stroke="#8B5CF6" 
                  fill="url(#coreGradient)"
                  strokeWidth={2}
                />
                <Area 
                  type="monotone" 
                  dataKey="catalog_predicted" 
                  stroke="#06B6D4" 
                  fill="url(#catalogGradient)"
                  strokeWidth={2}
                />
                <Line 
                  type="monotone" 
                  dataKey="weighted_predicted" 
                  stroke="#10B981" 
                  strokeWidth={4}
                  strokeDasharray="8 4"
                  dot={{ fill: '#10B981', strokeWidth: 3, r: 5 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 flex items-center justify-center space-x-6 text-sm">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-purple-500 rounded"></div>
              <span>Core Products (70%)</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-cyan-500 rounded"></div>
              <span>Catalog Products (30%)</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 border-2 border-green-500 border-dashed rounded"></div>
              <span>Weighted Total</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Style Affinity Patterns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900">
              Style Affinity Patterns
            </CardTitle>
            <p className="text-sm text-gray-600">Customer preference patterns by product type</p>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={styleAffinityRadarData}>
                  <PolarGrid />
                  <PolarAngleAxis 
                    dataKey="category" 
                    className="text-xs text-gray-600"
                    tick={{ fontSize: 10 }}
                  />
                  <PolarRadiusAxis 
                    angle={90} 
                    domain={[0, 100]} 
                    tick={false}
                  />
                  <Radar 
                    name="Core Products" 
                    dataKey="core" 
                    stroke="#8B5CF6" 
                    fill="#8B5CF6" 
                    fillOpacity={0.3}
                    strokeWidth={3}
                  />
                  <Radar 
                    name="Catalog Products" 
                    dataKey="catalog" 
                    stroke="#06B6D4" 
                    fill="#06B6D4" 
                    fillOpacity={0.2}
                    strokeWidth={2}
                  />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900">
              Product Demand Forecast
            </CardTitle>
            <p className="text-sm text-gray-600">Weighted demand predictions by product type</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {demandForecast.slice(0, 5).map((item: any, index: number) => {
                const isCore = item.product_type === 'Core Product';
                const stockInfo = item.current_stock !== 'Managed via Stripe' ? 
                  ` (Stock: ${item.current_stock})` : ' (Stripe Managed)';
                
                return (
                  <div key={index} className={`p-4 border-2 rounded-lg ${
                    isCore ? 'border-purple-200 bg-purple-50' : 'border-cyan-200 bg-cyan-50'
                  }`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        {isCore ? <Crown className="h-4 w-4 text-purple-600" /> : <Package2 className="h-4 w-4 text-cyan-600" />}
                        <h4 className={`font-medium ${isCore ? 'text-purple-900' : 'text-cyan-900'}`}>
                          {item.product}
                        </h4>
                      </div>
                      <Badge className={isCore ? 'bg-purple-600 text-white' : 'bg-cyan-600 text-white'}>
                        {item.weight || (isCore ? '70%' : '30%')}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className={isCore ? 'text-purple-700' : 'text-cyan-700'}>Predicted Demand</p>
                        <p className={`font-medium ${isCore ? 'text-purple-900' : 'text-cyan-900'}`}>
                          {item.predicted_demand}
                        </p>
                      </div>
                      <div>
                        <p className={isCore ? 'text-purple-700' : 'text-cyan-700'}>Confidence</p>
                        <p className={`font-medium ${isCore ? 'text-purple-900' : 'text-cyan-900'}`}>
                          {item.confidence || 85}%
                        </p>
                      </div>
                      <div>
                        <p className={isCore ? 'text-purple-700' : 'text-cyan-700'}>Seasonality</p>
                        <p className={`font-medium ${isCore ? 'text-purple-900' : 'text-cyan-900'}`}>
                          {item.seasonality_factor}x
                        </p>
                      </div>
                    </div>
                    <div className="text-xs mt-2" style={{ color: isCore ? '#7C3AED' : '#0891B2' }}>
                      {item.product_type}{stockInfo}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AI Strategic Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
            <Zap className="h-5 w-5 text-yellow-500" />
            <span>AI Strategic Recommendations</span>
            <Badge variant="outline">Dual Product Optimization</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recommendations.length > 0 ? recommendations.map((rec: any, index: number) => {
              const isCore = rec.category === 'Core Products';
              const isCatalog = rec.category === 'Catalog Products';
              
              return (
                <div key={index} className={`flex items-start space-x-4 p-4 border-2 rounded-lg ${
                  isCore ? 'bg-purple-50 border-purple-200' :
                  isCatalog ? 'bg-cyan-50 border-cyan-200' :
                  'bg-gray-50 border-gray-200'
                }`}>
                  <div className="flex-shrink-0 mt-1">
                    {isCore ? <Crown className="h-5 w-5 text-purple-600" /> :
                     isCatalog ? <Package2 className="h-5 w-5 text-cyan-600" /> :
                     <Target className="h-5 w-5 text-gray-600" />}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <Badge variant={rec.priority === 'High' ? 'destructive' : 'default'}>
                        {rec.priority} Priority
                      </Badge>
                      <Badge className={isCore ? 'bg-purple-600 text-white' : isCatalog ? 'bg-cyan-600 text-white' : 'bg-gray-600 text-white'}>
                        {rec.category}
                      </Badge>
                      {rec.weight && (
                        <Badge variant="outline">{rec.weight}</Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-700 mb-2">{rec.recommendation}</p>
                    <div className="text-xs text-gray-600 mb-3">
                      Confidence: {rec.confidence}%
                    </div>
                    <Button size="sm" variant="outline">
                      Review Strategy
                    </Button>
                  </div>
                </div>
              );
            }) : (
              <div className="text-center py-8 text-gray-500">
                <p>No strategic recommendations available yet.</p>
                <p className="text-sm">AI will generate insights as more dual product data is processed.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};