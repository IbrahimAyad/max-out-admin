import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'

// Product Images Management Hook
export function useProductImages(productId?: string) {
  const queryClient = useQueryClient()

  // Fetch product images from the product_images table
  const productImagesQuery = useQuery({
    queryKey: ['product-images', productId],
    queryFn: async () => {
      if (!productId) return []
      
      const { data, error } = await supabase
        .from('product_images')
        .select('*')
        .eq('product_id', productId)
        .order('position', { ascending: true })
        .order('created_at', { ascending: true })
      
      if (error) throw error
      return data || []
    },
    enabled: !!productId,
  })

  // Fetch product gallery from products table (for backward compatibility)
  const productGalleryQuery = useQuery({
    queryKey: ['product-gallery', productId],
    queryFn: async () => {
      if (!productId) return { primary_image: null, image_gallery: [], gallery_urls: [] }
      
      const { data, error } = await supabase
        .from('products')
        .select('primary_image, image_gallery, gallery_urls')
        .eq('id', productId)
        .single()
      
      if (error) throw error
      return data || { primary_image: null, image_gallery: [], gallery_urls: [] }
    },
    enabled: !!productId,
  })

  // Upload image mutation
  const uploadImageMutation = useMutation({
    mutationFn: async ({ file, productId, imageType = 'gallery' }: {
      file: File
      productId?: string
      imageType?: 'primary' | 'gallery'
    }) => {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
      if (!allowedTypes.includes(file.type)) {
        throw new Error('Invalid file type. Please upload JPG, PNG, or WebP images.')
      }

      // Validate file size (max 5MB)
      const maxSize = 5 * 1024 * 1024
      if (file.size > maxSize) {
        throw new Error('File size too large. Please upload images smaller than 5MB.')
      }

      // Convert file to base64
      return new Promise<any>((resolve, reject) => {
        const reader = new FileReader()
        reader.onloadend = async () => {
          try {
            const base64Data = reader.result as string

            // Use Edge Function to upload image
            const { data, error } = await supabase.functions.invoke('image-upload', {
              body: {
                imageData: base64Data,
                fileName: file.name,
                productId: productId,
                imageType: imageType
              }
            })

            if (error) throw error
            if (!data.success) throw new Error(data.error?.message || 'Upload failed')
            
            resolve(data.data)
          } catch (err) {
            reject(err)
          }
        }
        reader.onerror = () => reject(new Error('Failed to read file'))
        reader.readAsDataURL(file)
      })
    },
    onSuccess: (data, variables) => {
      // Invalidate and refetch queries
      queryClient.invalidateQueries({ queryKey: ['product-images', variables.productId] })
      queryClient.invalidateQueries({ queryKey: ['product-gallery', variables.productId] })
      queryClient.invalidateQueries({ queryKey: ['product', variables.productId] })
      
      toast.success('Image uploaded successfully!')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to upload image')
    },
  })

  // Delete image mutation
  const deleteImageMutation = useMutation({
    mutationFn: async ({ imageId, imageUrl, productId }: {
      imageId?: string
      imageUrl?: string
      productId?: string
    }) => {
      const { data, error } = await supabase.functions.invoke('image-delete', {
        body: {
          imageId,
          imageUrl,
          productId
        }
      })

      if (error) throw error
      if (!data.success) throw new Error(data.error?.message || 'Delete failed')
      
      return data
    },
    onSuccess: (data, variables) => {
      // Invalidate and refetch queries
      queryClient.invalidateQueries({ queryKey: ['product-images', variables.productId] })
      queryClient.invalidateQueries({ queryKey: ['product-gallery', variables.productId] })
      queryClient.invalidateQueries({ queryKey: ['product', variables.productId] })
      
      toast.success('Image deleted successfully!')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete image')
    },
  })

  // Update image position/metadata mutation
  const updateImageMutation = useMutation({
    mutationFn: async ({ imageId, updates }: {
      imageId: string
      updates: Partial<{
        position: number
        alt_text: string
        image_type: string
      }>
    }) => {
      const { data, error } = await supabase
        .from('product_images')
        .update(updates)
        .eq('id', imageId)
        .select()
        .single()
      
      if (error) throw error
      return data
    },
    onSuccess: (data, variables) => {
      // Find the productId from the updated record
      const productId = data.product_id
      queryClient.invalidateQueries({ queryKey: ['product-images', productId] })
      
      toast.success('Image updated successfully!')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update image')
    },
  })

  // Set primary image mutation
  const setPrimaryImageMutation = useMutation({
    mutationFn: async ({ productId, imageUrl }: {
      productId: string
      imageUrl: string
    }) => {
      const { data, error } = await supabase
        .from('products')
        .update({ primary_image: imageUrl })
        .eq('id', productId)
        .select()
        .single()
      
      if (error) throw error
      return data
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['product', variables.productId] })
      queryClient.invalidateQueries({ queryKey: ['product-gallery', variables.productId] })
      
      toast.success('Primary image updated successfully!')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to set primary image')
    },
  })

  return {
    // Queries
    productImages: productImagesQuery.data || [],
    productGallery: productGalleryQuery.data || { primary_image: null, image_gallery: [], gallery_urls: [] },
    isLoading: productImagesQuery.isLoading || productGalleryQuery.isLoading,
    error: productImagesQuery.error || productGalleryQuery.error,
    
    // Mutations
    uploadImage: uploadImageMutation.mutate,
    isUploading: uploadImageMutation.isPending,
    
    deleteImage: deleteImageMutation.mutate,
    isDeleting: deleteImageMutation.isPending,
    
    updateImage: updateImageMutation.mutate,
    isUpdating: updateImageMutation.isPending,
    
    setPrimaryImage: setPrimaryImageMutation.mutate,
    isSettingPrimary: setPrimaryImageMutation.isPending,
  }
}
