import React, { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'
import { X, Save, Loader2 } from 'lucide-react'

interface ProductEditModalProps {
  product: any
  isOpen: boolean
  onClose: () => void
}

export default function ProductEditModal({ product, isOpen, onClose }: ProductEditModalProps) {
  const [formData, setFormData] = useState({
    name: product?.name || '',
    description: product?.description || '',
    category: product?.category || '',
    subcategory: product?.subcategory || '',
    base_price: product?.base_price || 0,
    handle: product?.handle || '',
    status: product?.status || 'active',
    featured: product?.featured || false,
    visibility: product?.visibility || true,
    taxable: product?.taxable || true,
    requires_shipping: product?.requires_shipping || true,
    track_inventory: product?.track_inventory || true,
    weight: product?.weight || 0,
    meta_title: product?.meta_title || '',
    meta_description: product?.meta_description || '',
    tags: product?.tags?.join(', ') || '',
    // Luxury fashion fields
    materials: product?.additional_info?.materials || '',
    care_instructions: product?.additional_info?.care_instructions || '',
    sizing_guide: product?.additional_info?.sizing_guide || '',
    style_details: product?.additional_info?.style_details || '',
    color_family: product?.additional_info?.color_family || '',
    seasonal_collection: product?.additional_info?.seasonal_collection || '',
    designer: product?.additional_info?.designer || '',
    fabric_weight: product?.additional_info?.fabric_weight || '',
    occasion: product?.additional_info?.occasion || '',
    country_origin: product?.additional_info?.country_origin || '',
    sustainability: product?.additional_info?.sustainability || ''
  })

  const queryClient = useQueryClient()

  const updateProductMutation = useMutation({
    mutationFn: async (data: any) => {
      const updateData = {
        name: data.name,
        description: data.description,
        category: data.category,
        subcategory: data.subcategory,
        base_price: parseInt(data.base_price),
        handle: data.handle,
        status: data.status,
        featured: data.featured,
        visibility: data.visibility,
        taxable: data.taxable,
        requires_shipping: data.requires_shipping,
        track_inventory: data.track_inventory,
        weight: parseInt(data.weight) || null,
        meta_title: data.meta_title,
        meta_description: data.meta_description,
        tags: data.tags ? data.tags.split(',').map((tag: string) => tag.trim()).filter(Boolean) : [],
        additional_info: {
          ...product?.additional_info,
          materials: data.materials,
          care_instructions: data.care_instructions,
          sizing_guide: data.sizing_guide,
          style_details: data.style_details,
          color_family: data.color_family,
          seasonal_collection: data.seasonal_collection,
          designer: data.designer,
          fabric_weight: data.fabric_weight,
          occasion: data.occasion,
          country_origin: data.country_origin,
          sustainability: data.sustainability
        },
        updated_at: new Date().toISOString()
      }

      const { data: result, error } = await supabase
        .from('products')
        .update(updateData)
        .eq('id', product.id)
        .select()
        .single()

      if (error) throw error
      return result
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product', product.id] })
      queryClient.invalidateQueries({ queryKey: ['products'] })
      toast.success('Product updated successfully!')
      onClose()
    },
    onError: (error: any) => {
      console.error('Update error:', error)
      toast.error(error.message || 'Failed to update product')
    }
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    updateProductMutation.mutate(formData)
  }

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={onClose}></div>

        {/* Modal */}
        <div className="inline-block w-full max-w-4xl p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-lg">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-medium text-gray-900">Edit Product</h3>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <h4 className="text-md font-medium text-gray-900 border-b pb-2">Basic Information</h4>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Product Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                    <select
                      value={formData.category}
                      onChange={(e) => handleInputChange('category', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
                      required
                    >
                      <option value="">Select Category</option>
                      <option value="Suits">Suits</option>
                      <option value="Tuxedos">Tuxedos</option>
                      <option value="Blazers">Blazers</option>
                      <option value="Double-Breasted Suits">Double-Breasted Suits</option>
                      <option value="Stretch Suits">Stretch Suits</option>
                      <option value="Mens Shirts">Mens Shirts</option>
                      <option value="Accessories">Accessories</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Subcategory</label>
                    <input
                      type="text"
                      value={formData.subcategory}
                      onChange={(e) => handleInputChange('subcategory', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Base Price (cents)</label>
                    <input
                      type="number"
                      value={formData.base_price}
                      onChange={(e) => handleInputChange('base_price', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select
                      value={formData.status}
                      onChange={(e) => handleInputChange('status', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
                    >
                      <option value="active">Active</option>
                      <option value="draft">Draft</option>
                      <option value="archived">Archived</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Luxury Fashion Details */}
              <div className="space-y-4">
                <h4 className="text-md font-medium text-gray-900 border-b pb-2">Luxury Fashion Details</h4>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Materials & Composition</label>
                  <input
                    type="text"
                    value={formData.materials}
                    onChange={(e) => handleInputChange('materials', e.target.value)}
                    placeholder="e.g., 100% Wool, 70% Cotton 30% Silk"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Care Instructions</label>
                  <textarea
                    value={formData.care_instructions}
                    onChange={(e) => handleInputChange('care_instructions', e.target.value)}
                    placeholder="Dry clean only, Iron on low heat, etc."
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Designer</label>
                    <input
                      type="text"
                      value={formData.designer}
                      onChange={(e) => handleInputChange('designer', e.target.value)}
                      placeholder="Designer name"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Color Family</label>
                    <input
                      type="text"
                      value={formData.color_family}
                      onChange={(e) => handleInputChange('color_family', e.target.value)}
                      placeholder="Navy, Charcoal, etc."
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Seasonal Collection</label>
                    <select
                      value={formData.seasonal_collection}
                      onChange={(e) => handleInputChange('seasonal_collection', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
                    >
                      <option value="">Select Season</option>
                      <option value="Spring/Summer">Spring/Summer</option>
                      <option value="Fall/Winter">Fall/Winter</option>
                      <option value="Resort">Resort</option>
                      <option value="Pre-Fall">Pre-Fall</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Occasion</label>
                    <select
                      value={formData.occasion}
                      onChange={(e) => handleInputChange('occasion', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
                    >
                      <option value="">Select Occasion</option>
                      <option value="Business">Business</option>
                      <option value="Formal">Formal</option>
                      <option value="Black-tie">Black-tie</option>
                      <option value="Casual">Casual</option>
                      <option value="Wedding">Wedding</option>
                      <option value="Evening">Evening</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Style Details</label>
                  <input
                    type="text"
                    value={formData.style_details}
                    onChange={(e) => handleInputChange('style_details', e.target.value)}
                    placeholder="e.g., Notch lapel, Two-button, Side vents"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sizing Guide</label>
                  <textarea
                    value={formData.sizing_guide}
                    onChange={(e) => handleInputChange('sizing_guide', e.target.value)}
                    placeholder="Detailed sizing information and fit guide"
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
                  />
                </div>
              </div>
            </div>

            {/* Additional Settings */}
            <div className="border-t pt-6">
              <h4 className="text-md font-medium text-gray-900 mb-4">Additional Settings</h4>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.featured}
                    onChange={(e) => handleInputChange('featured', e.target.checked)}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">Featured Product</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.visibility}
                    onChange={(e) => handleInputChange('visibility', e.target.checked)}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">Visible</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.taxable}
                    onChange={(e) => handleInputChange('taxable', e.target.checked)}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">Taxable</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.track_inventory}
                    onChange={(e) => handleInputChange('track_inventory', e.target.checked)}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">Track Inventory</span>
                </label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Handle (URL)</label>
                  <input
                    type="text"
                    value={formData.handle}
                    onChange={(e) => handleInputChange('handle', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Weight (grams)</label>
                  <input
                    type="number"
                    value={formData.weight}
                    onChange={(e) => handleInputChange('weight', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tags (comma separated)</label>
                  <input
                    type="text"
                    value={formData.tags}
                    onChange={(e) => handleInputChange('tags', e.target.value)}
                    placeholder="formal, luxury, wool"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
                  />
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end space-x-4 pt-6 border-t">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={updateProductMutation.isPending}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-black border border-transparent rounded-md hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {updateProductMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
