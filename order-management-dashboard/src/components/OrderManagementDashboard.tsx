import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { useOrderManagement } from '../../hooks/useOrderManagement'
import { OrderQueue } from './sections/OrderQueue'
import { ProcessingDashboard } from './sections/ProcessingDashboard'
import { ExceptionManagement } from './sections/ExceptionManagement'
import { PerformanceAnalytics } from './sections/PerformanceAnalytics'
import { CustomerCommunications } from './sections/CustomerCommunications'
import { RealTimeMonitoring } from './sections/RealTimeMonitoring'
import { 
  ListOrdered, 
  BarChart3, 
  AlertTriangle, 
  TrendingUp, 
  MessageSquare, 
  Activity,
  RefreshCw, 
  Clock, 
  Settings,
  Zap
} from 'lucide-react'

export const OrderManagementDashboard: React.FC = () => {
  const {
    data,
    isLoading,
    error,
    timeframe,
    setTimeframe,
    refreshAll
  } = useOrderManagement()

  const [activeTab, setActiveTab] = useState('queue')

  const tabs = [
    {
      id: 'queue',
      label: 'Order Queue',
      icon: ListOrdered,
      component: OrderQueue,
      description: 'Smart priority queue management and order assignment'
    },
    {
      id: 'processing',
      label: 'Processing Dashboard',
      icon: BarChart3,
      component: ProcessingDashboard,
      description: 'Real-time processing status and workflow tracking'
    },
    {
      id: 'exceptions',
      label: 'Exception Management',
      icon: AlertTriangle,
      component: ExceptionManagement,
      description: 'Handle order exceptions and escalations'
    },
    {
      id: 'analytics',
      label: 'Performance Analytics',
      icon: TrendingUp,
      component: PerformanceAnalytics,
      description: 'Processing efficiency and performance metrics'
    },
    {
      id: 'communications',
      label: 'Customer Communications',
      icon: MessageSquare,
      component: CustomerCommunications,
      description: 'Automated and manual customer communications'
    },
    {
      id: 'monitoring',
      label: 'Real-Time Monitoring',
      icon: Activity,
      component: RealTimeMonitoring,
      description: 'Live system monitoring and alerts'
    }
  ]

  if (error) {
    return (
      <div className="space-y-6">
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-800">Order Management Dashboard Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-700 mb-4">
              Failed to load order management data. Please check your connection and try again.
            </p>
            <Button onClick={refreshAll} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Calculate summary metrics
  const totalOrders = data.orders?.length || 0
  const pendingOrders = data.orders?.filter(o => ['pending_payment', 'payment_confirmed', 'processing'].includes(o.current_status)).length || 0
  const exceptionsCount = data.exceptions?.filter(e => e.status !== 'resolved').length || 0
  const queueLength = data.queueStatus?.queueLength || 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-gray-200 rounded-lg">
        <div className="px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center space-x-3">
                <Settings className="h-8 w-8 text-blue-600" />
                <span>Intelligent Order Management Dashboard</span>
              </h1>
              <p className="text-gray-600 mt-1">
                Automated order processing with smart routing and exception handling
              </p>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* System Status Indicators */}
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-sm text-gray-600">System Online</span>
                </div>
                {exceptionsCount > 0 && (
                  <Badge variant="destructive" className="animate-pulse">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    {exceptionsCount} Exceptions
                  </Badge>
                )}
              </div>

              {/* Timeframe Selector */}
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-gray-500" />
                <Select value={timeframe} onValueChange={setTimeframe}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1d">Last 24 hours</SelectItem>
                    <SelectItem value="7d">Last 7 days</SelectItem>
                    <SelectItem value="30d">Last 30 days</SelectItem>
                    <SelectItem value="90d">Last 90 days</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Manual Refresh */}
              <Button 
                onClick={refreshAll} 
                variant="outline" 
                size="sm"
                disabled={isLoading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Orders</p>
                    <p className="text-2xl font-bold text-gray-900">{totalOrders}</p>
                  </div>
                  <ListOrdered className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Processing Queue</p>
                    <p className="text-2xl font-bold text-gray-900">{queueLength}</p>
                  </div>
                  <Clock className="h-8 w-8 text-orange-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Pending Orders</p>
                    <p className="text-2xl font-bold text-gray-900">{pendingOrders}</p>
                  </div>
                  <Activity className="h-8 w-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Active Exceptions</p>
                    <p className="text-2xl font-bold text-gray-900">{exceptionsCount}</p>
                  </div>
                  <AlertTriangle className={`h-8 w-8 ${exceptionsCount > 0 ? 'text-red-500' : 'text-green-500'}`} />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Dashboard Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        {/* Tab Navigation */}
        <div className="bg-white rounded-lg border border-gray-200 p-2">
          <TabsList className="grid w-full grid-cols-6 gap-2 bg-transparent">
            {tabs.map((tab) => {
              const IconComponent = tab.icon
              return (
                <TabsTrigger
                  key={tab.id}
                  value={tab.id}
                  className="flex flex-col items-center space-y-2 p-4 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:border-blue-200 border border-transparent rounded-md transition-all"
                >
                  <IconComponent className="h-5 w-5" />
                  <div className="text-center">
                    <div className="text-sm font-medium">{tab.label}</div>
                    <div className="text-xs text-gray-500 hidden lg:block">
                      {tab.description}
                    </div>
                  </div>
                </TabsTrigger>
              )
            })}
          </TabsList>
        </div>

        {/* Tab Content */}
        {tabs.map((tab) => {
          const ComponentToRender = tab.component
          return (
            <TabsContent key={tab.id} value={tab.id} className="space-y-6">
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    <tab.icon className="h-6 w-6 text-blue-600" />
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900">
                        {tab.label}
                      </h2>
                      <p className="text-sm text-gray-600">
                        {tab.description}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {isLoading && (
                      <Badge variant="secondary" className="animate-pulse">
                        <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                        Loading...
                      </Badge>
                    )}
                    <Badge variant="outline">
                      <Zap className="h-3 w-3 mr-1" />
                      Real-time
                    </Badge>
                  </div>
                </div>
                
                <ComponentToRender 
                  data={data} 
                  isLoading={isLoading}
                />
              </div>
            </TabsContent>
          )
        })}
      </Tabs>
    </div>
  )
}