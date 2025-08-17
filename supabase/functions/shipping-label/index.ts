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
        const { orderId, rateId } = await req.json();

        console.log('Shipping label request:', { orderId, rateId });

        // Validate required parameters
        if (!orderId || !rateId) {
            throw new Error('Order ID and rate ID are required');
        }

        // Get environment variables
        const easypostApiKey = Deno.env.get('EASYPOST_API_KEY') || 'EZAKf82c7d30d3fa4781a76b2b7f1bd85c0a1wfhRGGxu6fZdxxWC9kVjw';
        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
        const supabaseUrl = Deno.env.get('SUPABASE_URL');

        if (!serviceRoleKey || !supabaseUrl) {
            throw new Error('Supabase configuration missing');
        }

        // Get the rate details from database
        const rateResponse = await fetch(`${supabaseUrl}/rest/v1/shipping_rates?easypost_rate_id=eq.${rateId}&order_id=eq.${orderId}`, {
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey
            }
        });

        if (!rateResponse.ok) {
            throw new Error('Failed to retrieve rate information');
        }

        const rates = await rateResponse.json();
        if (!rates || rates.length === 0) {
            throw new Error('Rate not found');
        }

        const selectedRate = rates[0];

        // Get order details for shipment creation
        const orderResponse = await fetch(`${supabaseUrl}/rest/v1/orders?id=eq.${orderId}`, {
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey
            }
        });

        if (!orderResponse.ok) {
            throw new Error('Failed to retrieve order information');
        }

        const orders = await orderResponse.json();
        if (!orders || orders.length === 0) {
            throw new Error('Order not found');
        }

        const order = orders[0];

        // Create shipment for label generation
        const fromAddress = {
            name: 'KCT Menswear',
            street1: '123 Fashion Ave',
            city: 'New York',
            state: 'NY',
            zip: '10001',
            country: 'US',
            phone: '555-123-4567'
        };

        const toAddress = {
            name: `${order.shipping_first_name} ${order.shipping_last_name}`,
            street1: order.shipping_address_line_1,
            street2: order.shipping_address_line_2 || '',
            city: order.shipping_city,
            state: order.shipping_state,
            zip: order.shipping_postal_code,
            country: order.shipping_country || 'US',
            phone: order.customer_phone || ''
        };

        const parcel = {
            length: 12,
            width: 9,
            height: 3,
            weight: 16
        };

        const shipmentData = {
            shipment: {
                to_address: toAddress,
                from_address: fromAddress,
                parcel: parcel
            }
        };

        // Create new shipment
        const shipmentResponse = await fetch('https://api.easypost.com/v2/shipments', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${easypostApiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(shipmentData)
        });

        if (!shipmentResponse.ok) {
            const errorText = await shipmentResponse.text();
            console.error('EasyPost shipment creation error:', errorText);
            throw new Error(`Failed to create shipment: ${errorText}`);
        }

        const shipmentResult = await shipmentResponse.json();
        console.log('Shipment created:', shipmentResult.id);

        // Find the matching rate in the new shipment
        const matchingRate = shipmentResult.rates?.find((rate: any) => 
            rate.carrier === selectedRate.carrier && rate.service === selectedRate.service
        );

        if (!matchingRate) {
            throw new Error('Matching rate not found in new shipment');
        }

        // Purchase the shipment
        const buyResponse = await fetch(`https://api.easypost.com/v2/shipments/${shipmentResult.id}/buy`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${easypostApiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                rate: {
                    id: matchingRate.id
                }
            })
        });

        if (!buyResponse.ok) {
            const errorText = await buyResponse.text();
            console.error('EasyPost purchase error:', errorText);
            throw new Error(`Failed to purchase label: ${errorText}`);
        }

        const purchasedShipment = await buyResponse.json();
        console.log('Label purchased successfully:', purchasedShipment.id);

        const labelUrl = purchasedShipment.postage_label?.label_url;
        const trackingNumber = purchasedShipment.tracking_code;

        if (!labelUrl) {
            throw new Error('Label URL not found in response');
        }

        // Update order with shipping details
        const orderUpdateData = {
            easypost_shipment_id: purchasedShipment.id,
            shipping_label_url: labelUrl,
            tracking_number: trackingNumber,
            tracking_status: 'label_created',
            carrier: matchingRate.carrier,
            service_type: matchingRate.service,
            shipping_cost: parseFloat(matchingRate.rate),
            status: 'processing',
            shipped_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        const updateResponse = await fetch(`${supabaseUrl}/rest/v1/orders?id=eq.${orderId}`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey,
                'Content-Type': 'application/json',
                'Prefer': 'return=minimal'
            },
            body: JSON.stringify(orderUpdateData)
        });

        if (!updateResponse.ok) {
            console.error('Failed to update order:', await updateResponse.text());
        }

        // Save label information
        const labelData = {
            order_id: orderId,
            easypost_shipment_id: purchasedShipment.id,
            label_url: labelUrl,
            tracking_number: trackingNumber,
            carrier: matchingRate.carrier,
            service: matchingRate.service,
            cost: parseFloat(matchingRate.rate),
            created_at: new Date().toISOString()
        };

        const labelSaveResponse = await fetch(`${supabaseUrl}/rest/v1/shipping_labels`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(labelData)
        });

        if (!labelSaveResponse.ok) {
            console.error('Failed to save label information:', await labelSaveResponse.text());
        }

        return new Response(JSON.stringify({
            data: {
                shipmentId: purchasedShipment.id,
                labelUrl: labelUrl,
                trackingNumber: trackingNumber,
                carrier: matchingRate.carrier,
                service: matchingRate.service,
                cost: matchingRate.rate
            }
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Shipping label error:', error);

        const errorResponse = {
            error: {
                code: 'SHIPPING_LABEL_FAILED',
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