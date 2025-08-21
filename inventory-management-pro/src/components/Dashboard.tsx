import React, { useState, useMemo, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import {
  Search,
  Filter,
  Plus,
  MoreHorizontal,
  Package,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Eye,
  Edit,
  Trash2,
  Download,
  Upload,
  RefreshCw
} from 'lucide-react'
import { productQueries, analyticsQueries } from '../lib/queries'
import { formatPrice, formatDate, getStockStatusColor, getProductStatusColor } from '../lib/supabase'
import DashboardStats from './DashboardStats'
import ProductTable from './ProductTable'
import BulkActions from './BulkActions'
import FilterPanel from './FilterPanel'
import ExportImport from './ExportImport'
import analytics from '../lib/analytics'

const Dashboard = () => {
  const [selectedProducts, setSelectedProducts] = useState<string[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [filters, setFilters] = useState({
    category: '',
    status: '',
    stockStatus: '',
    priceRange: [0, 10000] as [number, number]
  })
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20
  })
  const [sortConfig, setSortConfig] = useState({
    sortBy: 'created_at',
    sortOrder: 'desc' as 'asc' | 'desc'
  })
  const [showFilters, setShowFilters] = useState(false)
  const [showExportImport, setShowExportImport] = useState(false)

  // Fetch products
  const {
    data: productsData,
    isLoading: productsLoading,
    error: productsError,
    refetch: refetchProducts
  } = useQuery({
    queryKey: ['products', pagination, searchTerm, filters, sortConfig],
    queryFn: () => productQueries.getProducts({
      ...pagination,
      search: searchTerm,
      ...filters,
      ...sortConfig
    })
  })

  // Fetch dashboard stats
  const {
    data: statsData,
    isLoading: statsLoading
  } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: analyticsQueries.getDashboardStats
  })

  // Fetch categories for filters
  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: productQueries.getCategories
  })

  // Track dashboard page view on load
  useEffect(() => {
    analytics.trackPageView({
      page_path: '/dashboard',
      page_title: 'Dashboard - Inventory Management'
    })
  }, [])

  const handleSearch = (value: string) => {
    setSearchTerm(value)
    setPagination(prev => ({ ...prev, page: 1 }))
  }

  const handleFilterChange = (newFilters: typeof filters) => {
    setFilters(newFilters)
    setPagination(prev => ({ ...prev, page: 1 }))
  }

  const handleSort = (field: string) => {
    setSortConfig(prev => ({
      sortBy: field,
      sortOrder: prev.sortBy === field && prev.sortOrder === 'asc' ? 'desc' : 'asc'
    }))
  }

  const handlePageChange = (page: number) => {
    setPagination(prev => ({ ...prev, page }))
  }

  const handleSelectProduct = (productId: string, selected: boolean) => {
    setSelectedProducts(prev => 
      selected 
        ? [...prev, productId]
        : prev.filter(id => id !== productId)
    )
  }

  const handleSelectAll = (selected: boolean) => {
    setSelectedProducts(
      selected ? (productsData?.products.map(p => p.id) || []) : []
    )
  }

  const clearSelection = () => setSelectedProducts([])

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Package className="h-8 w-8 text-indigo-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Inventory Management</h1>
                <p className="text-sm text-gray-500">Professional enterprise-grade inventory system</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowExportImport(true)}
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <Upload className="h-4 w-4 mr-2" />
                Import/Export
              </button>
              <button
                onClick={() => refetchProducts()}
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </button>
              <Link
                to="/products/create"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Product
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Dashboard Stats */}
        <div className="mb-8">
          <DashboardStats data={statsData} loading={statsLoading} />
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="p-6 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
              <div className="flex-1 max-w-lg">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search products, SKUs, categories..."
                    value={searchTerm}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`inline-flex items-center px-3 py-2 border shadow-sm text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                    showFilters
                      ? 'border-indigo-600 text-indigo-600 bg-indigo-50'
                      : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
                  }`}
                >
                  <Filter className="h-4 w-4 mr-2" />
                  Filters
                </button>
                {selectedProducts.length > 0 && (
                  <span className="inline-flex items-center px-2.5 py-1.5 rounded-md text-xs font-medium bg-indigo-100 text-indigo-800">
                    {selectedProducts.length} selected
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Filter Panel */}
          {showFilters && (
            <FilterPanel
              filters={filters}
              categories={categoriesData?.categories || []}
              onFilterChange={handleFilterChange}
            />
          )}
        </div>

        {/* Bulk Actions */}
        {selectedProducts.length > 0 && (
          <div className="mb-6">
            <BulkActions
              selectedProducts={selectedProducts}
              onClearSelection={clearSelection}
              onRefresh={refetchProducts}
            />
          </div>
        )}

        {/* Product Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <ProductTable
            products={productsData?.products || []}
            loading={productsLoading}
            error={productsError}
            selectedProducts={selectedProducts}
            onSelectProduct={handleSelectProduct}
            onSelectAll={handleSelectAll}
            onSort={handleSort}
            sortConfig={sortConfig}
            pagination={{
              ...pagination,
              total: productsData?.total || 0,
              totalPages: productsData?.totalPages || 1
            }}
            onPageChange={handlePageChange}
            onRefresh={refetchProducts}
          />
        </div>
      </div>

      {/* Export/Import Modal */}
      {showExportImport && (
        <ExportImport
          onClose={() => setShowExportImport(false)}
          onRefresh={refetchProducts}
        />
      )}
    </div>
  )
}

export default Dashboard