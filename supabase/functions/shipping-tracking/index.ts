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
        const url = new URL(req.url);
        const trackingNumber = url.searchParams.get('tracking_number');
        const orderId = url.searchParams.get('order_id');

        console.log('Tracking request:', { trackingNumber, orderId });

        if (!trackingNumber && !orderId) {
            throw new Error('Either tracking number or order ID is required');
        }

        // Get environment variables
        const easypostApiKey = Deno.env.get('EASYPOST_API_KEY') || 'EZAKf82c7d30d3fa4781a76b2b7f1bd85c0a1wfhRGGxu6fZdxxWC9kVjw';
        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
        const supabaseUrl = Deno.env.get('SUPABASE_URL');

        if (!serviceRoleKey || !supabaseUrl) {
            throw new Error('Supabase configuration missing');
        }

        let finalTrackingNumber = trackingNumber;

        // If we have order ID but no tracking number, get it from the database
        if (orderId && !trackingNumber) {
            const orderResponse = await fetch(`${supabaseUrl}/rest/v1/orders?id=eq.${orderId}&select=tracking_number`, {
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey
                }
            });

            if (!orderResponse.ok) {
                throw new Error('Failed to retrieve order information');
            }

            const orders = await orderResponse.json();
            if (!orders || orders.length === 0 || !orders[0].tracking_number) {
                throw new Error('Tracking number not found for this order');
            }

            finalTrackingNumber = orders[0].tracking_number;
        }

        // Get tracking information from EasyPost
        const trackingResponse = await fetch(`https://api.easypost.com/v2/trackers/${finalTrackingNumber}`, {
            headers: {
                'Authorization': `Bearer ${easypostApiKey}`
            }
        });

        if (!trackingResponse.ok) {
            const errorText = await trackingResponse.text();
            console.error('EasyPost tracking error:', errorText);
            throw new Error(`Failed to retrieve tracking information: ${errorText}`);
        }

        const trackingData = await trackingResponse.json();
        console.log('Tracking data retrieved:', trackingData.id);

        // Format tracking events
        const events = trackingData.tracking_details?.map((event: any) => ({
            status: event.status,
            message: event.message,
            location: event.tracking_location ? 
                     `${event.tracking_location.city}, ${event.tracking_location.state}` : null,
            datetime: event.datetime,
            source: 'easypost'
        })) || [];

        // Get stored tracking events from database
        const dbEventsResponse = await fetch(`${supabaseUrl}/rest/v1/shipping_events?tracking_number=eq.${finalTrackingNumber}&order=occurred_at.desc`, {
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey
            }
        });

        let dbEvents = [];
        if (dbEventsResponse.ok) {
            dbEvents = await dbEventsResponse.json();
        }

        // Combine events from EasyPost and database
        const allEvents = [
            ...events,
            ...dbEvents.map((event: any) => ({
                status: event.status,
                message: event.message,
                location: event.location,
                datetime: event.occurred_at,
                source: 'database'
            }))
        ].sort((a, b) => new Date(b.datetime).getTime() - new Date(a.datetime).getTime());

        // Remove duplicates based on datetime and status
        const uniqueEvents = allEvents.filter((event, index, arr) => 
            index === arr.findIndex(e => 
                e.datetime === event.datetime && e.status === event.status
            )
        );

        // Update order tracking status if we have the latest status
        if (orderId && trackingData.status) {
            const updateResponse = await fetch(`${supabaseUrl}/rest/v1/orders?id=eq.${orderId}`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey,
                    'Content-Type': 'application/json',
                    'Prefer': 'return=minimal'
                },
                body: JSON.stringify({
                    tracking_status: trackingData.status,
                    updated_at: new Date().toISOString()
                })
            });

            if (!updateResponse.ok) {
                console.error('Failed to update order tracking status:', await updateResponse.text());
            }
        }

        return new Response(JSON.stringify({
            data: {
                trackingNumber: finalTrackingNumber,
                status: trackingData.status,
                estimatedDeliveryDate: trackingData.est_delivery_date,
                carrier: trackingData.carrier,
                events: uniqueEvents,
                lastUpdated: new Date().toISOString()
            }
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Shipping tracking error:', error);

        const errorResponse = {
            error: {
                code: 'SHIPPING_TRACKING_FAILED',
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