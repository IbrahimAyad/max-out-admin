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
            case 'scan_low_stock':
                result = await scanForLowStock(supabaseUrl, serviceRoleKey);
                break;
            case 'acknowledge_alert':
                result = await acknowledgeAlert(data.alert_id, data.user_id, supabaseUrl, serviceRoleKey);
                break;
            case 'get_alerts':
                result = await getActiveAlerts(data.status, supabaseUrl, serviceRoleKey);
                break;
            case 'resolve_alert':
                result = await resolveAlert(data.alert_id, supabaseUrl, serviceRoleKey);
                break;
            default:
                throw new Error(`Unknown action: ${action}`);
        }

        return new Response(JSON.stringify({ data: result }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Low stock alerts error:', error);
        return new Response(JSON.stringify({
            error: {
                code: 'LOW_STOCK_ALERT_ERROR',
                message: error.message
            }
        }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});

async function scanForLowStock(supabaseUrl, serviceRoleKey) {
    // Get all variants where available_quantity <= low_stock_threshold
    const variantsResponse = await fetch(`${supabaseUrl}/rest/v1/enhanced_product_variants?select=*&or=(available_quantity.lte.low_stock_threshold,available_quantity.eq.0)&stock_status=neq.discontinued`, {
        headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'apikey': serviceRoleKey
        }
    });
    
    if (!variantsResponse.ok) {
        throw new Error('Failed to fetch variants');
    }
    
    const variants = await variantsResponse.json();
    const alertsCreated = [];
    
    for (const variant of variants) {
        if (variant.available_quantity <= variant.low_stock_threshold) {
            // Create or update alert using upsert
            const alertResponse = await fetch(`${supabaseUrl}/rest/v1/low_stock_alerts`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey,
                    'Content-Type': 'application/json',
                    'Prefer': 'resolution=merge-duplicates'
                },
                body: JSON.stringify({
                    variant_id: variant.id,
                    alert_threshold: variant.low_stock_threshold,
                    current_quantity: variant.available_quantity,
                    alert_status: 'active'
                })
            });
            
            // Even if there's a conflict, we'll count it as processed
            alertsCreated.push({
                variant_id: variant.id,
                sku: variant.sku,
                current_quantity: variant.available_quantity,
                threshold: variant.low_stock_threshold
            });
        }
    }
    
    return {
        scanned: variants.length,
        alerts_created: alertsCreated.length,
        alerts: alertsCreated
    };
}

async function acknowledgeAlert(alertId, userId, supabaseUrl, serviceRoleKey) {
    const response = await fetch(`${supabaseUrl}/rest/v1/low_stock_alerts?id=eq.${alertId}`, {
        method: 'PATCH',
        headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'apikey': serviceRoleKey,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            alert_status: 'acknowledged',
            acknowledged_by: userId,
            acknowledged_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        })
    });
    
    if (!response.ok) {
        throw new Error('Failed to acknowledge alert');
    }
    
    return { success: true, alert_id: alertId };
}

async function getActiveAlerts(status = 'active', supabaseUrl, serviceRoleKey) {
    const response = await fetch(`${supabaseUrl}/rest/v1/low_stock_alerts?alert_status=eq.${status}&order=created_at.desc`, {
        headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'apikey': serviceRoleKey
        }
    });
    
    if (!response.ok) {
        throw new Error('Failed to fetch alerts');
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

async function resolveAlert(alertId, supabaseUrl, serviceRoleKey) {
    const response = await fetch(`${supabaseUrl}/rest/v1/low_stock_alerts?id=eq.${alertId}`, {
        method: 'PATCH',
        headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'apikey': serviceRoleKey,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            alert_status: 'resolved',
            updated_at: new Date().toISOString()
        })
    });
    
    if (!response.ok) {
        throw new Error('Failed to resolve alert');
    }
    
    return { success: true, alert_id: alertId };
}