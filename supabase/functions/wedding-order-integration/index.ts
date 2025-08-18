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
        const supabaseUrl = Deno.env.get('SUPABASE_URL');
        const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
        const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');

        if (!supabaseUrl || !supabaseAnonKey || !stripeSecretKey) {
            throw new Error('Environment configuration missing');
        }

        const url = new URL(req.url);
        const method = req.method;

        if (method === 'POST' && url.pathname.endsWith('/create-wedding-order')) {
            // Create wedding order with group pricing
            const { 
                weddingId, 
                cartItems, 
                customerInfo, 
                partyMemberItems,
                shippingAddresses,
                paymentSplit 
            } = await req.json();

            if (!weddingId || !cartItems || !Array.isArray(cartItems) || cartItems.length === 0) {
                throw new Error('Wedding ID and cart items are required');
            }

            // Get wedding and party member info
            const weddingResponse = await fetch(`${supabaseUrl}/rest/v1/weddings?id=eq.${weddingId}&select=*,wedding_party_members(*)`, {
                headers: {
                    'apikey': supabaseAnonKey,
                    'Content-Type': 'application/json'
                }
            });

            const weddings = await weddingResponse.json();
            if (weddings.length === 0) {
                throw new Error('Wedding not found');
            }

            const wedding = weddings[0];
            const partySize = wedding.wedding_party_members?.length || 0;

            // Calculate group discount
            let groupDiscountPercentage = 0;
            if (partySize >= 8) groupDiscountPercentage = 20;
            else if (partySize >= 5) groupDiscountPercentage = 15;
            else if (partySize >= 3) groupDiscountPercentage = 10;

            // Calculate totals
            const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
            const groupDiscountAmount = (subtotal * groupDiscountPercentage) / 100;
            const totalAmount = subtotal - groupDiscountAmount;

            // Check for complimentary groom outfit (5+ rentals)
            const rentalCount = cartItems.filter(item => item.type === 'rental').length;
            const groomComplimentary = rentalCount >= 5;

            // Create main wedding order
            const orderData = {
                wedding_id: weddingId,
                order_type: 'wedding_group',
                is_group_discount_order: groupDiscountPercentage > 0,
                group_discount_percentage: groupDiscountPercentage,
                group_discount_amount: groupDiscountAmount,
                party_member_ids: partyMemberItems ? Object.keys(partyMemberItems) : [],
                primary_party_member_id: customerInfo?.partyMemberId || null,
                split_payment_data: paymentSplit || null,
                delivery_coordination: {
                    addresses: shippingAddresses || [],
                    coordination_type: 'wedding_party',
                    delivery_preference: 'coordinated'
                },
                order_deadline: wedding.wedding_date ? new Date(new Date(wedding.wedding_date).getTime() - (14 * 24 * 60 * 60 * 1000)).toISOString() : null, // 2 weeks before wedding
                delivery_deadline: wedding.wedding_date ? new Date(new Date(wedding.wedding_date).getTime() - (3 * 24 * 60 * 60 * 1000)).toISOString() : null, // 3 days before wedding
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };

            const orderResponse = await fetch(`${supabaseUrl}/rest/v1/wedding_orders`, {
                method: 'POST',
                headers: {
                    'apikey': supabaseAnonKey,
                    'Content-Type': 'application/json',
                    'Prefer': 'return=representation'
                },
                body: JSON.stringify(orderData)
            });

            if (!orderResponse.ok) {
                const errorText = await orderResponse.text();
                throw new Error(`Failed to create wedding order: ${errorText}`);
            }

            const order = await orderResponse.json();
            const weddingOrderId = order[0].id;

            // Send order data to main order management system
            const mainOrderPayload = {
                source: 'wedding_system',
                wedding_order_id: weddingOrderId,
                wedding_id: weddingId,
                customer_info: customerInfo,
                items: cartItems.map(item => ({
                    ...item,
                    is_wedding_item: true,
                    wedding_party_member_id: item.partyMemberId || null
                })),
                pricing: {
                    subtotal,
                    group_discount_percentage: groupDiscountPercentage,
                    group_discount_amount: groupDiscountAmount,
                    total: totalAmount,
                    groom_complimentary: groomComplimentary
                },
                shipping: {
                    addresses: shippingAddresses,
                    coordination_type: 'wedding_party',
                    special_instructions: `Wedding party order - ${partySize} members. Deliver by ${new Date(wedding.wedding_date).toLocaleDateString()}`
                },
                payment_split: paymentSplit,
                special_handling: {
                    is_wedding_order: true,
                    wedding_date: wedding.wedding_date,
                    rush_order: false,
                    coordination_required: true
                }
            };

            // Integration with main order system (webhook to existing system)
            try {
                const webhookResponse = await fetch('https://rtbbsdcrfbha.space.minimax.io/api/wedding-order-webhook', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Wedding-System-Key': Deno.env.get('KCT_WEBHOOK_SECRET') || 'wedding_integration_key'
                    },
                    body: JSON.stringify(mainOrderPayload)
                });

                if (!webhookResponse.ok) {
                    console.warn('Main order system integration failed, order created locally');
                }
            } catch (error) {
                console.warn('Main order system integration failed:', error.message);
            }

            return new Response(JSON.stringify({
                data: {
                    weddingOrderId,
                    orderId: weddingOrderId,
                    pricing: {
                        subtotal,
                        groupDiscountPercentage,
                        groupDiscountAmount,
                        total: totalAmount,
                        groomComplimentary
                    },
                    orderDeadline: orderData.order_deadline,
                    deliveryDeadline: orderData.delivery_deadline,
                    message: 'Wedding order created successfully'
                }
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });

        } else if (method === 'POST' && url.pathname.endsWith('/create-payment-intent')) {
            // Wedding-specific Stripe payment intent with group pricing
            const { 
                weddingOrderId, 
                paymentSplit, 
                customerEmail, 
                billingAddress 
            } = await req.json();

            if (!weddingOrderId) {
                throw new Error('Wedding order ID is required');
            }

            // Get wedding order details
            const orderResponse = await fetch(`${supabaseUrl}/rest/v1/wedding_orders?id=eq.${weddingOrderId}&select=*`, {
                headers: {
                    'apikey': supabaseAnonKey,
                    'Content-Type': 'application/json'
                }
            });

            const orders = await orderResponse.json();
            if (orders.length === 0) {
                throw new Error('Wedding order not found');
            }

            const weddingOrder = orders[0];

            // Calculate total amount with group discount
            const totalAmount = weddingOrder.total_amount || 0;

            if (paymentSplit && paymentSplit.length > 1) {
                // Handle split payments
                const paymentIntents = [];

                for (const split of paymentSplit) {
                    const stripeParams = new URLSearchParams();
                    stripeParams.append('amount', Math.round(split.amount * 100).toString());
                    stripeParams.append('currency', 'usd');
                    stripeParams.append('payment_method_types[]', 'card');
                    stripeParams.append('metadata[wedding_order_id]', weddingOrderId);
                    stripeParams.append('metadata[party_member_id]', split.partyMemberId || '');
                    stripeParams.append('metadata[split_payment]', 'true');
                    stripeParams.append('metadata[customer_email]', split.email || customerEmail || '');

                    const stripeResponse = await fetch('https://api.stripe.com/v1/payment_intents', {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${stripeSecretKey}`,
                            'Content-Type': 'application/x-www-form-urlencoded'
                        },
                        body: stripeParams.toString()
                    });

                    if (!stripeResponse.ok) {
                        const errorData = await stripeResponse.text();
                        throw new Error(`Stripe API error for split payment: ${errorData}`);
                    }

                    const paymentIntent = await stripeResponse.json();
                    paymentIntents.push({
                        partyMemberId: split.partyMemberId,
                        amount: split.amount,
                        paymentIntentId: paymentIntent.id,
                        clientSecret: paymentIntent.client_secret
                    });
                }

                return new Response(JSON.stringify({
                    data: {
                        type: 'split_payment',
                        paymentIntents,
                        weddingOrderId,
                        totalAmount
                    }
                }), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });

            } else {
                // Single payment
                const stripeParams = new URLSearchParams();
                stripeParams.append('amount', Math.round(totalAmount * 100).toString());
                stripeParams.append('currency', 'usd');
                stripeParams.append('payment_method_types[]', 'card');
                stripeParams.append('metadata[wedding_order_id]', weddingOrderId);
                stripeParams.append('metadata[customer_email]', customerEmail || '');
                stripeParams.append('metadata[group_discount]', weddingOrder.group_discount_amount?.toString() || '0');

                const stripeResponse = await fetch('https://api.stripe.com/v1/payment_intents', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${stripeSecretKey}`,
                        'Content-Type': 'application/x-www-form-urlencoded'
                    },
                    body: stripeParams.toString()
                });

                if (!stripeResponse.ok) {
                    const errorData = await stripeResponse.text();
                    throw new Error(`Stripe API error: ${errorData}`);
                }

                const paymentIntent = await stripeResponse.json();

                return new Response(JSON.stringify({
                    data: {
                        type: 'single_payment',
                        clientSecret: paymentIntent.client_secret,
                        paymentIntentId: paymentIntent.id,
                        weddingOrderId,
                        amount: totalAmount
                    }
                }), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
            }

        } else {
            return new Response(JSON.stringify({
                error: {
                    code: 'METHOD_NOT_ALLOWED',
                    message: 'Method not allowed'
                }
            }), {
                status: 405,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

    } catch (error) {
        console.error('Wedding order integration error:', error);

        const errorResponse = {
            error: {
                code: 'ORDER_INTEGRATION_ERROR',
                message: error.message
            }
        };

        return new Response(JSON.stringify(errorResponse), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});