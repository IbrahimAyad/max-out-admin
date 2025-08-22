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

        console.log(`Starting grouped import for ${productIds.length} products:`, productIds);

        // Get Supabase configuration
        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
        const supabaseUrl = Deno.env.get('SUPABASE_URL');

        if (!serviceRoleKey || !supabaseUrl) {
            throw new Error('Supabase configuration missing');
        }

        // Fetch all vendor data in one go for efficient processing
        const vendorData = await fetchAllVendorData(productIds, supabaseUrl, serviceRoleKey);
        
        // Group products by base_product_code + color for proper variant grouping
        const productGroups = groupProductsByColorVariant(vendorData);
        
        console.log(`Grouped ${productIds.length} vendor products into ${Object.keys(productGroups).length} main products`);

        const importResults = [];
        const errors = [];

        // Process each product group
        for (const [groupKey, groupData] of Object.entries(productGroups)) {
            try {
                console.log(`Processing product group: ${groupKey}`);
                
                const importResult = await importProductGroup({
                    groupKey,
                    groupData,
                    supabaseUrl,
                    serviceRoleKey
                });

                importResults.push({
                    groupKey,
                    success: true,
                    result: importResult
                });

                console.log(`Successfully imported product group: ${groupKey}`);

            } catch (error) {
                console.error(`Error importing product group ${groupKey}:`, error);
                errors.push({
                    groupKey,
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
                    totalVendorProducts: productIds.length,
                    productGroupsCreated: importResults.length,
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

// Fetch all vendor data efficiently
async function fetchAllVendorData(productIds, supabaseUrl, serviceRoleKey) {
    const vendorData = {};
    
    // Fetch all products
    const productIdsParam = productIds.join(',');
    
    const [productsResponse, variantsResponse, imagesResponse, inventoryResponse] = await Promise.all([
        fetch(`${supabaseUrl}/rest/v1/vendor_products?shopify_product_id=in.(${productIdsParam})&select=*`, {
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey
            }
        }),
        fetch(`${supabaseUrl}/rest/v1/vendor_variants?shopify_product_id=in.(${productIdsParam})&select=*`, {
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey
            }
        }),
        fetch(`${supabaseUrl}/rest/v1/vendor_images?shopify_product_id=in.(${productIdsParam})&select=*`, {
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey
            }
        }),
        fetch(`${supabaseUrl}/rest/v1/vendor_inventory_levels?select=*`, {
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey
            }
        })
    ]);

    const [products, variants, images, inventory] = await Promise.all([
        productsResponse.json(),
        variantsResponse.json(),
        imagesResponse.json(),
        inventoryResponse.json()
    ]);

    // Organize the data by product ID
    for (const product of products) {
        const productId = product.shopify_product_id;
        vendorData[productId] = {
            product,
            variants: variants.filter(v => v.shopify_product_id === productId),
            images: images.filter(i => i.shopify_product_id === productId),
            inventory: {}
        };
        
        // Map inventory by inventory_item_id
        const productVariants = vendorData[productId].variants;
        for (const variant of productVariants) {
            const inventoryLevel = inventory.find(inv => inv.inventory_item_id === variant.inventory_item_id);
            if (inventoryLevel) {
                vendorData[productId].inventory[variant.inventory_item_id] = inventoryLevel.available || 0;
            }
        }
    }
    
    return vendorData;
}

