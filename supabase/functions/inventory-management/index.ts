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
        
        const supabaseUrl = Deno.env.get('SUPABASE_URL');
        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

        if (!supabaseUrl || !serviceRoleKey) {
            throw new Error('Supabase configuration missing');
        }

        let result;

        switch (action) {
            case 'bulk_update':
                result = await handleBulkUpdate(data, supabaseUrl, serviceRoleKey);
                break;
            case 'get_variants':
                result = await getEnhancedVariants(data, supabaseUrl, serviceRoleKey);
                break;
            case 'update_variant':
                result = await updateVariant(data, supabaseUrl, serviceRoleKey);
                break;
            case 'get_low_stock':
                result = await getLowStockAlerts(supabaseUrl, serviceRoleKey);
                break;
            default:
                throw new Error(`Unknown action: ${action}`);
        }

        return new Response(JSON.stringify({ data: result }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Inventory management error:', error);
        return new Response(JSON.stringify({
            error: {
                code: 'INVENTORY_ERROR',
                message: error.message
            }
        }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});

async function handleBulkUpdate(updates, supabaseUrl, serviceRoleKey) {
    const results = [];
    
    for (const update of updates) {
        const { variant_id, inventory_quantity, reason } = update;
        
        // Get current variant
        const currentResponse = await fetch(`${supabaseUrl}/rest/v1/enhanced_product_variants?id=eq.${variant_id}`, {
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey,
                'Content-Type': 'application/json'
            }
        });
        
        if (!currentResponse.ok) {
            results.push({ variant_id, success: false, error: 'Variant not found' });
            continue;
        }
        
        const current = await currentResponse.json();
        if (current.length === 0) {
            results.push({ variant_id, success: false, error: 'Variant not found' });
            continue;
        }
        
        const currentVariant = current[0];
        const previousQuantity = currentVariant.available_quantity;
        
        // Update variant
        const updateResponse = await fetch(`${supabaseUrl}/rest/v1/enhanced_product_variants?id=eq.${variant_id}`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                inventory_quantity,
                available_quantity: inventory_quantity,
                last_inventory_update: new Date().toISOString()
            })
        });
        
        if (updateResponse.ok) {
            // Log the change
            await fetch(`${supabaseUrl}/rest/v1/inventory_history`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    variant_id,
                    change_type: 'adjustment',
                    quantity_change: inventory_quantity - previousQuantity,
                    previous_quantity: previousQuantity,
                    new_quantity: inventory_quantity,
                    reason: reason || 'Bulk inventory update'
                })
            });
            
            results.push({ variant_id, success: true, previous: previousQuantity, new: inventory_quantity });
        } else {
            results.push({ variant_id, success: false, error: 'Update failed' });
        }
    }
    
    return { updated: results.filter(r => r.success).length, results };
}

async function getEnhancedVariants(filters, supabaseUrl, serviceRoleKey) {
    let query = `${supabaseUrl}/rest/v1/enhanced_product_variants?select=*`;
    
    if (filters.product_id) {
        query += `&product_id=eq.${filters.product_id}`;
    }
    if (filters.stock_status) {
        query += `&stock_status=eq.${filters.stock_status}`;
    }
    if (filters.variant_type) {
        query += `&variant_type=eq.${filters.variant_type}`;
    }
    
    const response = await fetch(query, {
        headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'apikey': serviceRoleKey
        }
    });
    
    if (!response.ok) {
        throw new Error('Failed to fetch variants');
    }
    
    const variants = await response.json();
    
    // Get product details for each variant
    const productIds = [...new Set(variants.map(v => v.product_id))];
    if (productIds.length > 0) {
        const productsResponse = await fetch(`${supabaseUrl}/rest/v1/products?id=in.(${productIds.join(',')})&select=id,name,category,sku`, {
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey
            }
        });
        
        if (productsResponse.ok) {
            const products = await productsResponse.json();
            const productMap = Object.fromEntries(products.map(p => [p.id, p]));
            
            // Add product details to variants
            variants.forEach(variant => {
                variant.product = productMap[variant.product_id] || null;
            });
        }
    }
    
    return variants;
}

async function updateVariant(variantData, supabaseUrl, serviceRoleKey) {
    const { id, ...updates } = variantData;
    
    const response = await fetch(`${supabaseUrl}/rest/v1/enhanced_product_variants?id=eq.${id}`, {
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
    
    if (!response.ok) {
        throw new Error('Failed to update variant');
    }
    
    return { success: true, id };
}

async function getLowStockAlerts(supabaseUrl, serviceRoleKey) {
    const response = await fetch(`${supabaseUrl}/rest/v1/low_stock_alerts?alert_status=eq.active&select=*`, {
        headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'apikey': serviceRoleKey
        }
    });
    
    if (!response.ok) {
        throw new Error('Failed to fetch low stock alerts');
    }
    
    const alerts = await response.json();
    
    // Get variant and product details for each alert
    const variantIds = alerts.map(a => a.variant_id);
    if (variantIds.length > 0) {
        const variantsResponse = await fetch(`${supabaseUrl}/rest/v1/enhanced_product_variants?id=in.(${variantIds.join(',')})&select=*`, {
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey
            }
        });
        
        if (variantsResponse.ok) {
            const variants = await variantsResponse.json();
            const variantMap = Object.fromEntries(variants.map(v => [v.id, v]));
            
            // Get product details
            const productIds = [...new Set(variants.map(v => v.product_id))];
            const productsResponse = await fetch(`${supabaseUrl}/rest/v1/products?id=in.(${productIds.join(',')})&select=id,name,category`, {
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey
                }
            });
            
            if (productsResponse.ok) {
                const products = await productsResponse.json();
                const productMap = Object.fromEntries(products.map(p => [p.id, p]));
                
                // Add details to alerts
                alerts.forEach(alert => {
                    const variant = variantMap[alert.variant_id];
                    if (variant) {
                        alert.variant = variant;
                        alert.product = productMap[variant.product_id] || null;
                    }
                });
            }
        }
    }
    
    return alerts;
}