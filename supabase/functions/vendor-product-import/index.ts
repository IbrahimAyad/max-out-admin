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
        const skipped = [];

        // First, check for duplicate products to prevent re-import
        const duplicateCheckResponse = await fetch(`${supabaseUrl}/rest/v1/products?select=id,name,additional_info&additional_info->>shopify_product_id=in.(${productIds.join(',')})`, {
            headers
        });
        
        const existingProducts = duplicateCheckResponse.ok ? await duplicateCheckResponse.json() : [];
        const existingProductIds = new Set(existingProducts.map(p => parseInt(p.additional_info?.shopify_product_id)).filter(Boolean));
        
        console.log(`Found ${existingProducts.length} existing products that would be duplicates`);
        
        // Filter out products that already exist unless options.allowDuplicates is true
        const productsToImport = productIds.filter(id => {
            if (existingProductIds.has(id)) {
                if (!options.allowDuplicates) {
                    skipped.push({
                        shopify_product_id: id,
                        reason: 'Already imported - duplicate found',
                        existing_product_id: existingProducts.find(p => parseInt(p.additional_info?.shopify_product_id) === id)?.id
                    });
                    return false;
                }
            }
            return true;
        });
        
        console.log(`${productsToImport.length} products will be imported after duplicate check`);

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

        // Helper function to download and upload image with retries
        const processImage = async (imageUrl, productId, position, altText = '') => {
            try {
                console.log(`Processing image: ${imageUrl}`);
                
                // Download image with timeout and retries
                let imageResponse;
                let retries = 3;
                
                while (retries > 0) {
                    try {
                        const controller = new AbortController();
                        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
                        
                        imageResponse = await fetch(imageUrl, { 
                            signal: controller.signal,
                            headers: {
                                'User-Agent': 'KCT-Inventory-Importer/1.0'
                            }
                        });
                        
                        clearTimeout(timeoutId);
                        
                        if (imageResponse.ok) break;
                        throw new Error(`HTTP ${imageResponse.status}: ${imageResponse.statusText}`);
                    } catch (error) {
                        retries--;
                        console.warn(`Image download attempt failed (${retries} retries left):`, error.message);
                        if (retries === 0) throw error;
                        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second before retry
                    }
                }
                
                const imageBlob = await imageResponse.blob();
                
                // Validate image type and size
                if (!imageBlob.type.startsWith('image/')) {
                    throw new Error(`Invalid image type: ${imageBlob.type}`);
                }
                
                if (imageBlob.size > 10 * 1024 * 1024) { // 10MB limit
                    throw new Error(`Image too large: ${imageBlob.size} bytes`);
                }
                
                const imageBuffer = await imageBlob.arrayBuffer();
                
                // Generate unique filename
                const fileExtension = imageUrl.split('.').pop()?.split('?')[0] || 'jpg';
                const fileName = `${productId}-${position}-${Date.now()}.${fileExtension}`;
                const filePath = `imported/${fileName}`;
                
                // Upload to Supabase Storage with retries
                let uploadAttempts = 3;
                let uploadResponse;
                
                while (uploadAttempts > 0) {
                    try {
                        uploadResponse = await fetch(`${supabaseUrl}/storage/v1/object/product-images/${filePath}`, {
                            method: 'POST',
                            headers: {
                                'Authorization': `Bearer ${serviceRoleKey}`,
                                'Content-Type': imageBlob.type
                            },
                            body: imageBuffer
                        });
                        
                        if (uploadResponse.ok) break;
                        
                        const errorText = await uploadResponse.text();
                        throw new Error(`Upload failed: ${uploadResponse.status} - ${errorText}`);
                    } catch (error) {
                        uploadAttempts--;
                        console.warn(`Image upload attempt failed (${uploadAttempts} attempts left):`, error.message);
                        if (uploadAttempts === 0) throw error;
                        await new Promise(resolve => setTimeout(resolve, 1000));
                    }
                }
                
                // Get public URL
                const publicUrl = `${supabaseUrl}/storage/v1/object/public/product-images/${filePath}`;
                
                console.log(`Image uploaded successfully: ${publicUrl}`);
                return {
                    url: publicUrl,
                    originalUrl: imageUrl,
                    size: imageBlob.size,
                    type: imageBlob.type
                };
                
            } catch (error) {
                console.error(`Image processing failed for ${imageUrl}:`, error.message);
                return {
                    error: error.message,
                    originalUrl: imageUrl,
                    url: null
                };
            }
        };

        // Process each product
        for (const shopifyProductId of productsToImport) {
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
                const imageResults = [];
                
                if (options.downloadImages !== false && vendorImages.length > 0) {
                    console.log('Processing images...');
                    
                    for (const vendorImage of vendorImages) {
                        try {
                            const imageResult = await processImage(
                                vendorImage.src,
                                productId,
                                vendorImage.position,
                                vendorImage.alt
                            );
                            
                            imageResults.push(imageResult);
                            
                            if (imageResult.url) {
                                // Save to product_images table
                                const imageData = {
                                    product_id: productId,
                                    image_url: imageResult.url,
                                    alt_text: vendorImage.alt || '',
                                    position: vendorImage.position,
                                    width: vendorImage.width,
                                    height: vendorImage.height,
                                    original_url: imageResult.originalUrl,
                                    file_size: imageResult.size,
                                    file_type: imageResult.type
                                };
                                
                                const createImageResponse = await fetch(`${supabaseUrl}/rest/v1/product_images`, {
                                    method: 'POST',
                                    headers,
                                    body: JSON.stringify(imageData)
                                });
                                
                                if (createImageResponse.ok) {
                                    imageCount++;
                                    if (vendorImage.position === 1) {
                                        primaryImageUrl = imageResult.url;
                                    }
                                    console.log(`Successfully saved image ${imageCount}: ${imageResult.url}`);
                                } else {
                                    console.error(`Failed to save image record:`, await createImageResponse.text());
                                }
                            } else if (imageResult.error) {
                                console.error(`Failed to process image ${vendorImage.src}: ${imageResult.error}`);
                            }
                        } catch (imageError) {
                            console.error(`Error processing image:`, imageError);
                            imageResults.push({
                                error: imageError.message,
                                originalUrl: vendorImage.src,
                                url: null
                            });
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
                    images_processed: imageResults.length,
                    images_failed: imageResults.filter(r => r.error).length,
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
            skipped_duplicates: skipped.length,
            failed: errors.length,
            total_images_processed: imported.reduce((sum, p) => sum + (p.images_processed || 0), 0),
            total_images_failed: imported.reduce((sum, p) => sum + (p.images_failed || 0), 0),
            total_variants_created: imported.reduce((sum, p) => sum + (p.variants_count || 0), 0)
        };
        
        console.log('Import completed:', summary);
        
        return new Response(JSON.stringify({
            success: true,
            imported,
            skipped,
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