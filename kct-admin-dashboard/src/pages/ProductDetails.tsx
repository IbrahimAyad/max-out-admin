import React, { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useProduct } from '../hooks/useData'
import { useProductImages } from '../hooks/useProductImages'
import { 
  ArrowLeft, 
  Package, 
  Tag, 
  DollarSign, 
  Archive, 
  Edit,
  Eye,
  AlertTriangle,
  BarChart3,
  Image as ImageIcon
} from 'lucide-react'
import { CDN_BASE_URL, getImageUrl, getPrimaryImageFromProduct } from '../lib/supabase'
import ImageManager from '../components/ImageManager'
import ProductEditModal from '../components/ProductEditModal'

export default function ProductDetails() {
  const { productId } = useParams()
  const { data: product, isLoading, error } = useProduct(productId!)
  const { productImages, productGallery } = useProductImages(productId!)
  const [activeTab, setActiveTab] = useState<'details' | 'images'>('details')
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'draft':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'archived':
        return 'bg-red-100 text-red-800 border-red-200'
      default:
        return 'bg-neutral-100 text-neutral-800 border-neutral-200'
    }
  }

  const getStockColor = (quantity: number) => {
    if (quantity === 0) return 'text-red-600'
    if (quantity < 10) return 'text-yellow-600'
    return 'text-green-600'
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-neutral-200 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="h-96 bg-neutral-200 rounded"></div>
              <div className="h-48 bg-neutral-200 rounded"></div>
            </div>
            <div className="space-y-6">
              <div className="h-48 bg-neutral-200 rounded"></div>
              <div className="h-32 bg-neutral-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">Failed to load product details. Please try again.</p>
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="space-y-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800">Product not found.</p>
        </div>
      </div>
    )
  }

  const totalInventory = product.product_variants?.reduce(
    (sum: number, variant: any) => sum + (variant.inventory_quantity || 0), 
    0
  ) || 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            to="/products"
            className="inline-flex items-center p-2 border border-neutral-300 rounded-md text-neutral-400 hover:text-neutral-500 hover:bg-neutral-50"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-neutral-900">
              {product.name}
            </h1>
            <p className="text-sm text-neutral-500">
              SKU: {product.sku} • Created {formatDate(product.created_at)}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <div className={`flex items-center space-x-2 px-3 py-2 rounded-lg border ${
            getStatusColor(product.status)
          }`}>
            <span className="text-sm font-medium">
              {product.status.charAt(0).toUpperCase() + product.status.slice(1)}
            </span>
          </div>
          <button 
            onClick={() => setIsEditModalOpen(true)}
            className="inline-flex items-center px-4 py-2 border border-neutral-300 rounded-md shadow-sm text-sm font-medium text-neutral-700 bg-white hover:bg-neutral-50"
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit Product
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-neutral-200">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('details')}
            className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'details'
                ? 'border-black text-black'
                : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300'
            }`}
          >
            Product Details
          </button>
          <button
            onClick={() => setActiveTab('images')}
            className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors flex items-center ${
              activeTab === 'images'
                ? 'border-black text-black'
                : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300'
            }`}
          >
            <ImageIcon className="h-4 w-4 mr-2" />
            Images ({productImages.length})
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'details' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Product Image */}
            <div className="bg-white rounded-lg border border-neutral-200 overflow-hidden">
              <div className="aspect-w-16 aspect-h-9">
                {getPrimaryImageFromProduct(product) ? (
                  <img
                    src={getPrimaryImageFromProduct(product) || ''}
                    alt={product.name}
                    className="w-full h-96 object-cover"
                  />
                ) : (
                  <div className="w-full h-96 flex items-center justify-center bg-neutral-100">
                    <Package className="h-24 w-24 text-neutral-400" />
                  </div>
                )}
              </div>
            </div>

            {/* Product Description */}
            <div className="bg-white rounded-lg border border-neutral-200 p-6">
              <h3 className="text-lg font-medium text-neutral-900 mb-4">Description</h3>
              {product.description ? (
                <div className="prose prose-sm max-w-none text-neutral-700">
                  <p>{product.description}</p>
                </div>
              ) : (
                <p className="text-neutral-500 italic">No description available</p>
              )}
            </div>

            {/* Product Variants */}
            <div className="bg-white rounded-lg border border-neutral-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-neutral-200">
                <h3 className="text-lg font-medium text-neutral-900">Product Variants</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-neutral-200">
                  <thead className="bg-neutral-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                        Variant
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                        SKU
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                        Price
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                        Inventory
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-neutral-200">
                    {product.product_variants?.map((variant: any) => (
                      <tr key={variant.id} className="hover:bg-neutral-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-neutral-900">
                              {variant.size && `Size: ${variant.size}`}
                              {variant.size && variant.color && ' • '}
                              {variant.color && `Color: ${variant.color}`}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900">
                          {variant.sku}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900">
                          {formatCurrency(variant.price)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`text-sm font-medium ${
                            getStockColor(variant.inventory_quantity)
                          }`}>
                            {variant.inventory_quantity} units
                          </span>
                          {variant.inventory_quantity === 0 && (
                            <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              Out of Stock
                            </span>
                          )}
                          {variant.inventory_quantity > 0 && variant.inventory_quantity < 10 && (
                            <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                              Low Stock
                            </span>
                          )}
                        </td>
                      </tr>
                    )) || (
                      <tr>
                        <td colSpan={4} className="px-6 py-4 text-center text-sm text-neutral-500">
                          No variants found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Product Info */}
            <div className="bg-white rounded-lg border border-neutral-200 p-6">
              <h3 className="text-lg font-medium text-neutral-900 mb-4">Product Information</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-500">Base Price</label>
                  <div className="flex items-center space-x-2">
                    <p className="text-lg font-semibold text-neutral-900">
                      {formatCurrency(product.base_price)}
                    </p>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-neutral-500">Category</label>
                  <p className="text-sm text-neutral-900">
                    {product.category}
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-neutral-500">Handle</label>
                  <p className="text-sm text-neutral-900">{product.handle}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-neutral-500">Total Inventory</label>
                  <p className={`text-sm font-medium ${
                    getStockColor(totalInventory)
                  }`}>
                    {totalInventory} units
                  </p>
                </div>
              </div>
            </div>

            {/* Inventory Alert */}
            {totalInventory < 10 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-medium text-yellow-800">
                      {totalInventory === 0 ? 'Out of Stock' : 'Low Stock Alert'}
                    </h4>
                    <p className="text-sm text-yellow-700 mt-1">
                      {totalInventory === 0 
                        ? 'This product is currently out of stock.'
                        : `Only ${totalInventory} units remaining. Consider restocking soon.`
                      }
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div className="bg-white rounded-lg border border-neutral-200 p-6">
              <h3 className="text-lg font-medium text-neutral-900 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <button 
                  onClick={() => setIsEditModalOpen(true)}
                  className="w-full inline-flex items-center justify-center px-4 py-2 border border-neutral-300 rounded-md shadow-sm text-sm font-medium text-neutral-700 bg-white hover:bg-neutral-50"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Product
                </button>
                
                <button className="w-full inline-flex items-center justify-center px-4 py-2 border border-neutral-300 rounded-md shadow-sm text-sm font-medium text-neutral-700 bg-white hover:bg-neutral-50">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  View Analytics
                </button>
                
                <button className="w-full inline-flex items-center justify-center px-4 py-2 border border-neutral-300 rounded-md shadow-sm text-sm font-medium text-neutral-700 bg-white hover:bg-neutral-50">
                  <Archive className="h-4 w-4 mr-2" />
                  Archive Product
                </button>
              </div>
            </div>

            {/* Product Stats */}
            <div className="bg-white rounded-lg border border-neutral-200 p-6">
              <h3 className="text-lg font-medium text-neutral-900 mb-4">Statistics</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-neutral-500">Total Variants:</span>
                  <span className="text-sm font-medium text-neutral-900">
                    {product.product_variants?.length || 0}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-sm text-neutral-500">Created:</span>
                  <span className="text-sm font-medium text-neutral-900">
                    {formatDate(product.created_at)}
                  </span>
                </div>
                
                {product.updated_at && product.updated_at !== product.created_at && (
                  <div className="flex justify-between">
                    <span className="text-sm text-neutral-500">Last Updated:</span>
                    <span className="text-sm font-medium text-neutral-900">
                      {formatDate(product.updated_at)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        // Images Tab
        <div className="space-y-6">
          <ImageManager productId={productId!} />
        </div>
      )}

      {/* Product Edit Modal */}
      {product && (
        <ProductEditModal
          product={product}
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
        />
      )}
    </div>
  )
}