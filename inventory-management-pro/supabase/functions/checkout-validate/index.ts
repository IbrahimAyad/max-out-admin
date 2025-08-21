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
        const { items, session_id, user_id, order_id } = await req.json();
        
        if (!items || !Array.isArray(items)) {
            throw new Error('items array is required');
        }

        const validationResults = [];
        const reservations = [];
        let allValid = true;

        // Validate each item
        for (const item of items) {
            const { product_variant_id, quantity } = item;
            
            if (!product_variant_id || !quantity || quantity <= 0) {
                validationResults.push({
                    product_variant_id,
                    valid: false,
                    error: 'Invalid product variant ID or quantity'
                });
                allValid = false;
                continue;
            }

            // Get effective availability using our view
            const availabilityResponse = await fetch(`${supabaseUrl}/rest/v1/v_product_variants_effective?product_variant_id=eq.${product_variant_id}`, {
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey
                }
            });

            if (!availabilityResponse.ok) {
                validationResults.push({
                    product_variant_id,
                    valid: false,
                    error: 'Failed to check availability'
                });
                allValid = false;
                continue;
            }

            const availabilityData = await availabilityResponse.json();
            
            if (availabilityData.length === 0) {
                validationResults.push({
                    product_variant_id,
                    valid: false,
                    error: 'Product variant not found'
                });
                allValid = false;
                continue;
            }

            const variant = availabilityData[0];
            const effectiveAvailable = variant.effective_available;

            if (quantity > effectiveAvailable) {
                validationResults.push({
                    product_variant_id,
                    valid: false,
                    requested: quantity,
                    available: effectiveAvailable,
                    error: `Insufficient inventory. Requested: ${quantity}, Available: ${effectiveAvailable}`
                });
                allValid = false;
            } else {
                validationResults.push({
                    product_variant_id,
                    valid: true,
                    requested: quantity,
                    available: effectiveAvailable
                });
                
                // Prepare reservation data
                reservations.push({
                    product_variant_id,
                    quantity,
                    expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(), // 15 minutes from now
                    session_id,
                    user_id,
                    order_id,
                    reservation_type: 'checkout'
                });
            }
        }

        // If all items are valid, create reservations
        if (allValid && reservations.length > 0) {
            for (const reservation of reservations) {
                const reservationResponse = await fetch(`${supabaseUrl}/rest/v1/inventory_reservations`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'apikey': serviceRoleKey,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        variant_id: reservation.product_variant_id,
                        quantity: reservation.quantity,
                        expires_at: reservation.expires_at,
                        session_id: reservation.session_id,
                        user_id: reservation.user_id,
                        order_id: reservation.order_id,
                        reservation_type: reservation.reservation_type,
                        notes: 'Checkout validation reservation'
                    })
                });

                if (!reservationResponse.ok) {
                    console.error(`Failed to create reservation for variant ${reservation.product_variant_id}`);
                }
            }

            // Clean up expired reservations (housekeeping)
            await fetch(`${supabaseUrl}/rest/v1/inventory_reservations?expires_at=lt.${new Date().toISOString()}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey
                }
            });
        }

        return new Response(JSON.stringify({
            data: {
                valid: allValid,
                results: validationResults,
                reservations: allValid ? reservations.length : 0,
                message: allValid 
                    ? `Checkout validation passed. ${reservations.length} reservations created.`
                    : 'Checkout validation failed. Some items are not available.'
            }
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Checkout validation error:', error);

        const errorResponse = {
            error: {
                code: 'CHECKOUT_VALIDATION_FAILED',
                message: error.message
            }
        };

        return new Response(JSON.stringify(errorResponse), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});