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
        const shopifyDomain = Deno.env.get('SHOPIFY_STORE_DOMAIN');
        const shopifyToken = Deno.env.get('SHOPIFY_ADMIN_TOKEN');
        const shopifyLocationId = Deno.env.get('SHOPIFY_LOCATION_ID');

        if (!supabaseUrl || !serviceRoleKey || !shopifyDomain || !shopifyToken || !shopifyLocationId) {
            throw new Error('Missing required environment variables');
        }

        const syncInventoryLevels = async (pageInfo?: string) => {
            let url = `https://${shopifyDomain}/admin/api/2024-01/inventory_levels.json?location_ids=${shopifyLocationId}&limit=250`;
            
            if (pageInfo) {
                url += `&page_info=${pageInfo}`;
            }

            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'X-Shopify-Access-Token': shopifyToken
                }
            });

            if (!response.ok) {
                throw new Error(`Shopify REST API error: ${response.statusText}`);
            }

            const data = await response.json();
            const linkHeader = response.headers.get('link');
            
            // Parse next page info from Link header
            let nextPageInfo = null;
            if (linkHeader) {
                const nextMatch = linkHeader.match(/<[^>]*page_info=([^&>]+)[^>]*>; rel="next"/);
                if (nextMatch) {
                    nextPageInfo = nextMatch[1];
                }
            }

            return {
                inventoryLevels: data.inventory_levels || [],
                nextPageInfo
            };
        };

        const upsertInventoryLevels = async (inventoryLevels: any[]) => {
            for (const level of inventoryLevels) {
                await fetch(`${supabaseUrl}/rest/v1/vendor_inventory_levels`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'apikey': serviceRoleKey,
                        'Content-Type': 'application/json',
                        'Prefer': 'resolution=merge-duplicates'
                    },
                    body: JSON.stringify({
                        inventory_item_id: level.inventory_item_id,
                        location_id: level.location_id,
                        available: level.available || 0,
                        updated_at: new Date().toISOString()
                    })
                });
            }
        };

        // Main inventory sync logic
        let totalLevels = 0;
        let nextPageInfo: string | null = null;
        let hasMore = true;

        while (hasMore) {
            const result = await syncInventoryLevels(nextPageInfo || undefined);
            
            await upsertInventoryLevels(result.inventoryLevels);
            
            totalLevels += result.inventoryLevels.length;
            nextPageInfo = result.nextPageInfo;
            hasMore = !!nextPageInfo;
        }

        return new Response(JSON.stringify({
            data: {
                success: true,
                totalLevels,
                message: `Successfully synced ${totalLevels} inventory levels from Shopify`
            }
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Inventory sync error:', error);

        const errorResponse = {
            error: {
                code: 'INVENTORY_SYNC_FAILED',
                message: error.message
            }
        };

        return new Response(JSON.stringify(errorResponse), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});