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
    const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2.39.3');
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const requestData = await req.json();
    const { weddingId, paymentType, partyMemberIds, customerEmail } = requestData;
    
    // Validate required fields
    if (!weddingId || !paymentType || !customerEmail) {
      throw new Error('Missing required fields: weddingId, paymentType, customerEmail');
    }
    
    // Get wedding details and party members
    const { data: wedding, error: weddingError } = await supabase
      .from('weddings')
      .select('*')
      .eq('id', weddingId)
      .single();
      
    if (weddingError || !wedding) {
      throw new Error('Wedding not found');
    }
    
    // Get party members and their outfits
    const { data: partyMembers, error: partyError } = await supabase
      .from('wedding_party_members')
      .select(`
        *,
        wedding_outfits!inner(*),
        user_profiles!inner(full_name, email)
      `)
      .eq('wedding_id', weddingId)
      .in('id', partyMemberIds || []);
      
    if (partyError) {
      throw new Error('Failed to fetch party members');
    }
    
    // Calculate group discount based on party size
    const partySize = partyMembers?.length || 0;
    let groupDiscountPercent = 0;
    
    if (partySize >= 8) {
      groupDiscountPercent = 20;
    } else if (partySize >= 5) {
      groupDiscountPercent = 15;
    } else if (partySize >= 3) {
      groupDiscountPercent = 10;
    }
    
    // Check for complimentary groom outfit (5+ rentals)
    const hasComplimentaryGroom = partySize >= 5;
    
    // Calculate total amounts and line items
    let subtotal = 0;
    const lineItems = [];
    
    for (const member of partyMembers || []) {
      const outfit = member.wedding_outfits;
      const isGroom = member.role === 'groom';
      
      // Skip groom if complimentary
      if (isGroom && hasComplimentaryGroom) {
        lineItems.push({
          price_data: {
            currency: 'usd',
            product_data: {
              name: `${outfit.item_name} - ${member.user_profiles.full_name} (Groom - Complimentary)`,
              description: `Wedding: ${wedding.couple_names}`,
            },
            unit_amount: 0,
          },
          quantity: 1,
        });
        continue;
      }
      
      const itemPrice = outfit.rental_price || outfit.price || 0;
      subtotal += itemPrice;
      
      lineItems.push({
        price_data: {
          currency: 'usd',
          product_data: {
            name: `${outfit.item_name} - ${member.user_profiles.full_name}`,
            description: `Wedding: ${wedding.couple_names}`,
          },
          unit_amount: itemPrice,
        },
        quantity: 1,
      });
    }
    
    // Apply group discount
    const discountAmount = Math.round(subtotal * (groupDiscountPercent / 100));
    const finalTotal = subtotal - discountAmount;
    
    // Add discount line item if applicable
    if (discountAmount > 0) {
      lineItems.push({
        price_data: {
          currency: 'usd',
          product_data: {
            name: `Group Discount (${groupDiscountPercent}% off)`,
            description: `${partySize} party members discount`,
          },
          unit_amount: -discountAmount,
        },
        quantity: 1,
      });
    }
    
    // Create Stripe checkout session
    const stripe = await import('https://esm.sh/stripe@14.17.0');
    const stripeClient = new stripe.default(stripeSecretKey, {
      apiVersion: '2023-10-16',
    });
    
    // Determine success/cancel URLs based on payment type
    const baseUrl = req.headers.get('origin') || 'https://uac9impw13rm.space.minimax.io';
    let successUrl = `${baseUrl}/payment-success?session_id={CHECKOUT_SESSION_ID}`;
    let cancelUrl = `${baseUrl}/payment-cancelled`;
    
    if (paymentType === 'split') {
      successUrl = `${baseUrl}/split-payment-success?session_id={CHECKOUT_SESSION_ID}`;
    }
    
    const session = await stripeClient.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: successUrl,
      cancel_url: cancelUrl,
      customer_email: customerEmail,
      metadata: {
        wedding_id: weddingId.toString(),
        party_member_ids: JSON.stringify(partyMemberIds),
        payment_type: paymentType,
        group_discount_percent: groupDiscountPercent.toString(),
        has_complimentary_groom: hasComplimentaryGroom.toString(),
      },
      allow_promotion_codes: true,
    });
    
    // Create wedding order record
    const { data: weddingOrder, error: orderError } = await supabase
      .from('wedding_orders')
      .insert({
        wedding_id: weddingId,
        stripe_session_id: session.id,
        total_amount: finalTotal,
        subtotal: subtotal,
        discount_amount: discountAmount,
        group_discount_percent: groupDiscountPercent,
        party_size: partySize,
        has_complimentary_groom: hasComplimentaryGroom,
        payment_type: paymentType,
        status: 'pending',
        customer_email: customerEmail,
      })
      .select()
      .single();
      
    if (orderError) {
      console.error('Failed to create wedding order:', orderError);
      throw new Error('Failed to create order record');
    }
    
    // Create individual party order records
    if (partyMembers && partyMembers.length > 0) {
      const partyOrders = partyMembers.map(member => ({
        wedding_order_id: weddingOrder.id,
        party_member_id: member.id,
        outfit_id: member.wedding_outfits.id,
        amount: member.role === 'groom' && hasComplimentaryGroom ? 0 : (member.wedding_outfits.rental_price || member.wedding_outfits.price || 0),
        status: 'pending',
      }));
      
      const { error: partyOrderError } = await supabase
        .from('wedding_party_orders')
        .insert(partyOrders);
        
      if (partyOrderError) {
        console.error('Failed to create party orders:', partyOrderError);
      }
    }
    
    return new Response(
      JSON.stringify({
        data: {
          sessionId: session.id,
          checkoutUrl: session.url,
          weddingOrderId: weddingOrder.id,
          totalAmount: finalTotal,
          subtotal: subtotal,
          discountAmount: discountAmount,
          groupDiscountPercent: groupDiscountPercent,
          hasComplimentaryGroom: hasComplimentaryGroom,
        }
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
    
  } catch (error) {
    console.error('Wedding payment error:', error);
    
    const errorResponse = {
      error: {
        code: 'WEDDING_PAYMENT_ERROR',
        message: error.message
      }
    };
    
    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});