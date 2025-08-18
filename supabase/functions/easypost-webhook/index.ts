Deno.serve(async (req) => {
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-easypost-hmac-signature',
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE, PATCH',
        'Access-Control-Max-Age': '86400',
        'Access-Control-Allow-Credentials': 'false'
    };

    if (req.method === 'OPTIONS') {
        return new Response(null, { status: 200, headers: corsHeaders });
    }

    try {
        // Only accept POST requests for webhooks
        if (req.method !== 'POST') {
            return new Response(JSON.stringify({
                error: 'Method not allowed. Only POST requests accepted.'
            }), {
                status: 405,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // Get the raw body and signature for verification
        const rawBody = await req.text();
        const signature = req.headers.get('x-easypost-hmac-signature');
        const webhookSecret = 'kct-easypost-webhook-secret-2025';

        // Verify webhook signature
        if (signature && webhookSecret) {
            const expectedSignature = await generateHmacSignature(rawBody, webhookSecret);
            if (signature !== expectedSignature) {
                console.log('Invalid webhook signature');
                return new Response(JSON.stringify({
                    error: 'Invalid signature'
                }), {
                    status: 401,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
            }
        }

        // Parse the webhook payload
        const webhookData = JSON.parse(rawBody);
        const eventType = webhookData.description || webhookData.object?.mode || 'unknown';
        const objectType = webhookData.object?.object || 'unknown';

        console.log(`Received EasyPost webhook: ${eventType} - ${objectType}`);
        console.log('Webhook payload:', JSON.stringify(webhookData, null, 2));

        // Handle different webhook event types
        let processedData = null;
        
        switch (objectType) {
            case 'Tracker':
                processedData = await handleTrackerEvent(webhookData);
                break;
            case 'Shipment':
                processedData = await handleShipmentEvent(webhookData);
                break;
            case 'ScanForm':
                processedData = await handleScanFormEvent(webhookData);
                break;
            case 'Batch':
                processedData = await handleBatchEvent(webhookData);
                break;
            default:
                console.log(`Unhandled webhook object type: ${objectType}`);
                processedData = {
                    handled: false,
                    message: `Received ${objectType} event but no handler configured`
                };
        }

        // Store webhook event for audit trail
        const auditRecord = {
            webhook_id: webhookData.id || 'unknown',
            event_type: eventType,
            object_type: objectType,
            received_at: new Date().toISOString(),
            payload: webhookData,
            processed_data: processedData,
            signature_verified: !!signature
        };

        console.log('Webhook processed successfully:', auditRecord);

        return new Response(JSON.stringify({
            success: true,
            event_type: eventType,
            object_type: objectType,
            processed: processedData?.handled || false,
            message: processedData?.message || 'Event received and logged'
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Webhook processing error:', error);
        
        const errorResponse = {
            error: {
                code: 'EASYPOST_WEBHOOK_ERROR',
                message: error.message
            }
        };

        return new Response(JSON.stringify(errorResponse), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});

// Handle tracker events (shipment tracking updates)
async function handleTrackerEvent(webhookData) {
    const tracker = webhookData.object;
    const trackingCode = tracker.tracking_code;
    const status = tracker.status;
    const statusDetail = tracker.status_detail;
    
    console.log(`Tracker update: ${trackingCode} - ${status} (${statusDetail})`);
    
    // Key status updates to handle
    const criticalStatuses = [
        'delivered',
        'out_for_delivery', 
        'in_transit',
        'exception',
        'return_to_sender',
        'failure'
    ];
    
    if (criticalStatuses.includes(status)) {
        // Send notification to customer
        const notificationData = {
            notification_type: 'order_status_update',
            tracking_code: trackingCode,
            status: status,
            status_detail: statusDetail,
            estimated_delivery: tracker.est_delivery_date,
            tracking_details: tracker.tracking_details || []
        };
        
        // Call the wedding-notifications function
        try {
            await fetch('https://gvcswimqaxvylgxbklbz.supabase.co/functions/v1/wedding-notifications', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(notificationData)
            });
        } catch (notificationError) {
            console.error('Failed to send tracking notification:', notificationError);
        }
    }
    
    return {
        handled: true,
        message: `Tracker ${trackingCode} updated to ${status}`,
        tracking_code: trackingCode,
        status: status
    };
}

// Handle shipment events
async function handleShipmentEvent(webhookData) {
    const shipment = webhookData.object;
    const shipmentId = shipment.id;
    const status = shipment.status || 'unknown';
    
    console.log(`Shipment update: ${shipmentId} - ${status}`);
    
    return {
        handled: true,
        message: `Shipment ${shipmentId} status: ${status}`,
        shipment_id: shipmentId,
        status: status
    };
}

// Handle scan form events
async function handleScanFormEvent(webhookData) {
    const scanForm = webhookData.object;
    const scanFormId = scanForm.id;
    
    console.log(`ScanForm event: ${scanFormId}`);
    
    return {
        handled: true,
        message: `ScanForm ${scanFormId} processed`,
        scan_form_id: scanFormId
    };
}

// Handle batch events
async function handleBatchEvent(webhookData) {
    const batch = webhookData.object;
    const batchId = batch.id;
    const status = batch.status || 'unknown';
    
    console.log(`Batch event: ${batchId} - ${status}`);
    
    return {
        handled: true,
        message: `Batch ${batchId} status: ${status}`,
        batch_id: batchId,
        status: status
    };
}

// Generate HMAC signature for webhook verification
async function generateHmacSignature(data, secret) {
    const encoder = new TextEncoder();
    const keyData = encoder.encode(secret);
    const dataToSign = encoder.encode(data);
    
    const key = await crypto.subtle.importKey(
        'raw',
        keyData,
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
    );
    
    const signature = await crypto.subtle.sign('HMAC', key, dataToSign);
    const hashArray = Array.from(new Uint8Array(signature));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    
    return hashHex;
}