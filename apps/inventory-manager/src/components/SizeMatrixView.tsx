import React, { useState, useMemo } from 'react'
import { Edit2, Save, X, AlertTriangle } from 'lucide-react'
import type { EnhancedVariant as EnhancedProductVariant, InventoryProduct as Product } from '@/lib/supabase'

interface SizeMatrixViewProps {
  product: Product
  variants: EnhancedProductVariant[]
  onUpdateVariant: (variantId: string, updates: any) => void
}

export function SizeMatrixView({ product, variants, onUpdateVariant }: SizeMatrixViewProps) {
  const [editingCell, setEditingCell] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')

  // Group variants by type and organize by size/color matrix
  const variantMatrix = useMemo(() => {
    const byType = new Map<string, EnhancedProductVariant[]>()
    variants.forEach(variant => {
      const type = variant.piece_type || 'standard'
      if (!byType.has(type)) {
        byType.set(type, [])
      }
      byType.get(type)!.push(variant)
    })
    
    // For each type, create a matrix
    const matrices = new Map()
    byType.forEach((typeVariants, type) => {
      const sizes = [...new Set(typeVariants.map(v => v.size?.size_label || 'One Size'))].sort()
      const colors = [...new Set(typeVariants.map(v => v.color?.color_name || ''))].filter(c => c).sort()
      
      const matrix = new Map()
      typeVariants.forEach(variant => {
        const key = `${variant.color?.color_name || 'N/A'}-${variant.size?.size_label || 'One Size'}`
        matrix.set(key, variant)
      })
      
      matrices.set(type, { sizes, colors, matrix })
    })
    
    return matrices
  }, [variants])

  const getVariantTypeLabel = (type: string) => {
    if (type === 'standard') return 'Standard Variants'
    return type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
  }

  const getStockStatusClass = (status: string | undefined) => {
    switch (status) {
      case 'in_stock': return 'bg-green-100 text-green-800 border-green-200'
      case 'low_stock': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'out_of_stock': return 'bg-red-100 text-red-800 border-red-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const handleCellEdit = (variant: EnhancedProductVariant) => {
    setEditingCell(variant.id.toString())
    setEditValue(variant.stock_quantity?.toString() || '0')
  }

  const handleSaveEdit = async (variant: EnhancedProductVariant) => {
    const newQuantity = parseInt(editValue) || 0
    await onUpdateVariant(variant.id.toString(), {
      stock_quantity: newQuantity
    })
    setEditingCell(null)
    setEditValue('')
  }

  const handleCancelEdit = () => {
    setEditingCell(null)
    setEditValue('')
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">{product.name}</h3>
        <p className="text-sm text-gray-600">{product.category} • SKU: {product.sku_prefix}</p>
      </div>
      
      <div className="p-6 space-y-8">
        {Array.from(variantMatrix.entries()).map(([variantType, { sizes, colors, matrix }]) => (
          <div key={variantType}>
            <h4 className="text-md font-medium text-gray-900 mb-4">
              {getVariantTypeLabel(variantType)}
            </h4>
            
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Color \ {sizes.length > 1 ? 'Size' : ''}
                    </th>
                    {sizes.map(size => (
                      <th key={size} className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {size}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {colors.map(color => (
                    <tr key={color}>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-900">{color}</span>
                        </div>
                      </td>
                      {sizes.map(size => {
                        const key = `${color}-${size}`
                        const variant = matrix.get(key)
                        
                        if (!variant) {
                          return (
                            <td key={size} className="px-3 py-2 text-center">
                              <div className="w-16 h-12 bg-gray-50 border border-gray-200 rounded flex items-center justify-center">
                                <span className="text-xs text-gray-400">N/A</span>
                              </div>
                            </td>
                          )
                        }
                        
                        return (
                          <td key={size} className="px-3 py-2 text-center">
                            <div className={`w-16 h-12 border rounded flex flex-col items-center justify-center cursor-pointer hover:shadow-md transition-shadow ${
                              getStockStatusClass(variant.stock_status)
                            }`}>
                              {editingCell === variant.id.toString() ? (
                                <div className="flex items-center gap-1">
                                  <input
                                    type="number"
                                    value={editValue}
                                    onChange={(e) => setEditValue(e.target.value)}
                                    className="w-8 h-6 text-xs text-center border border-gray-300 rounded"
                                    min="0"
                                    autoFocus
                                  />
                                  <div className="flex flex-col gap-1">
                                    <button
                                      onClick={() => handleSaveEdit(variant)}
                                      className="text-green-600 hover:text-green-800"
                                    >
                                      <Save className="h-3 w-3" />
                                    </button>
                                    <button
                                      onClick={handleCancelEdit}
                                      className="text-red-600 hover:text-red-800"
                                    >
                                      <X className="h-3 w-3" />
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <div
                                  onClick={() => handleCellEdit(variant)}
                                  className="w-full h-full flex flex-col items-center justify-center group"
                                >
                                  <span className="text-sm font-bold">{variant.stock_quantity}</span>
                                  {variant.stock_quantity !== undefined && variant.stock_quantity <= variant.low_stock_threshold && (
                                    <AlertTriangle className="h-3 w-3 text-yellow-600" />
                                  )}
                                  <Edit2 className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>
                              )}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              ${variant.price.toFixed(0)}
                            </div>
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* Legend */}
            <div className="mt-4 flex items-center gap-4 text-xs text-gray-600">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-green-100 border border-green-200 rounded"></div>
                <span>In Stock</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-yellow-100 border border-yellow-200 rounded"></div>
                <span>Low Stock</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-red-100 border border-red-200 rounded"></div>
                <span>Out of Stock</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}