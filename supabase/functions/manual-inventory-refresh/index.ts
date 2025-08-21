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
        const { productIds, mode = 'batch' } = requestData;

        if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
            throw new Error('productIds array is required and must not be empty');
        }

        console.log(`Starting manual inventory refresh for ${productIds.length} products in ${mode} mode`);

        // Get environment variables
        const SHOPIFY_STORE_DOMAIN = Deno.env.get('SHOPIFY_STORE_DOMAIN');
        const SHOPIFY_ADMIN_TOKEN = Deno.env.get('SHOPIFY_ADMIN_TOKEN');
        const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
        const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

        if (!SHOPIFY_STORE_DOMAIN || !SHOPIFY_ADMIN_TOKEN) {
            throw new Error('Missing Shopify credentials. Please set SHOPIFY_STORE_DOMAIN and SHOPIFY_ADMIN_TOKEN environment variables.');
        }

        if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
            throw new Error('Missing Supabase configuration');
        }

        // Create sync log entry
        const syncLogId = await createSyncLog(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, 'manual', 'admin');
        
        // Initialize the inventory refresh processor
        const processor = new InventoryRefreshProcessor({
            shopifyDomain: SHOPIFY_STORE_DOMAIN,
            shopifyToken: SHOPIFY_ADMIN_TOKEN,
            supabaseUrl: SUPABASE_URL,
            serviceRoleKey: SUPABASE_SERVICE_ROLE_KEY,
            syncLogId
        });

        // Process the inventory refresh
        const result = await processor.processInventoryRefresh(productIds, mode);

        // Update sync log as completed
        await updateSyncLog(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, syncLogId, {
            status: 'completed',
            products_synced: result.successfulProducts,
            errors_count: result.errors.length,
            error_details: result.errors.length > 0 ? result.errors : null,
            completed_at: new Date().toISOString()
        });

        return new Response(JSON.stringify({
            data: {
                syncLogId,
                ...result
            }
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Manual inventory refresh error:', error);

        const errorResponse = {
            error: {
                code: 'INVENTORY_REFRESH_FAILED',
                message: error.message
            }
        };

        return new Response(JSON.stringify(errorResponse), {
            status: error.message.includes('Missing Shopify credentials') ? 400 : 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});

// Main processor class for inventory refresh operations
class InventoryRefreshProcessor {
    private shopifyDomain: string;
    private shopifyToken: string;
    private supabaseUrl: string;
    private serviceRoleKey: string;
    private syncLogId: string;
    
    // Rate limiting configuration
    private readonly BATCH_SIZE = 50; // Process 50 inventory items per API call
    private readonly MAX_RETRIES = 5;
    private readonly BASE_DELAY = 1000; // 1 second base delay
    private readonly MAX_DELAY = 30000; // 30 seconds max delay
    private readonly RATE_LIMIT_DELAY = 2000; // 2 seconds between API calls

    constructor(config: {
        shopifyDomain: string;
        shopifyToken: string;
        supabaseUrl: string;
        serviceRoleKey: string;
        syncLogId: string;
    }) {
        this.shopifyDomain = config.shopifyDomain;
        this.shopifyToken = config.shopifyToken;
        this.supabaseUrl = config.supabaseUrl;
        this.serviceRoleKey = config.serviceRoleKey;
        this.syncLogId = config.syncLogId;
    }

    async processInventoryRefresh(productIds: number[], mode: string) {
        const results = {
            totalProducts: productIds.length,
            successfulProducts: 0,
            failedProducts: 0,
            totalVariantsProcessed: 0,
            inventoryUpdates: 0,
            errors: [] as any[],
            processingTime: Date.now()
        };

        try {
            // Step 1: Get all inventory item IDs for the given products
            const inventoryItems = await this.getInventoryItemsForProducts(productIds);
            console.log(`Found ${inventoryItems.length} inventory items for ${productIds.length} products`);
            
            if (inventoryItems.length === 0) {
                throw new Error('No inventory items found for the specified products');
            }

            // Step 2: Process inventory items in batches
            const batches = this.createBatches(inventoryItems, this.BATCH_SIZE);
            console.log(`Processing ${batches.length} batches of inventory items`);

            for (let i = 0; i < batches.length; i++) {
                const batch = batches[i];
                console.log(`Processing batch ${i + 1}/${batches.length} with ${batch.length} items`);
                
                try {
                    // Add delay between batches to avoid rate limiting
                    if (i > 0) {
                        await this.sleep(this.RATE_LIMIT_DELAY);
                    }

                    const batchResult = await this.processBatch(batch);
                    results.inventoryUpdates += batchResult.updatedCount;
                    results.totalVariantsProcessed += batch.length;
                    
                    // Update progress in sync log
                    const progressPercentage = Math.round(((i + 1) / batches.length) * 100);
                    await this.updateProgress(progressPercentage, results.totalVariantsProcessed);
                    
                } catch (error) {
                    console.error(`Error processing batch ${i + 1}:`, error);
                    results.errors.push({
                        batch: i + 1,
                        error: error.message,
                        inventoryItems: batch.map(item => item.inventory_item_id)
                    });
                }
            }

            // Step 3: Calculate final results
            const processedProductIds = new Set();
            inventoryItems.forEach(item => {
                if (item.shopify_product_id) {
                    processedProductIds.add(item.shopify_product_id);
                }
            });
            
            results.successfulProducts = processedProductIds.size;
            results.failedProducts = productIds.length - results.successfulProducts;
            results.processingTime = Date.now() - results.processingTime;

            console.log(`Inventory refresh completed:`, results);
            return results;

        } catch (error) {
            console.error('Error in processInventoryRefresh:', error);
            results.errors.push({
                type: 'general_error',
                error: error.message
            });
            throw error;
        }
    }

    private async getInventoryItemsForProducts(productIds: number[]) {
        const placeholders = productIds.map(() => '?').join(',');
        const query = `shopify_product_id=in.(${productIds.join(',')})`;
        
        const response = await fetch(
            `${this.supabaseUrl}/rest/v1/vendor_variants?${query}&select=inventory_item_id,shopify_product_id,shopify_variant_id,sku`,
            {
                headers: {
                    'Authorization': `Bearer ${this.serviceRoleKey}`,
                    'apikey': this.serviceRoleKey
                }
            }
        );

        if (!response.ok) {
            throw new Error(`Failed to fetch inventory items: ${response.statusText}`);
        }

        const variants = await response.json();
        return variants.filter(variant => variant.inventory_item_id);
    }

    private createBatches<T>(items: T[], batchSize: number): T[][] {
        const batches: T[][] = [];
        for (let i = 0; i < items.length; i += batchSize) {
            batches.push(items.slice(i, i + batchSize));
        }
        return batches;
    }

    private async processBatch(inventoryItems: any[]) {
        const inventoryItemIds = inventoryItems.map(item => item.inventory_item_id);
        
        // Get current inventory levels from Shopify
        const inventoryLevels = await this.fetchInventoryLevelsWithRetry(inventoryItemIds);
        
        // Update our database with the new inventory levels
        const updatedCount = await this.updateInventoryLevels(inventoryLevels);
        
        return { updatedCount };
    }

    private async fetchInventoryLevelsWithRetry(inventoryItemIds: number[], retryCount = 0): Promise<any[]> {
        try {
            // Use Shopify's Inventory Levels API with batch support
            const inventoryItemIdsParam = inventoryItemIds.join(',');
            const url = `https://${this.shopifyDomain}/admin/api/2023-10/inventory_levels.json?inventory_item_ids=${inventoryItemIdsParam}&limit=250`;
            
            const response = await fetch(url, {
                headers: {
                    'X-Shopify-Access-Token': this.shopifyToken,
                    'Content-Type': 'application/json'
                }
            });

            if (response.status === 429) {
                // Rate limited
                const retryAfter = response.headers.get('Retry-After');
                const delay = retryAfter ? parseInt(retryAfter) * 1000 : this.calculateExponentialBackoff(retryCount);
                
                console.log(`Rate limited. Waiting ${delay}ms before retry ${retryCount + 1}/${this.MAX_RETRIES}`);
                
                if (retryCount >= this.MAX_RETRIES) {
                    throw new Error(`Max retries exceeded after rate limiting`);
                }
                
                await this.sleep(delay);
                return this.fetchInventoryLevelsWithRetry(inventoryItemIds, retryCount + 1);
            }

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Shopify API error: ${response.status} ${response.statusText} - ${errorText}`);
            }

            const data = await response.json();
            return data.inventory_levels || [];

        } catch (error) {
            if (retryCount < this.MAX_RETRIES && !error.message.includes('Rate limited')) {
                console.log(`Error fetching inventory levels, retrying... (${retryCount + 1}/${this.MAX_RETRIES})`);
                const delay = this.calculateExponentialBackoff(retryCount);
                await this.sleep(delay);
                return this.fetchInventoryLevelsWithRetry(inventoryItemIds, retryCount + 1);
            }
            throw error;
        }
    }

    private async updateInventoryLevels(inventoryLevels: any[]) {
        if (inventoryLevels.length === 0) {
            return 0;
        }

        // Prepare data for upsert
        const updateData = inventoryLevels.map(level => ({
            inventory_item_id: level.inventory_item_id,
            location_id: level.location_id,
            available: level.available,
            last_change_at: new Date().toISOString(),
            sync_batch_id: this.syncLogId,
            updated_at: new Date().toISOString()
        }));

        // Batch upsert to database
        const response = await fetch(
            `${this.supabaseUrl}/rest/v1/vendor_inventory_levels`,
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.serviceRoleKey}`,
                    'apikey': this.serviceRoleKey,
                    'Content-Type': 'application/json',
                    'Prefer': 'resolution=merge-duplicates'
                },
                body: JSON.stringify(updateData)
            }
        );

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to update inventory levels: ${errorText}`);
        }

        return updateData.length;
    }

    private calculateExponentialBackoff(retryCount: number): number {
        const delay = Math.min(
            this.BASE_DELAY * Math.pow(2, retryCount),
            this.MAX_DELAY
        );
        // Add jitter to avoid thundering herd
        return delay + Math.random() * 1000;
    }

    private async sleep(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    private async updateProgress(progressPercentage: number, variantsProcessed: number) {
        try {
            await updateSyncLog(this.supabaseUrl, this.serviceRoleKey, this.syncLogId, {
                products_synced: variantsProcessed,
                updated_at: new Date().toISOString()
            });
        } catch (error) {
            console.warn('Failed to update progress:', error);
        }
    }
}

// Helper function to create sync log entry
async function createSyncLog(supabaseUrl: string, serviceRoleKey: string, syncType: string, triggeredBy: string): Promise<string> {
    const logData = {
        sync_type: syncType,
        triggered_by: triggeredBy,
        status: 'running',
        started_at: new Date().toISOString()
    };

    const response = await fetch(
        `${supabaseUrl}/rest/v1/inventory_sync_log`,
        {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey,
                'Content-Type': 'application/json',
                'Prefer': 'return=representation'
            },
            body: JSON.stringify(logData)
        }
    );

    if (!response.ok) {
        throw new Error('Failed to create sync log entry');
    }

    const result = await response.json();
    return result[0].id;
}

// Helper function to update sync log entry
async function updateSyncLog(supabaseUrl: string, serviceRoleKey: string, logId: string, updateData: any) {
    const response = await fetch(
        `${supabaseUrl}/rest/v1/inventory_sync_log?id=eq.${logId}`,
        {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(updateData)
        }
    );

    if (!response.ok) {
        console.warn('Failed to update sync log:', await response.text());
    }
}