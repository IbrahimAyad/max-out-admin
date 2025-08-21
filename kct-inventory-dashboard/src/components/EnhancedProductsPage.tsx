import { useState, useMemo, useEffect } from 'react'
import { Search, Filter, Plus, Package, AlertTriangle, CheckCircle, XCircle, MoreHorizontal, Edit, Eye, ShoppingCart, Download } from 'lucide-react'
import { useInventoryProducts, useDefinitions } from '@/hooks/useInventory'
import { useAnalytics } from '@/hooks/useAnalytics'
import { type EnhancedProduct } from '@/lib/supabase'
import { ProductSizeMatrix } from './ProductSizeMatrix'
import { ProductColorGrid } from './ProductColorGrid'
import { BulkInventoryModal } from './BulkInventoryModal'
import { AddProductModal } from './AddProductModal'
import { EditProductModal } from './EditProductModal'
import { ExportModal } from './ExportModal'
import { SmartFeaturesDisplay } from './SmartFeaturesDisplay'

type FilterCategory = 'all' | 'suits' | 'shirts' | 'accessories'
type StockFilter = 'all' | 'in_stock' | 'low_stock' | 'out_of_stock'
type ViewMode = 'grid' | 'table'

export function EnhancedProductsPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<FilterCategory>('all')
  const [stockFilter, setStockFilter] = useState<StockFilter>('all')
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [selectedProduct, setSelectedProduct] = useState<EnhancedProduct | null>(null)
  const [editingProduct, setEditingProduct] = useState<EnhancedProduct | null>(null)
  const [showBulkModal, setShowBulkModal] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showExportModal, setShowExportModal] = useState(false)
  const [expandedProduct, setExpandedProduct] = useState<number | null>(null)

  const { products, loading, error, refetch } = useInventoryProducts()
  const { sizes, colors } = useDefinitions()
  const { trackPageView, trackEvent } = useAnalytics()

  // Track page view on component mount
  useEffect(() => {
    trackPageView('/products', 'Inventory Products')
  }, [])

  // Filter products based on search and filters
  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      // Search filter
      const matchesSearch = searchTerm === '' || 
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.sku_prefix.toLowerCase().includes(searchTerm.toLowerCase())

      // Category filter
      const matchesCategory = categoryFilter === 'all' || 
        product.category.toLowerCase().includes(categoryFilter.toLowerCase())

      // Stock filter
      const matchesStock = stockFilter === 'all' || 
        (stockFilter === 'in_stock' && (product.total_stock || 0) > 0 && (product.low_stock_variants || 0) === 0) ||
        (stockFilter === 'low_stock' && (product.low_stock_variants || 0) > 0) ||
        (stockFilter === 'out_of_stock' && (product.total_stock || 0) === 0)

      return matchesSearch && matchesCategory && matchesStock
    })
  }, [products, searchTerm, categoryFilter, stockFilter])

  const getStockStatus = (product: EnhancedProduct) => {
    if ((product.total_stock || 0) === 0) return 'out_of_stock'
    if ((product.low_stock_variants || 0) > 0) return 'low_stock'
    return 'in_stock'
  }

  const getStockStatusColor = (status: string) => {
    switch (status) {
      case 'in_stock': return 'text-green-600 bg-green-50'
      case 'low_stock': return 'text-yellow-600 bg-yellow-50'
      case 'out_of_stock': return 'text-red-600 bg-red-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }

  const getStockIcon = (status: string) => {
    switch (status) {
      case 'in_stock': return <CheckCircle className="h-4 w-4" />
      case 'low_stock': return <AlertTriangle className="h-4 w-4" />
      case 'out_of_stock': return <XCircle className="h-4 w-4" />
      default: return <Package className="h-4 w-4" />
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <div className="flex items-center">
          <XCircle className="h-5 w-5 text-red-400 mr-2" />
          <p className="text-red-800">Error loading products: {error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Enhanced Inventory Management</h1>
          <p className="text-gray-600">Manage size-specific and color-specific product variants</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowExportModal(true)}
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 flex items-center space-x-2"
          >
            <Download className="h-4 w-4" />
            <span>Export</span>
          </button>
          <button
            onClick={() => setShowBulkModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center space-x-2"
          >
            <Package className="h-4 w-4" />
            <span>Bulk Update</span>
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>Add Product</span>
          </button>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          {/* Search */}
          <div className="relative flex-1 lg:max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value)
                // Track search behavior
                if (e.target.value.length > 2) {
                  trackEvent('search', {
                    search_query: e.target.value,
                    page_section: 'product_inventory'
                  })
                }
              }}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-md w-full focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Category:</span>
              <select
                value={categoryFilter}
                onChange={(e) => {
                  const newCategory = e.target.value as FilterCategory
                  setCategoryFilter(newCategory)
                  trackEvent('filter_applied', {
                    filter_type: 'category',
                    filter_value: newCategory,
                    page_section: 'product_inventory'
                  })
                }}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Categories</option>
                <option value="suits">Suits</option>
                <option value="shirts">Shirts</option>
                <option value="accessories">Accessories</option>
              </select>
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-700">Stock:</span>
              <select
                value={stockFilter}
                onChange={(e) => {
                  const newStock = e.target.value as StockFilter
                  setStockFilter(newStock)
                  trackEvent('filter_applied', {
                    filter_type: 'stock',
                    filter_value: newStock,
                    page_section: 'product_inventory'
                  })
                }}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Stock Levels</option>
                <option value="in_stock">In Stock</option>
                <option value="low_stock">Low Stock</option>
                <option value="out_of_stock">Out of Stock</option>
              </select>
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-700">View:</span>
              <div className="flex border border-gray-300 rounded-md">
                <button
                  onClick={() => {
                    const newViewMode = 'grid'
                    setViewMode(newViewMode)
                    trackEvent('navigation_click', {
                      navigation_target: 'view_mode',
                      view_mode: newViewMode,
                      page_section: 'product_inventory'
                    })
                  }}
                  className={`px-3 py-2 text-sm ${
                    viewMode === 'grid'
                      ? 'bg-blue-50 text-blue-600 border-r border-gray-300'
                      : 'text-gray-700 hover:bg-gray-50 border-r border-gray-300'
                  }`}
                >
                  Grid
                </button>
                <button
                  onClick={() => {
                    const newViewMode = 'table'
                    setViewMode(newViewMode)
                    trackEvent('navigation_click', {
                      navigation_target: 'view_mode',
                      view_mode: newViewMode,
                      page_section: 'product_inventory'
                    })
                  }}
                  className={`px-3 py-2 text-sm ${
                    viewMode === 'table'
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Table
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Results count */}
        <div className="mt-4 text-sm text-gray-600">
          Showing {filteredProducts.length} of {products.length} products
        </div>
      </div>

      {/* Smart AI Features */}
      <SmartFeaturesDisplay 
        currentCategory={categoryFilter !== 'all' ? categoryFilter : undefined}
        className="mb-8"
      />

      {/* Products Grid/Table */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredProducts.map((product) => {
            const stockStatus = getStockStatus(product)
            const isExpanded = expandedProduct === product.id

            return (
              <div key={product.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                {/* Product Header */}
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900">{product.name}</h3>
                      <p className="text-sm text-gray-600">{product.category}</p>
                      <p className="text-sm text-gray-500">{product.sku_prefix}</p>
                    </div>
                    <div className="ml-4">
                      <button className="text-gray-400 hover:text-gray-600">
                        <MoreHorizontal className="h-5 w-5" />
                      </button>
                    </div>
                  </div>

                  {/* Stock Status */}
                  <div className="mt-4 flex items-center justify-between">
                    <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-medium ${getStockStatusColor(stockStatus)}`}>
                      {getStockIcon(stockStatus)}
                      <span className="capitalize">{stockStatus.replace('_', ' ')}</span>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">${product.base_price}</p>
                      <p className="text-xs text-gray-500">{product.total_stock || 0} units</p>
                    </div>
                  </div>

                  {/* Variants Summary */}
                  <div className="mt-4 text-xs text-gray-600">
                    <p>{product.variants?.length || 0} variants available</p>
                    {(product.low_stock_variants || 0) > 0 && (
                      <p className="text-yellow-600 font-medium">{product.low_stock_variants} low stock</p>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="mt-4 flex space-x-2">
                    <button
                      onClick={() => setExpandedProduct(isExpanded ? null : product.id)}
                      className="flex-1 px-3 py-2 bg-blue-50 text-blue-700 text-sm font-medium rounded-md hover:bg-blue-100"
                    >
                      {isExpanded ? 'Hide Matrix' : 'Show Matrix'}
                    </button>
                    <button 
                      onClick={() => {
                        setEditingProduct(product)
                        trackEvent('navigation_click', {
                          navigation_target: 'edit_product',
                          product_id: product.id.toString(),
                          product_name: product.name,
                          page_section: 'product_grid'
                        })
                      }}
                      className="px-3 py-2 bg-gray-50 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-100 flex items-center"
                      title="Edit Product"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Expanded Matrix View */}
                {isExpanded && (
                  <div className="border-t border-gray-200 p-6 bg-gray-50">
                    {product.requires_size ? (
                      <ProductSizeMatrix 
                        product={product}
                        sizes={sizes[product.sizing_category || ''] || []}
                        colors={colors}
                        onStockUpdate={refetch}
                      />
                    ) : (
                      <ProductColorGrid
                        product={product}
                        colors={colors}
                        onStockUpdate={refetch}
                      />
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      ) : (
        // Table View
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SKU Prefix</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Variants</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredProducts.map((product) => {
                  const stockStatus = getStockStatus(product)
                  return (
                    <tr key={product.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{product.name}</div>
                          <div className="text-sm text-gray-500">{product.subcategory}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{product.category}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-mono">{product.sku_prefix}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${product.base_price}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{product.total_stock || 0}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-medium ${getStockStatusColor(stockStatus)}`}>
                          {getStockIcon(stockStatus)}
                          <span className="capitalize">{stockStatus.replace('_', ' ')}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{product.variants?.length || 0} variants</div>
                        {(product.low_stock_variants || 0) > 0 && (
                          <div className="text-xs text-yellow-600">{product.low_stock_variants} low stock</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          <button className="text-blue-600 hover:text-blue-900">
                            <Eye className="h-4 w-4" />
                          </button>
                          <button 
                            onClick={() => {
                              setEditingProduct(product)
                              trackEvent('navigation_click', {
                                navigation_target: 'edit_product',
                                product_id: product.id.toString(),
                                product_name: product.name,
                                page_section: 'product_table'
                              })
                            }}
                            className="text-gray-600 hover:text-gray-900"
                            title="Edit Product"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button className="text-green-600 hover:text-green-900">
                            <ShoppingCart className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modals */}
      {showBulkModal && (
        <BulkInventoryModal
          products={filteredProducts}
          onClose={() => setShowBulkModal(false)}
          onUpdate={refetch}
        />
      )}

      {showAddModal && (
        <AddProductModal
          onClose={() => setShowAddModal(false)}
          onAdd={refetch}
        />
      )}

      {editingProduct && (
        <EditProductModal
          product={editingProduct}
          onClose={() => setEditingProduct(null)}
          onSave={refetch}
        />
      )}

      {showExportModal && (
        <ExportModal
          products={filteredProducts}
          onClose={() => setShowExportModal(false)}
        />
      )}
    </div>
  )
}