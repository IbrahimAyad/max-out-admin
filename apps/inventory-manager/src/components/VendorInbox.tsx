import React, { useState, useMemo } from 'react'
import { Search, Filter, Package, ShoppingCart, X, Check, Clock, Image as ImageIcon } from 'lucide-react'
import { useVendorInbox } from '@/hooks/useVendorInbox'
import type { VendorInboxVariant } from '@/lib/supabase'

export function VendorInbox() {
  const { 
    variants, 
    loading, 
    error, 
    page, 
    total, 
    filters, 
    updateFilters, 
    updatePage, 
    updateDecision,
    bulkUpdateDecisions
  } = useVendorInbox()
  
  const [selectedVariants, setSelectedVariants] = useState<Set<string>>(new Set())
  const [showFilters, setShowFilters] = useState(false)

  // Group variants by product for display
  const groupedVariants = useMemo(() => {
    const grouped = new Map<string, VendorInboxVariant[]>()
    variants.forEach(variant => {
      const key = `${variant.base_product_code}-${variant.color_code}`
      if (!grouped.has(key)) {
        grouped.set(key, [])
      }
      grouped.get(key)!.push(variant)
    })
    return grouped
  }, [variants])

  const totalPages = Math.ceil(total / 50)

  const handleSelectVariant = (shopifyProductId: string, selected: boolean) => {
    const newSelected = new Set(selectedVariants)
    if (selected) {
      newSelected.add(shopifyProductId)
    } else {
      newSelected.delete(shopifyProductId)
    }
    setSelectedVariants(newSelected)
  }

  const handleSelectAll = (selected: boolean) => {
    if (selected) {
      const allProductIds = Array.from(groupedVariants.values()).map(group => group[0].shopify_product_id)
      setSelectedVariants(new Set(allProductIds))
    } else {
      setSelectedVariants(new Set())
    }
  }

  const handleBulkAction = async (decision: 'import' | 'skip' | 'staged') => {
    const decisions = Array.from(selectedVariants).map(shopifyProductId => ({
      shopify_product_id: shopifyProductId,
      decision
    }))
    
    await bulkUpdateDecisions(decisions)
    setSelectedVariants(new Set())
  }

  const getDecisionColor = (decision: string) => {
    switch (decision) {
      case 'import': return 'bg-green-100 text-green-800'
      case 'skip': return 'bg-red-100 text-red-800'
      case 'staged': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getDecisionIcon = (decision: string) => {
    switch (decision) {
      case 'import': return <Check className="h-4 w-4" />
      case 'skip': return <X className="h-4 w-4" />
      case 'staged': return <Clock className="h-4 w-4" />
      default: return null
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div 
          className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"
          role="status"
          aria-label="Loading vendor products"
        ></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center">
          <X className="h-5 w-5 text-red-400 mr-2" />
          <span className="text-red-800">{error}</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Vendor Inbox</h1>
          <p className="text-gray-600">Manage products from your Shopify vendor</p>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-gray-50"
          >
            <Filter className="h-4 w-4" />
            Filters
          </button>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by title or SKU..."
                  value={filters.search}
                  onChange={(e) => updateFilters({ search: e.target.value })}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            
            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                value={filters.category}
                onChange={(e) => updateFilters({ category: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Categories</option>
                <option value="Suits">Suits</option>
                <option value="Dress Shirts">Dress Shirts</option>
                <option value="Accessories">Accessories</option>
              </select>
            </div>
            
            {/* Decision */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={filters.decision}
                onChange={(e) => updateFilters({ decision: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Statuses</option>
                <option value="none">Not Decided</option>
                <option value="import">Import</option>
                <option value="skip">Skip</option>
                <option value="staged">Staged</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Actions */}
      {selectedVariants.size > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <span className="text-blue-800">
              {selectedVariants.size} product{selectedVariants.size !== 1 ? 's' : ''} selected
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleBulkAction('import')}
                className="bg-green-600 text-white px-3 py-1 rounded-md text-sm flex items-center gap-1 hover:bg-green-700"
              >
                <Check className="h-4 w-4" />
                Import
              </button>
              <button
                onClick={() => handleBulkAction('staged')}
                className="bg-yellow-600 text-white px-3 py-1 rounded-md text-sm flex items-center gap-1 hover:bg-yellow-700"
              >
                <Clock className="h-4 w-4" />
                Stage
              </button>
              <button
                onClick={() => handleBulkAction('skip')}
                className="bg-red-600 text-white px-3 py-1 rounded-md text-sm flex items-center gap-1 hover:bg-red-700"
              >
                <X className="h-4 w-4" />
                Skip
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Product List */}
      <div className="space-y-4">
        {Array.from(groupedVariants.entries()).map(([key, group]) => {
          const firstVariant = group[0]
          const isSelected = selectedVariants.has(firstVariant.shopify_product_id)
          
          return (
            <div 
              key={key} 
              className={`bg-white rounded-lg border border-gray-200 overflow-hidden transition-all ${
                isSelected ? 'ring-2 ring-blue-500 border-blue-500' : 'hover:shadow-md'
              }`}
            >
              <div className="p-4">
                <div className="flex items-start gap-4">
                  {/* Product Image */}
                  <div className="flex-shrink-0">
                    {firstVariant.image_url ? (
                      <img
                        src={firstVariant.image_url}
                        alt={firstVariant.title}
                        className="w-full h-32 object-cover rounded-lg"
                      />
                    ) : (
                      <div className="w-full h-32 bg-gray-200 rounded-lg flex items-center justify-center">
                        <ImageIcon className="h-8 w-8 text-gray-400" />
                      </div>
                    )}
                  </div>
                  
                  {/* Product Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-lg font-medium text-gray-900 truncate">
                          {firstVariant.title}
                        </h3>
                        <p className="text-sm text-gray-500">
                          Color: {firstVariant.color_family} | SKU: {firstVariant.sku}
                        </p>
                        <p className="text-sm text-gray-500">
                          Category: {firstVariant.product_type} | Base Code: {firstVariant.base_product_code}
                        </p>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getDecisionColor(firstVariant.import_decision)}`}>
                          {getDecisionIcon(firstVariant.import_decision)}
                          <span className="ml-1 capitalize">{firstVariant.import_decision || 'None'}</span>
                        </span>
                      </div>
                    </div>
                    
                    {/* Variants */}
                    <div className="mt-3">
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
                        {group.map(variant => (
                          <div 
                            key={variant.id}
                            className="bg-gray-50 rounded-md p-2 text-center"
                          >
                            <div className="text-sm font-medium text-gray-900">
                              {variant.size}
                            </div>
                            <div className="text-xs text-gray-500">
                              Qty: {variant.inventory_quantity || 0}
                            </div>
                            <div className="text-xs text-gray-500">
                              ${(variant.price_cents / 100).toFixed(2)}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  {/* Actions */}
                  <div className="flex flex-col items-end gap-2">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={(e) => handleSelectVariant(firstVariant.shopify_product_id, e.target.checked)}
                      className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <div className="flex flex-col gap-1">
                      <button
                        onClick={() => updateDecision(firstVariant.shopify_product_id, 'import')}
                        className="p-1 text-green-600 hover:bg-green-100 rounded"
                        title="Import"
                      >
                        <Check className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => updateDecision(firstVariant.shopify_product_id, 'staged')}
                        className="p-1 text-yellow-600 hover:bg-yellow-100 rounded"
                        title="Stage"
                      >
                        <Clock className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => updateDecision(firstVariant.shopify_product_id, 'skip')}
                        className="p-1 text-red-600 hover:bg-red-100 rounded"
                        title="Skip"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
        
        {groupedVariants.size === 0 && (
          <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-500 mb-1">No vendor products found</p>
            <p className="text-sm text-gray-400">
              {filters.search || filters.category || filters.decision ? 'Try adjusting your filters' : 'Products from your Shopify vendor will appear here'}
            </p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6">
          <div className="flex flex-1 justify-between sm:hidden">
            <button
              onClick={() => updatePage(page - 1)}
              disabled={page === 1}
              className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Previous
            </button>
            <button
              onClick={() => updatePage(page + 1)}
              disabled={page === totalPages}
              className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Next
            </button>
          </div>
          <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Showing <span className="font-medium">{(page - 1) * 50 + 1}</span> to{' '}
                <span className="font-medium">{Math.min(page * 50, total)}</span> of{' '}
                <span className="font-medium">{total}</span> results
              </p>
            </div>
            <div>
              <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                <button
                  onClick={() => updatePage(page - 1)}
                  disabled={page === 1}
                  className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50"
                >
                  <span className="sr-only">Previous</span>
                  <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clipRule="evenodd" />
                  </svg>
                </button>
                
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum
                  if (totalPages <= 5) {
                    pageNum = i + 1
                  } else if (page <= 3) {
                    pageNum = i + 1
                  } else if (page >= totalPages - 2) {
                    pageNum = totalPages - 4 + i
                  } else {
                    pageNum = page - 2 + i
                  }
                  
                  return (
                    <button
                      key={pageNum}
                      onClick={() => updatePage(pageNum)}
                      className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${
                        pageNum === page
                          ? 'z-10 bg-blue-600 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600'
                          : 'text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:outline-offset-0'
                      }`}
                    >
                      {pageNum}
                    </button>
                  )
                })}
                
                <button
                  onClick={() => updatePage(page + 1)}
                  disabled={page === totalPages}
                  className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50"
                >
                  <span className="sr-only">Next</span>
                  <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
                  </svg>
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}