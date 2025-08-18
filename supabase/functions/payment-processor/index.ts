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
        const requestData = await req.json();
        const { payment_type, party_member_id, amount, wedding_id, order_details } = requestData;

        // Validate required fields
        if (!payment_type || !amount || (!party_member_id && !wedding_id)) {
            throw new Error('Missing required fields: payment_type, amount, and either party_member_id or wedding_id');
        }

        const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
        if (!stripeSecretKey) {
            throw new Error('Stripe secret key not configured');
        }

        let paymentIntent;
        
        // Handle different payment types
        switch (payment_type) {
            case 'individual_order':
                // Individual party member payment
                paymentIntent = await createPaymentIntent({
                    amount: Math.round(amount * 100), // Convert to cents
                    currency: 'usd',
                    metadata: {
                        payment_type: 'individual_order',
                        party_member_id: party_member_id,
                        wedding_id: wedding_id || '',
                        order_type: 'wedding_formal_wear'
                    },
                    description: `Wedding formal wear order - ${order_details?.description || 'Individual order'}`
                }, stripeSecretKey);
                break;
                
            case 'group_payment':
                // Groom paying for entire wedding party
                paymentIntent = await createPaymentIntent({
                    amount: Math.round(amount * 100),
                    currency: 'usd',
                    metadata: {
                        payment_type: 'group_payment',
                        wedding_id: wedding_id,
                        party_size: order_details?.party_size || '1',
                        order_type: 'wedding_group_order'
                    },
                    description: `Wedding party group order - ${order_details?.description || 'Group payment'}`
                }, stripeSecretKey);
                break;
                
            case 'deposit':
                // Partial payment/deposit
                paymentIntent = await createPaymentIntent({
                    amount: Math.round(amount * 100),
                    currency: 'usd',
                    metadata: {
                        payment_type: 'deposit',
                        party_member_id: party_member_id || '',
                        wedding_id: wedding_id,
                        is_deposit: 'true'
                    },
                    description: `Wedding order deposit - ${order_details?.description || 'Deposit payment'}`
                }, stripeSecretKey);
                break;
                
            case 'rush_surcharge':
                // Rush order surcharge
                paymentIntent = await createPaymentIntent({
                    amount: Math.round(amount * 100),
                    currency: 'usd',
                    metadata: {
                        payment_type: 'rush_surcharge',
                        party_member_id: party_member_id || '',
                        wedding_id: wedding_id,
                        rush_timeline: order_details?.timeline_days || '7'
                    },
                    description: `Rush order surcharge - ${order_details?.description || 'Expedited processing'}`
                }, stripeSecretKey);
                break;
                
            default:
                throw new Error(`Unknown payment type: ${payment_type}`);
        }

        const response = {
            success: true,
            payment_intent_id: paymentIntent.id,
            client_secret: paymentIntent.client_secret,
            amount: paymentIntent.amount,
            currency: paymentIntent.currency,
            status: paymentIntent.status,
            payment_type,
            metadata: paymentIntent.metadata
        };

        return new Response(JSON.stringify(response), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        const errorResponse = {
            error: {
                code: 'PAYMENT_PROCESSOR_ERROR',
                message: error.message
            }
        };

        return new Response(JSON.stringify(errorResponse), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});

// Helper function to create Stripe Payment Intent
async function createPaymentIntent(paymentData, stripeSecretKey) {
    const response = await fetch('https://api.stripe.com/v1/payment_intents', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${stripeSecretKey}`,
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
            amount: paymentData.amount.toString(),
            currency: paymentData.currency,
            description: paymentData.description,
            'metadata[payment_type]': paymentData.metadata.payment_type,
            'metadata[party_member_id]': paymentData.metadata.party_member_id || '',
            'metadata[wedding_id]': paymentData.metadata.wedding_id || '',
            'metadata[order_type]': paymentData.metadata.order_type,
            'metadata[is_deposit]': paymentData.metadata.is_deposit || 'false',
            'metadata[party_size]': paymentData.metadata.party_size || '1',
            'metadata[rush_timeline]': paymentData.metadata.rush_timeline || ''
        })
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Stripe API error: ${errorText}`);
    }

    return await response.json();
}