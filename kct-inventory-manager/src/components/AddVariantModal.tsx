import React, { useState } from 'react'
import { X } from 'lucide-react'
import { inventoryService } from '@/lib/supabase'
import type { Product } from '@/lib/supabase'

interface AddVariantModalProps {
  products: Product[]
  onSave: () => void
  onClose: () => void
}

export function AddVariantModal({ products, onSave, onClose }: AddVariantModalProps) {
  const [formData, setFormData] = useState({
    product_id: '',
    variant_type: 'suit_2piece' as 'suit_2piece' | 'suit_3piece' | 'shirt_slim' | 'shirt_classic' | 'color_only',
    color: '',
    size: '',
    price_cents: 0,
    inventory_quantity: 0,
    low_stock_threshold: 5
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const selectedProduct = products.find(p => p.id === formData.product_id)
  
  const getVariantTypeOptions = () => {
    if (!selectedProduct) return []
    
    switch (selectedProduct.category) {
      case 'Suits':
        return [
          { value: 'suit_2piece', label: '2-Piece Suit' },
          { value: 'suit_3piece', label: '3-Piece Suit' }
        ]
      case 'Dress Shirts':
        return [
          { value: 'shirt_slim', label: 'Slim Fit' },
          { value: 'shirt_classic', label: 'Classic Fit' }
        ]
      default:
        return [{ value: 'color_only', label: 'Color Only' }]
    }
  }
  
  const getSizeOptions = () => {
    if (!selectedProduct) return []
    
    switch (selectedProduct.category) {
      case 'Suits':
        return ['34S', '34R', '36S', '36R', '38S', '38R', '38L', '40S', '40R', '40L', 
                '42S', '42R', '42L', '44S', '44R', '44L', '46S', '46R', '46L', 
                '48S', '48R', '48L', '50S', '50R', '50L', '52R', '52L', '54R', '54L']
      case 'Dress Shirts':
        return ['14.5', '15', '15.5', '16', '16.5', '17', '17.5', '18']
      default:
        return ['One Size']
    }
  }

  const generateSKU = () => {
    if (!selectedProduct || !formData.color) return ''
    
    const productPrefix = selectedProduct.sku
    const colorCode = formData.color.substring(0, 3).toUpperCase()
    const sizeCode = formData.size || 'OS'
    let typeCode = ''
    
    switch (formData.variant_type) {
      case 'suit_3piece':
        typeCode = '3PC'
        break
      case 'suit_2piece':
        typeCode = '2PC'
        break
      case 'shirt_slim':
        typeCode = 'SLIM'
        break
      case 'shirt_classic':
        typeCode = 'CLASSIC'
        break
      default:
        typeCode = ''
    }
    
    return `${productPrefix}-${colorCode}${typeCode ? `-${typeCode}` : ''}-${sizeCode}`
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    
    try {
      const sku = generateSKU()
      if (!sku) {
        throw new Error('Could not generate SKU')
      }
      
      await inventoryService.createVariant({
        ...formData,
        sku,
        available_quantity: formData.inventory_quantity,
        reserved_quantity: 0,
        committed_quantity: 0,
        stock_status: formData.inventory_quantity > formData.low_stock_threshold ? 'in_stock' : 
                     formData.inventory_quantity > 0 ? 'low_stock' : 'out_of_stock',
        allow_backorders: false,
        stripe_active: false,
        weight_grams: 0
      })
      
      onSave()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create variant')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-md w-full mx-4 max-h-screen overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Add New Variant</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Product
            </label>
            <select
              value={formData.product_id}
              onChange={(e) => setFormData({ ...formData, product_id: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              required
            >
              <option value="">Select a product</option>
              {products.map(product => (
                <option key={product.id} value={product.id}>
                  {product.name} ({product.category})
                </option>
              ))}
            </select>
          </div>
          
          {selectedProduct && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Variant Type
              </label>
              <select
                value={formData.variant_type}
                onChange={(e) => setFormData({ ...formData, variant_type: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                required
              >
                {getVariantTypeOptions().map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Color
            </label>
            <input
              type="text"
              value={formData.color}
              onChange={(e) => setFormData({ ...formData, color: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., Navy, White, Black"
              required
            />
          </div>
          
          {selectedProduct && getSizeOptions().length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Size
              </label>
              <select
                value={formData.size}
                onChange={(e) => setFormData({ ...formData, size: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                required={selectedProduct.category !== 'Suspenders'}
              >
                <option value="">Select size</option>
                {getSizeOptions().map(size => (
                  <option key={size} value={size}>{size}</option>
                ))}
              </select>
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Price (cents)
            </label>
            <input
              type="number"
              value={formData.price_cents}
              onChange={(e) => setFormData({ ...formData, price_cents: parseInt(e.target.value) || 0 })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              min="0"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Price in cents (e.g., 2999 for $29.99)
            </p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Initial Inventory
            </label>
            <input
              type="number"
              value={formData.inventory_quantity}
              onChange={(e) => setFormData({ ...formData, inventory_quantity: parseInt(e.target.value) || 0 })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              min="0"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Low Stock Threshold
            </label>
            <input
              type="number"
              value={formData.low_stock_threshold}
              onChange={(e) => setFormData({ ...formData, low_stock_threshold: parseInt(e.target.value) || 0 })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              min="0"
              required
            />
          </div>
          
          {formData.product_id && formData.color && (
            <div className="bg-gray-50 p-3 rounded-md">
              <p className="text-sm text-gray-600">
                <strong>Generated SKU:</strong> {generateSKU() || 'Will be generated'}
              </p>
            </div>
          )}
        </form>
        
        <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || !formData.product_id || !formData.color}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating...' : 'Create Variant'}
          </button>
        </div>
      </div>
    </div>
  )
}