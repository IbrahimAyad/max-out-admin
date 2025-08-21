Deno.serve(async (req) => {
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE, PATCH',
        'Access-Control-Max-Age': '86400',
        'Access-Control-Allow-Credentials': 'false'
    };

    if (req.method === 'OPTIONS') {
        return new Response(null, { status: 200, headers: corsHeaders });
    }

    try {
        // Get environment variables
        const supabaseUrl = Deno.env.get('SUPABASE_URL');
        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
        const shopifyLocationId = Deno.env.get('SHOPIFY_LOCATION_ID');

        console.log('Starting vendor product import...');
        console.log('Environment check:', {
            supabaseUrl: !!supabaseUrl,
            serviceRoleKey: !!serviceRoleKey,
            shopifyLocationId
        });

        if (!supabaseUrl || !serviceRoleKey) {
            throw new Error('Missing required Supabase environment variables');
        }

        // Parse request body
        const requestData = await req.json();
        const { productIds, options = {} } = requestData;

        if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
            throw new Error('productIds must be a non-empty array');
        }

        console.log(`Processing import for ${productIds.length} products`);

        const headers = {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'apikey': serviceRoleKey,
            'Content-Type': 'application/json'
        };

        const imported = [];
        const errors = [];

        // Helper function to generate unique handle
        const generateUniqueHandle = async (baseHandle) => {
            let handle = baseHandle;
            let counter = 1;
            
            while (true) {
                const checkResponse = await fetch(`${supabaseUrl}/rest/v1/products?select=id&handle=eq.${handle}`, {
                    headers
                });
                const existingProducts = await checkResponse.json();
                
                if (existingProducts.length === 0) {
                    return handle;
                }
                
                handle = `${baseHandle}-${counter}`;
                counter++;
            }
        };

        // Helper function to download and upload image
        const processImage = async (imageUrl, productId, position, altText = '') => {
            try {
                console.log(`Processing image: ${imageUrl}`);
                
                // Download image
                const imageResponse = await fetch(imageUrl);
                if (!imageResponse.ok) {
                    throw new Error(`Failed to download image: ${imageResponse.status}`);
                }
                
                const imageBlob = await imageResponse.blob();
                const imageBuffer = await imageBlob.arrayBuffer();
                
                // Generate unique filename
                const fileExtension = imageUrl.split('.').pop()?.split('?')[0] || 'jpg';
                const fileName = `${productId}-${position}-${Date.now()}.${fileExtension}`;
                const filePath = `imported/${fileName}`;
                
                // Upload to Supabase Storage
                const uploadResponse = await fetch(`${supabaseUrl}/storage/v1/object/product-images/${filePath}`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'Content-Type': imageBlob.type
                    },
                    body: imageBuffer
                });
                
                if (!uploadResponse.ok) {
                    const errorText = await uploadResponse.text();
                    throw new Error(`Upload failed: ${uploadResponse.status} - ${errorText}`);
                }
                
                // Get public URL
                const publicUrl = `${supabaseUrl}/storage/v1/object/public/product-images/${filePath}`;
                
                console.log(`Image uploaded successfully: ${publicUrl}`);
                return publicUrl;
                
            } catch (error) {
                console.error(`Image processing failed for ${imageUrl}:`, error);
                return null; // Continue without the image
            }
        };

        // Process each product
        for (const shopifyProductId of productIds) {
            try {
                console.log(`Processing product ID: ${shopifyProductId}`);
                
                // Get vendor product data
                const productResponse = await fetch(`${supabaseUrl}/rest/v1/vendor_products?select=*&shopify_product_id=eq.${shopifyProductId}`, {
                    headers
                });
                const vendorProducts = await productResponse.json();
                
                if (vendorProducts.length === 0) {
                    errors.push({
                        shopify_product_id: shopifyProductId,
                        error: 'Vendor product not found'
                    });
                    continue;
                }
                
                const vendorProduct = vendorProducts[0];
                
                // Get vendor variants
                const variantsResponse = await fetch(`${supabaseUrl}/rest/v1/vendor_variants?select=*&shopify_product_id=eq.${shopifyProductId}&order=position.asc`, {
                    headers
                });
                const vendorVariants = await variantsResponse.json();
                
                // Get vendor images
                const imagesResponse = await fetch(`${supabaseUrl}/rest/v1/vendor_images?select=*&shopify_product_id=eq.${shopifyProductId}&order=position.asc`, {
                    headers
                });
                const vendorImages = await imagesResponse.json();
                
                console.log(`Found ${vendorVariants.length} variants and ${vendorImages.length} images`);
                
                // Generate unique handle
                const uniqueHandle = await generateUniqueHandle(vendorProduct.handle || vendorProduct.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'));
                
                // Calculate base price from first variant
                const basePrice = vendorVariants.length > 0 ? Math.round(vendorVariants[0].price * 100) : 0;
                
                // Create main product
                const productData = {
                    name: options.customTitles?.[shopifyProductId] || vendorProduct.title,
                    description: vendorProduct.body_html || vendorProduct.title,
                    category: vendorProduct.product_type || 'Imported',
                    sku: vendorVariants.length > 0 ? vendorVariants[0].sku : `IMPORTED-${shopifyProductId}`,
                    handle: uniqueHandle,
                    base_price: basePrice,
                    vendor: vendorProduct.vendor || 'Imported Vendor',
                    product_type: vendorProduct.product_type || 'Imported',
                    status: 'active',
                    tags: vendorProduct.tags || [],
                    track_inventory: true,
                    variant_count: vendorVariants.length,
                    additional_info: {
                        shopify_product_id: shopifyProductId,
                        imported_at: new Date().toISOString(),
                        import_source: 'vendor_shopify'
                    }
                };
                
                console.log('Creating main product...');
                const createProductResponse = await fetch(`${supabaseUrl}/rest/v1/products`, {
                    method: 'POST',
                    headers: {
                        ...headers,
                        'Prefer': 'return=representation'
                    },
                    body: JSON.stringify(productData)
                });
                
                if (!createProductResponse.ok) {
                    const errorText = await createProductResponse.text();
                    throw new Error(`Failed to create product: ${createProductResponse.status} - ${errorText}`);
                }
                
                const createdProducts = await createProductResponse.json();
                const createdProduct = createdProducts[0];
                const productId = createdProduct.id;
                
                console.log(`Created product with ID: ${productId}`);
                
                // Create variants
                let variantCount = 0;
                for (const [index, vendorVariant] of vendorVariants.entries()) {
                    try {
                        const variantData = {
                            product_id: productId,
                            variant_type: 'size-color', // More descriptive variant type
                            color: vendorVariant.option1 || 'Default',
                            size: vendorVariant.option2 || null,
                            sku: vendorVariant.sku || `${productData.sku}-${index + 1}`,
                            price_cents: Math.round(parseFloat(vendorVariant.price) * 100),
                            compare_at_price_cents: vendorVariant.compare_at_price ? Math.round(parseFloat(vendorVariant.compare_at_price) * 100) : null,
                            barcode: vendorVariant.barcode,
                            vendor_inventory_item_id: vendorVariant.inventory_item_id,
                            vendor_location_id: shopifyLocationId ? parseInt(shopifyLocationId) : null,
                            inventory_quantity: 0, // Will be synced from vendor
                            available_quantity: 0, // Will be synced from vendor
                            stock_status: 'in_stock'
                        };
                        
                        console.log(`Creating variant ${index + 1}:`, variantData.sku);
                        
                        const createVariantResponse = await fetch(`${supabaseUrl}/rest/v1/enhanced_product_variants`, {
                            method: 'POST',
                            headers: {
                                ...headers,
                                'Prefer': 'return=representation'
                            },
                            body: JSON.stringify(variantData)
                        });
                        
                        if (createVariantResponse.ok) {
                            variantCount++;
                            console.log(`Successfully created variant: ${variantData.sku}`);
                        } else {
                            const errorText = await createVariantResponse.text();
                            console.error(`Failed to create variant for ${vendorVariant.sku}:`, errorText);
                        }
                    } catch (variantError) {
                        console.error(`Error creating variant:`, variantError);
                    }
                }
                
                console.log(`Created ${variantCount} variants`);
                
                // Process images if enabled
                let imageCount = 0;
                let primaryImageUrl = null;
                
                if (options.downloadImages !== false && vendorImages.length > 0) {
                    console.log('Processing images...');
                    
                    for (const vendorImage of vendorImages) {
                        try {
                            const uploadedImageUrl = await processImage(
                                vendorImage.src,
                                productId,
                                vendorImage.position,
                                vendorImage.alt
                            );
                            
                            if (uploadedImageUrl) {
                                // Save to product_images table
                                const imageData = {
                                    product_id: productId,
                                    image_url: uploadedImageUrl,
                                    alt_text: vendorImage.alt || '',
                                    position: vendorImage.position,
                                    width: vendorImage.width,
                                    height: vendorImage.height
                                };
                                
                                const createImageResponse = await fetch(`${supabaseUrl}/rest/v1/product_images`, {
                                    method: 'POST',
                                    headers,
                                    body: JSON.stringify(imageData)
                                });
                                
                                if (createImageResponse.ok) {
                                    imageCount++;
                                    if (vendorImage.position === 1) {
                                        primaryImageUrl = uploadedImageUrl;
                                    }
                                }
                            }
                        } catch (imageError) {
                            console.error(`Error processing image:`, imageError);
                        }
                    }
                    
                    // Update product with primary image if available
                    if (primaryImageUrl) {
                        await fetch(`${supabaseUrl}/rest/v1/products?id=eq.${productId}`, {
                            method: 'PATCH',
                            headers,
                            body: JSON.stringify({ primary_image: primaryImageUrl })
                        });
                    }
                }
                
                console.log(`Processed ${imageCount} images`);
                
                // Update import decision status
                const updateDecisionResponse = await fetch(`${supabaseUrl}/rest/v1/vendor_import_decisions`, {
                    method: 'POST',
                    headers: {
                        ...headers,
                        'Prefer': 'resolution=merge-duplicates'
                    },
                    body: JSON.stringify({
                        shopify_product_id: shopifyProductId,
                        decision: 'imported',
                        decided_at: new Date().toISOString(),
                        notes: `Imported to product ID: ${productId}`
                    })
                });
                
                if (!updateDecisionResponse.ok) {
                    console.error('Failed to update import decision:', await updateDecisionResponse.text());
                }
                
                // Add to successful imports
                imported.push({
                    shopify_product_id: shopifyProductId,
                    local_product_id: productId,
                    title: productData.name,
                    variants_count: variantCount,
                    images_count: imageCount,
                    handle: uniqueHandle
                });
                
                console.log(`Successfully imported product: ${productData.name}`);
                
            } catch (error) {
                console.error(`Error importing product ${shopifyProductId}:`, error);
                errors.push({
                    shopify_product_id: shopifyProductId,
                    error: error.message
                });
            }
        }
        
        const summary = {
            total_requested: productIds.length,
            successfully_imported: imported.length,
            failed: errors.length
        };
        
        console.log('Import completed:', summary);
        
        return new Response(JSON.stringify({
            success: true,
            imported,
            errors,
            summary
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Vendor import error:', error);

        const errorResponse = {
            success: false,
            error: {
                code: 'VENDOR_IMPORT_FAILED',
                message: error.message
            }
        };

        return new Response(JSON.stringify(errorResponse), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});