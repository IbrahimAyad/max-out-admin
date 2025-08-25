import React, { useState } from 'react'
import { Edit2, Package, AlertTriangle, CheckCircle, XCircle } from 'lucide-react'
import type { EnhancedVariant as EnhancedProductVariant } from '@/lib/supabase'

interface ProductVariantCardProps {
  variant: EnhancedProductVariant
  selected: boolean
  onSelect: (selected: boolean) => void
  onUpdate: (variantId: string, updates: any) => void
}

export function ProductVariantCard({ variant, selected, onSelect, onUpdate }: ProductVariantCardProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [quantity, setQuantity] = useState(variant.stock_quantity || 0)
  const [threshold, setThreshold] = useState(variant.low_stock_threshold || 0)

  const handleSave = async () => {
    await onUpdate(variant.id.toString(), {
      stock_quantity: quantity,
      low_stock_threshold: threshold
    })
    setIsEditing(false)
  }

  const handleCancel = () => {
    setQuantity(variant.stock_quantity || 0)
    setThreshold(variant.low_stock_threshold || 0)
    setIsEditing(false)
  }

  const getStockStatusColor = (status: string | undefined) => {
    switch (status) {
      case 'in_stock': return 'text-green-600'
      case 'low_stock': return 'text-yellow-600'
      case 'out_of_stock': return 'text-red-600'
      default: return 'text-gray-600'
    }
  }

  const getStockStatusIcon = (status: string | undefined) => {
    switch (status) {
      case 'in_stock': return <CheckCircle className="h-4 w-4" />
      case 'low_stock': return <AlertTriangle className="h-4 w-4" />
      case 'out_of_stock': return <XCircle className="h-4 w-4" />
      default: return <Package className="h-4 w-4" />
    }
  }

  const getVariantTypeLabel = (type: string | undefined) => {
    if (!type) return 'Standard'
    return type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
  }

  return (
    <div className={`bg-white rounded-lg border-2 transition-all ${
      selected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
    }`}>
      <div className="p-4">
        {/* Header with checkbox and product info */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-start space-x-3">
            <input
              type="checkbox"
              checked={selected}
              onChange={(e) => onSelect(e.target.checked)}
              className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <div className="flex-1">
              <h3 className="font-medium text-gray-900">
                {variant.product?.name || 'Unknown Product'}
              </h3>
              <p className="text-sm text-gray-600">{getVariantTypeLabel(variant.piece_type)}</p>
            </div>
          </div>
          
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="text-gray-400 hover:text-gray-600"
            >
              <Edit2 className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* SKU and variant details */}
        <div className="space-y-2 mb-4">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-700">SKU:</span>
            <span className="text-sm text-gray-900 font-mono">{variant.sku}</span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-700">Color:</span>
            <div className="flex items-center gap-2">
              {variant.color?.hex_value && (
                <div 
                  className="w-4 h-4 rounded-full border border-gray-300"
                  style={{ backgroundColor: variant.color.hex_value }}
                ></div>
              )}
              <span className="text-sm text-gray-900">{variant.color?.color_name || 'N/A'}</span>
            </div>
          </div>
          
          {variant.size && (
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700">Size:</span>
              <span className="text-sm text-gray-900">{variant.size.size_label}</span>
            </div>
          )}
          
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-700">Price:</span>
            <span className="text-sm text-gray-900 font-medium">
              ${variant.price.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Stock information */}
        <div className="border-t border-gray-200 pt-3">
          {isEditing ? (
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Available Quantity
                </label>
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                  min="0"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Low Stock Threshold
                </label>
                <input
                  type="number"
                  value={threshold}
                  onChange={(e) => setThreshold(parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                  min="0"
                />
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={handleSave}
                  className="flex-1 bg-blue-600 text-white px-3 py-2 rounded text-sm hover:bg-blue-700"
                >
                  Save
                </button>
                <button
                  onClick={handleCancel}
                  className="flex-1 bg-gray-500 text-white px-3 py-2 rounded text-sm hover:bg-gray-600"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">Stock:</span>
                <div className={`flex items-center gap-1 ${getStockStatusColor(variant.stock_status)}`}>
                  {getStockStatusIcon(variant.stock_status)}
                  <span className="text-sm font-medium">{variant.stock_quantity}</span>
                </div>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">Status:</span>
                <span className={`text-sm font-medium capitalize ${getStockStatusColor(variant.stock_status)}`}>
                  {(variant.stock_status || '').replace('_', ' ')}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">Threshold:</span>
                <span className="text-sm text-gray-900">{variant.low_stock_threshold}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">Last Updated:</span>
                <span className="text-sm text-gray-600">
                  {new Date(variant.updated_at).toLocaleDateString()}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}