import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts'
import {
  TrendingUp,
  TrendingDown,
  Eye,
  Edit,
  Users,
  ShoppingCart,
  Calendar,
  Activity
} from 'lucide-react'
import analytics from '../lib/analytics'

const AnalyticsDashboard: React.FC = () => {
  const [timeRange, setTimeRange] = useState('7d')

  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard-analytics', timeRange],
    queryFn: () => analytics.getDashboardStats(),
    refetchInterval: 30000 // Refresh every 30 seconds
  })

  const mockChartData = [
    { name: 'Mon', views: 120, edits: 12 },
    { name: 'Tue', views: 190, edits: 18 },
    { name: 'Wed', views: 100, edits: 8 },
    { name: 'Thu', views: 220, edits: 25 },
    { name: 'Fri', views: 180, edits: 15 },
    { name: 'Sat', views: 160, edits: 10 },
    { name: 'Sun', views: 140, edits: 14 }
  ]

  const categoryData = [
    { name: 'Suits', value: 35, color: '#8884d8' },
    { name: 'Blazers', value: 30, color: '#82ca9d' },
    { name: 'Accessories', value: 20, color: '#ffc658' },
    { name: 'Shirts', value: 15, color: '#ff7300' }
  ]

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="h-64 bg-gray-200 rounded-lg"></div>
            <div className="h-64 bg-gray-200 rounded-lg"></div>
          </div>
        </div>
      </div>
    )
  }

  const StatCard = ({ title, value, change, icon: Icon, trend }: {
    title: string
    value: string | number
    change: number
    icon: React.ComponentType<any>
    trend: 'up' | 'down'
  }) => (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
        <div className="p-3 bg-indigo-50 rounded-lg">
          <Icon className="h-6 w-6 text-indigo-600" />
        </div>
      </div>
      <div className="mt-4 flex items-center">
        {trend === 'up' ? (
          <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
        ) : (
          <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
        )}
        <span className={`text-sm font-medium ${
          trend === 'up' ? 'text-green-600' : 'text-red-600'
        }`}>
          {change.toFixed(1)}%
        </span>
        <span className="text-sm text-gray-500 ml-2">vs last week</span>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Activity className="h-8 w-8 text-indigo-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
                <p className="text-sm text-gray-500">Real-time insights and performance metrics</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="1d">Last 24 hours</option>
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 90 days</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Page Views"
            value={stats?.pageViews?.week || 0}
            change={stats?.pageViews?.change || 0}
            icon={Eye}
            trend={stats?.pageViews?.change >= 0 ? 'up' : 'down'}
          />
          <StatCard
            title="Product Views"
            value={stats?.productViews?.week || 0}
            change={stats?.productViews?.change || 0}
            icon={ShoppingCart}
            trend={stats?.productViews?.change >= 0 ? 'up' : 'down'}
          />
          <StatCard
            title="Product Edits"
            value={stats?.productEdits?.week || 0}
            change={stats?.productEdits?.change || 0}
            icon={Edit}
            trend={stats?.productEdits?.change >= 0 ? 'up' : 'down'}
          />
          <StatCard
            title="Active Sessions"
            value={42}
            change={15.3}
            icon={Users}
            trend="up"
          />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Activity Chart */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Daily Activity</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={mockChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="views"
                  stroke="#8884d8"
                  strokeWidth={2}
                  name="Views"
                />
                <Line
                  type="monotone"
                  dataKey="edits"
                  stroke="#82ca9d"
                  strokeWidth={2}
                  name="Edits"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Category Distribution */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Category Performance</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Recent Activity</h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {stats?.recentActivity?.slice(0, 10).map((activity, index) => (
                <div key={index} className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
                  <div className="flex-shrink-0">
                    {activity.event_type === 'product_view' && (
                      <Eye className="h-5 w-5 text-blue-500" />
                    )}
                    {activity.event_type === 'product_edit' && (
                      <Edit className="h-5 w-5 text-green-500" />
                    )}
                    {!['product_view', 'product_edit'].includes(activity.event_type) && (
                      <Activity className="h-5 w-5 text-gray-500" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">
                      {activity.event_type.replace('_', ' ').toUpperCase()}
                    </p>
                    <p className="text-sm text-gray-500 truncate">
                      {activity.properties?.product_name || 'Unknown item'}
                    </p>
                  </div>
                  <div className="text-sm text-gray-500">
                    {new Date(activity.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              )) || (
                <div className="text-center py-8">
                  <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-sm font-medium text-gray-900 mb-2">No recent activity</h3>
                  <p className="text-sm text-gray-500">Activity will appear here as users interact with your products.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AnalyticsDashboard
