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
        const supabaseUrl = Deno.env.get('SUPABASE_URL');
        const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');

        if (!supabaseUrl || !supabaseAnonKey) {
            throw new Error('Supabase configuration missing');
        }

        // Get user from auth header
        const authHeader = req.headers.get('authorization');
        if (!authHeader) {
            throw new Error('No authorization header');
        }

        const token = authHeader.replace('Bearer ', '');

        // Verify token and get user
        const userResponse = await fetch(`${supabaseUrl}/auth/v1/user`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'apikey': supabaseAnonKey
            }
        });

        if (!userResponse.ok) {
            throw new Error('Invalid token');
        }

        const userData = await userResponse.json();
        const userEmail = userData.email;

        // Get party member data
        const memberResponse = await fetch(`${supabaseUrl}/rest/v1/wedding_party_members?email=eq.${userEmail}&select=*`, {
            headers: {
                'apikey': supabaseAnonKey,
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!memberResponse.ok) {
            throw new Error('Failed to fetch party member data');
        }

        const members = await memberResponse.json();

        if (members.length === 0) {
            throw new Error('No wedding party membership found for this user');
        }

        const member = members[0];
        const url = new URL(req.url);
        const method = req.method;

        if (method === 'GET') {
            // Get current measurements
            const measurementsResponse = await fetch(`${supabaseUrl}/rest/v1/wedding_measurements?party_member_id=eq.${member.id}&is_current=eq.true&select=*`, {
                headers: {
                    'apikey': supabaseAnonKey,
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            const measurements = measurementsResponse.ok ? await measurementsResponse.json() : [];

            return new Response(JSON.stringify({
                data: {
                    measurements: measurements.length > 0 ? measurements[0] : null,
                    hasCurrentMeasurements: measurements.length > 0
                }
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });

        } else if (method === 'POST') {
            // Submit new measurements
            const { measurements, fitPreferences, measurementMethod, notes, specialConsiderations } = await req.json();

            if (!measurements) {
                throw new Error('Measurements data is required');
            }

            // Validate measurement data
            const requiredMeasurements = ['chest', 'waist', 'hips', 'shoulder_width', 'sleeve_length', 'inseam', 'neck'];
            const missingMeasurements = requiredMeasurements.filter(m => !measurements[m]);

            if (missingMeasurements.length > 0) {
                return new Response(JSON.stringify({
                    error: {
                        code: 'INCOMPLETE_MEASUREMENTS',
                        message: `Missing required measurements: ${missingMeasurements.join(', ')}`,
                        missingFields: missingMeasurements
                    }
                }), {
                    status: 400,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
            }

            // Calculate confidence score based on measurement consistency
            let confidenceScore = 80; // Base confidence

            // Check for reasonable measurement ranges
            const measurementRanges = {
                chest: [32, 60],
                waist: [28, 56],
                hips: [32, 60],
                shoulder_width: [14, 26],
                sleeve_length: [30, 38],
                inseam: [28, 40],
                neck: [14, 20]
            };

            for (const [key, value] of Object.entries(measurements)) {
                if (measurementRanges[key]) {
                    const [min, max] = measurementRanges[key];
                    if (value < min || value > max) {
                        confidenceScore -= 10;
                    }
                }
            }

            // Generate size recommendations based on measurements
            const sizeRecommendations = {
                jacket: calculateJacketSize(measurements),
                trouser: calculateTrouserSize(measurements),
                shirt: calculateShirtSize(measurements)
            };

            // Mark previous measurements as not current
            await fetch(`${supabaseUrl}/rest/v1/wedding_measurements?party_member_id=eq.${member.id}`, {
                method: 'PATCH',
                headers: {
                    'apikey': supabaseAnonKey,
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ is_current: false })
            });

            // Insert new measurement record
            const measurementData = {
                party_member_id: member.id,
                measurements,
                fit_preferences: fitPreferences || {},
                size_recommendations: sizeRecommendations,
                measurement_method: measurementMethod || 'self_measured',
                confidence_score: Math.max(10, Math.min(100, confidenceScore)),
                measured_by: `${member.first_name} ${member.last_name}`,
                requires_fitting: confidenceScore < 60,
                professional_review_needed: confidenceScore < 50,
                is_current: true,
                version_number: 1,
                notes: notes || '',
                special_considerations: specialConsiderations || {}
            };

            const insertResponse = await fetch(`${supabaseUrl}/rest/v1/wedding_measurements`, {
                method: 'POST',
                headers: {
                    'apikey': supabaseAnonKey,
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    'Prefer': 'return=representation'
                },
                body: JSON.stringify(measurementData)
            });

            if (!insertResponse.ok) {
                const errorText = await insertResponse.text();
                throw new Error(`Failed to save measurements: ${errorText}`);
            }

            const savedMeasurements = await insertResponse.json();

            // Update party member status
            await fetch(`${supabaseUrl}/rest/v1/wedding_party_members?id=eq.${member.id}`, {
                method: 'PATCH',
                headers: {
                    'apikey': supabaseAnonKey,
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    measurements_status: 'completed',
                    updated_at: new Date().toISOString()
                })
            });

            return new Response(JSON.stringify({
                data: {
                    measurements: savedMeasurements[0],
                    sizeRecommendations,
                    confidenceScore,
                    message: 'Measurements submitted successfully'
                }
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });

        } else {
            return new Response(JSON.stringify({
                error: {
                    code: 'METHOD_NOT_ALLOWED',
                    message: 'Method not allowed'
                }
            }), {
                status: 405,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

    } catch (error) {
        console.error('Groomsmen measurements error:', error);

        const errorResponse = {
            error: {
                code: 'MEASUREMENTS_ERROR',
                message: error.message
            }
        };

        return new Response(JSON.stringify(errorResponse), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});

// Helper functions for size calculations
function calculateJacketSize(measurements) {
    const chest = measurements.chest;
    
    if (chest <= 36) return '36S';
    if (chest <= 38) return '38R';
    if (chest <= 40) return '40R';
    if (chest <= 42) return '42R';
    if (chest <= 44) return '44R';
    if (chest <= 46) return '46R';
    if (chest <= 48) return '48R';
    if (chest <= 50) return '50R';
    return '52R';
}

function calculateTrouserSize(measurements) {
    const waist = measurements.waist;
    const inseam = measurements.inseam;
    
    return {
        waist: Math.round(waist),
        inseam: Math.round(inseam),
        size: `${Math.round(waist)}x${Math.round(inseam)}`
    };
}

function calculateShirtSize(measurements) {
    const neck = measurements.neck;
    const sleeve = measurements.sleeve_length;
    
    return {
        neck: Math.round(neck * 2) / 2, // Round to nearest half
        sleeve: Math.round(sleeve),
        size: `${Math.round(neck * 2) / 2} ${Math.round(sleeve)}`
    };
}