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
    // Initialize Supabase client with service role for storage access
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
    const { imageData, fileName, productId, imageType = 'gallery' } = requestData

    if (!imageData || !fileName) {
      throw new Error('Missing image data or file name')
    }

    // Extract base64 data (remove data:image/...;base64, prefix)
    const base64Data = imageData.split(',')[1]
    const binaryData = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0))
    
    // Generate unique filename with timestamp
    const timestamp = Date.now()
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_')
    const uniqueFileName = `${timestamp}-${sanitizedFileName}`
    const filePath = productId ? `products/${productId}/${uniqueFileName}` : `temp/${uniqueFileName}`

    // Upload to storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('product-images')
      .upload(filePath, binaryData, {
        contentType: 'image/jpeg',
        cacheControl: '3600',
        upsert: false
      })

    if (uploadError) {
      throw new Error(`Upload failed: ${uploadError.message}`)
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('product-images')
      .getPublicUrl(filePath)

    if (!urlData?.publicUrl) {
      throw new Error('Failed to get public URL')
    }

    // If productId is provided, also update the product_images table
    if (productId) {
      // Get image dimensions (approximate based on file size)
      const approximateWidth = Math.floor(Math.sqrt(binaryData.length / 3 * 4))
      const approximateHeight = Math.floor(approximateWidth * 0.75) // Assume 4:3 ratio
      
      const { error: dbError } = await supabase
        .from('product_images')
        .insert({
          product_id: productId,
          image_url: urlData.publicUrl,
          image_type: imageType,
          alt_text: `${fileName} - Product Image`,
          width: approximateWidth,
          height: approximateHeight,
          position: 0 // Will be updated by client if needed
        })

      if (dbError) {
        console.warn('Failed to insert into product_images table:', dbError)
        // Don't throw error - the upload was successful
      }
    }

    // Return success response
    return new Response(JSON.stringify({
      success: true,
      data: {
        publicUrl: urlData.publicUrl,
        filePath: filePath,
        fileName: uniqueFileName
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Image upload error:', error)
    
    return new Response(JSON.stringify({
      success: false,
      error: {
        code: 'IMAGE_UPLOAD_ERROR',
        message: error.message || 'Failed to upload image'
      }
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
