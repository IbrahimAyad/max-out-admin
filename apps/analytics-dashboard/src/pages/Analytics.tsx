import React, { useState } from 'react'
import { useAnalytics } from '../hooks/useData'
import { 
  TrendingUp, 
  TrendingDown,
  BarChart3,
  PieChart,
  LineChart,
  Target,
  Calendar,
  Filter,
  RefreshCw,
  Download,
  Zap,
  Users,
  DollarSign,
  ShoppingBag,
  Package,
  Eye,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react'

export default function Analytics() {
  const [timeframe, setTimeframe] = useState('30d')
  const [metric, setMetric] = useState('revenue')
  const [isRefreshing, setIsRefreshing] = useState(false)

  const { data: analytics, isLoading, error, refetch } = useAnalytics(timeframe, metric)

  const timeframeOptions = [
    { value: '7d', label: 'Last 7 Days' },
    { value: '30d', label: 'Last 30 Days' },
    { value: '90d', label: 'Last 3 Months' },
    { value: '365d', label: 'Last 12 Months' },
    { value: 'ytd', label: 'Year to Date' }
  ]

  const metricOptions = [
    { value: 'revenue', label: 'Revenue Analytics' },
    { value: 'customers', label: 'Customer Analytics' },
    { value: 'products', label: 'Product Analytics' },
    { value: 'traffic', label: 'Traffic Analytics' }
  ]

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      notation: amount >= 1000000 ? 'compact' : 'standard',
      maximumFractionDigits: amount >= 1000000 ? 1 : 0
    }).format(amount)
  }

  const formatPercentage = (value: number) => {
    const sign = value >= 0 ? '+' : ''
    return `${sign}${value.toFixed(1)}%`
  }

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US', {
      notation: num >= 1000 ? 'compact' : 'standard',
      maximumFractionDigits: 1
    }).format(num)
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      await refetch()
      await new Promise(resolve => setTimeout(resolve, 1000))
    } catch (error) {
      console.error('Failed to refresh analytics:', error)
    } finally {
      setIsRefreshing(false)
    }
  }

  if (isLoading && !analytics) {
    return (
      <div className="space-y-6 pb-safe">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Analytics</h2>
            <p className="text-sm text-gray-500">Advanced business analytics and insights</p>
          </div>
        </div>
        
        {/* Loading skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/3"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6 pb-safe">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">Failed to load analytics. Please try again.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-safe">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Analytics</h2>
          <p className="text-sm text-gray-500">
            Advanced business analytics and insights
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50 touch-manipulation"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50 touch-manipulation">
            <Download className="h-4 w-4 mr-2" />
            Export
          </button>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Time Period
            </label>
            <select
              value={timeframe}
              onChange={(e) => setTimeframe(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-black text-base"
              style={{ fontSize: '16px' }}
            >
              {timeframeOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Focus Area
            </label>
            <select
              value={metric}
              onChange={(e) => setMetric(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-black text-base"
              style={{ fontSize: '16px' }}
            >
              {metricOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      {analytics?.kpis && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard
            title="Revenue"
            value={formatCurrency(analytics.kpis.revenue || 0)}
            change={analytics.kpis.revenueChange || 0}
            target={analytics.kpis.revenueTarget || 0}
            icon={DollarSign}
            color="bg-green-50 border-green-200"
            iconColor="text-green-600"
          />
          <KPICard
            title="Orders"
            value={formatNumber(analytics.kpis.orders || 0)}
            change={analytics.kpis.ordersChange || 0}
            target={analytics.kpis.ordersTarget || 0}
            icon={ShoppingBag}
            color="bg-blue-50 border-blue-200"
            iconColor="text-blue-600"
          />
          <KPICard
            title="Customers"
            value={formatNumber(analytics.kpis.customers || 0)}
            change={analytics.kpis.customersChange || 0}
            target={analytics.kpis.customersTarget || 0}
            icon={Users}
            color="bg-purple-50 border-purple-200"
            iconColor="text-purple-600"
          />
          <KPICard
            title="Conversion Rate"
            value={`${(analytics.kpis.conversionRate || 0).toFixed(1)}%`}
            change={analytics.kpis.conversionChange || 0}
            target={analytics.kpis.conversionTarget || 0}
            icon={Target}
            color="bg-orange-50 border-orange-200"
            iconColor="text-orange-600"
          />
        </div>
      )}

      {/* Main Chart */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            {metricOptions.find(m => m.value === metric)?.label || 'Analytics'} Trend
          </h3>
          <div className="flex items-center space-x-2">
            <button className="p-2 text-gray-400 hover:text-gray-600 touch-manipulation">
              <LineChart className="h-4 w-4" />
            </button>
            <button className="p-2 text-gray-400 hover:text-gray-600 touch-manipulation">
              <BarChart3 className="h-4 w-4" />
            </button>
          </div>
        </div>
        
        {/* Chart Placeholder */}
        <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
          <div className="text-center">
            <LineChart className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-500">Analytics chart would be displayed here</p>
            <p className="text-xs text-gray-400 mt-1">Data for {timeframe} period</p>
          </div>
        </div>
      </div>

      {/* Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Products */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Package className="h-5 w-5 mr-2 text-gray-600" />
            Top Performing Products
          </h3>
          {analytics?.topProducts && analytics.topProducts.length > 0 ? (
            <div className="space-y-3">
              {analytics.topProducts.slice(0, 5).map((product: any, index: number) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                      <span className="text-xs font-medium text-gray-600">{index + 1}</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{product.name}</p>
                      <p className="text-xs text-gray-500">{product.category}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">{formatCurrency(product.revenue)}</p>
                    <p className="text-xs text-gray-500">{product.sales} sales</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No product data available.</p>
          )}
        </div>

        {/* Customer Insights */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Users className="h-5 w-5 mr-2 text-gray-600" />
            Customer Insights
          </h3>
          {analytics?.customerInsights ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">New Customers</span>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-gray-900">
                    {analytics.customerInsights.newCustomers}
                  </span>
                  <TrendChangeIcon change={analytics.customerInsights.newCustomersChange} />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Returning Customers</span>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-gray-900">
                    {analytics.customerInsights.returningCustomers}
                  </span>
                  <TrendChangeIcon change={analytics.customerInsights.returningCustomersChange} />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Avg. Order Value</span>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-gray-900">
                    {formatCurrency(analytics.customerInsights.avgOrderValue)}
                  </span>
                  <TrendChangeIcon change={analytics.customerInsights.aovChange} />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Customer Lifetime Value</span>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-gray-900">
                    {formatCurrency(analytics.customerInsights.clv)}
                  </span>
                  <TrendChangeIcon change={analytics.customerInsights.clvChange} />
                </div>
              </div>
            </div>
          ) : (
            <p className="text-gray-500">No customer data available.</p>
          )}
        </div>

        {/* Traffic Sources */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Eye className="h-5 w-5 mr-2 text-gray-600" />
            Traffic Sources
          </h3>
          {analytics?.trafficSources ? (
            <div className="space-y-3">
              {analytics.trafficSources.map((source: any, index: number) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: source.color }}></div>
                    <span className="text-sm text-gray-900">{source.name}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-medium text-gray-900">{source.percentage}%</span>
                    <p className="text-xs text-gray-500">{formatNumber(source.visitors)} visitors</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No traffic data available.</p>
          )}
        </div>

        {/* Performance Metrics */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Zap className="h-5 w-5 mr-2 text-gray-600" />
            Performance Metrics
          </h3>
          {analytics?.performance ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Page Load Time</span>
                <span className="text-sm font-medium text-gray-900">
                  {analytics.performance.pageLoadTime}ms
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Bounce Rate</span>
                <span className="text-sm font-medium text-gray-900">
                  {analytics.performance.bounceRate}%
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Session Duration</span>
                <span className="text-sm font-medium text-gray-900">
                  {analytics.performance.sessionDuration}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Pages per Session</span>
                <span className="text-sm font-medium text-gray-900">
                  {analytics.performance.pagesPerSession}
                </span>
              </div>
            </div>
          ) : (
            <p className="text-gray-500">No performance data available.</p>
          )}
        </div>
      </div>
    </div>
  )
}

// KPI Card Component
function KPICard({ 
  title, 
  value, 
  change, 
  target, 
  icon: Icon, 
  color, 
  iconColor 
}: { 
  title: string
  value: string
  change: number
  target: number
  icon: any
  color: string
  iconColor: string
}) {
  const formatPercentage = (value: number) => {
    const sign = value >= 0 ? '+' : ''
    return `${sign}${value.toFixed(1)}%`
  }

  const getChangeColor = (value: number) => {
    if (value > 0) return 'text-green-600'
    if (value < 0) return 'text-red-600'
    return 'text-gray-600'
  }

  const progressPercentage = target > 0 ? Math.min((parseFloat(value.replace(/[^0-9.-]/g, '')) / target) * 100, 100) : 0

  return (
    <div className={`bg-white rounded-lg border p-4 ${color}`}>
      <div className="flex items-center justify-between mb-2">
        <Icon className={`h-5 w-5 ${iconColor}`} />
        <TrendChangeIcon change={change} />
      </div>
      <div className="mb-2">
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        <p className="text-sm text-gray-600">{title}</p>
      </div>
      <div className="flex items-center justify-between text-xs">
        <span className={getChangeColor(change)}>
          {formatPercentage(change)} vs last period
        </span>
        {target > 0 && (
          <span className="text-gray-500">
            {progressPercentage.toFixed(0)}% of target
          </span>
        )}
      </div>
      {target > 0 && (
        <div className="mt-2">
          <div className="w-full bg-gray-200 rounded-full h-1">
            <div 
              className="bg-current h-1 rounded-full transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
        </div>
      )}
    </div>
  )
}

// Trend Change Icon Component
function TrendChangeIcon({ change }: { change: number }) {
  if (change > 0) {
    return <ArrowUpRight className="h-4 w-4 text-green-600" />
  } else if (change < 0) {
    return <ArrowDownRight className="h-4 w-4 text-red-600" />
  }
  return null
}