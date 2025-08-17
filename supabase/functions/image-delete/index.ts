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
        console.log('Image delete function called');
        
        // Get Supabase credentials
        const supabaseUrl = Deno.env.get('SUPABASE_URL');
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
        
        if (!supabaseUrl || !supabaseKey) {
            throw new Error('Missing Supabase environment variables');
        }

    // Extract request data
    const requestData = await req.json()
    console.log('Delete request data:', { 
      imageId: requestData.imageId, 
      productId: requestData.productId,
      hasImageUrl: !!requestData.imageUrl
    })
    
    const { imageUrl, imageId, productId } = requestData

    if (!imageUrl && !imageId) {
      throw new Error('Missing image URL or image ID')
    }

    let filePath = ''
    let actualImageUrl = imageUrl
    
        // If we have imageId, get the image record from database first
        if (imageId) {
            console.log('Fetching image record for ID:', imageId);
            
            const fetchResponse = await fetch(`${supabaseUrl}/rest/v1/product_images?id=eq.${imageId}&select=image_url,product_id`, {
                headers: {
                    'Authorization': `Bearer ${supabaseKey}`,
                    'apikey': supabaseKey
                }
            });
            
            if (!fetchResponse.ok) {
                const errorText = await fetchResponse.text();
                console.error('Failed to fetch image record:', errorText);
                throw new Error(`Failed to fetch image record: ${fetchResponse.status}`);
            }
            
            const imageRecords = await fetchResponse.json();
            
            if (!imageRecords || imageRecords.length === 0) {
                throw new Error('Image record not found');
            }
            
            const imageRecord = imageRecords[0];
            actualImageUrl = imageRecord.image_url;
            console.log('Found image URL:', actualImageUrl);
            
            // Delete from database first
            console.log('Deleting from database');
            const deleteDbResponse = await fetch(`${supabaseUrl}/rest/v1/product_images?id=eq.${imageId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${supabaseKey}`,
                    'apikey': supabaseKey
                }
            });
            
            if (!deleteDbResponse.ok) {
                const errorText = await deleteDbResponse.text();
                console.error('Database deletion error:', errorText);
                throw new Error(`Failed to delete from database: ${deleteDbResponse.status}`);
            }
            
            console.log('Database deletion successful');
        }
    
    // Extract file path from the URL
    if (actualImageUrl) {
      const urlParts = actualImageUrl.split('/product-images/')
      if (urlParts.length > 1) {
        filePath = urlParts[1]
        console.log('Extracted file path:', filePath)
      }
    }

        if (!filePath) {
            console.warn('Could not determine file path from URL:', actualImageUrl);
            // Don't throw error if file path can't be determined - database deletion may have succeeded
        } else {
            // Delete from storage
            console.log('Deleting from storage:', filePath);
            const storageDeleteUrl = `${supabaseUrl}/storage/v1/object/product-images/${filePath}`;
            
            const storageResponse = await fetch(storageDeleteUrl, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${supabaseKey}`
                }
            });

            if (!storageResponse.ok) {
                const errorText = await storageResponse.text();
                console.warn('Storage deletion warning:', errorText);
                // Don't throw error if file doesn't exist in storage
            } else {
                console.log('Storage deletion successful');
            }
        }

        // If productId provided, update product arrays if needed
        if (productId && actualImageUrl) {
            console.log('Updating product arrays for product:', productId);
            
            // Get current product data
            const productResponse = await fetch(`${supabaseUrl}/rest/v1/products?id=eq.${productId}&select=primary_image,image_gallery,gallery_urls`, {
                headers: {
                    'Authorization': `Bearer ${supabaseKey}`,
                    'apikey': supabaseKey
                }
            });

            if (productResponse.ok) {
                const products = await productResponse.json();
                
                if (products && products.length > 0) {
                    const product = products[0];
                    let updates = {};
                    
                    // Remove from primary_image if it matches
                    if (product.primary_image === actualImageUrl) {
                        updates.primary_image = null;
                        console.log('Removing from primary_image');
                    }
                    
                    // Remove from image_gallery array if it exists
                    if (product.image_gallery && Array.isArray(product.image_gallery)) {
                        const updatedGallery = product.image_gallery.filter((url) => url !== actualImageUrl);
                        if (updatedGallery.length !== product.image_gallery.length) {
                            updates.image_gallery = updatedGallery;
                            console.log('Removing from image_gallery');
                        }
                    }
                    
                    // Remove from gallery_urls array if it exists
                    if (product.gallery_urls && Array.isArray(product.gallery_urls)) {
                        const updatedGalleryUrls = product.gallery_urls.filter((url) => url !== actualImageUrl);
                        if (updatedGalleryUrls.length !== product.gallery_urls.length) {
                            updates.gallery_urls = updatedGalleryUrls;
                            console.log('Removing from gallery_urls');
                        }
                    }
                    
                    // Update product if there are changes
                    if (Object.keys(updates).length > 0) {
                        console.log('Updating product with:', updates);
                        const updateResponse = await fetch(`${supabaseUrl}/rest/v1/products?id=eq.${productId}`, {
                            method: 'PATCH',
                            headers: {
                                'Authorization': `Bearer ${supabaseKey}`,
                                'Content-Type': 'application/json',
                                'apikey': supabaseKey
                            },
                            body: JSON.stringify(updates)
                        });
                        
                        if (!updateResponse.ok) {
                            const errorText = await updateResponse.text();
                            console.warn('Failed to update product arrays:', errorText);
                        } else {
                            console.log('Product arrays updated successfully');
                        }
                    }
                }
            } else {
                const errorText = await productResponse.text();
                console.warn('Failed to fetch product for array updates:', errorText);
            }
        }

    const result = {
      success: true,
      message: 'Image deleted successfully'
    }
    
    console.log('Delete operation completed successfully')
    
    return new Response(JSON.stringify(result), {
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