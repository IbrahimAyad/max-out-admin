import React, { useState } from 'react'
import { useProducts } from '../hooks/useData'
import { Link } from 'react-router-dom'
import { 
  Search, 
  Filter, 
  Plus, 
  Package, 
  Eye, 
  Edit, 
  MoreVertical,
  Grid3X3,
  List,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import { CDN_BASE_URL, getImageUrl, getPrimaryImageFromProduct } from '../lib/supabase'

export default function Products() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const limit = 20

  const { data, isLoading, error } = useProducts(page, limit, search, category)

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800'
      case 'draft':
        return 'bg-yellow-100 text-yellow-800'
      case 'archived':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-neutral-100 text-neutral-800'
    }
  }

  const categories = [
    'Suits',
    'Tuxedos',
    'Blazers',
    'Double-Breasted Suits',
    'Stretch Suits',
    'Mens Shirts',
    'Accessories'
  ]

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-neutral-900">Products</h2>
            <p className="text-sm text-neutral-500">Manage your product catalog and inventory</p>
          </div>
        </div>
        
        {/* Loading skeleton */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg border border-neutral-200 p-4">
              <div className="animate-pulse">
                <div className="h-48 bg-neutral-200 rounded mb-4"></div>
                <div className="h-4 bg-neutral-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-neutral-200 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">Failed to load products. Please try again.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-neutral-900">Products</h2>
          <p className="text-sm text-neutral-500">
            Manage your product catalog and inventory
          </p>
        </div>
        <button className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-black hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black">
          <Plus className="h-4 w-4 mr-2" />
          Add Product
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-neutral-200 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-400" />
              <input
                type="text"
                placeholder="Search products..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
              />
            </div>
          </div>
          
          {/* Category Filter */}
          <div className="sm:w-48">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
            >
              <option value="">All Categories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* View Mode */}
          <div className="flex border border-neutral-300 rounded-md">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-2 text-sm font-medium rounded-l-md ${
                viewMode === 'grid'
                  ? 'bg-black text-white'
                  : 'bg-white text-neutral-700 hover:bg-neutral-50'
              }`}
            >
              <Grid3X3 className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-2 text-sm font-medium rounded-r-md border-l ${
                viewMode === 'list'
                  ? 'bg-black text-white'
                  : 'bg-white text-neutral-700 hover:bg-neutral-50'
              }`}
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Products Grid/List */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {data?.products.map((product: any) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-neutral-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-neutral-200">
              <thead className="bg-neutral-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Variants
                  </th>
                  <th className="relative px-6 py-3">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-neutral-200">
                {data?.products.map((product: any) => (
                  <ProductRow key={product.id} product={product} />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination */}
      {data?.total && data.total > limit && (
        <div className="flex items-center justify-between bg-white px-4 py-3 border border-neutral-200 rounded-lg">
          <div className="flex justify-between flex-1 sm:hidden">
            <button
              onClick={() => setPage(page - 1)}
              disabled={page === 1}
              className="relative inline-flex items-center px-4 py-2 border border-neutral-300 text-sm font-medium rounded-md text-neutral-700 bg-white hover:bg-neutral-50 disabled:opacity-50"
            >
              Previous
            </button>
            <button
              onClick={() => setPage(page + 1)}
              disabled={!data.hasMore}
              className="ml-3 relative inline-flex items-center px-4 py-2 border border-neutral-300 text-sm font-medium rounded-md text-neutral-700 bg-white hover:bg-neutral-50 disabled:opacity-50"
            >
              Next
            </button>
          </div>
          <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-neutral-700">
                Showing <span className="font-medium">{(page - 1) * limit + 1}</span> to{' '}
                <span className="font-medium">
                  {Math.min(page * limit, data.total)}
                </span>{' '}
                of <span className="font-medium">{data.total}</span> results
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                <button
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-neutral-300 bg-white text-sm font-medium text-neutral-500 hover:bg-neutral-50 disabled:opacity-50"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  onClick={() => setPage(page + 1)}
                  disabled={!data.hasMore}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-neutral-300 bg-white text-sm font-medium text-neutral-500 hover:bg-neutral-50 disabled:opacity-50"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Product Card Component
function ProductCard({ product }: { product: any }) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800'
      case 'draft':
        return 'bg-yellow-100 text-yellow-800'
      case 'archived':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-neutral-100 text-neutral-800'
    }
  }

  return (
    <div className="bg-white rounded-lg border border-neutral-200 overflow-hidden hover:shadow-lg transition-shadow duration-200">
      <div className="aspect-w-1 aspect-h-1 bg-neutral-100">
        {getPrimaryImageFromProduct(product) ? (
          <img
            src={getPrimaryImageFromProduct(product) || ''}
            alt={product.name}
            className="w-full h-48 object-cover"
          />
        ) : (
          <div className="w-full h-48 flex items-center justify-center bg-neutral-100">
            <Package className="h-12 w-12 text-neutral-400" />
          </div>
        )}
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-medium text-neutral-900 truncate">
              {product.name}
            </h3>
            <p className="text-sm text-neutral-500 mt-1">
              {product.category}
            </p>
            <p className="text-sm text-neutral-500">
              SKU: {product.sku}
            </p>
          </div>
          <div className="ml-2 flex-shrink-0">
            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
              getStatusColor(product.status)
            }`}>
              {product.status}
            </span>
          </div>
        </div>
        
        <div className="mt-4 flex items-center justify-between">
          <div>
            <div className="flex items-center space-x-2">
              <p className="text-lg font-semibold text-neutral-900">
                {formatCurrency(product.base_price)}
              </p>
            </div>
            <div className="flex items-center space-x-2 mt-1">
              <p className="text-xs text-neutral-500">
                {product.product_variants?.[0]?.count || 0} variants
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Link
              to={`/products/${product.id}`}
              className="inline-flex items-center p-1.5 border border-neutral-300 rounded-md text-neutral-400 hover:text-neutral-500 hover:bg-neutral-50"
            >
              <Eye className="h-4 w-4" />
            </Link>
            <button className="inline-flex items-center p-1.5 border border-neutral-300 rounded-md text-neutral-400 hover:text-neutral-500 hover:bg-neutral-50">
              <Edit className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// Product Row Component
function ProductRow({ product }: { product: any }) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800'
      case 'draft':
        return 'bg-yellow-100 text-yellow-800'
      case 'archived':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-neutral-100 text-neutral-800'
    }
  }

  return (
    <tr className="hover:bg-neutral-50">
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center">
          <div className="flex-shrink-0 h-12 w-12">
            {getPrimaryImageFromProduct(product) ? (
              <img
                src={getPrimaryImageFromProduct(product) || ''}
                alt={product.name}
                className="h-12 w-12 rounded-md object-cover"
              />
            ) : (
              <div className="h-12 w-12 rounded-md bg-neutral-100 flex items-center justify-center">
                <Package className="h-6 w-6 text-neutral-400" />
              </div>
            )}
          </div>
          <div className="ml-4">
            <div className="text-sm font-medium text-neutral-900">
              {product.name}
            </div>
            <div className="text-sm text-neutral-500">
              SKU: {product.sku}
            </div>
          </div>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900">
        <div>
          <div>{product.category}</div>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900">
        <div>
          <div>{formatCurrency(product.base_price)}</div>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
          getStatusColor(product.status)
        }`}>
          {product.status}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900">
        {product.product_variants?.[0]?.count || 0}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
        <div className="flex items-center justify-end space-x-2">
          <Link
            to={`/products/${product.id}`}
            className="text-black hover:text-neutral-700"
          >
            View
          </Link>
          <button className="text-black hover:text-neutral-700">
            Edit
          </button>
        </div>
      </td>
    </tr>
  )
}