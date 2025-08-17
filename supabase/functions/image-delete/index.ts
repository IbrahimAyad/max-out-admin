import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE, PATCH',
  'Access-Control-Max-Age': '86400',
  'Access-Control-Allow-Credentials': 'false'
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders })
  }

  try {
    // Initialize Supabase client with service role
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Extract request data
    const requestData = await req.json()
    const { imageUrl, imageId, productId } = requestData

    if (!imageUrl && !imageId) {
      throw new Error('Missing image URL or image ID')
    }

    let filePath = ''
    
    // If we have imageId, get the image record from database first
    if (imageId) {
      const { data: imageRecord, error: fetchError } = await supabase
        .from('product_images')
        .select('image_url, product_id')
        .eq('id', imageId)
        .single()
      
      if (fetchError) {
        throw new Error(`Failed to fetch image record: ${fetchError.message}`)
      }
      
      // Extract file path from the public URL
      const urlParts = imageRecord.image_url.split('/product-images/')
      if (urlParts.length > 1) {
        filePath = urlParts[1]
      }
      
      // Delete from database first
      const { error: deleteDbError } = await supabase
        .from('product_images')
        .delete()
        .eq('id', imageId)
      
      if (deleteDbError) {
        throw new Error(`Failed to delete from database: ${deleteDbError.message}`)
      }
    } else {
      // Extract file path from provided URL
      const urlParts = imageUrl.split('/product-images/')
      if (urlParts.length > 1) {
        filePath = urlParts[1]
      }
    }

    if (!filePath) {
      throw new Error('Could not determine file path from URL')
    }

    // Delete from storage
    const { error: storageError } = await supabase.storage
      .from('product-images')
      .remove([filePath])

    if (storageError) {
      console.warn('Storage deletion warning:', storageError)
      // Don't throw error if file doesn't exist in storage
    }

    // If productId provided, update product arrays if needed
    if (productId) {
      // Get current product data
      const { data: product, error: productError } = await supabase
        .from('products')
        .select('primary_image, image_gallery, gallery_urls')
        .eq('id', productId)
        .single()

      if (!productError && product) {
        let updates: any = {}
        
        // Remove from primary_image if it matches
        if (product.primary_image === imageUrl) {
          updates.primary_image = null
        }
        
        // Remove from image_gallery array if it exists
        if (product.image_gallery && Array.isArray(product.image_gallery)) {
          const updatedGallery = product.image_gallery.filter((url: string) => url !== imageUrl)
          if (updatedGallery.length !== product.image_gallery.length) {
            updates.image_gallery = updatedGallery
          }
        }
        
        // Remove from gallery_urls array if it exists
        if (product.gallery_urls && Array.isArray(product.gallery_urls)) {
          const updatedGalleryUrls = product.gallery_urls.filter((url: string) => url !== imageUrl)
          if (updatedGalleryUrls.length !== product.gallery_urls.length) {
            updates.gallery_urls = updatedGalleryUrls
          }
        }
        
        // Update product if there are changes
        if (Object.keys(updates).length > 0) {
          const { error: updateError } = await supabase
            .from('products')
            .update(updates)
            .eq('id', productId)
          
          if (updateError) {
            console.warn('Failed to update product arrays:', updateError)
          }
        }
      }
    }

    return new Response(JSON.stringify({
      success: true,
      message: 'Image deleted successfully'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Image deletion error:', error)
    
    return new Response(JSON.stringify({
      success: false,
      error: {
        code: 'IMAGE_DELETE_ERROR',
        message: error.message || 'Failed to delete image'
      }
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
