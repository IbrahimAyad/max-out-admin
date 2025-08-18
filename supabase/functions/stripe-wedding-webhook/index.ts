Deno.serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
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
    const stripeWebhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Get raw body for signature verification
    const body = await req.text();
    const signature = req.headers.get('stripe-signature');
    
    if (!signature) {
      throw new Error('Missing Stripe signature');
    }
    
    // Verify webhook signature
    const stripe = await import('https://esm.sh/stripe@14.17.0');
    const stripeClient = new stripe.default(stripeSecretKey, {
      apiVersion: '2023-10-16',
    });
    
    let event;
    try {
      event = stripeClient.webhooks.constructEvent(body, signature, stripeWebhookSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err.message);
      throw new Error('Invalid signature');
    }
    
    console.log('Processing webhook event:', event.type);
    
    // Handle different event types
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        
        // Get wedding order by session ID
        const { data: weddingOrder, error: orderError } = await supabase
          .from('wedding_orders')
          .select('*')
          .eq('stripe_session_id', session.id)
          .single();
          
        if (orderError || !weddingOrder) {
          console.error('Wedding order not found for session:', session.id);
          break;
        }
        
        // Update wedding order status
        const { error: updateOrderError } = await supabase
          .from('wedding_orders')
          .update({
            status: 'paid',
            paid_at: new Date().toISOString(),
            stripe_payment_intent_id: session.payment_intent,
          })
          .eq('id', weddingOrder.id);
          
        if (updateOrderError) {
          console.error('Failed to update wedding order:', updateOrderError);
          break;
        }
        
        // Update party orders status
        const { error: updatePartyOrdersError } = await supabase
          .from('wedding_party_orders')
          .update({ status: 'paid' })
          .eq('wedding_order_id', weddingOrder.id);
          
        if (updatePartyOrdersError) {
          console.error('Failed to update party orders:', updatePartyOrdersError);
        }
        
        // Create order in main orders table for integration with existing system
        const { data: mainOrder, error: mainOrderError } = await supabase
          .from('orders')
          .insert({
            customer_email: weddingOrder.customer_email,
            total_amount: weddingOrder.total_amount,
            status: 'paid',
            order_type: 'wedding',
            wedding_id: weddingOrder.wedding_id,
            stripe_payment_intent_id: session.payment_intent,
            metadata: {
              wedding_order_id: weddingOrder.id,
              group_discount_percent: weddingOrder.group_discount_percent,
              party_size: weddingOrder.party_size,
              has_complimentary_groom: weddingOrder.has_complimentary_groom,
            },
          })
          .select()
          .single();
          
        if (mainOrderError) {
          console.error('Failed to create main order:', mainOrderError);
          break;
        }
        
        // Get party members for this order
        const { data: partyOrders, error: partyOrdersError } = await supabase
          .from('wedding_party_orders')
          .select(`
            *,
            wedding_party_members!inner(*),
            wedding_outfits!inner(*)
          `)
          .eq('wedding_order_id', weddingOrder.id);
          
        if (partyOrdersError) {
          console.error('Failed to fetch party orders:', partyOrdersError);
          break;
        }
        
        // Create order items for each party member
        if (partyOrders && partyOrders.length > 0) {
          const orderItems = partyOrders.map(partyOrder => ({
            order_id: mainOrder.id,
            product_id: partyOrder.wedding_outfits.product_id,
            variant_id: partyOrder.wedding_outfits.variant_id,
            quantity: 1,
            price: partyOrder.amount,
            total: partyOrder.amount,
            metadata: {
              party_member_id: partyOrder.party_member_id,
              outfit_id: partyOrder.outfit_id,
              member_role: partyOrder.wedding_party_members.role,
              member_name: partyOrder.wedding_party_members.full_name,
            },
          }));
          
          const { error: orderItemsError } = await supabase
            .from('order_items')
            .insert(orderItems);
            
          if (orderItemsError) {
            console.error('Failed to create order items:', orderItemsError);
          }
        }
        
        // Update wedding party member statuses
        if (partyOrders && partyOrders.length > 0) {
          const memberIds = partyOrders.map(po => po.party_member_id);
          const { error: updateMembersError } = await supabase
            .from('wedding_party_members')
            .update({ order_status: 'paid', updated_at: new Date().toISOString() })
            .in('id', memberIds);
            
          if (updateMembersError) {
            console.error('Failed to update party member statuses:', updateMembersError);
          }
        }
        
        // Log payment transaction
        const { error: transactionError } = await supabase
          .from('payment_transactions')
          .insert({
            order_id: mainOrder.id,
            payment_method: 'stripe',
            amount: weddingOrder.total_amount,
            status: 'completed',
            stripe_payment_intent_id: session.payment_intent,
            transaction_type: 'payment',
            metadata: {
              wedding_order_id: weddingOrder.id,
              stripe_session_id: session.id,
            },
          });
          
        if (transactionError) {
          console.error('Failed to log payment transaction:', transactionError);
        }
        
        console.log('Successfully processed wedding payment:', {
          weddingOrderId: weddingOrder.id,
          mainOrderId: mainOrder.id,
          amount: weddingOrder.total_amount,
        });
        
        break;
      }
      
      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object;
        
        // Find and update wedding order
        const { error: updateError } = await supabase
          .from('wedding_orders')
          .update({ status: 'failed' })
          .eq('stripe_payment_intent_id', paymentIntent.id);
          
        if (updateError) {
          console.error('Failed to update failed payment:', updateError);
        }
        
        break;
      }
      
      default:
        console.log('Unhandled event type:', event.type);
    }
    
    return new Response(
      JSON.stringify({ received: true }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
    
  } catch (error) {
    console.error('Webhook processing error:', error);
    
    const errorResponse = {
      error: {
        code: 'WEBHOOK_ERROR',
        message: error.message
      }
    };
    
    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});