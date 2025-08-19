import { useState } from 'react'
import { X, Plus } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useDefinitions } from '@/hooks/useInventory'

interface AddProductModalProps {
  onClose: () => void
  onAdd: () => void
}

type ProductCategory = 'suits' | 'shirts' | 'accessories'

export function AddProductModal({ onClose, onAdd }: AddProductModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    category: 'suits' as ProductCategory,
    subcategory: '',
    sku_prefix: '',
    base_price: '',
    description: '',
    requires_size: true,
    requires_color: true
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const { sizes, colors } = useDefinitions()

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // Auto-update requirements based on category
    if (field === 'category') {
      const newRequirements = {
        suits: { requires_size: true, requires_color: true },
        shirts: { requires_size: true, requires_color: true },
        accessories: { requires_size: false, requires_color: true }
      }
      
      setFormData(prev => ({
        ...prev,
        category: value,
        ...newRequirements[value as ProductCategory]
      }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      // Validate required fields
      if (!formData.name || !formData.sku_prefix || !formData.base_price) {
        throw new Error('Please fill in all required fields')
      }

      const price = parseFloat(formData.base_price)
      if (isNaN(price) || price <= 0) {
        throw new Error('Please enter a valid price')
      }

      // Create the product
      const { data: product, error: productError } = await supabase
        .from('inventory_products')
        .insert({
          name: formData.name,
          category: formData.category.charAt(0).toUpperCase() + formData.category.slice(1),
          subcategory: formData.subcategory || null,
          sku_prefix: formData.sku_prefix.toUpperCase(),
          base_price: price,
          description: formData.description || null,
          requires_size: formData.requires_size,
          requires_color: formData.requires_color,
          sizing_category: formData.requires_size ? formData.category : null,
          is_active: true
        })
        .select()
        .single()

      if (productError) throw productError

      // Generate basic variants based on product type
      if (formData.requires_size && formData.requires_color) {
        // Products that need both size and color (suits, shirts)
        await generateSizedVariants(product, formData.category)
      } else if (formData.requires_color) {
        // Products that only need color (accessories)
        await generateColorVariants(product)
      }

      onAdd()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create product')
    } finally {
      setLoading(false)
    }
  }

  const generateSizedVariants = async (product: any, category: string) => {
    const relevantSizes = sizes[category] || []
    const basicColors = colors.slice(0, 5) // Start with 5 basic colors
    const pieceTypes = category === 'suits' ? ['2-piece', '3-piece'] : ['slim', 'classic']

    const variants = []
    for (const color of basicColors) {
      for (const pieceType of pieceTypes) {
        for (const size of relevantSizes) {
          const sku = `${product.sku_prefix}-${color.color_code.toUpperCase()}-${size.size_code}-${pieceType.toUpperCase()}`
          const price = pieceType === '3-piece' ? product.base_price + 50 : product.base_price
          
          variants.push({
            product_id: product.id,
            size_id: size.id,
            color_id: color.id,
            piece_type: pieceType,
            sku,
            price,
            stock_quantity: 0,
            low_stock_threshold: 5,
            is_active: true
          })
        }
      }
    }

    if (variants.length > 0) {
      const { error: variantError } = await supabase
        .from('inventory_variants')
        .insert(variants)
      
      if (variantError) throw variantError
    }
  }

  const generateColorVariants = async (product: any) => {
    const basicColors = colors.slice(0, 10) // Start with 10 colors for accessories
    
    const variants = basicColors.map(color => ({
      product_id: product.id,
      size_id: null,
      color_id: color.id,
      piece_type: null,
      sku: `${product.sku_prefix}-${color.color_code.toUpperCase()}`,
      price: product.base_price,
      stock_quantity: 0,
      low_stock_threshold: 5,
      is_active: true
    }))

    if (variants.length > 0) {
      const { error: variantError } = await supabase
        .from('inventory_variants')
        .insert(variants)
      
      if (variantError) throw variantError
    }
  }

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Add New Product</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h4 className="text-md font-medium text-gray-900">Basic Information</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Product Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="Enter product name"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => handleInputChange('category', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="suits">Suits</option>
                    <option value="shirts">Shirts</option>
                    <option value="accessories">Accessories</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Subcategory
                  </label>
                  <input
                    type="text"
                    value={formData.subcategory}
                    onChange={(e) => handleInputChange('subcategory', e.target.value)}
                    placeholder="e.g., Business Suits, Dress Shirts"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    SKU Prefix *
                  </label>
                  <input
                    type="text"
                    value={formData.sku_prefix}
                    onChange={(e) => handleInputChange('sku_prefix', e.target.value.toUpperCase())}
                    placeholder="e.g., SUIT-NAV, SHIRT-SLM"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Base Price *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.base_price}
                    onChange={(e) => handleInputChange('base_price', e.target.value)}
                    placeholder="0.00"
                    className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Product description..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Product Requirements */}
            <div className="space-y-4">
              <h4 className="text-md font-medium text-gray-900">Product Requirements</h4>
              
              <div className="space-y-3">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="requires_size"
                    checked={formData.requires_size}
                    onChange={(e) => handleInputChange('requires_size', e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="requires_size" className="ml-2 text-sm text-gray-700">
                    Product requires sizing (suits, shirts)
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="requires_color"
                    checked={formData.requires_color}
                    onChange={(e) => handleInputChange('requires_color', e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="requires_color" className="ml-2 text-sm text-gray-700">
                    Product has color variants
                  </label>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                <p className="text-sm text-blue-800">
                  <strong>Note:</strong> Basic variants will be automatically created based on these settings.
                  You can add more variants and update stock quantities after creating the product.
                </p>
              </div>
            </div>
          </div>

          {error && (
            <div className="mt-4 bg-red-50 border border-red-200 rounded-md p-3">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || !formData.name || !formData.sku_prefix || !formData.base_price}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>{loading ? 'Creating...' : 'Create Product'}</span>
          </button>
        </div>
      </div>
    </div>
  )
}