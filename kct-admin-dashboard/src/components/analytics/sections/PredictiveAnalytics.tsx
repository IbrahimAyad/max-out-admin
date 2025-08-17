import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';
import { TrendingUp, Calendar, Target, AlertCircle, Brain, Zap } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, ComposedChart, Bar } from 'recharts';

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

  const revenueForecast = data?.revenue_forecast || [
    { period: '2025-08', predicted: 67000, confidence_lower: 58000, confidence_upper: 75000, actual: 65200 },
    { period: '2025-09', predicted: 72000, confidence_lower: 63000, confidence_upper: 81000, actual: null },
    { period: '2025-10', predicted: 89000, confidence_lower: 78000, confidence_upper: 98000, actual: null },
    { period: '2025-11', predicted: 95000, confidence_lower: 83000, confidence_upper: 107000, actual: null },
    { period: '2025-12', predicted: 125000, confidence_lower: 110000, confidence_upper: 140000, actual: null },
    { period: '2026-01', predicted: 78000, confidence_lower: 68000, confidence_upper: 88000, actual: null }
  ];

  const demandForecast = data?.demand_forecast || [
    { product: 'Premium Suits', predicted_demand: 145, current_stock: 89, seasonality_factor: 1.2 },
    { product: 'Wool Blazers', predicted_demand: 234, current_stock: 156, seasonality_factor: 1.8 },
    { product: 'Dress Shirts', predicted_demand: 312, current_stock: 278, seasonality_factor: 1.1 },
    { product: 'Accessories', predicted_demand: 456, current_stock: 189, seasonality_factor: 2.1 },
    { product: 'Outerwear', predicted_demand: 189, current_stock: 67, seasonality_factor: 2.8 }
  ];

  const keyPredictions = [
    {
      metric: 'Q4 Revenue Growth',
      prediction: '+42%',
      confidence: 87,
      impact: 'High',
      factors: ['Seasonal demand', 'Holiday campaigns', 'New product launches']
    },
    {
      metric: 'Customer Acquisition',
      prediction: '+28%',
      confidence: 92,
      impact: 'Medium',
      factors: ['Marketing optimization', 'Referral programs', 'Social media growth']
    },
    {
      metric: 'Average Order Value',
      prediction: '+15%',
      confidence: 79,
      impact: 'High',
      factors: ['Bundle offers', 'Premium positioning', 'Cross-selling']
    }
  ];

  const riskFactors = [
    {
      risk: 'Supply Chain Disruption',
      probability: 23,
      impact: 'High',
      mitigation: 'Diversify suppliers, increase safety stock'
    },
    {
      risk: 'Economic Downturn',
      probability: 15,
      impact: 'Medium',
      mitigation: 'Focus on value products, flexible pricing'
    },
    {
      risk: 'Seasonal Overstock',
      probability: 34,
      impact: 'Medium',
      mitigation: 'Early promotions, outlet channels'
    }
  ];

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 85) return 'text-green-600 bg-green-100';
    if (confidence >= 70) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getRiskColor = (probability: number) => {
    if (probability >= 30) return 'text-red-600 bg-red-100';
    if (probability >= 15) return 'text-yellow-600 bg-yellow-100';
    return 'text-green-600 bg-green-100';
  };

  return (
    <div className="space-y-6">
      {/* Key Predictions Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {keyPredictions.map((prediction, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                {prediction.metric}
              </CardTitle>
              <Brain className="h-5 w-5 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900 mb-2">
                {prediction.prediction}
              </div>
              <div className="flex items-center space-x-2 mb-3">
                <Badge className={getConfidenceColor(prediction.confidence)}>
                  {prediction.confidence}% confidence
                </Badge>
                <Badge variant={prediction.impact === 'High' ? 'destructive' : 'default'}>
                  {prediction.impact} impact
                </Badge>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-gray-500">Key factors:</p>
                {prediction.factors.slice(0, 2).map((factor, i) => (
                  <p key={i} className="text-xs text-gray-600">• {factor}</p>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Revenue Forecast */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
            <TrendingUp className="h-5 w-5" />
            <span>Revenue Forecast (6 Months)</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={revenueForecast}>
                <defs>
                  <linearGradient id="confidenceGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.05}/>
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
                  tickFormatter={(value) => `$${value / 1000}k`}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #E5E7EB',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                  formatter={(value: any, name: string) => [
                    `$${value?.toLocaleString()}`, 
                    name === 'predicted' ? 'Predicted' : name === 'actual' ? 'Actual' : name
                  ]}
                />
                <Area 
                  type="monotone" 
                  dataKey="confidence_upper" 
                  stroke="none" 
                  fill="url(#confidenceGradient)"
                  stackId="confidence"
                />
                <Area 
                  type="monotone" 
                  dataKey="confidence_lower" 
                  stroke="none" 
                  fill="white"
                  stackId="confidence"
                />
                <Line 
                  type="monotone" 
                  dataKey="predicted" 
                  stroke="#3B82F6" 
                  strokeWidth={3}
                  strokeDasharray="5 5"
                  dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="actual" 
                  stroke="#10B981" 
                  strokeWidth={3}
                  dot={{ fill: '#10B981', strokeWidth: 2, r: 4 }}
                  connectNulls={false}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 flex items-center justify-center space-x-6 text-sm">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded"></div>
              <span>Actual Revenue</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 border-2 border-blue-500 border-dashed rounded"></div>
              <span>Predicted Revenue</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-blue-200 rounded"></div>
              <span>Confidence Interval</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Demand Forecast & Risk Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900">
              Product Demand Forecast
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {demandForecast.map((item, index) => {
                const stockRatio = item.current_stock / item.predicted_demand;
                const isLowStock = stockRatio < 0.7;
                
                return (
                  <div key={index} className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-gray-900">{item.product}</h4>
                      {isLowStock && (
                        <AlertCircle className="h-5 w-5 text-red-500" />
                      )}
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500">Predicted Demand</p>
                        <p className="font-medium">{item.predicted_demand}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Current Stock</p>
                        <p className={`font-medium ${
                          isLowStock ? 'text-red-600' : 'text-green-600'
                        }`}>
                          {item.current_stock}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500">Seasonality</p>
                        <p className="font-medium">{item.seasonality_factor}x</p>
                      </div>
                    </div>
                    {isLowStock && (
                      <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded">
                        <p className="text-xs text-red-700">
                          <AlertCircle className="h-3 w-3 inline mr-1" />
                          Stock may run low - consider restocking
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900">
              Risk Assessment
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {riskFactors.map((risk, index) => (
                <div key={index} className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-900">{risk.risk}</h4>
                    <div className="flex items-center space-x-2">
                      <Badge className={getRiskColor(risk.probability)}>
                        {risk.probability}%
                      </Badge>
                      <Badge variant={risk.impact === 'High' ? 'destructive' : 'default'}>
                        {risk.impact}
                      </Badge>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="text-sm text-gray-600">
                      <strong>Mitigation:</strong> {risk.mitigation}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AI Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
            <Zap className="h-5 w-5 text-yellow-500" />
            <span>AI Strategic Recommendations</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {(data?.recommendations || [
              'Increase wool blazer inventory by 40% before October peak season',
              'Launch premium accessories campaign in November for holiday demand spike',
              'Implement dynamic pricing for suits based on demand forecasting model',
              'Consider pre-orders for high-demand items to reduce stockout risk'
            ]).map((recommendation: string, index: number) => (
              <div key={index} className="flex items-start space-x-4 p-4 bg-purple-50 border border-purple-200 rounded-lg">
                <Target className="h-5 w-5 text-purple-600 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-gray-700 mb-2">{recommendation}</p>
                  <Button size="sm" variant="outline">
                    Review Strategy
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