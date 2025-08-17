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
        const { amount, currency = 'usd', cartItems, customerEmail, shippingAddress, billingAddress, specialInstructions, rushOrder, groupOrder } = await req.json();

        console.log('Payment intent request received:', { amount, currency, cartItemsCount: cartItems?.length });

        // Validate required parameters
        if (!amount || amount <= 0) {
            throw new Error('Valid amount is required');
        }

        if (!cartItems || !Array.isArray(cartItems) || cartItems.length === 0) {
            throw new Error('Cart items are required');
        }

        // Validate cart items structure
        for (const item of cartItems) {
            if (!item.product_id || !item.quantity || !item.price || !item.product_name) {
                throw new Error('Each cart item must have product_id, quantity, price, and product_name');
            }
            if (item.quantity <= 0 || item.price <= 0) {
                throw new Error('Cart item quantity and price must be positive');
            }
        }

        // Get environment variables
        const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
        const supabaseUrl = Deno.env.get('SUPABASE_URL');

        if (!stripeSecretKey) {
            console.error('Stripe secret key not found in environment');
            throw new Error('Stripe secret key not configured');
        }

        if (!serviceRoleKey || !supabaseUrl) {
            throw new Error('Supabase configuration missing');
        }

        console.log('Environment variables validated, creating payment intent...');

        // Calculate total amount from cart items to verify
        const calculatedAmount = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        if (Math.abs(calculatedAmount - amount) > 0.01) {
            throw new Error('Amount mismatch: calculated amount does not match provided amount');
        }

        // Determine if this is a Core Product order (Stripe) or Catalog order
        const hasStripeProducts = cartItems.some(item => item.product_source === 'core_stripe' || item.stripe_product_id);
        
        // Prepare Stripe payment intent data
        const stripeParams = new URLSearchParams();
        stripeParams.append('amount', Math.round(amount * 100).toString()); // Convert to cents
        stripeParams.append('currency', currency);
        stripeParams.append('payment_method_types[]', 'card');
        stripeParams.append('metadata[customer_email]', customerEmail || '');
        stripeParams.append('metadata[cart_items_count]', cartItems.length.toString());
        stripeParams.append('metadata[total_items]', cartItems.reduce((sum, item) => sum + item.quantity, 0).toString());
        stripeParams.append('metadata[has_core_products]', hasStripeProducts.toString());
        stripeParams.append('metadata[is_rush_order]', (rushOrder || false).toString());
        stripeParams.append('metadata[is_group_order]', (groupOrder || false).toString());

        // Create payment intent with Stripe
        const stripeResponse = await fetch('https://api.stripe.com/v1/payment_intents', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${stripeSecretKey}`,
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: stripeParams.toString()
        });

        console.log('Stripe API response status:', stripeResponse.status);

        if (!stripeResponse.ok) {
            const errorData = await stripeResponse.text();
            console.error('Stripe API error:', errorData);
            throw new Error(`Stripe API error: ${errorData}`);
        }

        const paymentIntent = await stripeResponse.json();
        console.log('Payment intent created successfully:', paymentIntent.id);

        // Generate order number
        const orderNumber = `KCT-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;

        // Determine order priority based on various factors
        let orderPriority = 'normal';
        if (rushOrder) orderPriority = 'rush';
        if (groupOrder) orderPriority = 'wedding_party';
        if (amount > 2000) orderPriority = 'high';
        if (amount > 5000) orderPriority = 'vip_customer';

        // Create order record in database - simplified version
        const orderData = {
            order_number: orderNumber,
            customer_email: customerEmail,
            customer_name: shippingAddress?.name || customerEmail?.split('@')[0] || 'Customer',
            customer_phone: shippingAddress?.phone,
            stripe_payment_intent_id: paymentIntent.id,
            status: 'pending_payment',
            total_amount: amount,
            currency: currency.toUpperCase(),
            shipping_address_line_1: shippingAddress?.line1,
            shipping_address_line_2: shippingAddress?.line2,
            shipping_city: shippingAddress?.city,
            shipping_state: shippingAddress?.state,
            shipping_postal_code: shippingAddress?.postal_code,
            shipping_country: shippingAddress?.country || 'US',
            billing_address_line_1: billingAddress?.line1 || shippingAddress?.line1,
            billing_address_line_2: billingAddress?.line2 || shippingAddress?.line2,
            billing_city: billingAddress?.city || shippingAddress?.city,
            billing_state: billingAddress?.state || shippingAddress?.state,
            billing_postal_code: billingAddress?.postal_code || shippingAddress?.postal_code,
            billing_country: billingAddress?.country || shippingAddress?.country || 'US',
            is_rush_order: rushOrder || false,
            is_group_order: groupOrder || false,
            special_instructions: specialInstructions,
            subtotal: amount,
            tax_amount: 0,
            shipping_amount: 0,
            discount_amount: 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        console.log('Creating order in database...');

        const orderResponse = await fetch(`${supabaseUrl}/rest/v1/orders`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey,
                'Content-Type': 'application/json',
                'Prefer': 'return=representation'
            },
            body: JSON.stringify(orderData)
        });

        if (!orderResponse.ok) {
            const errorText = await orderResponse.text();
            console.error('Failed to create order:', errorText);
            // If order creation fails, we should cancel the payment intent
            try {
                await fetch(`https://api.stripe.com/v1/payment_intents/${paymentIntent.id}/cancel`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${stripeSecretKey}`,
                        'Content-Type': 'application/x-www-form-urlencoded'
                    }
                });
                console.log('Payment intent cancelled due to order creation failure');
            } catch (cancelError) {
                console.error('Failed to cancel payment intent:', cancelError.message);
            }
            throw new Error(`Failed to create order: ${errorText}`);
        }

        const order = await orderResponse.json();
        const orderId = order[0].id;
        console.log('Order created successfully:', orderId);

        // Create order items - simplified version
        const orderItems = cartItems.map(item => ({
            order_id: orderId,
            product_source: item.product_source || (item.stripe_product_id ? 'core_stripe' : 'catalog_supabase'),
            stripe_product_id: item.stripe_product_id,
            product_name: item.product_name,
            product_sku: item.sku,
            size: item.size,
            color: item.color,
            quantity: item.quantity,
            unit_price: item.price,
            line_total: item.price * item.quantity,
            is_bundle_item: item.is_bundle_item || false,
            created_at: new Date().toISOString()
        }));

        console.log('Creating order items...');

        const orderItemsResponse = await fetch(`${supabaseUrl}/rest/v1/order_items`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(orderItems)
        });

        if (!orderItemsResponse.ok) {
            const errorText = await orderItemsResponse.text();
            console.error('Failed to create order items:', errorText);
            console.warn('Order created but order items creation failed');
        } else {
            console.log('Order items created successfully');
        }

        const result = {
            data: {
                clientSecret: paymentIntent.client_secret,
                paymentIntentId: paymentIntent.id,
                orderId: orderId,
                orderNumber: orderNumber,
                amount: amount,
                currency: currency,
                status: 'pending_payment',
                priority: orderPriority,
                hasStripeProducts: hasStripeProducts
            }
        };

        console.log('Payment intent creation completed successfully');

        return new Response(JSON.stringify(result), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Payment intent creation error:', error);

        const errorResponse = {
            error: {
                code: 'PAYMENT_INTENT_FAILED',
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