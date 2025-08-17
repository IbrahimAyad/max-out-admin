Deno.serve(async (req) => {
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE, PATCH',
        'Access-Control-Max-Age': '86400',
        'Access-Control-Allow-Credentials': 'false'
    };
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
        return new Response(null, { status: 200, headers: corsHeaders });
    }

    try {
        console.log('Image upload function called');
        
        // Get Supabase credentials
        const supabaseUrl = Deno.env.get('SUPABASE_URL');
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
        
        if (!supabaseUrl || !supabaseKey) {
            throw new Error('Missing Supabase environment variables');
        }

    // Extract request data
    const requestData = await req.json()
    console.log('Request data received:', { 
      fileName: requestData.fileName, 
      productId: requestData.productId, 
      imageType: requestData.imageType,
      hasImageData: !!requestData.imageData
    })
    
    const { imageData, fileName, productId, imageType = 'gallery' } = requestData

    if (!imageData || !fileName) {
      throw new Error('Missing image data or file name')
    }

    // Validate base64 data format
    if (!imageData.startsWith('data:image/')) {
      throw new Error('Invalid image data format')
    }

    // Extract base64 data (remove data:image/...;base64, prefix)
    const base64Parts = imageData.split(',')
    if (base64Parts.length !== 2) {
      throw new Error('Invalid base64 format')
    }
    
    const base64Data = base64Parts[1]
    
    // Validate base64 string
    if (!base64Data || base64Data.length === 0) {
      throw new Error('Empty base64 data')
    }
    
    console.log('Base64 data length:', base64Data.length)
    
    let binaryData
    try {
      binaryData = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0))
      console.log('Binary data created, length:', binaryData.length)
    } catch (error) {
      throw new Error(`Failed to decode base64: ${error.message}`)
    }
    
    // Generate unique filename with timestamp
    const timestamp = Date.now()
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_')
    const uniqueFileName = `${timestamp}-${sanitizedFileName}`
    const filePath = productId ? `products/${productId}/${uniqueFileName}` : `temp/${uniqueFileName}`

    console.log('Uploading to path:', filePath)
    
    // Determine content type from original data
    const mimeMatch = imageData.match(/data:([^;]+);/)
    const contentType = mimeMatch ? mimeMatch[1] : 'image/jpeg'
    
        // Upload to storage using REST API
        const storageUrl = `${supabaseUrl}/storage/v1/object/product-images/${filePath}`;
        
        const uploadResponse = await fetch(storageUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${supabaseKey}`,
                'Content-Type': contentType,
                'Cache-Control': '3600'
            },
            body: binaryData
        });

        if (!uploadResponse.ok) {
            const errorText = await uploadResponse.text();
            console.error('Storage upload error:', errorText);
            throw new Error(`Upload failed: ${uploadResponse.status} ${errorText}`);
        }
        
        console.log('Upload successful');

        // Get public URL
        const publicUrl = `${supabaseUrl}/storage/v1/object/public/product-images/${filePath}`;
        
        console.log('Public URL generated:', publicUrl);

    // If productId is provided, also update the product_images table
    if (productId) {
      console.log('Inserting into product_images table')
      
      // Get image dimensions (approximate based on file size)
      const approximateWidth = Math.floor(Math.sqrt(binaryData.length / 3 * 4))
      const approximateHeight = Math.floor(approximateWidth * 0.75) // Assume 4:3 ratio
      
      const dbPayload = {
                product_id: productId,
                image_url: publicUrl,
                image_type: imageType,
                alt_text: `${fileName} - Product Image`,
                width: approximateWidth,
                height: approximateHeight,
                position: 0
            };
            
            const dbResponse = await fetch(`${supabaseUrl}/rest/v1/product_images`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${supabaseKey}`,
                    'Content-Type': 'application/json',
                    'apikey': supabaseKey,
                    'Prefer': 'return=representation'
                },
                body: JSON.stringify(dbPayload)
            });

            if (!dbResponse.ok) {
                const errorText = await dbResponse.text();
                console.warn('Failed to insert into product_images table:', errorText);
                // Don't throw error - the upload was successful
            } else {
                console.log('Database insert successful');
            }
    }

    // Return success response
    const result = {
      success: true,
      data: {
                publicUrl: publicUrl,
                filePath: filePath,
                fileName: uniqueFileName
            }
    }
    
    console.log('Returning success response:', result)
    
    return new Response(JSON.stringify(result), {
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