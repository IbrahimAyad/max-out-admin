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
        // Parse the incoming request
        const requestData = await req.json();
        const { productIds } = requestData;

        if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
            throw new Error('productIds array is required and must not be empty');
        }

        console.log(`Starting import for ${productIds.length} products:`, productIds);

        // Get Supabase configuration
        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
        const supabaseUrl = Deno.env.get('SUPABASE_URL');

        if (!serviceRoleKey || !supabaseUrl) {
            throw new Error('Supabase configuration missing');
        }

        const importResults = [];
        const errors = [];

        // Process each product ID
        for (const productId of productIds) {
            try {
                console.log(`Processing product ID: ${productId}`);

                // Fetch the vendor product record
                const productResponse = await fetch(`${supabaseUrl}/rest/v1/vendor_products?shopify_product_id=eq.${productId}&select=*`, {
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'apikey': serviceRoleKey,
                        'Content-Type': 'application/json'
                    }
                });

                if (!productResponse.ok) {
                    throw new Error(`Failed to fetch vendor product ${productId}: ${productResponse.statusText}`);
                }

                const productData = await productResponse.json();
                
                if (!productData || productData.length === 0) {
                    throw new Error(`Vendor product ${productId} not found`);
                }

                const vendorProduct = productData[0];
                console.log(`Found vendor product:`, vendorProduct.title);

                // Fetch all variants for this product
                const variantsResponse = await fetch(`${supabaseUrl}/rest/v1/vendor_variants?shopify_product_id=eq.${productId}&select=*`, {
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'apikey': serviceRoleKey,
                        'Content-Type': 'application/json'
                    }
                });

                if (!variantsResponse.ok) {
                    throw new Error(`Failed to fetch variants for product ${productId}: ${variantsResponse.statusText}`);
                }

                const variantsData = await variantsResponse.json();
                console.log(`Found ${variantsData.length} variants for product ${productId}`);

                // Fetch product images
                const imagesResponse = await fetch(`${supabaseUrl}/rest/v1/vendor_images?shopify_product_id=eq.${productId}&select=*`, {
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'apikey': serviceRoleKey,
                        'Content-Type': 'application/json'
                    }
                });

                if (!imagesResponse.ok) {
                    throw new Error(`Failed to fetch images for product ${productId}: ${imagesResponse.statusText}`);
                }

                const imagesData = await imagesResponse.json();
                console.log(`Found ${imagesData.length} images for product ${productId}`);

                // Now process the import for this product
                const importResult = await importProduct({
                    vendorProduct,
                    variants: variantsData,
                    images: imagesData,
                    supabaseUrl,
                    serviceRoleKey
                });

                importResults.push({
                    vendorProductId: productId,
                    success: true,
                    result: importResult
                });

                console.log(`Successfully imported product ${productId}`);

            } catch (error) {
                console.error(`Error importing product ${productId}:`, error);
                errors.push({
                    vendorProductId: productId,
                    error: error.message
                });
            }
        }

        // Return the results
        const response = {
            data: {
                imported: importResults,
                errors: errors,
                summary: {
                    total: productIds.length,
                    successful: importResults.length,
                    failed: errors.length
                }
            }
        };

        return new Response(JSON.stringify(response), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Import function error:', error);

        const errorResponse = {
            error: {
                code: 'IMPORT_FAILED',
                message: error.message
            }
        };

        return new Response(JSON.stringify(errorResponse), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});

