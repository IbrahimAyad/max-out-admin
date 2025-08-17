import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card'
import { Badge } from '../../ui/badge'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts'
import { 
  TrendingUp, 
  TrendingDown, 
  Target, 
  Clock, 
  Award,
  BarChart3,
  Users,
  AlertTriangle
} from 'lucide-react'

interface PerformanceAnalyticsProps {
  data: any
  isLoading: boolean
}

export const PerformanceAnalytics: React.FC<PerformanceAnalyticsProps> = ({ data, isLoading }) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-4 bg-gray-200 rounded mb-4"></div>
              <div className="h-32 bg-gray-200 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  const processingMetrics = data?.processingMetrics || {}
  const orders = data?.orders || []

  // Mock performance data - in real implementation this would come from the analytics API
  const efficiencyTrend = [
    { date: '2025-08-11', efficiency: 92, slaCompliance: 98, avgTime: 68 },
    { date: '2025-08-12', efficiency: 89, slaCompliance: 94, avgTime: 72 },
    { date: '2025-08-13', efficiency: 94, slaCompliance: 96, avgTime: 65 },
    { date: '2025-08-14', efficiency: 91, slaCompliance: 92, avgTime: 71 },
    { date: '2025-08-15', efficiency: 96, slaCompliance: 99, avgTime: 62 },
    { date: '2025-08-16', efficiency: 93, slaCompliance: 97, avgTime: 66 },
    { date: '2025-08-17', efficiency: 95, slaCompliance: 98, avgTime: 64 }
  ]

  const bottleneckData = [
    { stage: 'Payment Processing', avgTime: 15, slaTarget: 30 },
    { stage: 'Production', avgTime: 1440, slaTarget: 2880 }, // 24 hours vs 48 hours
    { stage: 'Quality Check', avgTime: 180, slaTarget: 240 },
    { stage: 'Shipping', avgTime: 960, slaTarget: 1440 }, // 16 hours vs 24 hours
    { stage: 'Delivery', avgTime: 2880, slaTarget: 4320 } // 48 hours vs 72 hours
  ]

  const processorPerformance = [
    { name: 'Processor A', efficiency: 96, ordersCompleted: 45, avgTime: 58 },
    { name: 'Processor B', efficiency: 92, ordersCompleted: 38, avgTime: 65 },
    { name: 'Processor C', efficiency: 89, ordersCompleted: 42, avgTime: 71 },
    { name: 'Processor D', efficiency: 94, ordersCompleted: 40, avgTime: 62 }
  ]

  const qualityMetrics = [
    { metric: 'First Pass Quality', value: 94, target: 95, color: '#ef4444' },
    { metric: 'Customer Satisfaction', value: 4.8, target: 4.5, color: '#22c55e' },
    { metric: 'Rework Rate', value: 3.2, target: 5.0, color: '#22c55e' },
    { metric: 'On-Time Delivery', value: 97, target: 95, color: '#22c55e' }
  ]

  const currentEfficiency = efficiencyTrend[efficiencyTrend.length - 1]?.efficiency || 0
  const currentSLA = efficiencyTrend[efficiencyTrend.length - 1]?.slaCompliance || 0
  const currentAvgTime = efficiencyTrend[efficiencyTrend.length - 1]?.avgTime || 0

  const getPerformanceColor = (value: number, target: number, inverse: boolean = false) => {
    const ratio = inverse ? target / value : value / target
    if (ratio >= 1.05) return 'text-green-600'
    if (ratio >= 0.95) return 'text-yellow-600'
    return 'text-red-600'
  }

  return (
    <div className="space-y-6">
      {/* Key Performance Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Overall Efficiency</p>
                <p className="text-2xl font-bold text-green-600">{currentEfficiency}%</p>
                <p className="text-xs text-gray-500 mt-1">Processing efficiency score</p>
              </div>
              <Target className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">SLA Compliance</p>
                <p className="text-2xl font-bold text-blue-600">{currentSLA}%</p>
                <p className="text-xs text-gray-500 mt-1">Orders delivered on time</p>
              </div>
              <Award className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Processing Time</p>
                <p className="text-2xl font-bold text-purple-600">{currentAvgTime}h</p>
                <p className="text-xs text-gray-500 mt-1">End-to-end fulfillment</p>
              </div>
              <Clock className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Processors</p>
                <p className="text-2xl font-bold text-orange-600">{processorPerformance.length}</p>
                <p className="text-xs text-gray-500 mt-1">Currently processing orders</p>
              </div>
              <Users className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Trends */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5" />
              <span>Efficiency Trend (7 Days)</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={efficiencyTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="efficiency" 
                  stroke="#22c55e" 
                  strokeWidth={2}
                  name="Efficiency %"
                />
                <Line 
                  type="monotone" 
                  dataKey="slaCompliance" 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  name="SLA Compliance %"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5" />
              <span>Processing Stage Analysis</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={bottleneckData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="stage" 
                  angle={-45} 
                  textAnchor="end" 
                  height={80}
                  fontSize={12}
                />
                <YAxis />
                <Tooltip 
                  formatter={(value, name) => [
                    `${value} minutes`, 
                    name === 'avgTime' ? 'Actual Time' : 'SLA Target'
                  ]}
                />
                <Bar dataKey="avgTime" fill="#3b82f6" name="Actual Time" />
                <Bar dataKey="slaTarget" fill="#e5e7eb" name="SLA Target" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Quality Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Award className="h-5 w-5" />
            <span>Quality Metrics</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {qualityMetrics.map((metric, index) => (
              <div key={index} className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-600">{metric.metric}</span>
                  {metric.value >= metric.target ? (
                    <TrendingUp className="h-4 w-4 text-green-500" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-500" />
                  )}
                </div>
                <div className="text-2xl font-bold" style={{ color: metric.color }}>
                  {metric.metric.includes('Satisfaction') ? metric.value.toFixed(1) : `${metric.value}%`}
                </div>
                <div className="text-xs text-gray-500">
                  Target: {metric.metric.includes('Satisfaction') ? metric.target.toFixed(1) : `${metric.target}%`}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Processor Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5" />
            <span>Processor Performance</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {processorPerformance.map((processor, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <Users className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{processor.name}</p>
                    <p className="text-sm text-gray-500">{processor.ordersCompleted} orders completed</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-6">
                  <div className="text-center">
                    <p className="text-sm text-gray-600">Efficiency</p>
                    <p className="text-lg font-bold text-green-600">{processor.efficiency}%</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-600">Avg Time</p>
                    <p className="text-lg font-bold text-blue-600">{processor.avgTime}h</p>
                  </div>
                  <Badge 
                    variant={processor.efficiency >= 95 ? 'default' : 
                            processor.efficiency >= 90 ? 'secondary' : 'destructive'}
                  >
                    {processor.efficiency >= 95 ? 'Excellent' : 
                     processor.efficiency >= 90 ? 'Good' : 'Needs Improvement'}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5" />
            <span>Performance Recommendations</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start space-x-3">
                <TrendingUp className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="font-medium text-blue-900">Optimize Production Stage</p>
                  <p className="text-sm text-blue-700">Production is taking 24 hours on average. Consider adding capacity or streamlining workflow to reduce bottleneck.</p>
                </div>
              </div>
            </div>
            
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-start space-x-3">
                <Award className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <p className="font-medium text-green-900">Excellent SLA Performance</p>
                  <p className="text-sm text-green-700">97% on-time delivery rate exceeds target. Current processes are working well.</p>
                </div>
              </div>
            </div>
            
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-start space-x-3">
                <Clock className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div>
                  <p className="font-medium text-yellow-900">Monitor Rush Order Processing</p>
                  <p className="text-sm text-yellow-700">Rush orders require closer monitoring to maintain quality while meeting tight deadlines.</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}