import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card'
import { Badge } from '../../ui/badge'
import { Progress } from '../../ui/progress'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts'
import { ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from '../../../lib/supabase'
import { 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  Users,
  Package,
  Target
} from 'lucide-react'

interface ProcessingDashboardProps {
  data: any
  isLoading: boolean
}

export const ProcessingDashboard: React.FC<ProcessingDashboardProps> = ({ data, isLoading }) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-4 bg-gray-200 rounded mb-4"></div>
              <div className="h-8 bg-gray-200 rounded mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-2/3"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  const processingMetrics = data?.processingMetrics || {}
  const orders = data?.orders || []
  const realTimeMetrics = data?.realTimeMetrics || {}

  // Calculate processing statistics
  const statusBreakdown = orders.reduce((acc: any, order: any) => {
    const status = order.current_status
    acc[status] = (acc[status] || 0) + 1
    return acc
  }, {})

  const statusChartData = Object.entries(statusBreakdown).map(([status, count]) => ({
    status: ORDER_STATUS_LABELS[status as keyof typeof ORDER_STATUS_LABELS] || status,
    count,
    color: ORDER_STATUS_COLORS[status as keyof typeof ORDER_STATUS_COLORS]?.split(' ')[0].replace('bg-', '#') || '#6b7280'
  }))

  // Processing efficiency data
  const efficiencyData = processingMetrics?.dailyMetrics?.slice(-7).map((day: any) => ({
    date: new Date(day.processing_date).toLocaleDateString(),
    orders: day.order_count || 0,
    efficiency: day.avg_efficiency_score || 0,
    avgTime: day.avg_fulfillment_time || 0
  })) || []

  // Priority distribution
  const priorityBreakdown = orders.reduce((acc: any, order: any) => {
    const priority = order.order_priority || 'normal'
    acc[priority] = (acc[priority] || 0) + 1
    return acc
  }, {})

  const priorityChartData = Object.entries(priorityBreakdown).map(([priority, count]) => ({
    name: priority.replace('_', ' ').toUpperCase(),
    value: count,
    color: priority === 'rush' || priority === 'urgent' ? '#ef4444' :
           priority === 'high' ? '#f97316' :
           priority === 'wedding_party' || priority === 'prom_group' ? '#ec4899' :
           priority === 'vip_customer' ? '#8b5cf6' : '#3b82f6'
  }))

  const totalOrders = orders.length
  const completedOrders = orders.filter((o: any) => ['delivered', 'completed'].includes(o.current_status)).length
  const processingOrders = orders.filter((o: any) => ['processing', 'in_production', 'quality_check', 'packaging'].includes(o.current_status)).length
  const exceptionsCount = orders.filter((o: any) => o.has_exceptions).length

  const completionRate = totalOrders > 0 ? (completedOrders / totalOrders) * 100 : 0
  const processingRate = totalOrders > 0 ? (processingOrders / totalOrders) * 100 : 0
  const exceptionRate = totalOrders > 0 ? (exceptionsCount / totalOrders) * 100 : 0

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Completion Rate</p>
                <p className="text-2xl font-bold text-green-600">{completionRate.toFixed(1)}%</p>
                <p className="text-xs text-gray-500 mt-1">{completedOrders} of {totalOrders} orders</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
            <Progress value={completionRate} className="mt-3" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Processing Rate</p>
                <p className="text-2xl font-bold text-blue-600">{processingRate.toFixed(1)}%</p>
                <p className="text-xs text-gray-500 mt-1">{processingOrders} orders in progress</p>
              </div>
              <Package className="h-8 w-8 text-blue-500" />
            </div>
            <Progress value={processingRate} className="mt-3" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Exception Rate</p>
                <p className="text-2xl font-bold text-red-600">{exceptionRate.toFixed(1)}%</p>
                <p className="text-xs text-gray-500 mt-1">{exceptionsCount} orders with issues</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
            <Progress value={exceptionRate} className="mt-3" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Processing Time</p>
                <p className="text-2xl font-bold text-purple-600">
                  {processingMetrics?.overview?.avgFulfillmentTimeMinutes ? 
                    `${Math.round(processingMetrics.overview.avgFulfillmentTimeMinutes / 60)}h` : 
                    'N/A'
                  }
                </p>
                <p className="text-xs text-gray-500 mt-1">From payment to delivery</p>
              </div>
              <Clock className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Order Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Target className="h-5 w-5" />
              <span>Order Status Distribution</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={statusChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="status" 
                  angle={-45} 
                  textAnchor="end" 
                  height={80}
                  fontSize={12}
                />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Priority Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5" />
              <span>Priority Distribution</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={priorityChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {priorityChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Processing Efficiency Trend */}
      {efficiencyData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5" />
              <span>Processing Efficiency Trend (Last 7 Days)</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={efficiencyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis yAxisId="left" orientation="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Bar yAxisId="left" dataKey="orders" fill="#e5e7eb" name="Orders Count" />
                <Line 
                  yAxisId="right" 
                  type="monotone" 
                  dataKey="efficiency" 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  name="Efficiency Score"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Real-time Activity */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="h-5 w-5" />
              <span>Active Processors</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {realTimeMetrics?.activeProcessors?.map((processor: any) => (
                <div key={processor.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">{processor.name}</p>
                    <p className="text-sm text-gray-500">{processor.assignedOrders} orders assigned</p>
                  </div>
                  <Badge variant={processor.status === 'active' ? 'default' : 'secondary'}>
                    {processor.status}
                  </Badge>
                </div>
              )) || (
                <p className="text-gray-500 text-center py-4">No active processors data available</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Clock className="h-5 w-5" />
              <span>Processing Queue Status</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Waiting</span>
                <Badge variant="secondary">{data?.queueStatus?.statusBreakdown?.waiting || 0}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Assigned</span>
                <Badge variant="default">{data?.queueStatus?.statusBreakdown?.assigned || 0}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">In Progress</span>
                <Badge variant="default">{data?.queueStatus?.statusBreakdown?.in_progress || 0}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Completed Today</span>
                <Badge variant="default">{realTimeMetrics?.todayOrders?.completed || 0}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}