// Group products by base_product_code + color for proper variant grouping
function groupProductsByColorVariant(vendorData) {
    const groups = {};
    
    for (const [productId, data] of Object.entries(vendorData)) {
        const { product, variants } = data;
        
        // Extract base product code from SKU (e.g., "KS001" from "KS001-RED-10")
        const firstVariant = variants[0];
        if (!firstVariant) continue;
        
        const baseSku = firstVariant.sku || '';
        const baseProductCode = baseSku.match(/^([^-]+)/)?.[1] || product.handle;
        
        // Group by base product + color (option1 is typically color)
        const colorCode = firstVariant.option1 || 'default';
        const groupKey = `${baseProductCode}-${colorCode}`.toLowerCase();
        
        if (!groups[groupKey]) {
            groups[groupKey] = {
                baseProductCode,
                colorCode,
                colorName: firstVariant.option1 || 'Default',
                title: product.title,
                description: product.body_html || '',
                category: product.product_type || 'General',
                vendor: product.vendor || '',
                tags: product.tags || [],
                basePrice: Math.round(parseFloat(firstVariant.price) * 100),
                variants: [],
                images: [],
                vendorProductIds: []
            };
        }
        
        // Add all variants and data to this group
        groups[groupKey].variants.push(...variants);
        groups[groupKey].images.push(...data.images);
        groups[groupKey].vendorProductIds.push(productId);
        
        // Update inventory mapping
        if (!groups[groupKey].inventory) {
            groups[groupKey].inventory = {};
        }
        Object.assign(groups[groupKey].inventory, data.inventory);
    }
    
    return groups;
}

// Import a product group (base product + color variants)
async function importProductGroup({ groupKey, groupData, supabaseUrl, serviceRoleKey }) {
    const { baseProductCode, colorCode, colorName, title, description, category, vendor, tags, basePrice, variants, images } = groupData;
    
    // Create the main product name with color
    const productName = `${title} - ${colorName}`;
    const handle = `${baseProductCode}-${colorCode}`.toLowerCase();
    
    console.log(`Creating main product: ${productName}`);
    
    // Check if product already exists
    const existingProductResponse = await fetch(`${supabaseUrl}/rest/v1/products?handle=eq.${handle}&select=id`, {
        headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'apikey': serviceRoleKey
        }
    });
    
    let mainProduct;
    if (existingProductResponse.ok) {
        const existingProducts = await existingProductResponse.json();
        if (existingProducts.length > 0) {
            mainProduct = existingProducts[0];
            console.log(`Using existing product: ${mainProduct.id}`);
        }
    }
    
    if (!mainProduct) {
        // Create new main product
        const productData = {
            name: productName,
            description: description,
            category: category,
            sku: `${baseProductCode}-${colorCode}`,
            base_price: basePrice,
            status: 'active',
            product_type: category,
            vendor: vendor,
            tags: tags,
            handle: handle,
            visibility: true,
            featured: false,
            requires_shipping: true,
            taxable: true,
            track_inventory: true,
            weight: 0,
            additional_info: {
                base_product_code: baseProductCode,
                color_code: colorCode,
                color_name: colorName,
                vendor_product_ids: groupData.vendorProductIds,
                import_source: 'vendor_shopify_grouped',
                imported_at: new Date().toISOString()
            },
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

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
        mainProduct = createdProducts[0];
        console.log(`Created main product: ${mainProduct.id}`);
    }

    // Create variants for all sizes
    const createdVariants = [];
    let totalInventory = 0;
    
    for (const vendorVariant of variants) {
        const size = vendorVariant.option2 || 'Default';
        const variantTitle = `${productName} - Size ${size}`;
        
        const variantData = {
            product_id: mainProduct.id,
            title: variantTitle,
            price: Math.round(parseFloat(vendorVariant.price) * 100),
            compare_at_price: vendorVariant.compare_at_price ? Math.round(parseFloat(vendorVariant.compare_at_price) * 100) : null,
            sku: vendorVariant.sku || '',
            barcode: vendorVariant.barcode || '',
            inventory_quantity: groupData.inventory[vendorVariant.inventory_item_id] || 0,
            weight: 0,
            option1: colorName, // Color
            option2: size, // Size
            option3: vendorVariant.option3,
            available: true,
            allow_backorders: false,
            vendor_inventory_item_id: vendorVariant.inventory_item_id,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };
        
        totalInventory += variantData.inventory_quantity;
        
        console.log(`Creating variant: ${variantTitle} (Qty: ${variantData.inventory_quantity})`);

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
            console.error(`Failed to create variant: ${errorText}`);
            continue;
        }

        const createdVariantResponse = await variantResponse.json();
        createdVariants.push(createdVariantResponse[0]);
    }

    console.log(`Created ${createdVariants.length} variants with total inventory: ${totalInventory}`);

    // Create or update main inventory record
    await createOrUpdateInventory(mainProduct.id, totalInventory, supabaseUrl, serviceRoleKey);
    
    // Process images (take first image from the group)
    const createdImages = [];
    const primaryImage = images.find(img => img.position === 1) || images[0];
    
    if (primaryImage) {
        try {
            console.log(`Processing primary image: ${primaryImage.src}`);
            
            const imageResponse = await fetch(primaryImage.src);
            if (imageResponse.ok) {
                const imageBuffer = await imageResponse.arrayBuffer();
                const imageData = new Uint8Array(imageBuffer);
                
                const imageExtension = primaryImage.src.split('.').pop()?.split('?')[0] || 'jpg';
                const filename = `product-${mainProduct.id}-primary-${Date.now()}.${imageExtension}`;
                
                const uploadResponse = await fetch(`${supabaseUrl}/storage/v1/object/product-images/${filename}`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'Content-Type': imageResponse.headers.get('content-type') || 'image/jpeg',
                        'x-upsert': 'true'
                    },
                    body: imageData
                });
                
                if (uploadResponse.ok) {
                    const publicUrl = `${supabaseUrl}/storage/v1/object/public/product-images/${filename}`;
                    
                    const imageRecord = {
                        product_id: mainProduct.id,
                        image_url: publicUrl,
                        alt_text: primaryImage.alt || productName,
                        position: 1,
                        width: primaryImage.width,
                        height: primaryImage.height,
                        vendor_image_id: primaryImage.shopify_image_id,
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
                    
                    if (imageRecordResponse.ok) {
                        const createdImageRecord = await imageRecordResponse.json();
                        createdImages.push(createdImageRecord[0]);
                        console.log(`Successfully uploaded and saved image: ${filename}`);
                    }
                }
            }
        } catch (error) {
            console.error(`Error processing image:`, error);
        }
    }

    // Update vendor import decisions for all vendor products in this group
    for (const vendorProductId of groupData.vendorProductIds) {
        const importDecision = {
            shopify_product_id: parseInt(vendorProductId),
            decision: 'imported',
            decided_at: new Date().toISOString(),
            notes: `Grouped import: ${createdVariants.length} variants, total inventory: ${totalInventory}`
        };

        await fetch(`${supabaseUrl}/rest/v1/vendor_import_decisions`, {
            method: 'UPSERT',
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(importDecision)
        });
    }

    return {
        product: mainProduct,
        variants: createdVariants,
        images: createdImages,
        totalInventory,
        vendorProductIds: groupData.vendorProductIds
    };
}

