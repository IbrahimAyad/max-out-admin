import React, { useState } from 'react'
import { X } from 'lucide-react'

interface BulkEditModalProps {
  selectedCount: number
  onSave: (updates: any) => void
  onClose: () => void
}

export function BulkEditModal({ selectedCount, onSave, onClose }: BulkEditModalProps) {
  const [quantity, setQuantity] = useState('')
  const [threshold, setThreshold] = useState('')
  const [updateQuantity, setUpdateQuantity] = useState(false)
  const [updateThreshold, setUpdateThreshold] = useState(false)

  const handleSave = () => {
    const updates: any = {}
    
    if (updateQuantity && quantity) {
      const qty = parseInt(quantity)
      updates.available_quantity = qty
      updates.inventory_quantity = qty
    }
    
    if (updateThreshold && threshold) {
      updates.low_stock_threshold = parseInt(threshold)
    }
    
    if (Object.keys(updates).length > 0) {
      onSave(updates)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-md w-full mx-4">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Bulk Edit {selectedCount} Variants
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <div className="p-6 space-y-4">
          <div className="space-y-3">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={updateQuantity}
                onChange={(e) => setUpdateQuantity(e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-700">Update available quantity</span>
            </label>
            
            {updateQuantity && (
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="New quantity"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                min="0"
              />
            )}
          </div>
          
          <div className="space-y-3">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={updateThreshold}
                onChange={(e) => setUpdateThreshold(e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-700">Update low stock threshold</span>
            </label>
            
            {updateThreshold && (
              <input
                type="number"
                value={threshold}
                onChange={(e) => setThreshold(e.target.value)}
                placeholder="New threshold"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                min="0"
              />
            )}
          </div>
        </div>
        
        <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={(!updateQuantity && !updateThreshold) || (updateQuantity && !quantity) || (updateThreshold && !threshold)}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Update {selectedCount} Variants
          </button>
        </div>
      </div>
    </div>
  )
}