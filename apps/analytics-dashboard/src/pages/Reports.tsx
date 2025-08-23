import React, { useState } from 'react'
import { useReports } from '../hooks/useData'
import { 
  FileText, 
  Download, 
  Calendar, 
  TrendingUp,
  DollarSign,
  ShoppingBag,
  Users,
  Package,
  Filter,
  RefreshCw,
  BarChart3,
  PieChart,
  LineChart
} from 'lucide-react'

export default function Reports() {
  const [dateRange, setDateRange] = useState('month')
  const [reportType, setReportType] = useState('sales')
  const [isGenerating, setIsGenerating] = useState(false)

  const { data: reports, isLoading, error, refetch } = useReports(dateRange, reportType)

  const dateRangeOptions = [
    { value: 'week', label: 'Last 7 Days' },
    { value: 'month', label: 'Last 30 Days' },
    { value: 'quarter', label: 'Last 3 Months' },
    { value: 'year', label: 'Last 12 Months' },
    { value: 'custom', label: 'Custom Range' }
  ]

  const reportTypes = [
    { 
      value: 'sales', 
      label: 'Sales Report', 
      icon: DollarSign,
      description: 'Revenue, orders, and sales trends'
    },
    { 
      value: 'products', 
      label: 'Product Report', 
      icon: Package,
      description: 'Top products, inventory, and performance'
    },
    { 
      value: 'customers', 
      label: 'Customer Report', 
      icon: Users,
      description: 'Customer analytics and behavior'
    },
    { 
      value: 'inventory', 
      label: 'Inventory Report', 
      icon: BarChart3,
      description: 'Stock levels and inventory movements'
    }
  ]

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
  }

  const formatPercentage = (value: number) => {
    const sign = value >= 0 ? '+' : ''
    return `${sign}${value.toFixed(1)}%`
  }

  const handleGenerateReport = async () => {
    setIsGenerating(true)
    try {
      await refetch()
      // Simulate report generation time
      await new Promise(resolve => setTimeout(resolve, 1500))
    } catch (error) {
      console.error('Failed to generate report:', error)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleExportReport = (format: string) => {
    // Placeholder for export functionality
    console.log(`Exporting report in ${format} format`)
  }

  if (isLoading && !reports) {
    return (
      <div className="space-y-6 pb-safe">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Reports</h2>
            <p className="text-sm text-gray-500">Generate and analyze business reports</p>
          </div>
        </div>
        
        {/* Loading skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
                <div className="h-32 bg-gray-200 rounded mb-4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-safe">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Reports</h2>
          <p className="text-sm text-gray-500">
            Generate and analyze business reports
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={handleGenerateReport}
            disabled={isGenerating}
            className="inline-flex items-center px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 touch-manipulation"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isGenerating ? 'animate-spin' : ''}`} />
            {isGenerating ? 'Generating...' : 'Refresh Data'}
          </button>
        </div>
      </div>

      {/* Report Configuration */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Report Configuration</h3>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
          {/* Date Range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date Range
            </label>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-black text-base"
              style={{ fontSize: '16px' }}
            >
              {dateRangeOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>

          {/* Report Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Report Type
            </label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-black text-base"
              style={{ fontSize: '16px' }}
            >
              {reportTypes.map((type) => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Export Options */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => handleExportReport('pdf')}
            className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50 touch-manipulation"
          >
            <Download className="h-4 w-4 mr-2" />
            Export PDF
          </button>
          <button
            onClick={() => handleExportReport('excel')}
            className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50 touch-manipulation"
          >
            <Download className="h-4 w-4 mr-2" />
            Export Excel
          </button>
          <button
            onClick={() => handleExportReport('csv')}
            className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50 touch-manipulation"
          >
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Report Summary Cards */}
      {reports?.summary && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <SummaryCard
            title="Total Revenue"
            value={formatCurrency(reports.summary.totalRevenue || 0)}
            change={reports.summary.revenueChange || 0}
            icon={DollarSign}
            color="text-green-600"
          />
          <SummaryCard
            title="Total Orders"
            value={(reports.summary.totalOrders || 0).toLocaleString()}
            change={reports.summary.ordersChange || 0}
            icon={ShoppingBag}
            color="text-blue-600"
          />
          <SummaryCard
            title="New Customers"
            value={(reports.summary.newCustomers || 0).toLocaleString()}
            change={reports.summary.customersChange || 0}
            icon={Users}
            color="text-purple-600"
          />
          <SummaryCard
            title="Avg Order Value"
            value={formatCurrency(reports.summary.avgOrderValue || 0)}
            change={reports.summary.aovChange || 0}
            icon={TrendingUp}
            color="text-orange-600"
          />
        </div>
      )}

      {/* Report Content based on type */}
      {reportType === 'sales' && <SalesReport data={reports?.salesData} />}
      {reportType === 'products' && <ProductsReport data={reports?.productsData} />}
      {reportType === 'customers' && <CustomersReport data={reports?.customersData} />}
      {reportType === 'inventory' && <InventoryReport data={reports?.inventoryData} />}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">Failed to load reports. Please try again.</p>
        </div>
      )}
    </div>
  )
}

// Summary Card Component
function SummaryCard({ 
  title, 
  value, 
  change, 
  icon: Icon, 
  color 
}: { 
  title: string
  value: string
  change: number
  icon: any
  color: string
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

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-2">
        <Icon className={`h-5 w-5 ${color}`} />
        <span className={`text-sm font-medium ${getChangeColor(change)}`}>
          {formatPercentage(change)}
        </span>
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-sm text-gray-600">{title}</p>
    </div>
  )
}

// Sales Report Component
function SalesReport({ data }: { data?: any }) {
  if (!data) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Sales Report</h3>
        <p className="text-gray-500">No sales data available for the selected period.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Chart Placeholder */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Sales Trend</h3>
        <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
          <div className="text-center">
            <LineChart className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-500">Sales chart would be displayed here</p>
          </div>
        </div>
      </div>

      {/* Top Products */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Selling Products</h3>
        {data.topProducts && data.topProducts.length > 0 ? (
          <div className="space-y-3">
            {data.topProducts.map((product: any, index: number) => (
              <div key={index} className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">{product.name}</p>
                  <p className="text-sm text-gray-500">{product.category}</p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-gray-900">{product.quantity} sold</p>
                  <p className="text-sm text-gray-500">{product.revenue}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">No product data available.</p>
        )}
      </div>
    </div>
  )
}

// Products Report Component
function ProductsReport({ data }: { data?: any }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Products Report</h3>
      <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
        <div className="text-center">
          <BarChart3 className="h-8 w-8 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-500">Product analytics would be displayed here</p>
        </div>
      </div>
    </div>
  )
}

// Customers Report Component
function CustomersReport({ data }: { data?: any }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Customers Report</h3>
      <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
        <div className="text-center">
          <PieChart className="h-8 w-8 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-500">Customer analytics would be displayed here</p>
        </div>
      </div>
    </div>
  )
}

// Inventory Report Component
function InventoryReport({ data }: { data?: any }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Inventory Report</h3>
      <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
        <div className="text-center">
          <Package className="h-8 w-8 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-500">Inventory analytics would be displayed here</p>
        </div>
      </div>
    </div>
  )
}