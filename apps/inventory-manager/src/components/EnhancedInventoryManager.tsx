import React, { useState, useMemo } from 'react'
import { Search, Filter, Download, Plus, AlertTriangle, Package, Shirt, Palette } from 'lucide-react'
import { useInventory } from '@/hooks/useInventory'
import { ProductVariantCard } from './ProductVariantCard'
import { SizeMatrixView } from './SizeMatrixView'
import { BulkEditModal } from './BulkEditModal'
import { AddVariantModal } from './AddVariantModal'
import { LowStockAlerts } from './LowStockAlerts'
import type { EnhancedProductVariant } from '@/lib/supabase'

type ViewMode = 'grid' | 'matrix' | 'alerts'
type FilterCategory = 'all' | 'Suits' | 'Dress Shirts' | 'Suspenders' | 'Vests' | 'Accessories'
type StockFilter = 'all' | 'in_stock' | 'low_stock' | 'out_of_stock'

export function EnhancedInventoryManager() {
  const { variants, products, loading, error, loadVariants, updateVariant, bulkUpdate } = useInventory()
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<FilterCategory>('all')
  const [stockFilter, setStockFilter] = useState<StockFilter>('all')
  const [selectedVariants, setSelectedVariants] = useState<Set<string>>(new Set())
  const [showBulkEdit, setShowBulkEdit] = useState(false)
  const [showAddVariant, setShowAddVariant] = useState(false)

  // Filter and search variants
  const filteredVariants = useMemo(() => {
    return variants.filter(variant => {
      // Search filter
      const searchMatch = !searchTerm || 
        variant.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
        variant.color.toLowerCase().includes(searchTerm.toLowerCase()) ||
        variant.product?.name?.toLowerCase().includes(searchTerm.toLowerCase())
      
      // Category filter
      const categoryMatch = categoryFilter === 'all' || 
        variant.product?.category === categoryFilter
      
      // Stock filter
      const stockMatch = stockFilter === 'all' || 
        variant.stock_status === stockFilter
      
      return searchMatch && categoryMatch && stockMatch
    })
  }, [variants, searchTerm, categoryFilter, stockFilter])

  // Group variants by product for matrix view
  const variantsByProduct = useMemo(() => {
    const grouped = new Map<string, EnhancedProductVariant[]>()
    filteredVariants.forEach(variant => {
      const productId = variant.product_id
      if (!grouped.has(productId)) {
        grouped.set(productId, [])
      }
      grouped.get(productId)!.push(variant)
    })
    return grouped
  }, [filteredVariants])

  // Statistics
  const stats = useMemo(() => {
    const total = filteredVariants.length
    const inStock = filteredVariants.filter(v => v.stock_status === 'in_stock').length
    const lowStock = filteredVariants.filter(v => v.stock_status === 'low_stock').length
    const outOfStock = filteredVariants.filter(v => v.stock_status === 'out_of_stock').length
    const totalValue = filteredVariants.reduce((sum, v) => sum + (v.price_cents * v.available_quantity), 0)
    
    return { total, inStock, lowStock, outOfStock, totalValue }
  }, [filteredVariants])

  const handleSelectVariant = (variantId: string, selected: boolean) => {
    const newSelected = new Set(selectedVariants)
    if (selected) {
      newSelected.add(variantId)
    } else {
      newSelected.delete(variantId)
    }
    setSelectedVariants(newSelected)
  }

  const handleSelectAll = (selected: boolean) => {
    if (selected) {
      setSelectedVariants(new Set(filteredVariants.map(v => v.id)))
    } else {
      setSelectedVariants(new Set())
    }
  }

  const handleBulkEdit = async (updates: any) => {
    const selectedIds = Array.from(selectedVariants)
    const bulkUpdates = selectedIds.map(id => ({ id, ...updates }))
    
    const results = await bulkUpdate(bulkUpdates)
    const successful = results.filter(r => r.success).length
    
    alert(`Successfully updated ${successful} of ${selectedIds.length} variants`)
    setSelectedVariants(new Set())
    setShowBulkEdit(false)
  }

  const exportData = () => {
    const csvData = filteredVariants.map(variant => ({
      SKU: variant.sku,
      Product: variant.product?.name || '',
      Color: variant.color,
      Size: variant.size || 'One Size',
      Type: variant.variant_type,
      'Available Quantity': variant.available_quantity,
      'Total Inventory': variant.inventory_quantity,
      'Stock Status': variant.stock_status,
      'Price': `$${(variant.price_cents / 100).toFixed(2)}`,
      'Last Updated': new Date(variant.last_inventory_update).toLocaleDateString()
    }))
    
    const csv = [Object.keys(csvData[0])]
      .concat(csvData.map(row => Object.values(row).map(v => String(v))))
      .map(row => row.join(','))
      .join('\n')
    
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `inventory-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center">
          <AlertTriangle className="h-5 w-5 text-red-400 mr-2" />
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
          <h1 className="text-2xl font-bold text-gray-900">Enhanced Inventory Manager</h1>
          <p className="text-gray-600">Advanced sizing and inventory management for KCT Menswear</p>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAddVariant(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            Add Variant
          </button>
          <button
            onClick={exportData}
            className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-green-700"
          >
            <Download className="h-4 w-4" />
            Export
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <Package className="h-8 w-8 text-blue-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Total Variants</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
              <div className="h-4 w-4 bg-green-600 rounded-full"></div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">In Stock</p>
              <p className="text-2xl font-bold text-green-600">{stats.inStock}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <div className="h-8 w-8 bg-yellow-100 rounded-full flex items-center justify-center">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Low Stock</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.lowStock}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <div className="h-8 w-8 bg-red-100 rounded-full flex items-center justify-center">
              <div className="h-4 w-4 bg-red-600 rounded-full"></div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Out of Stock</p>
              <p className="text-2xl font-bold text-red-600">{stats.outOfStock}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <div className="h-8 w-8 bg-purple-100 rounded-full flex items-center justify-center">
              <span className="text-purple-600 font-bold text-sm">$</span>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Total Value</p>
              <p className="text-2xl font-bold text-purple-600">
                ${(stats.totalValue / 100).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* View Mode Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setViewMode('grid')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              viewMode === 'grid'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Package className="h-4 w-4 inline mr-2" />
            Grid View
          </button>
          <button
            onClick={() => setViewMode('matrix')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              viewMode === 'matrix'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Shirt className="h-4 w-4 inline mr-2" />
            Size Matrix
          </button>
          <button
            onClick={() => setViewMode('alerts')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              viewMode === 'alerts'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <AlertTriangle className="h-4 w-4 inline mr-2" />
            Low Stock Alerts
          </button>
        </nav>
      </div>

      {/* Filters and Search */}
      {viewMode !== 'alerts' && (
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by SKU, color, or product name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            
            {/* Category Filter */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value as FilterCategory)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Categories</option>
              <option value="Suits">Suits</option>
              <option value="Dress Shirts">Dress Shirts</option>
              <option value="Suspenders">Suspenders</option>
              <option value="Vests">Vests</option>
              <option value="Accessories">Accessories</option>
            </select>
            
            {/* Stock Filter */}
            <select
              value={stockFilter}
              onChange={(e) => setStockFilter(e.target.value as StockFilter)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Stock Status</option>
              <option value="in_stock">In Stock</option>
              <option value="low_stock">Low Stock</option>
              <option value="out_of_stock">Out of Stock</option>
            </select>
          </div>
          
          {/* Bulk Actions */}
          {selectedVariants.size > 0 && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm text-blue-800">
                  {selectedVariants.size} variant{selectedVariants.size === 1 ? '' : 's'} selected
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowBulkEdit(true)}
                    className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                  >
                    Bulk Edit
                  </button>
                  <button
                    onClick={() => setSelectedVariants(new Set())}
                    className="bg-gray-500 text-white px-3 py-1 rounded text-sm hover:bg-gray-600"
                  >
                    Clear Selection
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Content based on view mode */}
      {viewMode === 'grid' && (
        <div className="space-y-4">
          {filteredVariants.length > 0 && (
            <div className="flex items-center justify-between">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={selectedVariants.size === filteredVariants.length && filteredVariants.length > 0}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">Select All</span>
              </label>
              <span className="text-sm text-gray-500">
                {filteredVariants.length} variant{filteredVariants.length === 1 ? '' : 's'}
              </span>
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredVariants.map(variant => (
              <ProductVariantCard
                key={variant.id}
                variant={variant}
                selected={selectedVariants.has(variant.id)}
                onSelect={(selected) => handleSelectVariant(variant.id, selected)}
                onUpdate={updateVariant}
              />
            ))}
          </div>
        </div>
      )}

      {viewMode === 'matrix' && (
        <div className="space-y-6">
          {Array.from(variantsByProduct.entries()).map(([productId, productVariants]) => {
            const product = productVariants[0]?.product
            if (!product) return null
            
            return (
              <SizeMatrixView
                key={productId}
                product={product}
                variants={productVariants}
                onUpdateVariant={updateVariant}
              />
            )
          })}
        </div>
      )}

      {viewMode === 'alerts' && <LowStockAlerts />}

      {/* Modals */}
      {showBulkEdit && (
        <BulkEditModal
          selectedCount={selectedVariants.size}
          onSave={handleBulkEdit}
          onClose={() => setShowBulkEdit(false)}
        />
      )}
      
      {showAddVariant && (
        <AddVariantModal
          products={products}
          onSave={() => {
            setShowAddVariant(false)
            loadVariants()
          }}
          onClose={() => setShowAddVariant(false)}
        />
      )}
    </div>
  )
}