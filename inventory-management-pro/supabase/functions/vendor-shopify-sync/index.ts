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

        if (!supabaseUrl || !serviceRoleKey || !shopifyDomain || !shopifyToken) {
            throw new Error('Missing required environment variables');
        }

        const syncProducts = async (cursor?: string) => {
            const query = `
                query getProducts($first: Int!, $after: String) {
                    products(first: $first, after: $after) {
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
                                variants(first: 100) {
                                    edges {
                                        node {
                                            id
                                            sku
                                            barcode
                                            price
                                            compareAtPrice
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
                                images(first: 10) {
                                    edges {
                                        node {
                                            id
                                            src
                                            altText
                                            width
                                            height
                                        }
                                    }
                                }
                            }
                        }
                        pageInfo {
                            hasNextPage
                            endCursor
                        }
                    }
                }
            `;

            const variables = {
                first: 100,
                after: cursor
            };

            const response = await fetch(`https://${shopifyDomain}/admin/api/2024-01/graphql.json`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Shopify-Access-Token': shopifyToken
                },
                body: JSON.stringify({ query, variables })
            });

            if (!response.ok) {
                throw new Error(`Shopify GraphQL error: ${response.statusText}`);
            }

            return await response.json();
        };

        const upsertVendorData = async (products: any[]) => {
            for (const product of products) {
                const shopifyProductId = parseInt(product.id.split('/').pop());
                
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
                        shopify_product_id: shopifyProductId,
                        handle: product.handle,
                        title: product.title,
                        body_html: product.bodyHtml,
                        vendor: product.vendor,
                        product_type: product.productType,
                        status: product.status.toLowerCase(),
                        tags: product.tags,
                        created_at: product.createdAt,
                        updated_at: product.updatedAt
                    })
                });

                // Upsert vendor_variants
                for (let i = 0; i < product.variants.edges.length; i++) {
                    const variant = product.variants.edges[i].node;
                    const shopifyVariantId = parseInt(variant.id.split('/').pop());
                    const inventoryItemId = parseInt(variant.inventoryItem.id.split('/').pop());
                    
                    const options = variant.selectedOptions;
                    
                    await fetch(`${supabaseUrl}/rest/v1/vendor_variants`, {
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
                            sku: variant.sku,
                            barcode: variant.barcode,
                            price: parseFloat(variant.price) || 0,
                            compare_at_price: variant.compareAtPrice ? parseFloat(variant.compareAtPrice) : null,
                            position: variant.position || i + 1,
                            inventory_item_id: inventoryItemId,
                            option1: options.find((opt: any) => opt.name === 'Size')?.value || options[0]?.value || null,
                            option2: options.find((opt: any) => opt.name === 'Color')?.value || options[1]?.value || null,
                            option3: options[2]?.value || null
                        })
                    });
                }

                // Upsert vendor_images
                for (let i = 0; i < product.images.edges.length; i++) {
                    const image = product.images.edges[i].node;
                    const shopifyImageId = parseInt(image.id.split('/').pop());
                    
                    await fetch(`${supabaseUrl}/rest/v1/vendor_images`, {
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
                            alt: image.altText,
                            position: i + 1,
                            width: image.width,
                            height: image.height
                        })
                    });
                }
            }
        };

        // Main sync logic
        let totalProducts = 0;
        let hasNextPage = true;
        let cursor: string | undefined;

        while (hasNextPage) {
            const result = await syncProducts(cursor);
            
            if (result.errors) {
                throw new Error(`GraphQL errors: ${JSON.stringify(result.errors)}`);
            }

            const products = result.data.products.edges.map((edge: any) => edge.node);
            await upsertVendorData(products);
            
            totalProducts += products.length;
            hasNextPage = result.data.products.pageInfo.hasNextPage;
            cursor = result.data.products.pageInfo.endCursor;
        }

        return new Response(JSON.stringify({
            data: {
                success: true,
                totalProducts,
                message: `Successfully synced ${totalProducts} products from Shopify`
            }
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Vendor sync error:', error);

        const errorResponse = {
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