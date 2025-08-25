import { useState, useEffect } from 'react'
import { ArrowLeft, ArrowRight, X, Save, Package, Edit3, Palette, Ruler, Image, Tag, CheckCircle } from 'lucide-react'
import { supabase, type EnhancedProduct, type InventoryVariant } from '@/lib/supabase'
import { useDefinitions } from '@/hooks/useInventory'

interface EditProductModalProps {
  product: EnhancedProduct
  onClose: () => void
  onSave: () => void
}

type ProductCategory = 'suits' | 'shirts' | 'accessories'

interface EditProductFormData {
  name: string
  category: ProductCategory
  subcategory: string
  sku_prefix: string
  base_price: string
  description: string
  requires_size: boolean
  requires_color: boolean
  image_url?: string
}

const STEPS = [
  { id: 1, name: 'Basic Info', icon: Package },
  { id: 2, name: 'Variants', icon: Edit3 },
  { id: 3, name: 'Pricing', icon: Tag },
  { id: 4, name: 'Images', icon: Image },
  { id: 5, name: 'Review', icon: CheckCircle }
]

export function EditProductModal({ product, onClose, onSave }: EditProductModalProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState<EditProductFormData>({
    name: product.name,
    category: product.category.toLowerCase() as ProductCategory,
    subcategory: product.subcategory || '',
    sku_prefix: product.sku_prefix,
    base_price: product.base_price.toString(),
    description: product.description || '',
    requires_size: product.requires_size,
    requires_color: product.requires_color,
    image_url: product.image_url || ''
  })
  const [variants, setVariants] = useState<InventoryVariant[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  
  const { sizes, colors } = useDefinitions()

  // Load variants when component mounts
  useEffect(() => {
    loadVariants()
  }, [product.id])

  const loadVariants = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('inventory_variants')
        .select('*')
        .eq('product_id', product.id)
        .eq('is_active', true)
        .order('sku', { ascending: true })

      if (error) throw error
      setVariants(data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load variants')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: keyof EditProductFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setError(null)
    
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

  const handleVariantUpdate = async (variantId: number, field: string, value: any) => {
    try {
      const { error } = await supabase
        .from('inventory_variants')
        .update({ [field]: value })
        .eq('id', variantId)

      if (error) throw error

      // Update local state
      setVariants(prev => prev.map(variant => 
        variant.id === variantId ? { ...variant, [field]: value } : variant
      ))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update variant')
    }
  }

  const nextStep = () => {
    if (currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSave = async () => {
    if (!validateCurrentStep()) return
    
    try {
      setSaving(true)
      setError(null)

      // Validate required fields
      if (!formData.name || !formData.sku_prefix || !formData.base_price) {
        throw new Error('Please fill in all required fields')
      }

      const price = parseFloat(formData.base_price)
      if (isNaN(price) || price <= 0) {
        throw new Error('Please enter a valid price')
      }

      // Update the product
      const { error: productError } = await supabase
        .from('inventory_products')
        .update({
          name: formData.name,
          category: formData.category.charAt(0).toUpperCase() + formData.category.slice(1),
          subcategory: formData.subcategory || null,
          sku_prefix: formData.sku_prefix.toUpperCase(),
          base_price: price,
          description: formData.description || null,
          requires_size: formData.requires_size,
          requires_color: formData.requires_color,
          sizing_category: formData.requires_size ? formData.category : null,
          image_url: formData.image_url || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', product.id)

      if (productError) throw productError

      onSave()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save product')
    } finally {
      setSaving(false)
    }
  }

  const validateCurrentStep = (): boolean => {
    switch (currentStep) {
      case 1:
        if (!formData.name || !formData.sku_prefix || !formData.base_price) {
          setError('Please fill in all required fields')
          return false
        }
        const price = parseFloat(formData.base_price)
        if (isNaN(price) || price <= 0) {
          setError('Please enter a valid price')
          return false
        }
        break
    }
    setError(null)
    return true
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <h4 className="text-lg font-medium text-gray-900 flex items-center">
              <Package className="h-5 w-5 mr-2 text-blue-600" />
              Basic Information
            </h4>
            
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
                  placeholder="e.g., BS001"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Base Price *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                  <input
                    type="number"
                    value={formData.base_price}
                    onChange={(e) => handleInputChange('base_price', e.target.value)}
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                    className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Enter product description"
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="requires_size"
                  checked={formData.requires_size}
                  onChange={(e) => handleInputChange('requires_size', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="requires_size" className="ml-2 block text-sm text-gray-900">
                  Requires Size Selection
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
                <label htmlFor="requires_color" className="ml-2 block text-sm text-gray-900">
                  Requires Color Selection
                </label>
              </div>
            </div>
          </div>
        )

      case 2:
        return (
          <div className="space-y-6">
            <h4 className="text-lg font-medium text-gray-900 flex items-center">
              <Edit3 className="h-5 w-5 mr-2 text-green-600" />
              Product Variants
            </h4>
            
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <div className="max-h-96 overflow-y-auto">
                <div className="space-y-3">
                  {variants.map((variant) => (
                    <div key={variant.id} className="bg-gray-50 p-4 rounded-lg">
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            SKU
                          </label>
                          <input
                            type="text"
                            value={variant.sku}
                            onChange={(e) => handleVariantUpdate(variant.id, 'sku', e.target.value)}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Price ($)
                          </label>
                          <input
                            type="number"
                            value={variant.price}
                            onChange={(e) => handleVariantUpdate(variant.id, 'price', parseFloat(e.target.value) || 0)}
                            step="0.01"
                            min="0"
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Stock
                          </label>
                          <input
                            type="number"
                            value={variant.stock_quantity}
                            onChange={(e) => handleVariantUpdate(variant.id, 'stock_quantity', parseInt(e.target.value) || 0)}
                            min="0"
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Low Stock Alert
                          </label>
                          <input
                            type="number"
                            value={variant.low_stock_threshold}
                            onChange={(e) => handleVariantUpdate(variant.id, 'low_stock_threshold', parseInt(e.target.value) || 0)}
                            min="0"
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                      {variant.piece_type && (
                        <div className="mt-2">
                          <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                            {variant.piece_type}
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )

      case 3:
        return (
          <div className="space-y-6">
            <h4 className="text-lg font-medium text-gray-900 flex items-center">
              <Tag className="h-5 w-5 mr-2 text-purple-600" />
              Pricing Strategy
            </h4>
            
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-medium text-gray-700">Base Price</span>
                <span className="text-lg font-bold text-blue-600">${formData.base_price}</span>
              </div>
              
              <div className="text-sm text-gray-600">
                <p>• Base price applies to all standard variants</p>
                <p>• 3-piece suits automatically get +$50 premium</p>
                <p>• Premium materials may have additional charges</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h5 className="font-medium text-gray-900 mb-3">Pricing Tiers</h5>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Standard (2-piece)</span>
                    <span>${formData.base_price}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Premium (3-piece)</span>
                    <span>${(parseFloat(formData.base_price) + 50).toFixed(2)}</span>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg">
                <h5 className="font-medium text-gray-900 mb-3">Variant Count</h5>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Total Variants</span>
                    <span>{variants.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>In Stock</span>
                    <span>{variants.filter(v => v.stock_quantity > 0).length}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )

      case 4:
        return (
          <div className="space-y-6">
            <h4 className="text-lg font-medium text-gray-900 flex items-center">
              <Image className="h-5 w-5 mr-2 text-orange-600" />
              Images & Media
            </h4>
            
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              {formData.image_url ? (
                <div className="space-y-4">
                  <img 
                    src={formData.image_url} 
                    alt={formData.name} 
                    className="mx-auto h-32 w-32 object-cover rounded-lg"
                  />
                  <div>
                    <input
                      type="url"
                      value={formData.image_url}
                      onChange={(e) => handleInputChange('image_url', e.target.value)}
                      placeholder="Enter image URL"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleInputChange('image_url', '')}
                    className="text-red-600 hover:text-red-800 text-sm"
                  >
                    Remove Image
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <Image className="mx-auto h-12 w-12 text-gray-400" />
                  <div>
                    <h5 className="text-lg font-medium text-gray-900">Add Product Image</h5>
                    <p className="text-gray-500">Enter an image URL to display your product</p>
                  </div>
                  <div>
                    <input
                      type="url"
                      value={formData.image_url || ''}
                      onChange={(e) => handleInputChange('image_url', e.target.value)}
                      placeholder="Enter image URL"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              )}
            </div>
            
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <Image className="h-5 w-5 text-yellow-400" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800">Image Guidelines</h3>
                  <div className="mt-2 text-sm text-yellow-700">
                    <ul className="list-disc pl-5 space-y-1">
                      <li>Use high-quality images (minimum 800x800 pixels)</li>
                      <li>Ensure consistent lighting and background</li>
                      <li>Images should be in JPEG, PNG, or WebP format</li>
                      <li>Keep file sizes under 2MB for optimal loading</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )

      case 5:
        return (
          <div className="space-y-6">
            <h4 className="text-lg font-medium text-gray-900 flex items-center">
              <CheckCircle className="h-5 w-5 mr-2 text-green-600" />
              Review & Save
            </h4>
            
            <div className="bg-gray-50 rounded-lg p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h5 className="font-medium text-gray-900 mb-3">Product Information</h5>
                  <dl className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <dt className="text-gray-600">Name:</dt>
                      <dd className="font-medium">{formData.name}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-600">Category:</dt>
                      <dd className="font-medium capitalize">{formData.category}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-600">SKU Prefix:</dt>
                      <dd className="font-medium">{formData.sku_prefix}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-600">Base Price:</dt>
                      <dd className="font-medium">${formData.base_price}</dd>
                    </div>
                  </dl>
                </div>
                
                <div>
                  <h5 className="font-medium text-gray-900 mb-3">Configuration</h5>
                  <dl className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <dt className="text-gray-600">Requires Size:</dt>
                      <dd className={`font-medium ${formData.requires_size ? 'text-green-600' : 'text-gray-400'}`}>
                        {formData.requires_size ? 'Yes' : 'No'}
                      </dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-600">Requires Color:</dt>
                      <dd className={`font-medium ${formData.requires_color ? 'text-green-600' : 'text-gray-400'}`}>
                        {formData.requires_color ? 'Yes' : 'No'}
                      </dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-600">Total Variants:</dt>
                      <dd className="font-medium">{variants.length}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-600">In Stock Variants:</dt>
                      <dd className="font-medium">{variants.filter(v => v.stock_quantity > 0).length}</dd>
                    </div>
                  </dl>
                </div>
              </div>
              
              {formData.description && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h5 className="font-medium text-gray-900 mb-2">Description</h5>
                  <p className="text-sm text-gray-600">{formData.description}</p>
                </div>
              )}
            </div>
            
            <div className="bg-green-50 border border-green-200 rounded-md p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <CheckCircle className="h-5 w-5 text-green-400" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-green-800">Ready to Save</h3>
                  <div className="mt-2 text-sm text-green-700">
                    <p>All product information has been configured. Click 'Save Changes' to update the product.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h3 className="text-xl font-semibold text-gray-900">Edit Product</h3>
            <p className="text-sm text-gray-600 mt-1">Modify product information and settings</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Step Navigation */}
        <div className="px-6 py-4 border-b border-gray-200">
          <nav className="flex justify-center">
            <ol className="flex items-center space-x-8">
              {STEPS.map((step) => {
                const Icon = step.icon
                const isActive = step.id === currentStep
                const isCompleted = step.id < currentStep
                
                return (
                  <li key={step.id} className="flex items-center">
                    <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
                      isActive 
                        ? 'border-blue-600 bg-blue-600 text-white' 
                        : isCompleted 
                          ? 'border-green-500 bg-green-500 text-white'
                          : 'border-gray-300 bg-white text-gray-500'
                    }`}>
                      {isCompleted ? (
                        <CheckCircle className="h-5 w-5" />
                      ) : (
                        <Icon className="h-4 w-4" />
                      )}
                    </div>
                    <span className={`ml-2 text-sm font-medium ${
                      isActive ? 'text-blue-600' : isCompleted ? 'text-green-600' : 'text-gray-500'
                    }`}>
                      {step.name}
                    </span>
                  </li>
                )
              })}
            </ol>
          </nav>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mx-6 mt-4 bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex items-center">
              <X className="h-5 w-5 text-red-400 mr-2" />
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          </div>
        )}

        {/* Step Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-300px)]">
          {renderStepContent()}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200">
          <button
            onClick={prevStep}
            disabled={currentStep === 1}
            className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Previous
          </button>
          
          <span className="text-sm text-gray-500">
            Step {currentStep} of {STEPS.length}
          </span>
          
          {currentStep < STEPS.length ? (
            <button
              onClick={nextStep}
              disabled={!validateCurrentStep()}
              className="flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
              <ArrowRight className="h-4 w-4 ml-2" />
            </button>
          ) : (
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}