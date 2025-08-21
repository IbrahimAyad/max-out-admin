Deno.serve(async (req) => {
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-shopify-hmac-sha256, x-shopify-topic',
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
        const shopifyAppSecret = Deno.env.get('SHOPIFY_APP_SECRET');

        if (!supabaseUrl || !serviceRoleKey || !shopifyAppSecret) {
            throw new Error('Missing required environment variables');
        }

        // Get webhook headers
        const hmacHeader = req.headers.get('x-shopify-hmac-sha256');
        const topicHeader = req.headers.get('x-shopify-topic');
        
        if (!hmacHeader || !topicHeader) {
            throw new Error('Missing required Shopify webhook headers');
        }

        // Get request body
        const body = await req.text();
        
        // Verify HMAC signature
        const encoder = new TextEncoder();
        const key = await crypto.subtle.importKey(
            'raw',
            encoder.encode(shopifyAppSecret),
            { name: 'HMAC', hash: 'SHA-256' },
            false,
            ['sign']
        );
        
        const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(body));
        const expectedHmac = btoa(String.fromCharCode(...new Uint8Array(signature)));
        
        if (hmacHeader !== expectedHmac) {
            throw new Error('Invalid HMAC signature');
        }

        // Parse webhook data
        const webhookData = JSON.parse(body);
        
        // Handle different webhook topics
        switch (topicHeader) {
            case 'products/create':
            case 'products/update':
                await handleProductUpdate(webhookData, supabaseUrl, serviceRoleKey);
                break;
                
            case 'products/delete':
                await handleProductDelete(webhookData, supabaseUrl, serviceRoleKey);
                break;
                
            case 'inventory_levels/update':
                await handleInventoryUpdate(webhookData, supabaseUrl, serviceRoleKey);
                break;
                
            default:
                console.log(`Unhandled webhook topic: ${topicHeader}`);
        }

        return new Response(JSON.stringify({
            data: {
                success: true,
                topic: topicHeader,
                message: 'Webhook processed successfully'
            }
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Webhook processing error:', error);

        const errorResponse = {
            error: {
                code: 'WEBHOOK_PROCESSING_FAILED',
                message: error.message
            }
        };

        return new Response(JSON.stringify(errorResponse), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});

// Helper functions
async function handleProductUpdate(product: any, supabaseUrl: string, serviceRoleKey: string) {
    // Upsert vendor_products
    await fetch(`${supabaseUrl}/rest/v1/vendor_products`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'apikey': serviceRoleKey,
            'Content-Type': 'application/json',
            'Prefer': 'resolution=merge-duplicates'
        },
        body: JSON.stringify({
            shopify_product_id: product.id,
            handle: product.handle,
            title: product.title,
            body_html: product.body_html,
            vendor: product.vendor,
            product_type: product.product_type,
            status: product.status,
            tags: product.tags ? product.tags.split(', ') : [],
            created_at: product.created_at,
            updated_at: product.updated_at
        })
    });

    // Update variants
    if (product.variants) {
        for (let i = 0; i < product.variants.length; i++) {
            const variant = product.variants[i];
            
            await fetch(`${supabaseUrl}/rest/v1/vendor_variants`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey,
                    'Content-Type': 'application/json',
                    'Prefer': 'resolution=merge-duplicates'
                },
                body: JSON.stringify({
                    shopify_variant_id: variant.id,
                    shopify_product_id: product.id,
                    sku: variant.sku,
                    barcode: variant.barcode,
                    price: parseFloat(variant.price) || 0,
                    compare_at_price: variant.compare_at_price ? parseFloat(variant.compare_at_price) : null,
                    position: variant.position || i + 1,
                    inventory_item_id: variant.inventory_item_id,
                    option1: variant.option1,
                    option2: variant.option2,
                    option3: variant.option3
                })
            });
        }
    }

    // Update images
    if (product.images) {
        for (let i = 0; i < product.images.length; i++) {
            const image = product.images[i];
            
            await fetch(`${supabaseUrl}/rest/v1/vendor_images`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey,
                    'Content-Type': 'application/json',
                    'Prefer': 'resolution=merge-duplicates'
                },
                body: JSON.stringify({
                    shopify_image_id: image.id,
                    shopify_product_id: product.id,
                    src: image.src,
                    alt: image.alt,
                    position: image.position || i + 1,
                    width: image.width,
                    height: image.height
                })
            });
        }
    }
}

async function handleProductDelete(product: any, supabaseUrl: string, serviceRoleKey: string) {
    // Delete product (cascading will handle variants and images)
    await fetch(`${supabaseUrl}/rest/v1/vendor_products?shopify_product_id=eq.${product.id}`, {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'apikey': serviceRoleKey
        }
    });
}

async function handleInventoryUpdate(inventoryLevel: any, supabaseUrl: string, serviceRoleKey: string) {
    await fetch(`${supabaseUrl}/rest/v1/vendor_inventory_levels`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'apikey': serviceRoleKey,
            'Content-Type': 'application/json',
            'Prefer': 'resolution=merge-duplicates'
        },
        body: JSON.stringify({
            inventory_item_id: inventoryLevel.inventory_item_id,
            location_id: inventoryLevel.location_id,
            available: inventoryLevel.available || 0,
            updated_at: new Date().toISOString()
        })
    });
}