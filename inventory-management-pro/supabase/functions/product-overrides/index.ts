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

        if (!supabaseUrl || !serviceRoleKey) {
            throw new Error('Missing required environment variables');
        }

        // Parse request body
        const requestData = await req.json();
        const {
            shopify_product_id,
            title_override,
            price_override_strategy,
            price_value,
            primary_image_url_override,
            hidden
        } = requestData;
        
        if (!shopify_product_id) {
            throw new Error('shopify_product_id is required');
        }

        // Validate price override strategy if provided
        if (price_override_strategy && !['absolute', 'percent'].includes(price_override_strategy)) {
            throw new Error('price_override_strategy must be either "absolute" or "percent"');
        }

        // Upsert product override
        const overrideData = {
            shopify_product_id: parseInt(shopify_product_id),
            title_override: title_override || null,
            price_override_strategy: price_override_strategy || null,
            price_value: price_value ? parseFloat(price_value) : null,
            primary_image_url_override: primary_image_url_override || null,
            hidden: hidden || false
        };

        // Remove null values to avoid unnecessary updates
        const cleanOverrideData = Object.fromEntries(
            Object.entries(overrideData).filter(([_, value]) => value !== null && value !== undefined)
        );

        const response = await fetch(`${supabaseUrl}/rest/v1/product_overrides`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey,
                'Content-Type': 'application/json',
                'Prefer': 'resolution=merge-duplicates,return=representation'
            },
            body: JSON.stringify(cleanOverrideData)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Database upsert failed: ${errorText}`);
        }

        const result = await response.json();

        // If we updated pricing, also update any imported product variants
        if (price_override_strategy && price_value) {
            // Find our products linked to this vendor product
            const linkedProductsResponse = await fetch(`${supabaseUrl}/rest/v1/products?vendor_id=eq.${shopify_product_id}`, {
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey
                }
            });

            if (linkedProductsResponse.ok) {
                const linkedProducts = await linkedProductsResponse.json();
                
                for (const product of linkedProducts) {
                    // Update product variants with new pricing
                    const variantsResponse = await fetch(`${supabaseUrl}/rest/v1/product_variants?product_id=eq.${product.id}`, {
                        headers: {
                            'Authorization': `Bearer ${serviceRoleKey}`,
                            'apikey': serviceRoleKey
                        }
                    });
                    
                    if (variantsResponse.ok) {
                        const variants = await variantsResponse.json();
                        
                        for (const variant of variants) {
                            let newPrice;
                            
                            if (price_override_strategy === 'absolute') {
                                newPrice = price_value;
                            } else if (price_override_strategy === 'percent') {
                                // Get original vendor price
                                const vendorVariantResponse = await fetch(`${supabaseUrl}/rest/v1/vendor_variants?inventory_item_id=eq.${variant.vendor_inventory_item_id}`, {
                                    headers: {
                                        'Authorization': `Bearer ${serviceRoleKey}`,
                                        'apikey': serviceRoleKey
                                    }
                                });
                                
                                if (vendorVariantResponse.ok) {
                                    const vendorVariants = await vendorVariantResponse.json();
                                    if (vendorVariants.length > 0) {
                                        const originalPrice = parseFloat(vendorVariants[0].price);
                                        newPrice = originalPrice * (1 + price_value / 100);
                                    }
                                }
                            }
                            
                            if (newPrice) {
                                await fetch(`${supabaseUrl}/rest/v1/product_variants?id=eq.${variant.id}`, {
                                    method: 'PATCH',
                                    headers: {
                                        'Authorization': `Bearer ${serviceRoleKey}`,
                                        'apikey': serviceRoleKey,
                                        'Content-Type': 'application/json'
                                    },
                                    body: JSON.stringify({
                                        price: newPrice
                                    })
                                });
                            }
                        }
                    }
                }
            }
        }

        // If we updated the title, update the linked product title
        if (title_override) {
            await fetch(`${supabaseUrl}/rest/v1/products?vendor_id=eq.${shopify_product_id}`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    name: title_override
                })
            });
        }

        // If we updated the image, update the linked product image
        if (primary_image_url_override) {
            await fetch(`${supabaseUrl}/rest/v1/products?vendor_id=eq.${shopify_product_id}`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    image_url: primary_image_url_override
                })
            });
        }

        return new Response(JSON.stringify({
            data: {
                success: true,
                override: result[0] || cleanOverrideData,
                message: 'Product override updated successfully'
            }
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Product override error:', error);

        const errorResponse = {
            error: {
                code: 'PRODUCT_OVERRIDE_FAILED',
                message: error.message
            }
        };

        return new Response(JSON.stringify(errorResponse), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});