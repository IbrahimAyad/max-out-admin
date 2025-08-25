import { useState } from 'react'
import { Edit2, Check, X, AlertTriangle, Package } from 'lucide-react'
import { type EnhancedProduct, type ColorDefinition } from '@/lib/supabase'
import { useStockUpdate } from '@/hooks/useInventory'

interface ProductColorGridProps {
  product: EnhancedProduct
  colors: ColorDefinition[]
  onStockUpdate: () => void
}

export function ProductColorGrid({ product, colors, onStockUpdate }: ProductColorGridProps) {
  const [editingCell, setEditingCell] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')
  const { updateStock, updating, error } = useStockUpdate()

  const handleCellEdit = (variant: any) => {
    setEditingCell(`${variant.id}`)
    setEditValue(variant.stock_quantity.toString())
  }

  const handleSaveEdit = async (variant: any) => {
    const newQuantity = parseInt(editValue)
    if (isNaN(newQuantity) || newQuantity < 0) {
      setEditingCell(null)
      return
    }

    const success = await updateStock(variant.id, newQuantity, 'Manual update via color grid')
    if (success) {
      setEditingCell(null)
      onStockUpdate()
    }
  }

  const handleCancelEdit = () => {
    setEditingCell(null)
    setEditValue('')
  }

  const getStockStatusClass = (quantity: number, threshold: number) => {
    if (quantity === 0) return 'bg-red-50 border-red-200 text-red-800'
    if (quantity <= threshold) return 'bg-yellow-50 border-yellow-200 text-yellow-800'
    return 'bg-green-50 border-green-200 text-green-800'
  }

  const getStockIcon = (quantity: number, threshold: number) => {
    if (quantity === 0) return <Package className="h-4 w-4 text-red-500" />
    if (quantity <= threshold) return <AlertTriangle className="h-4 w-4 text-yellow-500" />
    return <Package className="h-4 w-4 text-green-500" />
  }

  // Filter colors that have variants for this product
  const availableVariants = product.variants || []
  const colorVariants = availableVariants.filter(variant => variant.color_id)

  // Get colors that have variants
  const relevantColors = colors.filter(color => 
    colorVariants.some(variant => variant.color_id === color.id)
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-lg font-semibold text-gray-900">Color Variants - {product.name}</h4>
        <div className="flex items-center space-x-4 text-xs">
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-green-50 border border-green-200 rounded"></div>
            <span className="text-gray-600">In Stock</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-yellow-50 border border-yellow-200 rounded"></div>
            <span className="text-gray-600">Low Stock</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-red-50 border border-red-200 rounded"></div>
            <span className="text-gray-600">Out of Stock</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {colorVariants.map(variant => {
          const color = colors.find(c => c.id === variant.color_id)
          const isEditing = editingCell === `${variant.id}`
          
          if (!color) return null

          return (
            <div 
              key={variant.id} 
              className={`border-2 rounded-lg p-4 transition-all hover:shadow-md ${getStockStatusClass(variant.stock_quantity, variant.low_stock_threshold)}`}
            >
              {/* Color Header */}
              <div className="flex items-center space-x-3 mb-3">
                <div 
                  className="w-6 h-6 rounded-full border-2 border-white shadow-sm"
                  style={{ backgroundColor: color.hex_value || '#6B7280' }}
                ></div>
                <div>
                  <h5 className="font-medium text-gray-900">{color.color_name}</h5>
                  <p className="text-xs text-gray-500 font-mono">{variant.sku}</p>
                </div>
              </div>

              {/* Stock Information */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Stock:</span>
                  {isEditing ? (
                    <div className="flex items-center space-x-1">
                      <input
                        type="number"
                        min="0"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        className="w-16 px-2 py-1 text-sm border border-blue-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveEdit(variant)
                          if (e.key === 'Escape') handleCancelEdit()
                        }}
                        autoFocus
                      />
                      <button
                        onClick={() => handleSaveEdit(variant)}
                        disabled={updating}
                        className="text-green-600 hover:text-green-800 disabled:opacity-50"
                      >
                        <Check className="h-4 w-4" />
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        className="text-red-600 hover:text-red-800"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleCellEdit(variant)}
                      className="group flex items-center space-x-2 px-2 py-1 rounded hover:bg-white hover:bg-opacity-50"
                    >
                      {getStockIcon(variant.stock_quantity, variant.low_stock_threshold)}
                      <span className="font-medium">{variant.stock_quantity}</span>
                      <Edit2 className="h-3 w-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                  )}
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Price:</span>
                  <span className="font-medium">${variant.price}</span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Threshold:</span>
                  <span className="text-gray-800">{variant.low_stock_threshold}</span>
                </div>
              </div>

              {/* Stock Status Badge */}
              <div className="mt-3 pt-3 border-t border-gray-200">
                <div className="flex items-center justify-center space-x-1">
                  {getStockIcon(variant.stock_quantity, variant.low_stock_threshold)}
                  <span className="text-xs font-medium">
                    {variant.stock_quantity === 0 ? 'Out of Stock' :
                     variant.stock_quantity <= variant.low_stock_threshold ? 'Low Stock' : 'In Stock'}
                  </span>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {colorVariants.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <Package className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <p>No color variants found for this product.</p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-3">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}
    </div>
  )
}