// Helper function to import a single product
async function importProduct({ vendorProduct, variants, images, supabaseUrl, serviceRoleKey }) {
        // Generate a unique handle
        let baseHandle = vendorProduct.handle || vendorProduct.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        let uniqueHandle = baseHandle;
        
        // Check if handle already exists and generate unique one if needed
        const handleCheckResponse = await fetch(`${supabaseUrl}/rest/v1/products?handle=eq.${uniqueHandle}&select=id`, {
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey
            }
        });
        
        if (handleCheckResponse.ok) {
            const existingProducts = await handleCheckResponse.json();
            if (existingProducts.length > 0) {
                // Product with this handle already exists, append timestamp to make it unique
                uniqueHandle = `${baseHandle}-${Date.now()}`;
                console.log(`Handle collision detected, using unique handle: ${uniqueHandle}`);
            }
        }

        const productData = {
            name: vendorProduct.title,
            description: vendorProduct.body_html || '',
            category: vendorProduct.product_type || 'General',
            sku: vendorProduct.handle || `VENDOR-${vendorProduct.shopify_product_id}`,
            base_price: variants.length > 0 ? Math.round(parseFloat(variants[0].price) * 100) : 0, // Use first variant price in cents
            status: 'active',
            product_type: vendorProduct.product_type || 'general',
            vendor: vendorProduct.vendor || '',
            tags: vendorProduct.tags || [],
            handle: uniqueHandle,
            visibility: true,
            featured: false,
            requires_shipping: true,
            taxable: true,
            track_inventory: true,
            weight: 0,
            additional_info: {
                shopify_product_id: vendorProduct.shopify_product_id,
                vendor_product_id: vendorProduct.shopify_product_id,
                import_source: 'vendor_shopify',
                imported_at: new Date().toISOString()
            },
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

    console.log('Creating main product record:', productData.name);

    const productResponse = await fetch(`${supabaseUrl}/rest/v1/products`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'apikey': serviceRoleKey,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
        },
        body: JSON.stringify(productData)
    });

    if (!productResponse.ok) {
        const errorText = await productResponse.text();
        throw new Error(`Failed to create product: ${errorText}`);
    }

    const createdProducts = await productResponse.json();
    const newProduct = createdProducts[0];
    console.log(`Created product with ID: ${newProduct.id}`);

    // Step 2: Create product variants
    const createdVariants = [];
    for (const vendorVariant of variants) {
        const variantData = {
            product_id: newProduct.id,
            title: `${vendorProduct.title} - ${vendorVariant.option1 || 'Default'}`,
            price: Math.round(parseFloat(vendorVariant.price) * 100), // Convert to cents
            compare_at_price: vendorVariant.compare_at_price ? Math.round(parseFloat(vendorVariant.compare_at_price) * 100) : null,
            sku: vendorVariant.sku || '',
            barcode: vendorVariant.barcode || '',
            inventory_quantity: 0, // Set to 0 initially, will be managed via inventory sync
            weight: 0,
            option1: vendorVariant.option1,
            option2: vendorVariant.option2,
            option3: vendorVariant.option3,
            available: true,
            allow_backorders: false,
            vendor_inventory_item_id: vendorVariant.inventory_item_id, // Critical for inventory sync!
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        console.log(`Creating variant: ${variantData.title}`);

        const variantResponse = await fetch(`${supabaseUrl}/rest/v1/product_variants`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey,
                'Content-Type': 'application/json',
                'Prefer': 'return=representation'
            },
            body: JSON.stringify(variantData)
        });

        if (!variantResponse.ok) {
            const errorText = await variantResponse.text();
            throw new Error(`Failed to create variant: ${errorText}`);
        }

        const createdVariantResponse = await variantResponse.json();
        createdVariants.push(createdVariantResponse[0]);
    }

    console.log(`Created ${createdVariants.length} variants`);

    // Step 3: Process and upload images
    const createdImages = [];
    for (let i = 0; i < images.length; i++) {
        const vendorImage = images[i];
        try {
            console.log(`Processing image ${i + 1}/${images.length}: ${vendorImage.src}`);

            // Download the image from the vendor URL
            const imageResponse = await fetch(vendorImage.src);
            if (!imageResponse.ok) {
                console.error(`Failed to download image from ${vendorImage.src}`);
                continue;
            }

            const imageBuffer = await imageResponse.arrayBuffer();
            const imageData = new Uint8Array(imageBuffer);

            // Generate a unique filename
            const imageExtension = vendorImage.src.split('.').pop()?.split('?')[0] || 'jpg';
            const filename = `product-${newProduct.id}-image-${i + 1}-${Date.now()}.${imageExtension}`;

            // Upload to Supabase Storage
            const uploadResponse = await fetch(`${supabaseUrl}/storage/v1/object/product-images/${filename}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'Content-Type': imageResponse.headers.get('content-type') || 'image/jpeg',
                    'x-upsert': 'true'
                },
                body: imageData
            });

            if (!uploadResponse.ok) {
                const errorText = await uploadResponse.text();
                console.error(`Failed to upload image: ${errorText}`);
                continue;
            }

            // Get the public URL
            const publicUrl = `${supabaseUrl}/storage/v1/object/public/product-images/${filename}`;

            // Create the products_images record
            const imageRecord = {
                product_id: newProduct.id,
                image_url: publicUrl,
                alt_text: vendorImage.alt || newProduct.name,
                position: vendorImage.position || (i + 1),
                width: vendorImage.width,
                height: vendorImage.height,
                vendor_image_id: vendorImage.shopify_image_id,
                created_at: new Date().toISOString()
            };

            const imageRecordResponse = await fetch(`${supabaseUrl}/rest/v1/products_images`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey,
                    'Content-Type': 'application/json',
                    'Prefer': 'return=representation'
                },
                body: JSON.stringify(imageRecord)
            });

            if (!imageRecordResponse.ok) {
                const errorText = await imageRecordResponse.text();
                console.error(`Failed to create image record: ${errorText}`);
                continue;
            }

            const createdImageRecord = await imageRecordResponse.json();
            createdImages.push(createdImageRecord[0]);
            console.log(`Successfully uploaded and saved image: ${filename}`);

        } catch (error) {
            console.error(`Error processing image ${vendorImage.src}:`, error);
        }
    }

    console.log(`Created ${createdImages.length} image records`);

    // Step 4: Update vendor_import_decisions table
    const importDecision = {
        vendor_product_id: vendorProduct.shopify_product_id,
        product_id: newProduct.id,
        decision: 'imported',
        imported_at: new Date().toISOString(),
        notes: `Imported ${variants.length} variants and ${createdImages.length} images`
    };

    const decisionResponse = await fetch(`${supabaseUrl}/rest/v1/vendor_import_decisions`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'apikey': serviceRoleKey,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(importDecision)
    });

    if (!decisionResponse.ok) {
        console.error('Failed to update import decisions table');
    }

    return {
        product: newProduct,
        variants: createdVariants,
        images: createdImages,
        vendorProductId: vendorProduct.shopify_product_id
    };
}