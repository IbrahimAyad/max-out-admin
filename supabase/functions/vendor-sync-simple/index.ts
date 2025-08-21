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

        console.log('Starting simplified vendor sync...');
        console.log('Environment check:', {
            supabaseUrl: !!supabaseUrl,
            serviceRoleKey: !!serviceRoleKey,
            shopifyDomain,
            shopifyToken: !!shopifyToken
        });

        if (!supabaseUrl || !serviceRoleKey || !shopifyDomain || !shopifyToken) {
            throw new Error('Missing required environment variables');
        }

        // Simplified query to get first 10 products with essential data
        const query = `
            query getProducts($first: Int!) {
                products(first: $first) {
                    edges {
                        node {
                            id
                            handle
                            title
                            bodyHtml
                            vendor
                            productType
                            status
                            tags
                            createdAt
                            updatedAt
                            variants(first: 5) {
                                edges {
                                    node {
                                        id
                                        sku
                                        price
                                        position
                                        inventoryItem {
                                            id
                                        }
                                        selectedOptions {
                                            name
                                            value
                                        }
                                    }
                                }
                            }
                            images(first: 3) {
                                edges {
                                    node {
                                        id
                                        src
                                        altText
                                    }
                                }
                            }
                        }
                    }
                }
            }
        `;

        console.log('Fetching products from Shopify...');
        const response = await fetch(`https://${shopifyDomain}/admin/api/2024-01/graphql.json`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Shopify-Access-Token': shopifyToken
            },
            body: JSON.stringify({ 
                query, 
                variables: { first: 10 } 
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Shopify API error:', errorText);
            throw new Error(`Shopify GraphQL error: ${response.status} - ${errorText}`);
        }

        const result = await response.json();
        console.log('Shopify response received');

        if (result.errors) {
            console.error('GraphQL errors:', result.errors);
            throw new Error(`GraphQL errors: ${JSON.stringify(result.errors)}`);
        }

        const products = result.data.products.edges.map(edge => edge.node);
        console.log(`Processing ${products.length} products...`);

        let syncedProducts = 0;
        let syncedVariants = 0;
        let syncedImages = 0;

        for (const product of products) {
            try {
                const shopifyProductId = parseInt(product.id.split('/').pop());
                console.log(`Syncing product: ${product.title} (ID: ${shopifyProductId})`);
                
                // Insert vendor_products
                const productResponse = await fetch(`${supabaseUrl}/rest/v1/vendor_products`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'apikey': serviceRoleKey,
                        'Content-Type': 'application/json',
                        'Prefer': 'resolution=merge-duplicates'
                    },
                    body: JSON.stringify({
                        shopify_product_id: shopifyProductId,
                        handle: product.handle,
                        title: product.title,
                        body_html: product.bodyHtml,
                        vendor: product.vendor || 'Unknown',
                        product_type: product.productType || 'Unknown',
                        status: product.status.toLowerCase(),
                        tags: Array.isArray(product.tags) ? product.tags : [product.tags].filter(Boolean),
                        created_at: product.createdAt,
                        updated_at: product.updatedAt
                    })
                });

                if (productResponse.ok) {
                    syncedProducts++;
                    console.log(`Product synced: ${product.title}`);
                } else {
                    const error = await productResponse.text();
                    console.error(`Failed to sync product ${product.title}:`, error);
                }

                // Insert vendor_variants
                for (const variantEdge of product.variants.edges) {
                    const variant = variantEdge.node;
                    const shopifyVariantId = parseInt(variant.id.split('/').pop());
                    const inventoryItemId = parseInt(variant.inventoryItem.id.split('/').pop());
                    
                    const options = variant.selectedOptions || [];
                    
                    const variantResponse = await fetch(`${supabaseUrl}/rest/v1/vendor_variants`, {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${serviceRoleKey}`,
                            'apikey': serviceRoleKey,
                            'Content-Type': 'application/json',
                            'Prefer': 'resolution=merge-duplicates'
                        },
                        body: JSON.stringify({
                            shopify_variant_id: shopifyVariantId,
                            shopify_product_id: shopifyProductId,
                            sku: variant.sku || '',
                            price: parseFloat(variant.price) || 0,
                            position: variant.position || 1,
                            inventory_item_id: inventoryItemId,
                            option1: options[0]?.value || null,
                            option2: options[1]?.value || null,
                            option3: options[2]?.value || null
                        })
                    });

                    if (variantResponse.ok) {
                        syncedVariants++;
                    }
                }

                // Insert vendor_images
                for (let i = 0; i < product.images.edges.length; i++) {
                    const imageEdge = product.images.edges[i];
                    const image = imageEdge.node;
                    const shopifyImageId = parseInt(image.id.split('/').pop());
                    
                    const imageResponse = await fetch(`${supabaseUrl}/rest/v1/vendor_images`, {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${serviceRoleKey}`,
                            'apikey': serviceRoleKey,
                            'Content-Type': 'application/json',
                            'Prefer': 'resolution=merge-duplicates'
                        },
                        body: JSON.stringify({
                            shopify_image_id: shopifyImageId,
                            shopify_product_id: shopifyProductId,
                            src: image.src,
                            alt: image.altText || '',
                            position: i + 1
                        })
                    });

                    if (imageResponse.ok) {
                        syncedImages++;
                    }
                }
                
            } catch (error) {
                console.error(`Error processing product ${product.title}:`, error);
            }
        }

        console.log(`Sync completed: ${syncedProducts} products, ${syncedVariants} variants, ${syncedImages} images`);

        return new Response(JSON.stringify({
            success: true,
            data: {
                message: `Successfully synced ${syncedProducts} products from Shopify`,
                products_synced: syncedProducts,
                variants_synced: syncedVariants,
                images_synced: syncedImages,
                shopify_domain: shopifyDomain
            }
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Vendor sync error:', error);

        const errorResponse = {
            success: false,
            error: {
                code: 'VENDOR_SYNC_FAILED',
                message: error.message
            }
        };

        return new Response(JSON.stringify(errorResponse), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});