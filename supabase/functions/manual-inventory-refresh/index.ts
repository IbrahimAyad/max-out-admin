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
        // Parse request body
        const requestData = await req.json();
        const { productIds, refreshType = 'all' } = requestData;
        
        console.log(`Starting manual inventory refresh: ${refreshType}`, { productIds });
        
        // Get Supabase configuration
        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
        const supabaseUrl = Deno.env.get('SUPABASE_URL');
        const shopifyDomain = Deno.env.get('SHOPIFY_STORE_DOMAIN');
        const shopifyToken = Deno.env.get('SHOPIFY_ADMIN_TOKEN');
        const shopifyLocationId = Deno.env.get('SHOPIFY_LOCATION_ID');

        if (!serviceRoleKey || !supabaseUrl || !shopifyDomain || !shopifyToken || !shopifyLocationId) {
            throw new Error('Missing required environment variables');
        }

        // Rate limiting check - prevent excessive API calls
        const recentSyncResponse = await fetch(
            `${supabaseUrl}/rest/v1/inventory_sync_log?sync_type=eq.manual&started_at=gte.${new Date(Date.now() - 5 * 60 * 1000).toISOString()}&order=started_at.desc&limit=1`,
            {
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey
                }
            }
        );

        if (recentSyncResponse.ok) {
            const recentSyncs = await recentSyncResponse.json();
            if (recentSyncs.length > 0) {
                const lastSync = recentSyncs[0];
                if (lastSync.status === 'running') {
                    return new Response(JSON.stringify({
                        error: {
                            code: 'SYNC_IN_PROGRESS',
                            message: 'An inventory sync is already in progress. Please wait for it to complete.'
                        }
                    }), {
                        status: 429,
                        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                    });
                }
                
                const timeSinceLastSync = Date.now() - new Date(lastSync.started_at).getTime();
                if (timeSinceLastSync < 5 * 60 * 1000) { // 5 minutes
                    return new Response(JSON.stringify({
                        error: {
                            code: 'RATE_LIMITED',
                            message: 'Manual refresh is limited to once every 5 minutes. Please try again later.',
                            nextAllowedTime: new Date(new Date(lastSync.started_at).getTime() + 5 * 60 * 1000).toISOString()
                        }
                    }), {
                        status: 429,
                        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                    });
                }
            }
        }

        // Create sync log entry
        const syncLogResponse = await fetch(`${supabaseUrl}/rest/v1/inventory_sync_log`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey,
                'Content-Type': 'application/json',
                'Prefer': 'return=representation'
            },
            body: JSON.stringify({
                sync_type: 'manual',
                triggered_by: 'admin',
                shopify_location_id: parseInt(shopifyLocationId)
            })
        });

        if (!syncLogResponse.ok) {
            throw new Error('Failed to create sync log entry');
        }

        const syncLogData = await syncLogResponse.json();
        const syncBatchId = syncLogData[0].id;
        console.log(`Created manual sync batch: ${syncBatchId}`);

        // Determine which products to sync
        let targetProductIds = [];
        
        if (refreshType === 'selected' && productIds && productIds.length > 0) {
            targetProductIds = productIds;
        } else {
            // Get all vendor products
            const vendorProductsResponse = await fetch(
                `${supabaseUrl}/rest/v1/vendor_products?select=shopify_product_id`, 
                {
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'apikey': serviceRoleKey
                    }
                }
            );

            if (!vendorProductsResponse.ok) {
                throw new Error('Failed to fetch vendor products');
            }

            const vendorProducts = await vendorProductsResponse.json();
            targetProductIds = vendorProducts.map(p => p.shopify_product_id);
        }

        console.log(`Manual refresh targeting ${targetProductIds.length} products`);

        if (targetProductIds.length === 0) {
            await updateSyncLog(supabaseUrl, serviceRoleKey, syncBatchId, {
                status: 'completed',
                completed_at: new Date().toISOString(),
                products_synced: 0
            });
            
            return new Response(JSON.stringify({
                data: {
                    syncBatchId,
                    message: 'No products found to sync',
                    productsProcessed: 0,
                    refreshType
                }
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        let productsProcessed = 0;
        let errorsCount = 0;
        const errors = [];
        const progressUpdates = [];

        // Process products in smaller batches for manual refresh (more responsive)
        const BATCH_SIZE = 5;
        
        for (let i = 0; i < targetProductIds.length; i += BATCH_SIZE) {
            const batch = targetProductIds.slice(i, i + BATCH_SIZE);
            const batchNumber = Math.floor(i / BATCH_SIZE) + 1;
            const totalBatches = Math.ceil(targetProductIds.length / BATCH_SIZE);
            
            console.log(`Processing batch ${batchNumber}/${totalBatches}: products ${i + 1}-${Math.min(i + BATCH_SIZE, targetProductIds.length)}`);
            
            try {
                const batchResult = await processInventoryBatch(batch, shopifyDomain, shopifyToken, shopifyLocationId, supabaseUrl, serviceRoleKey, syncBatchId);
                productsProcessed += batch.length;
                
                progressUpdates.push({
                    batch: batchNumber,
                    totalBatches,
                    processed: Math.min(i + BATCH_SIZE, targetProductIds.length),
                    total: targetProductIds.length,
                    percentage: Math.round((Math.min(i + BATCH_SIZE, targetProductIds.length) / targetProductIds.length) * 100),
                    inventoryUpdates: batchResult.inventoryUpdates
                });
                
                // Shorter delay for manual refresh to be more responsive
                if (i + BATCH_SIZE < targetProductIds.length) {
                    await new Promise(resolve => setTimeout(resolve, 500)); // 0.5 second delay
                }
            } catch (error) {
                console.error(`Manual refresh batch processing error:`, error);
                errorsCount += batch.length;
                errors.push({
                    batch: batchNumber,
                    productIds: batch,
                    error: error.message
                });
            }
        }

        // Update sync log with final results
        const finalStatus = errorsCount === 0 ? 'completed' : 'failed';
        await updateSyncLog(supabaseUrl, serviceRoleKey, syncBatchId, {
            status: finalStatus,
            completed_at: new Date().toISOString(),
            products_synced: productsProcessed,
            errors_count: errorsCount,
            error_details: errors.length > 0 ? { errors, progressUpdates } : { progressUpdates }
        });

        console.log(`Manual refresh completed. Processed: ${productsProcessed}, Errors: ${errorsCount}`);

        return new Response(JSON.stringify({
            data: {
                syncBatchId,
                productsProcessed,
                errorsCount,
                status: finalStatus,
                refreshType,
                progressUpdates,
                summary: {
                    totalProducts: targetProductIds.length,
                    successful: productsProcessed,
                    failed: errorsCount,
                    inventoryItemsUpdated: progressUpdates.reduce((sum, update) => sum + (update.inventoryUpdates || 0), 0)
                },
                timestamp: new Date().toISOString(),
                errors: errors.length > 0 ? errors : undefined
            }
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Manual inventory refresh error:', error);

        const errorResponse = {
            error: {
                code: 'MANUAL_REFRESH_FAILED',
                message: error.message
            }
        };

        return new Response(JSON.stringify(errorResponse), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});

// Helper function to process a batch of products for manual refresh
async function processInventoryBatch(productIds, shopifyDomain, shopifyToken, shopifyLocationId, supabaseUrl, serviceRoleKey, syncBatchId) {
    console.log(`Processing inventory batch for products: ${productIds.join(', ')}`);
    
    let inventoryUpdatesCount = 0;
    
    // Get inventory levels from Shopify for this batch
    const inventoryPromises = productIds.map(async (productId) => {
        try {
            // Get the variants for this product
            const variantsResponse = await fetch(
                `https://${shopifyDomain}/admin/api/2023-10/products/${productId}.json`,
                {
                    headers: {
                        'X-Shopify-Access-Token': shopifyToken,
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (!variantsResponse.ok) {
                throw new Error(`Failed to fetch product ${productId}: ${variantsResponse.statusText}`);
            }

            const productData = await variantsResponse.json();
            const variants = productData.product.variants;

            // Get current inventory levels for comparison
            const currentInventoryResponse = await fetch(
                `${supabaseUrl}/rest/v1/vendor_inventory_levels?shopify_product_id=eq.${productId}&select=*`,
                {
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'apikey': serviceRoleKey
                    }
                }
            );

            const currentInventory = currentInventoryResponse.ok ? await currentInventoryResponse.json() : [];
            const currentInventoryMap = new Map(currentInventory.map(item => [item.shopify_variant_id, item.available]));

            // Get inventory levels for each variant
            const inventoryUpdates = [];
            
            for (const variant of variants) {
                const inventoryItemId = variant.inventory_item_id;
                
                // Get inventory level for this item at the specified location
                const inventoryResponse = await fetch(
                    `https://${shopifyDomain}/admin/api/2023-10/inventory_levels.json?inventory_item_ids=${inventoryItemId}&location_ids=${shopifyLocationId}`,
                    {
                        headers: {
                            'X-Shopify-Access-Token': shopifyToken,
                            'Content-Type': 'application/json'
                        }
                    }
                );

                if (inventoryResponse.ok) {
                    const inventoryData = await inventoryResponse.json();
                    if (inventoryData.inventory_levels && inventoryData.inventory_levels.length > 0) {
                        const level = inventoryData.inventory_levels[0];
                        const previousAvailable = currentInventoryMap.get(variant.id) || null;
                        
                        inventoryUpdates.push({
                            shopify_product_id: productId,
                            shopify_variant_id: variant.id,
                            inventory_item_id: inventoryItemId,
                            location_id: parseInt(shopifyLocationId),
                            available: level.available,
                            previous_available: previousAvailable,
                            sync_batch_id: syncBatchId,
                            last_change_at: new Date().toISOString()
                        });
                        
                        inventoryUpdatesCount++;
                    }
                }
                
                // Small delay between API calls
                await new Promise(resolve => setTimeout(resolve, 100));
            }

            return inventoryUpdates;
        } catch (error) {
            console.error(`Error processing product ${productId}:`, error);
            return [];
        }
    });

    const allUpdates = await Promise.all(inventoryPromises);
    const flatUpdates = allUpdates.flat();

    if (flatUpdates.length === 0) {
        return { inventoryUpdates: 0 };
    }

    // Upsert inventory levels in Supabase
    const upsertResponse = await fetch(`${supabaseUrl}/rest/v1/vendor_inventory_levels`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'apikey': serviceRoleKey,
            'Content-Type': 'application/json',
            'Prefer': 'resolution=merge-duplicates'
        },
        body: JSON.stringify(flatUpdates)
    });

    if (!upsertResponse.ok) {
        const errorText = await upsertResponse.text();
        throw new Error(`Failed to update inventory levels: ${errorText}`);
    }

    // Also sync inventory to main product_variants table for imported products
    const syncMainInventoryPromises = flatUpdates.map(async (update) => {
        try {
            // Find matching imported product variants by vendor_inventory_item_id
            const variantsResponse = await fetch(
                `${supabaseUrl}/rest/v1/enhanced_product_variants?select=id&vendor_inventory_item_id=eq.${update.inventory_item_id}`,
                {
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'apikey': serviceRoleKey
                    }
                }
            );
            
            if (variantsResponse.ok) {
                const matchingVariants = await variantsResponse.json();
                
                // Update each matching variant's inventory
                const updatePromises = matchingVariants.map(variant =>
                    fetch(`${supabaseUrl}/rest/v1/enhanced_product_variants?id=eq.${variant.id}`, {
                        method: 'PATCH',
                        headers: {
                            'Authorization': `Bearer ${serviceRoleKey}`,
                            'apikey': serviceRoleKey,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            inventory_quantity: update.available,
                            available_quantity: update.available,
                            stock_status: update.available > 0 ? 'in_stock' : 'out_of_stock',
                            last_inventory_update: update.last_change_at
                        })
                    })
                );
                
                await Promise.all(updatePromises);
                console.log(`Updated ${matchingVariants.length} product variants for inventory item ${update.inventory_item_id}`);
            }
        } catch (error) {
            console.error(`Failed to sync inventory to main product table for item ${update.inventory_item_id}:`, error);
        }
    });

    await Promise.all(syncMainInventoryPromises);
    console.log(`Updated ${flatUpdates.length} inventory levels and synced to main product table for manual refresh batch`);
    
    return { inventoryUpdates: flatUpdates.length };
}

// Helper function to update sync log
async function updateSyncLog(supabaseUrl, serviceRoleKey, syncBatchId, updates) {
    const updateResponse = await fetch(`${supabaseUrl}/rest/v1/inventory_sync_log?id=eq.${syncBatchId}`, {
        method: 'PATCH',
        headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'apikey': serviceRoleKey,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            ...updates,
            updated_at: new Date().toISOString()
        })
    });

    if (!updateResponse.ok) {
        console.error('Failed to update sync log');
    }
}