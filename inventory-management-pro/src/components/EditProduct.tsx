import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'
import {
  ArrowLeft,
  ArrowRight,
  Save,
  X,
  Package,
  Info,
  Palette,
  DollarSign,
  Search,
  Tag,
  Upload,
  Plus,
  Trash2,
  Image as ImageIcon,
  AlertTriangle
} from 'lucide-react'
import { productQueries, variantQueries } from '../lib/queries'
import { Product, ProductVariant, supabase } from '../lib/supabase'
import ImageUpload from './ImageUpload'
import analytics from '../lib/analytics'

interface ProductFormData {
  // Basic Info
  name: string
  description: string
  category: string
  subcategory: string
  sku: string
  vendor: string
  product_type: string
  
  // Pricing
  base_price: number
  
  // Variants (for display, actual variants managed separately)
  variants: Array<{
    id?: string
    variant_type: string
    color: string
    size: string
    sku: string
    price_cents: number
    compare_at_price_cents?: number
    inventory_quantity: number
    low_stock_threshold: number
  }>
  
  // Settings
  status: string
  visibility: boolean
  featured: boolean
  requires_shipping: boolean
  taxable: boolean
  track_inventory: boolean
  weight: number
  
  // SEO
  meta_title: string
  meta_description: string
  seo_title: string
  seo_description: string
  search_keywords: string
  
  // Images & Media
  primary_image: string
  image_gallery: string[]
  
  // Additional
  tags: string[]
  additional_info: any
}

