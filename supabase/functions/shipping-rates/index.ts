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
        const { orderId, toAddress, weight, dimensions } = await req.json();

        console.log('Shipping rates request:', { orderId, toAddress, weight, dimensions });

        // Validate required parameters
        if (!orderId || !toAddress) {
            throw new Error('Order ID and destination address are required');
        }

        // Get environment variables
        const easypostApiKey = Deno.env.get('EASYPOST_API_KEY') || 'EZAKf82c7d30d3fa4781a76b2b7f1bd85c0a1wfhRGGxu6fZdxxWC9kVjw';
        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
        const supabaseUrl = Deno.env.get('SUPABASE_URL');

        if (!serviceRoleKey || !supabaseUrl) {
            throw new Error('Supabase configuration missing');
        }

        // Default from address (KCT Menswear warehouse)
        const fromAddress = {
            name: 'KCT Menswear',
            street1: '123 Fashion Ave',
            city: 'New York',
            state: 'NY',
            zip: '10001',
            country: 'US',
            phone: '555-123-4567'
        };

        // Default parcel dimensions if not provided
        const parcel = {
            length: dimensions?.length || 12,
            width: dimensions?.width || 9,
            height: dimensions?.height || 3,
            weight: weight || 16 // Default weight in ounces
        };

        // Create shipment with EasyPost
        const shipmentData = {
            shipment: {
                to_address: toAddress,
                from_address: fromAddress,
                parcel: parcel
            }
        };

        console.log('Creating EasyPost shipment:', JSON.stringify(shipmentData, null, 2));

        const easypostResponse = await fetch('https://api.easypost.com/v2/shipments', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${easypostApiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(shipmentData)
        });

        if (!easypostResponse.ok) {
            const errorText = await easypostResponse.text();
            console.error('EasyPost API error:', errorText);
            throw new Error(`EasyPost API error: ${errorText}`);
        }

        const shipmentResult = await easypostResponse.json();
        console.log('EasyPost shipment created:', shipmentResult.id);

        // Extract and save rates
        const rates = shipmentResult.rates?.map((rate: any) => ({
            order_id: orderId,
            carrier: rate.carrier,
            service: rate.service,
            rate: parseFloat(rate.rate),
            delivery_days: rate.delivery_days,
            delivery_date: rate.delivery_date,
            easypost_rate_id: rate.id,
            created_at: new Date().toISOString()
        })) || [];

        if (rates.length > 0) {
            // Save rates to database
            const ratesResponse = await fetch(`${supabaseUrl}/rest/v1/shipping_rates`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(rates)
            });

            if (!ratesResponse.ok) {
                console.error('Failed to save shipping rates:', await ratesResponse.text());
            }
        }

        // Return formatted rates
        const formattedRates = rates.map((rate: any) => ({
            id: rate.easypost_rate_id,
            carrier: rate.carrier,
            service: rate.service,
            rate: `$${rate.rate}`,
            delivery_days: rate.delivery_days,
            delivery_date: rate.delivery_date
        }));

        return new Response(JSON.stringify({
            data: {
                shipmentId: shipmentResult.id,
                rates: formattedRates
            }
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Shipping rates error:', error);

        const errorResponse = {
            error: {
                code: 'SHIPPING_RATES_FAILED',
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