import React, { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Search,
  Filter,
  X,
  Package,
  Download,
  ChevronLeft,
  ChevronRight,
  Check,
  SkipForward,
  Archive,
  RefreshCw
} from 'lucide-react'
import { vendorQueries } from '../lib/queries'
import { formatPrice, formatDate } from '../lib/supabase'

interface VendorInboxProps {
  onClose: () => void
}

const VendorInbox: React.FC<VendorInboxProps> = ({ onClose }) => {
  const [selectedProducts, setSelectedProducts] = useState<number[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [filters, setFilters] = useState({
    status: '',
    decision: ''
  })
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20
  })
  const [showFilters, setShowFilters] = useState(false)

  const queryClient = useQueryClient()

  // Fetch vendor inbox items
  const {
    data: inboxData,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['vendor-inbox', pagination, searchTerm, filters],
    queryFn: () => vendorQueries.getVendorInboxItems({
      ...pagination,
      search: searchTerm,
      ...filters
    })
  })

  // Import products mutation
  const importMutation = useMutation({
    mutationFn: ({ productIds, overrides }: { productIds: number[], overrides?: Record<number, any> }) =>
      vendorQueries.importVendorProducts(productIds, overrides),
    onSuccess: () => {
      setSelectedProducts([])
      refetch()
      queryClient.invalidateQueries({ queryKey: ['vendor-inbox-count'] })
    }
  })

  // Update decision mutation
  const decisionMutation = useMutation({
    mutationFn: ({ productIds, decision }: { productIds: number[], decision: 'staged' | 'skipped' }) =>
      vendorQueries.updateImportDecision(productIds, decision),
    onSuccess: () => {
      setSelectedProducts([])
      refetch()
      queryClient.invalidateQueries({ queryKey: ['vendor-inbox-count'] })
    }
  })

  const handleSelectProduct = (productId: number, selected: boolean) => {
    setSelectedProducts(prev => 
      selected 
        ? [...prev, productId]
        : prev.filter(id => id !== productId)
    )
  }

  const handleSelectAll = (selected: boolean) => {
    setSelectedProducts(
      selected ? (inboxData?.items.map(item => item.shopify_product_id) || []) : []
    )
  }

  const handleImport = () => {
    if (selectedProducts.length === 0) return
    importMutation.mutate({ productIds: selectedProducts })
  }

  const handleDecision = (decision: 'staged' | 'skipped') => {
    if (selectedProducts.length === 0) return
    decisionMutation.mutate({ productIds: selectedProducts, decision })
  }

  const handleSearch = (value: string) => {
    setSearchTerm(value)
    setPagination(prev => ({ ...prev, page: 1 }))
  }

  const handleFilterChange = (newFilters: typeof filters) => {
    setFilters(newFilters)
    setPagination(prev => ({ ...prev, page: 1 }))
  }

  const handlePageChange = (page: number) => {
    setPagination(prev => ({ ...prev, page }))
  }

  const getDecisionBadge = (decision: string) => {
    switch (decision) {
      case 'staged':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">Staged</span>
      case 'skipped':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">Skipped</span>
      case 'imported':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Imported</span>
      default:
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">New</span>
    }
  }

  const getStatusBadge = (status: string) => {
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
        status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
      }`}>
        {status}
      </span>
    )
  }

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-4 mx-auto p-5 border w-11/12 max-w-7xl shadow-lg rounded-md bg-white mb-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 pb-4 mb-6">
          <div className="flex items-center space-x-3">
            <Package className="h-8 w-8 text-indigo-600" />
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Vendor Inbox</h2>
              <p className="text-sm text-gray-500">Import products from Shopify vendor catalog</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-md bg-white text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Search and Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0 mb-6">
          <div className="flex-1 max-w-lg">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search vendor products..."
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
            <button
              onClick={() => refetch()}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </button>
            {selectedProducts.length > 0 && (
              <span className="inline-flex items-center px-2.5 py-1.5 rounded-md text-xs font-medium bg-indigo-100 text-indigo-800">
                {selectedProducts.length} selected
              </span>
            )}
          </div>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={filters.status}
                  onChange={(e) => handleFilterChange({ ...filters, status: e.target.value })}
                  className="block w-full border border-gray-300 rounded-md px-3 py-2 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">All Statuses</option>
                  <option value="active">Active</option>
                  <option value="draft">Draft</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Decision</label>
                <select
                  value={filters.decision}
                  onChange={(e) => handleFilterChange({ ...filters, decision: e.target.value })}
                  className="block w-full border border-gray-300 rounded-md px-3 py-2 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">All Decisions</option>
                  <option value="none">New</option>
                  <option value="staged">Staged</option>
                  <option value="skipped">Skipped</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Bulk Actions */}
        {selectedProducts.length > 0 && (
          <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <span className="text-sm font-medium text-indigo-900">
                  {selectedProducts.length} product{selectedProducts.length > 1 ? 's' : ''} selected
                </span>
              </div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => handleDecision('staged')}
                  disabled={decisionMutation.isPending}
                  className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-yellow-700 bg-yellow-100 hover:bg-yellow-200 disabled:opacity-50"
                >
                  <Archive className="h-3 w-3 mr-1" />
                  Stage
                </button>
                <button
                  onClick={() => handleDecision('skipped')}
                  disabled={decisionMutation.isPending}
                  className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-gray-700 bg-gray-100 hover:bg-gray-200 disabled:opacity-50"
                >
                  <SkipForward className="h-3 w-3 mr-1" />
                  Skip
                </button>
                <button
                  onClick={handleImport}
                  disabled={importMutation.isPending}
                  className="inline-flex items-center px-4 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
                >
                  <Download className="h-3 w-3 mr-1" />
                  {importMutation.isPending ? 'Importing...' : 'Import'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Table */}
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          {isLoading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
              <p className="mt-2 text-sm text-gray-500">Loading vendor products...</p>
            </div>
          ) : error ? (
            <div className="p-8 text-center">
              <p className="text-sm text-red-600">Error loading vendor products. Please try again.</p>
            </div>
          ) : !inboxData?.items.length ? (
            <div className="p-8 text-center">
              <Package className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-sm text-gray-500">No vendor products found.</p>
            </div>
          ) : (
            <>
              <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    checked={selectedProducts.length === inboxData.items.length}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                  />
                  <span className="ml-3 text-sm font-medium text-gray-900">Select All</span>
                </div>
              </div>
              <ul className="divide-y divide-gray-200">
                {inboxData.items.map((item) => (
                  <li key={item.shopify_product_id} className="px-6 py-4">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        checked={selectedProducts.includes(item.shopify_product_id)}
                        onChange={(e) => handleSelectProduct(item.shopify_product_id, e.target.checked)}
                      />
                      <div className="ml-4 flex-shrink-0">
                        {item.image_src ? (
                          <img className="h-16 w-16 rounded-lg object-cover" src={item.image_src} alt={item.title} />
                        ) : (
                          <div className="h-16 w-16 rounded-lg bg-gray-100 flex items-center justify-center">
                            <Package className="h-8 w-8 text-gray-400" />
                          </div>
                        )}
                      </div>
                      <div className="ml-4 flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900 truncate">{item.title}</p>
                            <div className="flex items-center space-x-2 mt-1">
                              {item.category && (
                                <span className="text-xs text-gray-500">{item.category}</span>
                              )}
                              {getStatusBadge(item.status)}
                              {getDecisionBadge(item.decision)}
                            </div>
                          </div>
                          <div className="flex items-center space-x-4 text-sm text-gray-500">
                            <div className="text-right">
                              <p className="font-medium text-gray-900">{item.price ? formatPrice(item.price) : 'N/A'}</p>
                              <p className="text-xs">Price</p>
                            </div>
                            <div className="text-right">
                              <p className="font-medium text-gray-900">{item.inventory ?? 'N/A'}</p>
                              <p className="text-xs">Stock</p>
                            </div>
                            <div className="text-right">
                              <p className="font-medium text-gray-900">{item.variants}</p>
                              <p className="text-xs">Variants</p>
                            </div>
                            <div className="text-right">
                              <p className="font-medium text-gray-900">{formatDate(item.created_at)}</p>
                              <p className="text-xs">Created</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>

        {/* Pagination */}
        {inboxData && inboxData.totalPages > 1 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6 mt-4">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page === inboxData.totalPages}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing <span className="font-medium">{(pagination.page - 1) * pagination.limit + 1}</span> to{' '}
                  <span className="font-medium">
                    {Math.min(pagination.page * pagination.limit, inboxData.total)}
                  </span>{' '}
                  of <span className="font-medium">{inboxData.total}</span> results
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                  <button
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  {[...Array(inboxData.totalPages)].map((_, i) => {
                    const page = i + 1
                    return (
                      <button
                        key={page}
                        onClick={() => handlePageChange(page)}
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                          page === pagination.page
                            ? 'z-10 bg-indigo-50 border-indigo-500 text-indigo-600'
                            : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        {page}
                      </button>
                    )
                  })}
                  <button
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={pagination.page === inboxData.totalPages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default VendorInbox