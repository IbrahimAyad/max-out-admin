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
        const { party_member_id, measurements, fit_preferences } = requestData;

        // Validate required fields
        if (!party_member_id || !measurements) {
            throw new Error('Missing required fields: party_member_id and measurements');
        }

        // Validate measurement data structure
        const requiredMeasurements = ['chest', 'waist', 'hips', 'inseam', 'outseam', 'shoulder_width'];
        const missingMeasurements = requiredMeasurements.filter(key => !measurements[key]);
        
        if (missingMeasurements.length > 0) {
            throw new Error(`Missing required measurements: ${missingMeasurements.join(', ')}`);
        }

        // Calculate confidence score based on measurement completeness and consistency
        let confidenceScore = 100;
        
        // Check for reasonable measurement ranges (in inches)
        const measurementRanges = {
            chest: [30, 60],
            waist: [26, 50],
            hips: [32, 55],
            inseam: [28, 38],
            outseam: [38, 48],
            shoulder_width: [16, 24]
        };

        for (const [key, value] of Object.entries(measurements)) {
            if (measurementRanges[key]) {
                const [min, max] = measurementRanges[key];
                const numValue = parseFloat(value);
                
                if (numValue < min || numValue > max) {
                    confidenceScore -= 15;
                }
            }
        }

        // Generate size recommendations based on measurements
        const chestSize = parseFloat(measurements.chest);
        const waistSize = parseFloat(measurements.waist);
        
        let jacketSize, pantSize;
        
        // Standard sizing algorithm
        if (chestSize <= 36) jacketSize = '36R';
        else if (chestSize <= 38) jacketSize = '38R';
        else if (chestSize <= 40) jacketSize = '40R';
        else if (chestSize <= 42) jacketSize = '42R';
        else if (chestSize <= 44) jacketSize = '44R';
        else if (chestSize <= 46) jacketSize = '46R';
        else jacketSize = '48R';
        
        if (waistSize <= 30) pantSize = '30';
        else if (waistSize <= 32) pantSize = '32';
        else if (waistSize <= 34) pantSize = '34';
        else if (waistSize <= 36) pantSize = '36';
        else if (waistSize <= 38) pantSize = '38';
        else pantSize = '40';

        const sizeRecommendations = {
            jacket_size: jacketSize,
            pant_size: pantSize,
            shirt_size: `${Math.round(chestSize / 2)}`
        };

        const processedData = {
            party_member_id,
            measurements,
            fit_preferences: fit_preferences || {},
            size_recommendations: sizeRecommendations,
            confidence_score: Math.max(0, confidenceScore),
            measurement_method: 'self_reported',
            requires_fitting: confidenceScore < 70,
            professional_review_needed: confidenceScore < 50
        };

        return new Response(JSON.stringify({
            success: true,
            data: processedData,
            recommendations: {
                confidence_level: confidenceScore >= 80 ? 'high' : confidenceScore >= 60 ? 'medium' : 'low',
                next_steps: confidenceScore < 70 ? 
                    ['Schedule professional fitting', 'Review measurements with tailor'] :
                    ['Proceed with order', 'Schedule final fitting if desired']
            }
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        const errorResponse = {
            error: {
                code: 'MEASUREMENT_PROCESSOR_ERROR',
                message: error.message
            }
        };

        return new Response(JSON.stringify(errorResponse), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});