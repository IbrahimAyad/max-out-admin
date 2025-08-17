import React, { useState } from 'react'
import { useDashboardStats } from '../hooks/useData'
import { 
  BarChart3, 
  TrendingUp, 
  Download, 
  Calendar,
  Filter,
  DollarSign,
  ShoppingCart,
  Users,
  Package
} from 'lucide-react'

export default function Reports() {
  const [dateRange, setDateRange] = useState('30')
  const { data: stats, isLoading } = useDashboardStats()

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-neutral-900">Reports</h2>
          <p className="text-sm text-neutral-500">
            Analytics and business insights
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
            <option value="365">Last year</option>
          </select>
          <button className="inline-flex items-center px-4 py-2 border border-neutral-300 rounded-md shadow-sm text-sm font-medium text-neutral-700 bg-white hover:bg-neutral-50">
            <Download className="h-4 w-4 mr-2" />
            Export
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white rounded-lg border border-neutral-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-neutral-500">Total Revenue</p>
              <p className="text-2xl font-bold text-neutral-900">
                {formatCurrency(stats?.todayRevenue * 30 || 15420)}
              </p>
              <p className="text-xs text-neutral-500">Past {dateRange} days</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-neutral-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ShoppingCart className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-neutral-500">Total Orders</p>
              <p className="text-2xl font-bold text-neutral-900">
                {stats?.totalOrders || 0}
              </p>
              <p className="text-xs text-neutral-500">All time</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-neutral-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Users className="h-8 w-8 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-neutral-500">Total Customers</p>
              <p className="text-2xl font-bold text-neutral-900">
                {stats?.totalCustomers || 0}
              </p>
              <p className="text-xs text-neutral-500">Registered</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-neutral-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Package className="h-8 w-8 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-neutral-500">Products Sold</p>
              <p className="text-2xl font-bold text-neutral-900">
                {Math.floor((stats?.totalOrders || 0) * 1.3)}
              </p>
              <p className="text-xs text-neutral-500">Total units</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <div className="bg-white rounded-lg border border-neutral-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-neutral-900">Revenue Trend</h3>
            <BarChart3 className="h-5 w-5 text-neutral-400" />
          </div>
          <div className="h-64 flex items-center justify-center bg-neutral-50 rounded-lg">
            <div className="text-center">
              <BarChart3 className="h-12 w-12 text-neutral-400 mx-auto mb-2" />
              <p className="text-sm text-neutral-500">Revenue chart visualization</p>
              <p className="text-xs text-neutral-400">Chart integration coming soon</p>
            </div>
          </div>
        </div>

        {/* Orders Chart */}
        <div className="bg-white rounded-lg border border-neutral-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-neutral-900">Order Volume</h3>
            <TrendingUp className="h-5 w-5 text-neutral-400" />
          </div>
          <div className="h-64 flex items-center justify-center bg-neutral-50 rounded-lg">
            <div className="text-center">
              <TrendingUp className="h-12 w-12 text-neutral-400 mx-auto mb-2" />
              <p className="text-sm text-neutral-500">Order volume chart</p>
              <p className="text-xs text-neutral-400">Chart integration coming soon</p>
            </div>
          </div>
        </div>
      </div>

      {/* Additional Reports */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Products */}
        <div className="bg-white rounded-lg border border-neutral-200 p-6">
          <h3 className="text-lg font-medium text-neutral-900 mb-4">Top Products</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-neutral-100">
              <span className="text-sm text-neutral-900">Classic Black Suit</span>
              <span className="text-sm font-medium text-neutral-600">42 sold</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-neutral-100">
              <span className="text-sm text-neutral-900">Navy Wool Blazer</span>
              <span className="text-sm font-medium text-neutral-600">38 sold</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-neutral-100">
              <span className="text-sm text-neutral-900">White Dress Shirt</span>
              <span className="text-sm font-medium text-neutral-600">35 sold</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-sm text-neutral-900">Silk Tie Collection</span>
              <span className="text-sm font-medium text-neutral-600">28 sold</span>
            </div>
          </div>
        </div>

        {/* Customer Insights */}
        <div className="bg-white rounded-lg border border-neutral-200 p-6">
          <h3 className="text-lg font-medium text-neutral-900 mb-4">Customer Insights</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-neutral-500">Avg. Order Value:</span>
              <span className="text-sm font-medium text-neutral-900">{formatCurrency(245)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-neutral-500">Repeat Customers:</span>
              <span className="text-sm font-medium text-neutral-900">68%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-neutral-500">Customer Lifetime Value:</span>
              <span className="text-sm font-medium text-neutral-900">{formatCurrency(892)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-neutral-500">Acquisition Rate:</span>
              <span className="text-sm font-medium text-neutral-900">+12%</span>
            </div>
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="bg-white rounded-lg border border-neutral-200 p-6">
          <h3 className="text-lg font-medium text-neutral-900 mb-4">Performance</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-neutral-500">Conversion Rate:</span>
              <span className="text-sm font-medium text-green-600">3.2%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-neutral-500">Cart Abandonment:</span>
              <span className="text-sm font-medium text-yellow-600">67%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-neutral-500">Return Rate:</span>
              <span className="text-sm font-medium text-neutral-900">2.1%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-neutral-500">Customer Satisfaction:</span>
              <span className="text-sm font-medium text-green-600">4.8/5</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}