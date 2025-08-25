import React, { useState } from 'react'
import { X } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { InventoryProduct as Product } from '@/lib/supabase'

interface AddVariantModalProps {
  products: Product[]
  onSave: () => void
  onClose: () => void
}

export function AddVariantModal({ products, onSave, onClose }: AddVariantModalProps) {
  const [formData, setFormData] = useState({
    product_id: 0,
    piece_type: '2-piece' as string,
    color_id: 0,
    size_id: 0,
    price: 0,
    stock_quantity: 0,
    low_stock_threshold: 5
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const selectedProduct = products.find(p => p.id === formData.product_id)
  
  const getPieceTypeOptions = () => {
    if (!selectedProduct) return []
    
    switch (selectedProduct.category) {
      case 'suits':
        return [
          { value: '2-piece', label: '2-Piece Suit' },
          { value: '3-piece', label: '3-Piece Suit' }
        ]
      case 'shirts':
        return [
          { value: 'slim', label: 'Slim Fit' },
          { value: 'classic', label: 'Classic Fit' }
        ]
      default:
        return [{ value: 'standard', label: 'Standard' }]
    }
  }
  
  const generateSKU = () => {
    if (!selectedProduct) return ''
    
    const productPrefix = selectedProduct.sku_prefix
    const pieceCode = formData.piece_type.substring(0, 2).toUpperCase()
    
    return `${productPrefix}-${pieceCode}-${Date.now()}`
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
      
      const { error: insertError } = await supabase
        .from('inventory_variants')
        .insert({
          product_id: formData.product_id,
          piece_type: formData.piece_type,
          color_id: formData.color_id || null,
          size_id: formData.size_id || null,
          sku: sku,
          price: formData.price,
          stock_quantity: formData.stock_quantity,
          low_stock_threshold: formData.low_stock_threshold,
          is_active: true
        })

      if (insertError) throw insertError
      
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
              onChange={(e) => setFormData({ ...formData, product_id: parseInt(e.target.value) })}
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
                Piece Type
              </label>
              <select
                value={formData.piece_type}
                onChange={(e) => setFormData({ ...formData, piece_type: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                required
              >
                {getPieceTypeOptions().map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Price ($)
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="0.00"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Stock Quantity
            </label>
            <input
              type="number"
              min="0"
              value={formData.stock_quantity}
              onChange={(e) => setFormData({ ...formData, stock_quantity: parseInt(e.target.value) || 0 })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="0"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Low Stock Threshold
            </label>
            <input
              type="number"
              min="0"
              value={formData.low_stock_threshold}
              onChange={(e) => setFormData({ ...formData, low_stock_threshold: parseInt(e.target.value) || 0 })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="5"
              required
            />
          </div>
          
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
              disabled={loading}
            >
              {loading ? 'Creating...' : 'Create Variant'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}