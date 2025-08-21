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
        console.log('Starting scheduled inventory sync...');
        
        // Get Supabase configuration
        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
        const supabaseUrl = Deno.env.get('SUPABASE_URL');
        const shopifyDomain = Deno.env.get('SHOPIFY_STORE_DOMAIN');
        const shopifyToken = Deno.env.get('SHOPIFY_ADMIN_TOKEN');
        const shopifyLocationId = Deno.env.get('SHOPIFY_LOCATION_ID');

        if (!serviceRoleKey || !supabaseUrl || !shopifyDomain || !shopifyToken || !shopifyLocationId) {
            throw new Error('Missing required environment variables');
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
                sync_type: 'scheduled',
                triggered_by: 'system',
                shopify_location_id: parseInt(shopifyLocationId)
            })
        });

        if (!syncLogResponse.ok) {
            throw new Error('Failed to create sync log entry');
        }

        const syncLogData = await syncLogResponse.json();
        const syncBatchId = syncLogData[0].id;
        console.log(`Created sync batch: ${syncBatchId}`);

        // Get all vendor products that need inventory sync
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
        console.log(`Found ${vendorProducts.length} vendor products to sync`);

        if (vendorProducts.length === 0) {
            await updateSyncLog(supabaseUrl, serviceRoleKey, syncBatchId, {
                status: 'completed',
                completed_at: new Date().toISOString(),
                products_synced: 0
            });
            
            return new Response(JSON.stringify({
                data: {
                    syncBatchId,
                    message: 'No vendor products found to sync',
                    productsProcessed: 0
                }
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        let productsProcessed = 0;
        let errorsCount = 0;
        const errors = [];

        // Process products in batches to avoid API rate limits
        const BATCH_SIZE = 10;
        const productIds = vendorProducts.map(p => p.shopify_product_id);
        
        for (let i = 0; i < productIds.length; i += BATCH_SIZE) {
            const batch = productIds.slice(i, i + BATCH_SIZE);
            console.log(`Processing batch ${Math.floor(i / BATCH_SIZE) + 1}: products ${i + 1}-${Math.min(i + BATCH_SIZE, productIds.length)}`);
            
            try {
                await processBatch(batch, shopifyDomain, shopifyToken, shopifyLocationId, supabaseUrl, serviceRoleKey, syncBatchId);
                productsProcessed += batch.length;
                
                // Add delay between batches to respect rate limits
                if (i + BATCH_SIZE < productIds.length) {
                    await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second delay
                }
            } catch (error) {
                console.error(`Batch processing error:`, error);
                errorsCount += batch.length;
                errors.push({
                    batch: Math.floor(i / BATCH_SIZE) + 1,
                    productIds: batch,
                    error: error.message
                });
            }
        }

        // Update sync log with final results
        await updateSyncLog(supabaseUrl, serviceRoleKey, syncBatchId, {
            status: errorsCount === 0 ? 'completed' : 'failed',
            completed_at: new Date().toISOString(),
            products_synced: productsProcessed,
            errors_count: errorsCount,
            error_details: errors.length > 0 ? { errors } : null
        });

        console.log(`Sync completed. Processed: ${productsProcessed}, Errors: ${errorsCount}`);

        return new Response(JSON.stringify({
            data: {
                syncBatchId,
                productsProcessed,
                errorsCount,
                status: errorsCount === 0 ? 'completed' : 'failed',
                errors: errors.length > 0 ? errors : undefined
            }
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Scheduled inventory sync error:', error);

        const errorResponse = {
            error: {
                code: 'SYNC_FAILED',
                message: error.message
            }
        };

        return new Response(JSON.stringify(errorResponse), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});

// Helper function to process a batch of products
async function processBatch(productIds, shopifyDomain, shopifyToken, shopifyLocationId, supabaseUrl, serviceRoleKey, syncBatchId) {
    // Get inventory levels from Shopify for this batch
    const inventoryPromises = productIds.map(async (productId) => {
        try {
            // First get the variants for this product
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
                        inventoryUpdates.push({
                            shopify_product_id: productId,
                            shopify_variant_id: variant.id,
                            inventory_item_id: inventoryItemId,
                            location_id: parseInt(shopifyLocationId),
                            available: level.available,
                            sync_batch_id: syncBatchId,
                            last_change_at: new Date().toISOString()
                        });
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
        return;
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

    console.log(`Updated ${flatUpdates.length} inventory levels for batch`);
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