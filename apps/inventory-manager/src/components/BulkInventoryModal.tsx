import { useState, useMemo } from 'react'
import { X, Upload, Download, Search, Filter } from 'lucide-react'
import { type EnhancedProduct } from '@/lib/supabase'
import { useStockUpdate } from '@/hooks/useInventory'

interface BulkInventoryModalProps {
  products: EnhancedProduct[]
  onClose: () => void
  onUpdate: () => void
}

type BulkOperation = 'set' | 'add' | 'subtract' | 'percentage'

interface BulkUpdate {
  variantId: number
  currentQuantity: number
  newQuantity: number
  productName: string
  variantSku: string
}

export function BulkInventoryModal({ products, onClose, onUpdate }: BulkInventoryModalProps) {
  const [operation, setOperation] = useState<BulkOperation>('set')
  const [value, setValue] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedVariants, setSelectedVariants] = useState<Set<number>>(new Set())
  const [previewUpdates, setPreviewUpdates] = useState<BulkUpdate[]>([])
  const [showPreview, setShowPreview] = useState(false)
  const { bulkUpdateStock, updating, error } = useStockUpdate()

  // Get all variants from products
  const allVariants = useMemo(() => {
    const variants: Array<{
      id: number
      productName: string
      sku: string
      stockQuantity: number
      lowStockThreshold: number
      category: string
      colorName?: string
      sizeName?: string
    }> = []

    products.forEach(product => {
      product.variants?.forEach(variant => {
        variants.push({
          id: variant.id,
          productName: product.name,
          sku: variant.sku,
          stockQuantity: variant.stock_quantity,
          lowStockThreshold: variant.low_stock_threshold,
          category: product.category
        })
      })
    })

    return variants
  }, [products])

  // Filter variants based on search and category
  const filteredVariants = useMemo(() => {
    return allVariants.filter(variant => {
      const matchesSearch = searchTerm === '' || 
        variant.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        variant.sku.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesCategory = selectedCategory === 'all' || 
        variant.category.toLowerCase().includes(selectedCategory.toLowerCase())

      return matchesSearch && matchesCategory
    })
  }, [allVariants, searchTerm, selectedCategory])

  const handleSelectAll = () => {
    if (selectedVariants.size === filteredVariants.length) {
      setSelectedVariants(new Set())
    } else {
      setSelectedVariants(new Set(filteredVariants.map(v => v.id)))
    }
  }

  const handleVariantSelect = (variantId: number) => {
    const newSelected = new Set(selectedVariants)
    if (newSelected.has(variantId)) {
      newSelected.delete(variantId)
    } else {
      newSelected.add(variantId)
    }
    setSelectedVariants(newSelected)
  }

  const calculateNewQuantity = (currentQuantity: number, operation: BulkOperation, value: string) => {
    const numValue = parseFloat(value)
    if (isNaN(numValue)) return currentQuantity

    switch (operation) {
      case 'set':
        return Math.max(0, Math.floor(numValue))
      case 'add':
        return Math.max(0, currentQuantity + Math.floor(numValue))
      case 'subtract':
        return Math.max(0, currentQuantity - Math.floor(numValue))
      case 'percentage':
        return Math.max(0, Math.floor(currentQuantity * (1 + numValue / 100)))
      default:
        return currentQuantity
    }
  }

  const handlePreview = () => {
    const updates: BulkUpdate[] = []
    
    selectedVariants.forEach(variantId => {
      const variant = allVariants.find(v => v.id === variantId)
      if (variant) {
        const newQuantity = calculateNewQuantity(variant.stockQuantity, operation, value)
        updates.push({
          variantId: variant.id,
          currentQuantity: variant.stockQuantity,
          newQuantity,
          productName: variant.productName,
          variantSku: variant.sku
        })
      }
    })

    setPreviewUpdates(updates)
    setShowPreview(true)
  }

  const handleApplyUpdates = async () => {
    const updates = previewUpdates.map(update => ({
      variantId: update.variantId,
      newQuantity: update.newQuantity,
      notes: `Bulk ${operation}: ${value}`
    }))

    const success = await bulkUpdateStock(updates)
    if (success) {
      onUpdate()
      onClose()
    }
  }

  const getOperationLabel = (op: BulkOperation) => {
    switch (op) {
      case 'set': return 'Set to'
      case 'add': return 'Add'
      case 'subtract': return 'Subtract'
      case 'percentage': return 'Adjust by %'
    }
  }

  const categories = ['all', 'suits', 'shirts', 'accessories']

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Bulk Inventory Update</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {!showPreview ? (
            <div className="space-y-6">
              {/* Operation Selection */}
              <div className="space-y-4">
                <h4 className="text-md font-medium text-gray-900">Select Operation</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {(['set', 'add', 'subtract', 'percentage'] as BulkOperation[]).map(op => (
                    <button
                      key={op}
                      onClick={() => setOperation(op)}
                      className={`p-3 rounded-lg border-2 text-sm font-medium transition-colors ${
                        operation === op
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      {getOperationLabel(op)}
                    </button>
                  ))}
                </div>
                
                <div className="flex items-center space-x-3">
                  <label className="text-sm font-medium text-gray-700">
                    {getOperationLabel(operation)}:
                  </label>
                  <input
                    type="number"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    placeholder={operation === 'percentage' ? 'Enter percentage' : 'Enter quantity'}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  {operation === 'percentage' && <span className="text-gray-500">%</span>}
                </div>
              </div>

              {/* Filters */}
              <div className="space-y-4">
                <h4 className="text-md font-medium text-gray-900">Filter Products</h4>
                <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search products or SKUs..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 pr-4 py-2 border border-gray-300 rounded-md w-full focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Filter className="h-4 w-4 text-gray-500" />
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {categories.map(category => (
                        <option key={category} value={category}>
                          {category === 'all' ? 'All Categories' : category.charAt(0).toUpperCase() + category.slice(1)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Variant Selection */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-md font-medium text-gray-900">Select Variants</h4>
                  <div className="flex items-center space-x-3">
                    <span className="text-sm text-gray-600">
                      {selectedVariants.size} of {filteredVariants.length} selected
                    </span>
                    <button
                      onClick={handleSelectAll}
                      className="text-sm font-medium text-blue-600 hover:text-blue-800"
                    >
                      {selectedVariants.size === filteredVariants.length ? 'Deselect All' : 'Select All'}
                    </button>
                  </div>
                </div>

                <div className="border border-gray-200 rounded-lg max-h-64 overflow-y-auto">
                  {filteredVariants.map(variant => (
                    <div
                      key={variant.id}
                      className="flex items-center justify-between p-3 border-b border-gray-100 last:border-b-0 hover:bg-gray-50"
                    >
                      <div className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          checked={selectedVariants.has(variant.id)}
                          onChange={() => handleVariantSelect(variant.id)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <div>
                          <p className="text-sm font-medium text-gray-900">{variant.productName}</p>
                          <p className="text-xs text-gray-500 font-mono">{variant.sku}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">{variant.stockQuantity} units</p>
                        <p className="text-xs text-gray-500">{variant.category}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* Preview */
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h4 className="text-md font-medium text-gray-900">Preview Changes</h4>
                <button
                  onClick={() => setShowPreview(false)}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  Back to Edit
                </button>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                <p className="text-sm text-blue-800">
                  <strong>Operation:</strong> {getOperationLabel(operation)} {value}{operation === 'percentage' ? '%' : ''}
                </p>
                <p className="text-sm text-blue-800">
                  <strong>Variants to update:</strong> {previewUpdates.length}
                </p>
              </div>

              <div className="border border-gray-200 rounded-lg max-h-64 overflow-y-auto">
                {previewUpdates.map(update => (
                  <div
                    key={update.variantId}
                    className="flex items-center justify-between p-3 border-b border-gray-100 last:border-b-0"
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-900">{update.productName}</p>
                      <p className="text-xs text-gray-500 font-mono">{update.variantSku}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm">
                        <span className="text-gray-600">{update.currentQuantity}</span>
                        <span className="mx-2 text-gray-400">→</span>
                        <span className={`font-medium ${
                          update.newQuantity > update.currentQuantity ? 'text-green-600' :
                          update.newQuantity < update.currentQuantity ? 'text-red-600' :
                          'text-gray-900'
                        }`}>
                          {update.newQuantity}
                        </span>
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {error && (
            <div className="mt-4 bg-red-50 border border-red-200 rounded-md p-3">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
          >
            Cancel
          </button>
          {!showPreview ? (
            <button
              onClick={handlePreview}
              disabled={selectedVariants.size === 0 || !value}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Preview Changes
            </button>
          ) : (
            <button
              onClick={handleApplyUpdates}
              disabled={updating || previewUpdates.length === 0}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {updating ? 'Updating...' : 'Apply Changes'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}