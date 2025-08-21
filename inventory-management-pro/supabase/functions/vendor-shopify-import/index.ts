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

        if (!supabaseUrl || !serviceRoleKey) {
            throw new Error('Missing required environment variables');
        }

        // Parse request body
        const { productIds, overrides = {} } = await req.json();
        
        if (!productIds || !Array.isArray(productIds)) {
            throw new Error('productIds array is required');
        }

        const importedProducts = [];
        
        for (const productId of productIds) {
            // Get vendor product data
            const vendorProductResponse = await fetch(`${supabaseUrl}/rest/v1/vendor_products?shopify_product_id=eq.${productId}&select=*,vendor_variants(*),vendor_images(*)`, {
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey
                }
            });
            
            if (!vendorProductResponse.ok) {
                throw new Error(`Failed to fetch vendor product ${productId}`);
            }
            
            const vendorProducts = await vendorProductResponse.json();
            
            if (vendorProducts.length === 0) {
                continue; // Skip if product not found
            }
            
            const vendorProduct = vendorProducts[0];
            const productOverride = overrides[productId] || {};

            // Check if product already exists in our catalog
            const existingProductResponse = await fetch(`${supabaseUrl}/rest/v1/products?handle=eq.vendor-${vendorProduct.handle}`, {
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey
                }
            });
            
            const existingProducts = await existingProductResponse.json();
            
            let ourProductId;
            
            if (existingProducts.length === 0) {
                // Create new product
                const newProductResponse = await fetch(`${supabaseUrl}/rest/v1/products`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'apikey': serviceRoleKey,
                        'Content-Type': 'application/json',
                        'Prefer': 'return=representation'
                    },
                    body: JSON.stringify({
                        name: productOverride.title || vendorProduct.title,
                        description: vendorProduct.body_html || '',
                        handle: `vendor-${vendorProduct.handle}`,
                        category: vendorProduct.product_type || 'General',
                        tags: vendorProduct.tags || [],
                        status: 'active',
                        vendor_source: 'shopify',
                        vendor_id: productId
                    })
                });
                
                if (!newProductResponse.ok) {
                    throw new Error(`Failed to create product for vendor product ${productId}`);
                }
                
                const newProduct = await newProductResponse.json();
                ourProductId = newProduct[0].id;
            } else {
                ourProductId = existingProducts[0].id;
            }

            // Create/update variants
            for (const vendorVariant of vendorProduct.vendor_variants) {
                // Check if variant already exists
                const existingVariantResponse = await fetch(`${supabaseUrl}/rest/v1/product_variants?product_id=eq.${ourProductId}&sku=eq.${vendorVariant.sku}`, {
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'apikey': serviceRoleKey
                    }
                });
                
                const existingVariants = await existingVariantResponse.json();
                
                const variantData = {
                    product_id: ourProductId,
                    sku: vendorVariant.sku,
                    price: productOverride.price || vendorVariant.price,
                    barcode: vendorVariant.barcode,
                    option_1: vendorVariant.option1,
                    option_2: vendorVariant.option2,
                    option_3: vendorVariant.option3,
                    vendor_inventory_item_id: vendorVariant.inventory_item_id,
                    vendor_location_id: parseInt(shopifyLocationId || '0'),
                    status: 'active'
                };
                
                if (existingVariants.length === 0) {
                    // Create new variant
                    await fetch(`${supabaseUrl}/rest/v1/product_variants`, {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${serviceRoleKey}`,
                            'apikey': serviceRoleKey,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(variantData)
                    });
                } else {
                    // Update existing variant
                    await fetch(`${supabaseUrl}/rest/v1/product_variants?id=eq.${existingVariants[0].id}`, {
                        method: 'PATCH',
                        headers: {
                            'Authorization': `Bearer ${serviceRoleKey}`,
                            'apikey': serviceRoleKey,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(variantData)
                    });
                }
            }

            // Handle product images
            if (vendorProduct.vendor_images && vendorProduct.vendor_images.length > 0) {
                const primaryImage = vendorProduct.vendor_images.find((img: any) => img.position === 1) || vendorProduct.vendor_images[0];
                const imageUrl = productOverride.image || primaryImage.src;
                
                // Update product with primary image
                await fetch(`${supabaseUrl}/rest/v1/products?id=eq.${ourProductId}`, {
                    method: 'PATCH',
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'apikey': serviceRoleKey,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        image_url: imageUrl
                    })
                });
            }

            // Update import decision
            await fetch(`${supabaseUrl}/rest/v1/vendor_import_decisions`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey,
                    'Content-Type': 'application/json',
                    'Prefer': 'resolution=merge-duplicates'
                },
                body: JSON.stringify({
                    shopify_product_id: productId,
                    decision: 'imported',
                    decided_at: new Date().toISOString()
                })
            });

            // Store any overrides
            if (Object.keys(productOverride).length > 0) {
                await fetch(`${supabaseUrl}/rest/v1/product_overrides`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'apikey': serviceRoleKey,
                        'Content-Type': 'application/json',
                        'Prefer': 'resolution=merge-duplicates'
                    },
                    body: JSON.stringify({
                        shopify_product_id: productId,
                        title_override: productOverride.title,
                        price_override_strategy: productOverride.priceStrategy || 'absolute',
                        price_value: productOverride.price,
                        primary_image_url_override: productOverride.image
                    })
                });
            }
            
            importedProducts.push({
                shopify_product_id: productId,
                our_product_id: ourProductId,
                title: productOverride.title || vendorProduct.title
            });
        }

        return new Response(JSON.stringify({
            data: {
                success: true,
                imported: importedProducts,
                totalImported: importedProducts.length,
                message: `Successfully imported ${importedProducts.length} products`
            }
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Import error:', error);

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