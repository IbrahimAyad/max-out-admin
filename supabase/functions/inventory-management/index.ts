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
        const { action, data } = await req.json();

        if (!action) {
            throw new Error('Action parameter is required');
        }

        // Get environment variables
        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
        const supabaseUrl = Deno.env.get('SUPABASE_URL');

        if (!serviceRoleKey || !supabaseUrl) {
            throw new Error('Supabase configuration missing');
        }

        // Get user from auth header if provided
        let userId = null;
        const authHeader = req.headers.get('authorization');
        if (authHeader) {
            try {
                const token = authHeader.replace('Bearer ', '');
                const userResponse = await fetch(`${supabaseUrl}/auth/v1/user`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'apikey': serviceRoleKey
                    }
                });
                if (userResponse.ok) {
                    const userData = await userResponse.json();
                    userId = userData.id;
                }
            } catch (error) {
                console.log('Could not get user from token:', error.message);
            }
        }

        let result;

        switch (action) {
            case 'create_product_variants':
                result = await createProductVariants(supabaseUrl, serviceRoleKey, data, userId);
                break;
            case 'bulk_update_stock':
                result = await bulkUpdateStock(supabaseUrl, serviceRoleKey, data, userId);
                break;
            case 'generate_suit_variants':
                result = await generateSuitVariants(supabaseUrl, serviceRoleKey, data, userId);
                break;
            case 'generate_shirt_variants':
                result = await generateShirtVariants(supabaseUrl, serviceRoleKey, data, userId);
                break;
            case 'generate_accessory_variants':
                result = await generateAccessoryVariants(supabaseUrl, serviceRoleKey, data, userId);
                break;
            default:
                throw new Error(`Unknown action: ${action}`);
        }

        return new Response(JSON.stringify({ data: result }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Inventory management error:', error);

        const errorResponse = {
            error: {
                code: 'INVENTORY_OPERATION_FAILED',
                message: error.message,
                timestamp: new Date().toISOString()
            }
        };

        return new Response(JSON.stringify(errorResponse), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});

// Function to create individual product variants
async function createProductVariants(supabaseUrl: string, serviceRoleKey: string, data: any, userId: string | null) {
    const { variants } = data;

    if (!variants || !Array.isArray(variants)) {
        throw new Error('Variants array is required');
    }

    const createdVariants = [];

    for (const variant of variants) {
        const response = await fetch(`${supabaseUrl}/rest/v1/inventory_variants`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey,
                'Content-Type': 'application/json',
                'Prefer': 'return=representation'
            },
            body: JSON.stringify({
                ...variant,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to create variant: ${errorText}`);
        }

        const created = await response.json();
        createdVariants.push(created[0]);

        // Record inventory movement
        if (variant.stock_quantity > 0) {
            await recordInventoryMovement(supabaseUrl, serviceRoleKey, created[0].id, 'in', variant.stock_quantity, 0, variant.stock_quantity, 'Initial stock', userId);
        }
    }

    return { createdVariants, count: createdVariants.length };
}

// Function to bulk update stock quantities
async function bulkUpdateStock(supabaseUrl: string, serviceRoleKey: string, data: any, userId: string | null) {
    const { updates } = data;

    if (!updates || !Array.isArray(updates)) {
        throw new Error('Updates array is required');
    }

    const updatedVariants = [];

    for (const update of updates) {
        const { variant_id, new_quantity, notes } = update;

        // Get current quantity
        const currentResponse = await fetch(`${supabaseUrl}/rest/v1/inventory_variants?id=eq.${variant_id}&select=stock_quantity`, {
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey
            }
        });

        if (!currentResponse.ok) {
            throw new Error(`Failed to get current quantity for variant ${variant_id}`);
        }

        const currentData = await currentResponse.json();
        if (currentData.length === 0) {
            throw new Error(`Variant ${variant_id} not found`);
        }

        const currentQuantity = currentData[0].stock_quantity;
        const quantityDiff = new_quantity - currentQuantity;

        // Update the stock quantity
        const updateResponse = await fetch(`${supabaseUrl}/rest/v1/inventory_variants?id=eq.${variant_id}`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey,
                'Content-Type': 'application/json',
                'Prefer': 'return=representation'
            },
            body: JSON.stringify({
                stock_quantity: new_quantity,
                updated_at: new Date().toISOString()
            })
        });

        if (!updateResponse.ok) {
            const errorText = await updateResponse.text();
            throw new Error(`Failed to update variant ${variant_id}: ${errorText}`);
        }

        const updated = await updateResponse.json();
        updatedVariants.push(updated[0]);

        // Record inventory movement
        const movementType = quantityDiff > 0 ? 'in' : (quantityDiff < 0 ? 'out' : 'adjustment');
        await recordInventoryMovement(supabaseUrl, serviceRoleKey, variant_id, movementType, Math.abs(quantityDiff), currentQuantity, new_quantity, notes || 'Bulk update', userId);
    }

    return { updatedVariants, count: updatedVariants.length };
}

// Function to generate all variants for a suit product
async function generateSuitVariants(supabaseUrl: string, serviceRoleKey: string, data: any, userId: string | null) {
    const { product_id, color_ids, piece_types, base_price } = data;

    if (!product_id || !color_ids || !piece_types || !base_price) {
        throw new Error('product_id, color_ids, piece_types, and base_price are required');
    }

    // Get all suit sizes
    const sizesResponse = await fetch(`${supabaseUrl}/rest/v1/size_definitions?category=eq.suits&order=sort_order`, {
        headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'apikey': serviceRoleKey
        }
    });

    if (!sizesResponse.ok) {
        throw new Error('Failed to fetch suit sizes');
    }

    const sizes = await sizesResponse.json();
    const variants = [];

    // Generate variants for each combination
    for (const colorId of color_ids) {
        for (const pieceType of piece_types) {
            for (const size of sizes) {
                const sku = `SUIT-${colorId}-${size.size_code}-${pieceType.toUpperCase()}`;
                const price = pieceType === '3-piece' ? base_price + 50 : base_price; // 3-piece costs $50 more

                variants.push({
                    product_id: product_id,
                    size_id: size.id,
                    color_id: colorId,
                    piece_type: pieceType,
                    sku: sku,
                    price: price,
                    stock_quantity: 0,
                    low_stock_threshold: 5,
                    is_active: true
                });
            }
        }
    }

    // Create the variants
    return await createProductVariants(supabaseUrl, serviceRoleKey, { variants }, userId);
}

// Function to generate all variants for a shirt product
async function generateShirtVariants(supabaseUrl: string, serviceRoleKey: string, data: any, userId: string | null) {
    const { product_id, color_ids, fit_type, base_price } = data;

    if (!product_id || !color_ids || !fit_type || !base_price) {
        throw new Error('product_id, color_ids, fit_type, and base_price are required');
    }

    // Get all shirt sizes
    const sizesResponse = await fetch(`${supabaseUrl}/rest/v1/size_definitions?category=eq.shirts&order=sort_order`, {
        headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'apikey': serviceRoleKey
        }
    });

    if (!sizesResponse.ok) {
        throw new Error('Failed to fetch shirt sizes');
    }

    const sizes = await sizesResponse.json();
    const variants = [];

    // Generate variants for each combination
    for (const colorId of color_ids) {
        for (const size of sizes) {
            const sku = `SHIRT-${fit_type.toUpperCase()}-${colorId}-${size.size_code}`;

            variants.push({
                product_id: product_id,
                size_id: size.id,
                color_id: colorId,
                piece_type: fit_type,
                sku: sku,
                price: base_price,
                stock_quantity: 0,
                low_stock_threshold: 3,
                is_active: true
            });
        }
    }

    // Create the variants
    return await createProductVariants(supabaseUrl, serviceRoleKey, { variants }, userId);
}

// Function to generate color-only variants for accessories
async function generateAccessoryVariants(supabaseUrl: string, serviceRoleKey: string, data: any, userId: string | null) {
    const { product_id, color_ids, base_price, sku_prefix } = data;

    if (!product_id || !color_ids || !base_price || !sku_prefix) {
        throw new Error('product_id, color_ids, base_price, and sku_prefix are required');
    }

    const variants = [];

    // Generate variants for each color
    for (const colorId of color_ids) {
        const sku = `${sku_prefix}-${colorId}`;

        variants.push({
            product_id: product_id,
            size_id: null,
            color_id: colorId,
            piece_type: null,
            sku: sku,
            price: base_price,
            stock_quantity: 0,
            low_stock_threshold: 5,
            is_active: true
        });
    }

    // Create the variants
    return await createProductVariants(supabaseUrl, serviceRoleKey, { variants }, userId);
}

// Helper function to record inventory movements
async function recordInventoryMovement(supabaseUrl: string, serviceRoleKey: string, variantId: number, movementType: string, quantity: number, previousQuantity: number, newQuantity: number, notes: string, userId: string | null) {
    const response = await fetch(`${supabaseUrl}/rest/v1/inventory_movements`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'apikey': serviceRoleKey,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            variant_id: variantId,
            movement_type: movementType,
            quantity: quantity,
            previous_quantity: previousQuantity,
            new_quantity: newQuantity,
            notes: notes,
            created_by: userId || 'system',
            created_at: new Date().toISOString()
        })
    });

    if (!response.ok) {
        console.error('Failed to record inventory movement:', await response.text());
        // Don't throw error here as it's not critical to the main operation
    }
}
