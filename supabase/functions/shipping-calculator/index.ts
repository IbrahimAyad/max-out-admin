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
        const { to_address, from_address, parcel_details, timeline_days, service_preference } = requestData;

        // Validate required fields
        if (!to_address || !parcel_details) {
            throw new Error('Missing required fields: to_address and parcel_details');
        }

        const easypostApiKey = Deno.env.get('EASYPOST_API_KEY');
        if (!easypostApiKey) {
            throw new Error('EasyPost API key not configured');
        }

        // Default from address (KCT Menswear shipping center)
        const defaultFromAddress = from_address || {
            name: 'KCT Menswear',
            street1: '123 Fashion District Blvd',
            city: 'Los Angeles',
            state: 'CA',
            zip: '90028',
            country: 'US'
        };

        // Default parcel dimensions for formal wear
        const defaultParcel = {
            length: parcel_details.length || 24,
            width: parcel_details.width || 18,
            height: parcel_details.height || 6,
            weight: parcel_details.weight || 3.5,
            ...parcel_details
        };

        // Create shipment with EasyPost
        const shipmentResponse = await fetch('https://api.easypost.com/v2/shipments', {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${btoa(easypostApiKey + ':')}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                shipment: {
                    to_address: to_address,
                    from_address: defaultFromAddress,
                    parcel: defaultParcel
                }
            })
        });

        if (!shipmentResponse.ok) {
            const errorText = await shipmentResponse.text();
            throw new Error(`EasyPost shipment creation failed: ${errorText}`);
        }

        const shipmentData = await shipmentResponse.json();
        const rates = shipmentData.rates || [];

        // Filter and categorize rates based on wedding timeline
        const categorizedRates = {
            emergency_rush: [],
            standard_rush: [],
            standard: []
        };

        const timelineDays = parseInt(timeline_days) || 14;
        
        rates.forEach(rate => {
            const service = rate.service.toLowerCase();
            const carrierService = `${rate.carrier}_${service}`.toLowerCase();
            
            // Categorize based on service speed and timeline requirements
            if (timelineDays < 7) {
                if (service.includes('overnight') || service.includes('priority')) {
                    categorizedRates.emergency_rush.push({
                        ...rate,
                        category: 'emergency_rush',
                        surcharge: 50,
                        total_cost: parseFloat(rate.rate) + 50,
                        recommended: true
                    });
                } else if (service.includes('2day') || service.includes('express')) {
                    categorizedRates.standard_rush.push({
                        ...rate,
                        category: 'standard_rush',
                        surcharge: 25,
                        total_cost: parseFloat(rate.rate) + 25,
                        recommended: false
                    });
                }
            } else if (timelineDays >= 7 && timelineDays <= 14) {
                if (service.includes('2day') || service.includes('express')) {
                    categorizedRates.standard_rush.push({
                        ...rate,
                        category: 'standard_rush',
                        surcharge: 25,
                        total_cost: parseFloat(rate.rate) + 25,
                        recommended: true
                    });
                } else if (service.includes('ground') || service.includes('standard')) {
                    categorizedRates.standard.push({
                        ...rate,
                        category: 'standard',
                        surcharge: 0,
                        total_cost: parseFloat(rate.rate),
                        recommended: false
                    });
                }
            } else {
                if (service.includes('ground') || service.includes('standard')) {
                    categorizedRates.standard.push({
                        ...rate,
                        category: 'standard',
                        surcharge: 0,
                        total_cost: parseFloat(rate.rate),
                        recommended: true
                    });
                } else if (service.includes('2day') || service.includes('express')) {
                    categorizedRates.standard_rush.push({
                        ...rate,
                        category: 'standard_rush',
                        surcharge: 25,
                        total_cost: parseFloat(rate.rate) + 25,
                        recommended: false
                    });
                }
            }
        });

        // Find the best recommended option
        const allRates = [
            ...categorizedRates.emergency_rush,
            ...categorizedRates.standard_rush,
            ...categorizedRates.standard
        ];
        
        const recommendedRate = allRates.find(rate => rate.recommended) || allRates[0];

        // Calculate insurance value (assume formal wear value)
        const insuranceValue = parcel_details.declared_value || 500;
        
        const response = {
            success: true,
            shipment_id: shipmentData.id,
            timeline_days: timelineDays,
            rates: categorizedRates,
            recommended_rate: recommendedRate,
            insurance_required: insuranceValue,
            signature_required: true,
            delivery_options: {
                residential: to_address.residential !== false,
                saturday_delivery: timelineDays < 7,
                delivery_confirmation: true
            },
            address_verification: {
                status: shipmentData.to_address?.verifications?.delivery?.success ? 'verified' : 'needs_review',
                details: shipmentData.to_address?.verifications
            }
        };

        return new Response(JSON.stringify(response), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        const errorResponse = {
            error: {
                code: 'SHIPPING_CALCULATOR_ERROR',
                message: error.message
            }
        };

        return new Response(JSON.stringify(errorResponse), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});