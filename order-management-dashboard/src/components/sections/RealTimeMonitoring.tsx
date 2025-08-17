import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card'
import { Badge } from '../../ui/badge'
import { Button } from '../../ui/button'
import { Progress } from '../../ui/progress'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Users,
  Server,
  Wifi,
  Database,
  Zap,
  TrendingUp,
  Eye
} from 'lucide-react'

interface RealTimeMonitoringProps {
  data: any
  isLoading: boolean
}

export const RealTimeMonitoring: React.FC<RealTimeMonitoringProps> = ({ data, isLoading }) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

  const realTimeMetrics = data?.realTimeMetrics || {}
  const queueStatus = data?.queueStatus || {}
  
  // Mock real-time data for demonstration
  const systemHealth = {
    cpu: 68,
    memory: 72,
    database: 45,
    api: 89,
    overall: 94
  }

  const activeUsers = {
    adminUsers: 8,
    customerUsers: 156,
    apiCalls: 2847,
    avgResponseTime: 245
  }

  const orderFlowData = [
    { time: '16:00', pending: 15, processing: 23, shipped: 8 },
    { time: '16:15', pending: 12, processing: 25, shipped: 11 },
    { time: '16:30', pending: 18, processing: 22, shipped: 9 },
    { time: '16:45', pending: 14, processing: 27, shipped: 13 },
    { time: '17:00', pending: 16, processing: 24, shipped: 10 },
    { time: '17:15', pending: 13, processing: 26, shipped: 12 },
    { time: '17:30', pending: 19, processing: 21, shipped: 15 }
  ]

  const alerts = [
    {
      id: 1,
      type: 'warning',
      message: 'High queue length detected in production stage',
      timestamp: '2025-08-17T17:25:00Z',
      resolved: false
    },
    {
      id: 2,
      type: 'info',
      message: 'Automated backup completed successfully',
      timestamp: '2025-08-17T17:00:00Z',
      resolved: true
    },
    {
      id: 3,
      type: 'error',
      message: 'Payment processing service experiencing delays',
      timestamp: '2025-08-17T16:45:00Z',
      resolved: false
    }
  ]

  const getHealthColor = (value: number) => {
    if (value >= 95) return 'text-green-600'
    if (value >= 80) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getHealthBgColor = (value: number) => {
    if (value >= 95) return 'bg-green-100'
    if (value >= 80) return 'bg-yellow-100'
    return 'bg-red-100'
  }

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'error': return <AlertTriangle className="h-4 w-4 text-red-500" />
      case 'warning': return <AlertTriangle className="h-4 w-4 text-orange-500" />
      case 'info': return <CheckCircle className="h-4 w-4 text-blue-500" />
      default: return <Activity className="h-4 w-4 text-gray-500" />
    }
  }

  const getAlertColor = (type: string) => {
    switch (type) {
      case 'error': return 'border-red-200 bg-red-50'
      case 'warning': return 'border-orange-200 bg-orange-50'
      case 'info': return 'border-blue-200 bg-blue-50'
      default: return 'border-gray-200 bg-gray-50'
    }
  }

  return (
    <div className="space-y-6">
      {/* System Health Overview */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">CPU Usage</p>
                <p className={`text-2xl font-bold ${getHealthColor(100 - systemHealth.cpu)}`}>
                  {systemHealth.cpu}%
                </p>
              </div>
              <Server className="h-8 w-8 text-blue-500" />
            </div>
            <Progress value={systemHealth.cpu} className="mt-3" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Memory</p>
                <p className={`text-2xl font-bold ${getHealthColor(100 - systemHealth.memory)}`}>
                  {systemHealth.memory}%
                </p>
              </div>
              <Database className="h-8 w-8 text-purple-500" />
            </div>
            <Progress value={systemHealth.memory} className="mt-3" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Database</p>
                <p className={`text-2xl font-bold ${getHealthColor(100 - systemHealth.database)}`}>
                  {systemHealth.database}%
                </p>
              </div>
              <Database className="h-8 w-8 text-green-500" />
            </div>
            <Progress value={systemHealth.database} className="mt-3" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">API Health</p>
                <p className={`text-2xl font-bold ${getHealthColor(systemHealth.api)}`}>
                  {systemHealth.api}%
                </p>
              </div>
              <Wifi className="h-8 w-8 text-orange-500" />
            </div>
            <Progress value={systemHealth.api} className="mt-3" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Overall Health</p>
                <p className={`text-2xl font-bold ${getHealthColor(systemHealth.overall)}`}>
                  {systemHealth.overall}%
                </p>
              </div>
              <Activity className="h-8 w-8 text-green-500" />
            </div>
            <Progress value={systemHealth.overall} className="mt-3" />
          </CardContent>
        </Card>
      </div>

      {/* Live Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="h-5 w-5" />
              <span>Active Users & API Activity</span>
              <Badge variant="outline">
                <Eye className="h-3 w-3 mr-1" />
                Live
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-600 font-medium">Admin Users</p>
                <p className="text-2xl font-bold text-blue-900">{activeUsers.adminUsers}</p>
                <p className="text-xs text-blue-600">Currently active</p>
              </div>
              
              <div className="p-4 bg-green-50 rounded-lg">
                <p className="text-sm text-green-600 font-medium">Customer Users</p>
                <p className="text-2xl font-bold text-green-900">{activeUsers.customerUsers}</p>
                <p className="text-xs text-green-600">Online now</p>
              </div>
              
              <div className="p-4 bg-purple-50 rounded-lg">
                <p className="text-sm text-purple-600 font-medium">API Calls</p>
                <p className="text-2xl font-bold text-purple-900">{activeUsers.apiCalls.toLocaleString()}</p>
                <p className="text-xs text-purple-600">Last hour</p>
              </div>
              
              <div className="p-4 bg-orange-50 rounded-lg">
                <p className="text-sm text-orange-600 font-medium">Response Time</p>
                <p className="text-2xl font-bold text-orange-900">{activeUsers.avgResponseTime}ms</p>
                <p className="text-xs text-orange-600">Average</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5" />
              <span>Order Flow (Last 2 Hours)</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={orderFlowData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="pending" 
                  stroke="#f59e0b" 
                  strokeWidth={2}
                  name="Pending"
                />
                <Line 
                  type="monotone" 
                  dataKey="processing" 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  name="Processing"
                />
                <Line 
                  type="monotone" 
                  dataKey="shipped" 
                  stroke="#22c55e" 
                  strokeWidth={2}
                  name="Shipped"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Real-time Alerts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5" />
            <span>System Alerts</span>
            <Badge variant="outline">
              {alerts.filter(a => !a.resolved).length} Active
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {alerts.map((alert) => (
              <Card key={alert.id} className={`${getAlertColor(alert.type)} ${alert.resolved ? 'opacity-60' : ''}`}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {getAlertIcon(alert.type)}
                      <div>
                        <p className="font-medium text-gray-900">{alert.message}</p>
                        <p className="text-sm text-gray-500">
                          {new Date(alert.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {alert.resolved ? (
                        <Badge variant="secondary">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Resolved
                        </Badge>
                      ) : (
                        <Button size="sm" variant="outline">
                          Acknowledge
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Queue Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Clock className="h-5 w-5" />
              <span>Processing Queue Status</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
                <span className="font-medium text-gray-900">Waiting</span>
                <Badge variant="secondary">{queueStatus.statusBreakdown?.waiting || 0}</Badge>
              </div>
              
              <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                <span className="font-medium text-gray-900">Assigned</span>
                <Badge variant="default">{queueStatus.statusBreakdown?.assigned || 0}</Badge>
              </div>
              
              <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                <span className="font-medium text-gray-900">In Progress</span>
                <Badge variant="default">{queueStatus.statusBreakdown?.in_progress || 0}</Badge>
              </div>
              
              <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                <span className="font-medium text-gray-900">Completed Today</span>
                <Badge variant="default">{realTimeMetrics.todayOrders?.completed || 0}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Zap className="h-5 w-5" />
              <span>Performance Indicators</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Average Processing Time</span>
                <span className="font-medium">64 minutes</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">SLA Compliance</span>
                <span className="font-medium text-green-600">98%</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Exception Rate</span>
                <span className="font-medium text-orange-600">2.1%</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Customer Satisfaction</span>
                <span className="font-medium text-green-600">4.8/5</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Automation Rate</span>
                <span className="font-medium text-blue-600">85%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}