import { useState, useEffect } from 'react'
import { Edit2, Check, X, AlertTriangle, Package } from 'lucide-react'
import { type EnhancedProduct, type SizeDefinition, type ColorDefinition, type InventoryVariant } from '@/lib/supabase'
import { useStockUpdate } from '@/hooks/useInventory'

interface ProductSizeMatrixProps {
  product: EnhancedProduct
  sizes: SizeDefinition[]
  colors: ColorDefinition[]
  onStockUpdate: () => void
}

export function ProductSizeMatrix({ product, sizes, colors, onStockUpdate }: ProductSizeMatrixProps) {
  const [editingCell, setEditingCell] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')
  const [variantMatrix, setVariantMatrix] = useState<Record<string, InventoryVariant>>({})
  const { updateStock, updating, error } = useStockUpdate()

  // Build variant matrix for quick lookup
  useEffect(() => {
    const matrix: Record<string, InventoryVariant> = {}
    product.variants?.forEach(variant => {
      const key = `${variant.size_id}-${variant.color_id}-${variant.piece_type || ''}`
      matrix[key] = variant
    })
    setVariantMatrix(matrix)
  }, [product.variants])

  const getVariant = (sizeId: number, colorId: number, pieceType?: string) => {
    const key = `${sizeId}-${colorId}-${pieceType || ''}`
    return variantMatrix[key]
  }

  const handleCellEdit = (variant: InventoryVariant) => {
    setEditingCell(`${variant.id}`)
    setEditValue(variant.stock_quantity.toString())
  }

  const handleSaveEdit = async (variant: InventoryVariant) => {
    const newQuantity = parseInt(editValue)
    if (isNaN(newQuantity) || newQuantity < 0) {
      setEditingCell(null)
      return
    }

    const success = await updateStock(variant.id, newQuantity, 'Manual update via size matrix')
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
    if (quantity === 0) return 'bg-red-50 text-red-800'
    if (quantity <= threshold) return 'bg-yellow-50 text-yellow-800'
    return 'bg-green-50 text-green-800'
  }

  const getStockIcon = (quantity: number, threshold: number) => {
    if (quantity === 0) return <Package className="h-3 w-3 text-red-500" />
    if (quantity <= threshold) return <AlertTriangle className="h-3 w-3 text-yellow-500" />
    return <Package className="h-3 w-3 text-green-500" />
  }

  // Group colors by common colors for suits/shirts
  const relevantColors = colors.filter(color => {
    const commonSuitColors = ['navy', 'black', 'charcoal-grey', 'light-grey', 'midnight-blue']
    const commonShirtColors = ['navy', 'black', 'white', 'light-grey']
    
    if (product.category.toLowerCase().includes('suit')) {
      return commonSuitColors.includes(color.color_code)
    }
    if (product.category.toLowerCase().includes('shirt')) {
      return commonShirtColors.includes(color.color_code)
    }
    return true
  }).slice(0, 6) // Limit to 6 colors for better display

  const pieceTypes = product.category.toLowerCase().includes('suit') 
    ? ['2-piece', '3-piece'] 
    : ['slim', 'classic']

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h4 className="text-lg font-semibold text-gray-900">Size Matrix - {product.name}</h4>
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

      {pieceTypes.map(pieceType => (
        <div key={pieceType} className="space-y-3">
          <h5 className="text-md font-medium text-gray-800 capitalize">{pieceType}</h5>
          
          <div className="overflow-x-auto">
            <table className="min-w-full border border-gray-200 rounded-lg">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                    Size
                  </th>
                  {relevantColors.map(color => (
                    <th key={color.id} className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-l border-gray-200">
                      <div className="flex flex-col items-center space-y-1">
                        <div 
                          className="w-4 h-4 rounded-full border border-gray-300"
                          style={{ backgroundColor: color.hex_value || '#6B7280' }}
                          title={color.color_name}
                        ></div>
                        <span className="text-xs">{color.color_name.split(' ')[0]}</span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white">
                {sizes.map(size => (
                  <tr key={size.id} className="hover:bg-gray-50">
                    <td className="px-3 py-2 text-sm font-medium text-gray-900 border-b border-gray-200">
                      {size.size_label}
                    </td>
                    {relevantColors.map(color => {
                      const variant = getVariant(size.id, color.id, pieceType)
                      const isEditing = editingCell === `${variant?.id}`
                      
                      return (
                        <td key={color.id} className="px-2 py-2 text-center border-b border-l border-gray-200">
                          {variant ? (
                            <div className="flex items-center justify-center">
                              {isEditing ? (
                                <div className="flex items-center space-x-1">
                                  <input
                                    type="number"
                                    min="0"
                                    value={editValue}
                                    onChange={(e) => setEditValue(e.target.value)}
                                    className="w-12 px-1 py-1 text-xs border border-blue-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
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
                                    <Check className="h-3 w-3" />
                                  </button>
                                  <button
                                    onClick={handleCancelEdit}
                                    className="text-red-600 hover:text-red-800"
                                  >
                                    <X className="h-3 w-3" />
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => handleCellEdit(variant)}
                                  className={`group relative px-2 py-1 rounded text-xs font-medium min-w-[2rem] ${getStockStatusClass(variant.stock_quantity, variant.low_stock_threshold)} hover:ring-2 hover:ring-blue-300`}
                                >
                                  <div className="flex items-center justify-center space-x-1">
                                    {getStockIcon(variant.stock_quantity, variant.low_stock_threshold)}
                                    <span>{variant.stock_quantity}</span>
                                  </div>
                                  <Edit2 className="absolute top-0 right-0 h-2 w-2 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                                </button>
                              )}
                            </div>
                          ) : (
                            <div className="text-gray-400 text-xs">-</div>
                          )}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-3">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}
    </div>
  )
}