const EditProduct: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    description: '',
    category: '',
    subcategory: '',
    sku: '',
    vendor: 'KCT Menswear',
    product_type: 'Formal Accessories',
    base_price: 0,
    variants: [],
    status: 'draft',
    visibility: true,
    featured: false,
    requires_shipping: true,
    taxable: true,
    track_inventory: true,
    weight: 0,
    meta_title: '',
    meta_description: '',
    seo_title: '',
    seo_description: '',
    search_keywords: '',
    primary_image: '',
    image_gallery: [],
    tags: [],
    additional_info: {}
  })
  const [newTag, setNewTag] = useState('')
  const [variantsToDelete, setVariantsToDelete] = useState<string[]>([])

  // Fetch current product data
  const { data: product, isLoading, error } = useQuery({
    queryKey: ['product', id],
    queryFn: () => productQueries.getProduct(id!),
    enabled: !!id
  })

  // Fetch categories for dropdown
  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: productQueries.getCategories
  })

  // Initialize form data when product loads
  useEffect(() => {
    if (product) {
      // Track product edit start
      analytics.trackProductEdit(id!, product.name)
      analytics.trackPageView({
        page_path: `/products/${id}/edit`,
        page_title: `Edit Product: ${product.name}`
      })

      setFormData({
        name: product.name || '',
        description: product.description || '',
        category: product.category || '',
        subcategory: product.subcategory || '',
        sku: product.sku || '',
        vendor: product.vendor || 'KCT Menswear',
        product_type: product.product_type || 'Formal Accessories',
        base_price: (product.base_price || 0) / 100, // Convert from cents
        variants: (product.variants || []).map(v => ({
          id: v.id,
          variant_type: v.variant_type || 'standard',
          color: v.color || '',
          size: v.size || '',
          sku: v.sku || '',
          price_cents: v.price_cents || 0,
          compare_at_price_cents: v.compare_at_price_cents || 0,
          inventory_quantity: v.inventory_quantity || 0,
          low_stock_threshold: v.low_stock_threshold || 5
        })),
        status: product.status || 'draft',
        visibility: product.visibility !== false,
        featured: product.featured === true,
        requires_shipping: product.requires_shipping !== false,
        taxable: product.taxable !== false,
        track_inventory: product.track_inventory !== false,
        weight: product.weight || 0,
        meta_title: product.meta_title || '',
        meta_description: product.meta_description || '',
        seo_title: product.seo_title || '',
        seo_description: product.seo_description || '',
        search_keywords: product.search_keywords || '',
        primary_image: product.primary_image || '',
        image_gallery: product.image_gallery || [],
        tags: product.tags || [],
        additional_info: product.additional_info || {}
      })
    }
  }, [product])

  const updateProductMutation = useMutation({
    mutationFn: async (data: ProductFormData) => {
      // Update product first
      const productData = {
        name: data.name,
        description: data.description,
        category: data.category,
        subcategory: data.subcategory || null,
        sku: data.sku,
        vendor: data.vendor,
        product_type: data.product_type,
        base_price: Math.round(data.base_price * 100), // Convert to cents
        status: data.status,
        visibility: data.visibility,
        featured: data.featured,
        requires_shipping: data.requires_shipping,
        taxable: data.taxable,
        track_inventory: data.track_inventory,
        weight: data.weight,
        meta_title: data.meta_title,
        meta_description: data.meta_description,
        seo_title: data.seo_title,
        seo_description: data.seo_description,
        search_keywords: data.search_keywords,
        primary_image: data.primary_image || null,
        image_gallery: data.image_gallery,
        tags: data.tags,
        additional_info: data.additional_info,
        variant_count: data.variants.length,
        total_inventory: data.variants.reduce((sum, v) => sum + v.inventory_quantity, 0),
        in_stock: data.variants.some(v => v.inventory_quantity > 0),
        updated_at: new Date().toISOString()
      }
      
      const updatedProduct = await productQueries.updateProduct(id!, productData)
      
      // Handle variant updates
      const existingVariantIds = (product?.variants || []).map(v => v.id)
      const currentVariantIds = data.variants.filter(v => v.id).map(v => v.id!)
      
      // Delete removed variants
      const variantsToRemove = existingVariantIds.filter(id => !currentVariantIds.includes(id))
      for (const variantId of [...variantsToRemove, ...variantsToDelete]) {
        await variantQueries.deleteVariant(variantId)
      }
      
      // Update or create variants
      for (const variant of data.variants) {
        const variantData = {
          product_id: id!,
          variant_type: variant.variant_type,
          color: variant.color,
          size: variant.size || null,
          sku: variant.sku,
          price_cents: variant.price_cents,
          compare_at_price_cents: variant.compare_at_price_cents || null,
          inventory_quantity: variant.inventory_quantity,
          available_quantity: variant.inventory_quantity,
          low_stock_threshold: variant.low_stock_threshold,
          stock_status: variant.inventory_quantity > variant.low_stock_threshold ? 'in_stock' : 
                      variant.inventory_quantity > 0 ? 'low_stock' : 'out_of_stock',
          updated_at: new Date().toISOString()
        }
        
        if (variant.id) {
          // Update existing variant
          await variantQueries.updateVariant(variant.id, variantData)
        } else {
          // Create new variant
          await variantQueries.createVariant(variantData)
        }
      }
      
      return updatedProduct
    },
    onSuccess: (product) => {
      // Track successful product update
      analytics.trackProductUpdate(id!, {
        name: formData.name,
        category: formData.category,
        status: formData.status,
        variant_count: formData.variants.length
      })
      
      toast.success('Product updated successfully!')
      queryClient.invalidateQueries({ queryKey: ['products'] })
      queryClient.invalidateQueries({ queryKey: ['product', id] })
      navigate(`/products/${product.id}`)
    },
    onError: (error: any) => {
      toast.error(`Failed to update product: ${error.message}`)
    }
  })

  const updateFormData = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const addVariant = () => {
    const newVariant = {
      variant_type: 'standard',
      color: '',
      size: '',
      sku: `${formData.sku}-${formData.variants.length + 1}`,
      price_cents: Math.round(formData.base_price * 100),
      compare_at_price_cents: 0,
      inventory_quantity: 0,
      low_stock_threshold: 5
    }
    setFormData(prev => ({
      ...prev,
      variants: [...prev.variants, newVariant]
    }))
  }

  const updateVariant = (index: number, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      variants: prev.variants.map((variant, i) => 
        i === index ? { ...variant, [field]: value } : variant
      )
    }))
  }

  const removeVariant = (index: number) => {
    const variant = formData.variants[index]
    if (variant.id) {
      setVariantsToDelete(prev => [...prev, variant.id!])
    }
    setFormData(prev => ({
      ...prev,
      variants: prev.variants.filter((_, i) => i !== index)
    }))
  }

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }))
      setNewTag('')
    }
  }

  const removeTag = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag)
    }))
  }

  const handleImageUploaded = (imageUrl: string) => {
    updateFormData('primary_image', imageUrl)
  }

  const handleGalleryImageUploaded = (imageUrl: string) => {
    if (imageUrl) {
      setFormData(prev => ({
        ...prev,
        image_gallery: [...prev.image_gallery, imageUrl]
      }))
    }
  }

  const removeGalleryImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      image_gallery: prev.image_gallery.filter((_, i) => i !== index)
    }))
  }

  const nextStep = () => {
    setCurrentStep(prev => Math.min(prev + 1, 5))
  }

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1))
  }

  const handleSubmit = () => {
    // Validation
    if (!formData.name || !formData.category || !formData.sku) {
      toast.error('Please fill in all required fields')
      setCurrentStep(1)
      return
    }
    
    updateProductMutation.mutate(formData)
  }

  const steps = [
    { id: 1, name: 'Basic Info', icon: Info },
    { id: 2, name: 'Variants', icon: Palette },
    { id: 3, name: 'Pricing & Inventory', icon: DollarSign },
    { id: 4, name: 'Images & Media', icon: ImageIcon },
    { id: 5, name: 'SEO & Settings', icon: Search }
  ]

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Product not found</h3>
          <p className="text-gray-500 mb-4">The product you're trying to edit doesn't exist.</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate(`/products/${id}`)}
                className="text-gray-600 hover:text-gray-900 p-2 rounded-lg hover:bg-gray-100"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <Package className="h-8 w-8 text-indigo-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Edit Product</h1>
                <p className="text-sm text-gray-500">Modify {product.name}</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate(`/products/${id}`)}
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={updateProductMutation.isPending}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                {updateProductMutation.isPending ? 'Updating...' : 'Update Product'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="lg:grid lg:grid-cols-12 lg:gap-x-5">
          {/* Step Navigation */}
          <aside className="py-6 px-2 sm:px-6 lg:py-0 lg:px-0 lg:col-span-3">
            <nav className="space-y-1">
              {steps.map((step) => {
                const Icon = step.icon
                const isActive = currentStep === step.id
                const isCompleted = currentStep > step.id
                
                return (
                  <button
                    key={step.id}
                    onClick={() => setCurrentStep(step.id)}
                    className={`group rounded-md px-3 py-2 flex items-center text-sm font-medium w-full ${
                      isActive
                        ? 'bg-indigo-50 text-indigo-700 border-indigo-500'
                        : isCompleted
                        ? 'text-green-700 hover:text-green-700 hover:bg-green-50'
                        : 'text-gray-900 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    <Icon
                      className={`flex-shrink-0 -ml-1 mr-3 h-5 w-5 ${
                        isActive
                          ? 'text-indigo-500'
                          : isCompleted
                          ? 'text-green-500'
                          : 'text-gray-400 group-hover:text-gray-500'
                      }`}
                    />
                    <span className="truncate">{step.name}</span>
                  </button>
                )
              })}
            </nav>
          </aside>

          {/* Main Content */}
          <div className="space-y-6 sm:px-6 lg:px-0 lg:col-span-9">
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  {steps.find(s => s.id === currentStep)?.name}
                </h3>
              </div>
              
              <div className="px-6 py-6">
                {/* Step 1: Basic Info */}
                {currentStep === 1 && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Product Name *
                        </label>
                        <input
                          type="text"
                          value={formData.name}
                          onChange={(e) => updateFormData('name', e.target.value)}
                          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                          placeholder="Enter product name"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          SKU *
                        </label>
                        <input
                          type="text"
                          value={formData.sku}
                          onChange={(e) => updateFormData('sku', e.target.value)}
                          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                          placeholder="Enter SKU"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Description
                      </label>
                      <textarea
                        rows={4}
                        value={formData.description}
                        onChange={(e) => updateFormData('description', e.target.value)}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="Enter product description"
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Category *
                        </label>
                        <select
                          value={formData.category}
                          onChange={(e) => updateFormData('category', e.target.value)}
                          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                        >
                          <option value="">Select category</option>
                          {categoriesData?.categories.map(category => (
                            <option key={category} value={category}>{category}</option>
                          ))}
                          <option value="Suits">Suits</option>
                          <option value="Shirts">Shirts</option>
                          <option value="Accessories">Accessories</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Subcategory
                        </label>
                        <input
                          type="text"
                          value={formData.subcategory}
                          onChange={(e) => updateFormData('subcategory', e.target.value)}
                          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                          placeholder="Enter subcategory"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Product Type
                        </label>
                        <select
                          value={formData.product_type}
                          onChange={(e) => updateFormData('product_type', e.target.value)}
                          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                        >
                          <option value="Formal Accessories">Formal Accessories</option>
                          <option value="Shirt">Shirt</option>
                          <option value="Suit">Suit</option>
                          <option value="Accessory">Accessory</option>
                        </select>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Vendor
                        </label>
                        <input
                          type="text"
                          value={formData.vendor}
                          onChange={(e) => updateFormData('vendor', e.target.value)}
                          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Weight (grams)
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={formData.weight}
                          onChange={(e) => updateFormData('weight', parseInt(e.target.value) || 0)}
                          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 2: Variants */}
                {currentStep === 2 && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-lg font-medium text-gray-900">Product Variants</h4>
                        <p className="text-sm text-gray-500">Manage different variations of your product</p>
                      </div>
                      <button
                        onClick={addVariant}
                        className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Variant
                      </button>
                    </div>
                    
                    {formData.variants.length === 0 ? (
                      <div className="text-center py-12">
                        <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-sm font-medium text-gray-900 mb-2">No variants yet</h3>
                        <p className="text-sm text-gray-500 mb-4">Create variants for different sizes, colors, or styles</p>
                        <button
                          onClick={addVariant}
                          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add First Variant
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {formData.variants.map((variant, index) => (
                          <div key={index} className="border border-gray-200 rounded-lg p-4">
                            <div className="flex items-center justify-between mb-4">
                              <h5 className="text-sm font-medium text-gray-900">
                                Variant {index + 1} {variant.id && <span className="text-xs text-gray-500">(ID: {variant.id})</span>}
                              </h5>
                              <button
                                onClick={() => removeVariant(index)}
                                className="text-red-600 hover:text-red-700 p-1 rounded"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
                              <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">
                                  Color
                                </label>
                                <input
                                  type="text"
                                  value={variant.color}
                                  onChange={(e) => updateVariant(index, 'color', e.target.value)}
                                  className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                                  placeholder="Color"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">
                                  Size
                                </label>
                                <input
                                  type="text"
                                  value={variant.size}
                                  onChange={(e) => updateVariant(index, 'size', e.target.value)}
                                  className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                                  placeholder="Size"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">
                                  SKU
                                </label>
                                <input
                                  type="text"
                                  value={variant.sku}
                                  onChange={(e) => updateVariant(index, 'sku', e.target.value)}
                                  className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                                  placeholder="Variant SKU"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">
                                  Inventory
                                </label>
                                <input
                                  type="number"
                                  min="0"
                                  value={variant.inventory_quantity}
                                  onChange={(e) => updateVariant(index, 'inventory_quantity', parseInt(e.target.value) || 0)}
                                  className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                                  placeholder="Qty"
                                />
                              </div>
                            </div>
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 mt-4">
                              <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">
                                  Price (cents)
                                </label>
                                <input
                                  type="number"
                                  min="0"
                                  value={variant.price_cents}
                                  onChange={(e) => updateVariant(index, 'price_cents', parseInt(e.target.value) || 0)}
                                  className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                                  placeholder="Price in cents"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">
                                  Compare Price (cents)
                                </label>
                                <input
                                  type="number"
                                  min="0"
                                  value={variant.compare_at_price_cents || ''}
                                  onChange={(e) => updateVariant(index, 'compare_at_price_cents', parseInt(e.target.value) || 0)}
                                  className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                                  placeholder="Compare price"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">
                                  Low Stock Threshold
                                </label>
                                <input
                                  type="number"
                                  min="0"
                                  value={variant.low_stock_threshold}
                                  onChange={(e) => updateVariant(index, 'low_stock_threshold', parseInt(e.target.value) || 5)}
                                  className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                                  placeholder="Low stock alert"
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Step 3: Pricing & Inventory */}
                {currentStep === 3 && (
                  <div className="space-y-6">
                    <div>
                      <h4 className="text-lg font-medium text-gray-900 mb-4">Pricing & Inventory</h4>
                      
                      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Base Price ($)
                          </label>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={formData.base_price}
                            onChange={(e) => updateFormData('base_price', parseFloat(e.target.value) || 0)}
                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                            placeholder="0.00"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Status
                          </label>
                          <select
                            value={formData.status}
                            onChange={(e) => updateFormData('status', e.target.value)}
                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                          >
                            <option value="draft">Draft</option>
                            <option value="active">Active</option>
                            <option value="archived">Archived</option>
                          </select>
                        </div>
                      </div>
                      
                      <div className="mt-6">
                        <h5 className="text-sm font-medium text-gray-900 mb-3">Product Settings</h5>
                        <div className="space-y-3">
                          <div className="flex items-center">
                            <input
                              type="checkbox"
                              id="visibility"
                              checked={formData.visibility}
                              onChange={(e) => updateFormData('visibility', e.target.checked)}
                              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                            />
                            <label htmlFor="visibility" className="ml-2 text-sm text-gray-700">
                              Product is visible to customers
                            </label>
                          </div>
                          
                          <div className="flex items-center">
                            <input
                              type="checkbox"
                              id="featured"
                              checked={formData.featured}
                              onChange={(e) => updateFormData('featured', e.target.checked)}
                              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                            />
                            <label htmlFor="featured" className="ml-2 text-sm text-gray-700">
                              Featured product
                            </label>
                          </div>
                          
                          <div className="flex items-center">
                            <input
                              type="checkbox"
                              id="requires_shipping"
                              checked={formData.requires_shipping}
                              onChange={(e) => updateFormData('requires_shipping', e.target.checked)}
                              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                            />
                            <label htmlFor="requires_shipping" className="ml-2 text-sm text-gray-700">
                              Requires shipping
                            </label>
                          </div>
                          
                          <div className="flex items-center">
                            <input
                              type="checkbox"
                              id="taxable"
                              checked={formData.taxable}
                              onChange={(e) => updateFormData('taxable', e.target.checked)}
                              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                            />
                            <label htmlFor="taxable" className="ml-2 text-sm text-gray-700">
                              Charge taxes on this product
                            </label>
                          </div>
                          
                          <div className="flex items-center">
                            <input
                              type="checkbox"
                              id="track_inventory"
                              checked={formData.track_inventory}
                              onChange={(e) => updateFormData('track_inventory', e.target.checked)}
                              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                            />
                            <label htmlFor="track_inventory" className="ml-2 text-sm text-gray-700">
                              Track inventory for this product
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 4: Images & Media */}
                {currentStep === 4 && (
                  <div className="space-y-6">
                    <div>
                      <h4 className="text-lg font-medium text-gray-900 mb-4">Images & Media</h4>
                      
                      {/* Primary Image */}
                      <div className="mb-8">
                        <h5 className="text-sm font-medium text-gray-900 mb-3">Primary Product Image</h5>
                        <ImageUpload
                          productId={id}
                          imageType="primary"
                          currentImage={formData.primary_image}
                          onImageUploaded={handleImageUploaded}
                          className="mb-4"
                        />
                      </div>
                      
                      {/* Gallery Images */}
                      <div>
                        <h5 className="text-sm font-medium text-gray-900 mb-3">Product Gallery</h5>
                        
                        {/* Current Gallery Images */}
                        {formData.image_gallery.length > 0 && (
                          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mb-4">
                            {formData.image_gallery.map((imageUrl, index) => (
                              <div key={index} className="relative">
                                <img
                                  src={imageUrl}
                                  alt={`Gallery image ${index + 1}`}
                                  className="w-full h-32 object-cover rounded-lg border border-gray-200"
                                />
                                <button
                                  onClick={() => removeGalleryImage(index)}
                                  className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 shadow-sm"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                        
                        <ImageUpload
                          productId={id}
                          imageType="gallery"
                          onImageUploaded={handleGalleryImageUploaded}
                          multiple={true}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 5: SEO & Settings */}
                {currentStep === 5 && (
                  <div className="space-y-6">
                    <div>
                      <h4 className="text-lg font-medium text-gray-900 mb-4">SEO & Metadata</h4>
                      
                      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Meta Title
                          </label>
                          <input
                            type="text"
                            value={formData.meta_title}
                            onChange={(e) => updateFormData('meta_title', e.target.value)}
                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                            placeholder="SEO meta title"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            SEO Title
                          </label>
                          <input
                            type="text"
                            value={formData.seo_title}
                            onChange={(e) => updateFormData('seo_title', e.target.value)}
                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                            placeholder="Page title for SEO"
                          />
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Meta Description
                        </label>
                        <textarea
                          rows={3}
                          value={formData.meta_description}
                          onChange={(e) => updateFormData('meta_description', e.target.value)}
                          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                          placeholder="Brief description for search engines"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          SEO Description
                        </label>
                        <textarea
                          rows={3}
                          value={formData.seo_description}
                          onChange={(e) => updateFormData('seo_description', e.target.value)}
                          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                          placeholder="Detailed SEO description"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Search Keywords
                        </label>
                        <input
                          type="text"
                          value={formData.search_keywords}
                          onChange={(e) => updateFormData('search_keywords', e.target.value)}
                          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                          placeholder="Comma-separated keywords"
                        />
                      </div>
                      
                      {/* Tags */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Product Tags
                        </label>
                        
                        {/* Current Tags */}
                        {formData.tags.length > 0 && (
                          <div className="flex flex-wrap gap-2 mb-3">
                            {formData.tags.map((tag, index) => (
                              <span
                                key={index}
                                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800"
                              >
                                <Tag className="h-3 w-3 mr-1" />
                                {tag}
                                <button
                                  onClick={() => removeTag(tag)}
                                  className="ml-1 inline-flex items-center justify-center w-3 h-3 rounded-full text-indigo-400 hover:text-indigo-500"
                                >
                                  <X className="h-2 w-2" />
                                </button>
                              </span>
                            ))}
                          </div>
                        )}
                        
                        {/* Add New Tag */}
                        <div className="flex space-x-2">
                          <input
                            type="text"
                            value={newTag}
                            onChange={(e) => setNewTag(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && addTag()}
                            className="flex-1 border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                            placeholder="Add a tag"
                          />
                          <button
                            onClick={addTag}
                            type="button"
                            className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                          >
                            Add
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Step Navigation */}
                <div className="flex justify-between pt-6 border-t border-gray-200">
                  <button
                    onClick={prevStep}
                    disabled={currentStep === 1}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Previous
                  </button>
                  
                  {currentStep < 5 ? (
                    <button
                      onClick={nextStep}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
                    >
                      Next
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </button>
                  ) : (
                    <button
                      onClick={handleSubmit}
                      disabled={updateProductMutation.isPending}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
                    >
                      {updateProductMutation.isPending ? 'Updating...' : 'Update Product'}
                      <Save className="h-4 w-4 ml-2" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default EditProduct