// Create or update inventory record
async function createOrUpdateInventory(productId, totalQuantity, supabaseUrl, serviceRoleKey) {
    console.log(`Creating/updating inventory for product ${productId} with quantity ${totalQuantity}`);
    
    // Check if inventory record already exists
    const existingResponse = await fetch(`${supabaseUrl}/rest/v1/inventory?product_id=eq.${productId}&select=*`, {
        headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'apikey': serviceRoleKey
        }
    });
    
    const inventoryData = {
        product_id: productId,
        quantity: totalQuantity,
        reserved_quantity: 0,
        available_quantity: totalQuantity,
        low_stock_threshold: 10,
        updated_at: new Date().toISOString()
    };
    
    if (existingResponse.ok) {
        const existingInventory = await existingResponse.json();
        if (existingInventory.length > 0) {
            // Update existing inventory
            const updateResponse = await fetch(`${supabaseUrl}/rest/v1/inventory?product_id=eq.${productId}`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(inventoryData)
            });
            
            if (updateResponse.ok) {
                console.log(`Updated inventory for product ${productId}`);
            } else {
                console.error(`Failed to update inventory for product ${productId}`);
            }
            return;
        }
    }
    
    // Create new inventory record
    inventoryData.created_at = new Date().toISOString();
    
    const createResponse = await fetch(`${supabaseUrl}/rest/v1/inventory`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'apikey': serviceRoleKey,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(inventoryData)
    });
    
    if (createResponse.ok) {
        console.log(`Created inventory record for product ${productId}`);
    } else {
        const errorText = await createResponse.text();
        console.error(`Failed to create inventory for product ${productId}: ${errorText}`);
    }
}