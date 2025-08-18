Deno.serve(async (req) => {
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, user-agent',
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE, PATCH',
        'Access-Control-Max-Age': '86400',
        'Access-Control-Allow-Credentials': 'false'
    };

    if (req.method === 'OPTIONS') {
        return new Response(null, { status: 200, headers: corsHeaders });
    }

    try {
        console.log('EasyPost webhook received:', req.method);
        
        // Get environment variables
        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
        const supabaseUrl = Deno.env.get('SUPABASE_URL');
        
        if (!serviceRoleKey || !supabaseUrl) {
            throw new Error('Supabase configuration missing');
        }

        // Parse webhook payload
        const webhookData = await req.json();
        console.log('Webhook payload:', JSON.stringify(webhookData, null, 2));

        const { object, description } = webhookData;
        
        if (!object) {
            throw new Error('Invalid webhook payload: missing object');
        }

        // Handle different event types
        switch (description) {
            case 'tracker.updated':
                await handleTrackerUpdate(object, serviceRoleKey, supabaseUrl);
                break;
            
            case 'batch.updated':
                await handleBatchUpdate(object, serviceRoleKey, supabaseUrl);
                break;
                
            case 'shipment.purchased':
                await handleShipmentPurchased(object, serviceRoleKey, supabaseUrl);
                break;
                
            case 'shipment.label_created':
                await handleLabelCreated(object, serviceRoleKey, supabaseUrl);
                break;
                
            default:
                console.log(`Unhandled webhook event: ${description}`);
        }

        return new Response(JSON.stringify({ 
            success: true,
            message: 'Webhook processed successfully',
            event_type: description 
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('EasyPost webhook error:', error);
        
        const errorResponse = {
            error: {
                code: 'WEBHOOK_PROCESSING_FAILED',
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

// Handle tracking updates
async function handleTrackerUpdate(tracker: any, serviceRoleKey: string, supabaseUrl: string) {
    console.log('Processing tracker update:', tracker.id);
    
    const trackingNumber = tracker.tracking_code;
    const status = tracker.status;
    const lastEvent = tracker.tracking_details?.[0];
    
    if (!trackingNumber) {
        console.warn('Tracker update missing tracking number');
        return;
    }

    // Update order tracking status
    const updateResponse = await fetch(`${supabaseUrl}/rest/v1/orders`, {
        method: 'PATCH',
        headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'apikey': serviceRoleKey,
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal'
        },
        body: JSON.stringify({
            tracking_status: status,
            updated_at: new Date().toISOString()
        })
    });

    if (!updateResponse.ok) {
        console.error('Failed to update order tracking status:', await updateResponse.text());
    }

    // Insert tracking event
    const eventData = {
        tracking_number: trackingNumber,
        status: status,
        message: lastEvent?.message || `Status updated to ${status}`,
        location: lastEvent?.tracking_location?.city ? 
                 `${lastEvent.tracking_location.city}, ${lastEvent.tracking_location.state}` : null,
        occurred_at: lastEvent?.datetime || new Date().toISOString(),
        easypost_event_id: `tracker_${tracker.id}_${Date.now()}`,
        created_at: new Date().toISOString()
    };

    const eventResponse = await fetch(`${supabaseUrl}/rest/v1/shipping_events`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'apikey': serviceRoleKey,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(eventData)
    });

    if (!eventResponse.ok) {
        console.error('Failed to create shipping event:', await eventResponse.text());
    }

    // Trigger email notifications via new webhook email function
    try {
        const emailResponse = await fetch(`${supabaseUrl}/functions/v1/easypost-webhook-email`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                object: tracker,
                description: 'tracker.updated'
            })
        });

        if (!emailResponse.ok) {
            console.error('Failed to trigger email notification:', await emailResponse.text());
        } else {
            console.log('Email notification triggered successfully');
        }
    } catch (emailError) {
        console.error('Error triggering email notification:', emailError);
    }

    console.log('Tracker update processed successfully');
}

// Handle batch updates
async function handleBatchUpdate(batch: any, serviceRoleKey: string, supabaseUrl: string) {
    console.log('Processing batch update:', batch.id);
    // Batch updates can contain multiple shipments
    // This is useful for bulk operations
}

// Handle shipment purchased
async function handleShipmentPurchased(shipment: any, serviceRoleKey: string, supabaseUrl: string) {
    console.log('Processing shipment purchased:', shipment.id);
    
    const trackingNumber = shipment.tracking_code;
    const easypostShipmentId = shipment.id;
    
    if (!trackingNumber) {
        console.warn('Shipment purchased without tracking number');
        return;
    }

    // Update order with shipment details and set status to shipped
    const updateData = {
        easypost_shipment_id: easypostShipmentId,
        tracking_number: trackingNumber,
        tracking_status: 'label_created',
        carrier: shipment.selected_rate?.carrier,
        service_type: shipment.selected_rate?.service,
        shipping_cost: parseFloat(shipment.selected_rate?.rate || '0'),
        status: 'shipped',
        updated_at: new Date().toISOString()
    };

    const updateResponse = await fetch(`${supabaseUrl}/rest/v1/orders`, {
        method: 'PATCH',
        headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'apikey': serviceRoleKey,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
        },
        body: JSON.stringify(updateData)
    });

    if (!updateResponse.ok) {
        console.error('Failed to update order with shipment details:', await updateResponse.text());
        return;
    }

    // Get the updated order data for email
    const orderData = await updateResponse.json();
    const order = orderData[0];

    if (order) {
        // Trigger order automation for shipping label created
        try {
            const automationResponse = await fetch(`${supabaseUrl}/functions/v1/order-automation`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    action: 'shipping_label_created',
                    orderData: order
                })
            });

            if (!automationResponse.ok) {
                console.error('Failed to trigger shipping email automation:', await automationResponse.text());
            } else {
                console.log('Shipping email automation triggered successfully');
            }
        } catch (emailError) {
            console.error('Error triggering shipping email automation:', emailError);
        }
    }

    console.log('Shipment purchased processed successfully');
}

// Handle label created
async function handleLabelCreated(shipment: any, serviceRoleKey: string, supabaseUrl: string) {
    console.log('Processing label created:', shipment.id);
    
    const labelUrl = shipment.postage_label?.label_url;
    const trackingNumber = shipment.tracking_code;
    
    if (!labelUrl || !trackingNumber) {
        console.warn('Label created but missing label URL or tracking number');
        return;
    }

    // Update order with label URL
    const updateResponse = await fetch(`${supabaseUrl}/rest/v1/orders`, {
        method: 'PATCH',
        headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'apikey': serviceRoleKey,
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal'
        },
        body: JSON.stringify({
            shipping_label_url: labelUrl,
            updated_at: new Date().toISOString()
        })
    });

    if (!updateResponse.ok) {
        console.error('Failed to update order with label URL:', await updateResponse.text());
    }

    console.log('Label created processed successfully');
}