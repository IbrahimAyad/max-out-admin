import React, { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'
import {
  X,
  Edit,
  Trash2,
  Archive,
  Eye,
  Tag,
  DollarSign,
  Package
} from 'lucide-react'
import { productQueries } from '../lib/queries'
import { supabase } from '../lib/supabase'

interface BulkActionsProps {
  selectedProducts: string[]
  onClearSelection: () => void
  onRefresh: () => void
}

const BulkActions: React.FC<BulkActionsProps> = ({
  selectedProducts,
  onClearSelection,
  onRefresh
}) => {
  const [showBulkEdit, setShowBulkEdit] = useState(false)
  const [bulkEditData, setBulkEditData] = useState({
    status: '',
    category: '',
    tags: '',
    priceAdjustment: {
      type: 'none', // 'none', 'increase', 'decrease', 'set'
      value: 0,
      unit: 'percentage' // 'percentage', 'fixed'
    }
  })

  const queryClient = useQueryClient()

  const bulkUpdateMutation = useMutation({
    mutationFn: async (updates: any) => {
      const promises = selectedProducts.map(async (productId) => {
        const updateData: any = {}
        
        if (updates.status) updateData.status = updates.status
        if (updates.category) updateData.category = updates.category
        if (updates.tags) {
          const tags = updates.tags.split(',').map((tag: string) => tag.trim())
          updateData.tags = tags
        }
        
        if (updates.priceAdjustment.type !== 'none') {
          // Get current product to calculate new price
          const { data: product } = await supabase
            .from('products')
            .select('base_price')
            .eq('id', productId)
            .single()
          
          if (product) {
            let newPrice = product.base_price
            const adjustment = updates.priceAdjustment.value
            
            switch (updates.priceAdjustment.type) {
              case 'increase':
                if (updates.priceAdjustment.unit === 'percentage') {
                  newPrice = Math.round(newPrice * (1 + adjustment / 100))
                } else {
                  newPrice = newPrice + (adjustment * 100) // Convert to cents
                }
                break
              case 'decrease':
                if (updates.priceAdjustment.unit === 'percentage') {
                  newPrice = Math.round(newPrice * (1 - adjustment / 100))
                } else {
                  newPrice = Math.max(0, newPrice - (adjustment * 100))
                }
                break
              case 'set':
                newPrice = adjustment * 100 // Convert to cents
                break
            }
            
            updateData.base_price = newPrice
          }
        }
        
        return productQueries.updateProduct(productId, updateData)
      })
      
      return Promise.all(promises)
    },
    onSuccess: () => {
      toast.success(`Updated ${selectedProducts.length} products successfully`)
      queryClient.invalidateQueries({ queryKey: ['products'] })
      onClearSelection()
      setShowBulkEdit(false)
      onRefresh()
    },
    onError: (error: any) => {
      toast.error(`Failed to update products: ${error.message}`)
    }
  })

  const bulkDeleteMutation = useMutation({
    mutationFn: async () => {
      const promises = selectedProducts.map(productId => 
        productQueries.deleteProduct(productId)
      )
      return Promise.all(promises)
    },
    onSuccess: () => {
      toast.success(`Deleted ${selectedProducts.length} products successfully`)
      queryClient.invalidateQueries({ queryKey: ['products'] })
      onClearSelection()
      onRefresh()
    },
    onError: (error: any) => {
      toast.error(`Failed to delete products: ${error.message}`)
    }
  })

  const handleBulkEdit = () => {
    if (Object.values(bulkEditData).some(value => {
      if (typeof value === 'object') {
        return value.type !== 'none'
      }
      return value !== ''
    })) {
      bulkUpdateMutation.mutate(bulkEditData)
    } else {
      toast.error('Please select at least one field to update')
    }
  }

  const handleBulkDelete = () => {
    if (window.confirm(`Are you sure you want to delete ${selectedProducts.length} products? This action cannot be undone.`)) {
      bulkDeleteMutation.mutate()
    }
  }

  const handleArchive = () => {
    bulkUpdateMutation.mutate({ status: 'archived' })
  }

  const handleActivate = () => {
    bulkUpdateMutation.mutate({ status: 'active' })
  }

  return (
    <>
      <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <span className="text-sm font-medium text-indigo-900">
              {selectedProducts.length} products selected
            </span>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowBulkEdit(true)}
                className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <Edit className="h-3 w-3 mr-1" />
                Bulk Edit
              </button>
              <button
                onClick={handleActivate}
                disabled={bulkUpdateMutation.isPending}
                className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-green-700 bg-green-100 hover:bg-green-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
              >
                <Eye className="h-3 w-3 mr-1" />
                Activate
              </button>
              <button
                onClick={handleArchive}
                disabled={bulkUpdateMutation.isPending}
                className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-yellow-700 bg-yellow-100 hover:bg-yellow-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 disabled:opacity-50"
              >
                <Archive className="h-3 w-3 mr-1" />
                Archive
              </button>
              <button
                onClick={handleBulkDelete}
                disabled={bulkDeleteMutation.isPending}
                className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
              >
                <Trash2 className="h-3 w-3 mr-1" />
                Delete
              </button>
            </div>
          </div>
          <button
            onClick={onClearSelection}
            className="text-indigo-600 hover:text-indigo-800 p-1 rounded-full hover:bg-indigo-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Bulk Edit Modal */}
      {showBulkEdit && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Bulk Edit {selectedProducts.length} Products
                </h3>
                <button
                  onClick={() => setShowBulkEdit(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              <div className="space-y-4">
                {/* Status */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    value={bulkEditData.status}
                    onChange={(e) => setBulkEditData(prev => ({ ...prev, status: e.target.value }))}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  >
                    <option value="">No change</option>
                    <option value="active">Active</option>
                    <option value="draft">Draft</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>

                {/* Category */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category
                  </label>
                  <input
                    type="text"
                    value={bulkEditData.category}
                    onChange={(e) => setBulkEditData(prev => ({ ...prev, category: e.target.value }))}
                    placeholder="Leave empty for no change"
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </div>

                {/* Tags */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tags (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={bulkEditData.tags}
                    onChange={(e) => setBulkEditData(prev => ({ ...prev, tags: e.target.value }))}
                    placeholder="tag1, tag2, tag3"
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </div>

                {/* Price Adjustment */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Price Adjustment
                  </label>
                  <div className="space-y-2">
                    <select
                      value={bulkEditData.priceAdjustment.type}
                      onChange={(e) => setBulkEditData(prev => ({
                        ...prev,
                        priceAdjustment: { ...prev.priceAdjustment, type: e.target.value }
                      }))}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    >
                      <option value="none">No change</option>
                      <option value="increase">Increase</option>
                      <option value="decrease">Decrease</option>
                      <option value="set">Set to</option>
                    </select>
                    
                    {bulkEditData.priceAdjustment.type !== 'none' && (
                      <div className="flex space-x-2">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={bulkEditData.priceAdjustment.value}
                          onChange={(e) => setBulkEditData(prev => ({
                            ...prev,
                            priceAdjustment: { ...prev.priceAdjustment, value: parseFloat(e.target.value) || 0 }
                          }))}
                          className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                        />
                        <select
                          value={bulkEditData.priceAdjustment.unit}
                          onChange={(e) => setBulkEditData(prev => ({
                            ...prev,
                            priceAdjustment: { ...prev.priceAdjustment, unit: e.target.value }
                          }))}
                          className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                        >
                          <option value="percentage">%</option>
                          <option value="fixed">$</option>
                        </select>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowBulkEdit(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Cancel
                </button>
                <button
                  onClick={handleBulkEdit}
                  disabled={bulkUpdateMutation.isPending}
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                >
                  {bulkUpdateMutation.isPending ? 'Updating...' : 'Update Products'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default BulkActions