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
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

        if (!supabaseUrl || !supabaseServiceKey) {
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
                'apikey': supabaseServiceKey
            }
        });

        if (!userResponse.ok) {
            throw new Error('Invalid token');
        }

        const userData = await userResponse.json();
        const userId = userData.id;

        const requestData = await req.json().catch(() => ({}));
        const { action, measurement_data } = requestData;

        // Get party member data
        const memberResponse = await fetch(`${supabaseUrl}/rest/v1/wedding_party_members?user_id=eq.${userId}`, {
            headers: {
                'apikey': supabaseServiceKey,
                'Authorization': `Bearer ${supabaseServiceKey}`,
                'Content-Type': 'application/json'
            }
        });

        if (!memberResponse.ok) {
            throw new Error('Failed to fetch party member data');
        }

        const members = await memberResponse.json();
        if (members.length === 0) {
            throw new Error('No wedding party membership found');
        }

        const member = members[0];

        switch (action) {
            case 'get_measurements':
                // Get current measurements for the member
                const measurementsResponse = await fetch(`${supabaseUrl}/rest/v1/wedding_measurements?party_member_id=eq.${member.id}&is_current=eq.true&order=created_at.desc`, {
                    headers: {
                        'apikey': supabaseServiceKey,
                        'Authorization': `Bearer ${supabaseServiceKey}`,
                        'Content-Type': 'application/json'
                    }
                });

                let measurements = [];
                if (measurementsResponse.ok) {
                    measurements = await measurementsResponse.json();
                }

                return new Response(JSON.stringify({
                    success: true,
                    data: {
                        member: {
                            id: member.id,
                            firstName: member.first_name,
                            lastName: member.last_name,
                            measurementsStatus: member.measurements_status || 'pending'
                        },
                        measurements: measurements.length > 0 ? measurements[0] : null,
                        hasCurrentMeasurements: measurements.length > 0
                    }
                }), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });

            case 'submit_measurements':
                if (!measurement_data) {
                    throw new Error('Measurement data is required');
                }

                // Mark existing measurements as not current
                await fetch(`${supabaseUrl}/rest/v1/wedding_measurements?party_member_id=eq.${member.id}`, {
                    method: 'PATCH',
                    headers: {
                        'apikey': supabaseServiceKey,
                        'Authorization': `Bearer ${supabaseServiceKey}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        is_current: false,
                        updated_at: new Date().toISOString()
                    })
                });

                // Create new measurement record
                const newMeasurementResponse = await fetch(`${supabaseUrl}/rest/v1/wedding_measurements`, {
                    method: 'POST',
                    headers: {
                        'apikey': supabaseServiceKey,
                        'Authorization': `Bearer ${supabaseServiceKey}`,
                        'Content-Type': 'application/json',
                        'Prefer': 'return=representation'
                    },
                    body: JSON.stringify({
                        party_member_id: member.id,
                        measurements: measurement_data,
                        measurement_method: 'self_reported',
                        is_current: true,
                        measurement_date: new Date().toISOString(),
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString()
                    })
                });

                if (!newMeasurementResponse.ok) {
                    const errorText = await newMeasurementResponse.text();
                    throw new Error(`Failed to create measurement record: ${errorText}`);
                }

                const newMeasurement = await newMeasurementResponse.json();

                // Update party member status
                await fetch(`${supabaseUrl}/rest/v1/wedding_party_members?id=eq.${member.id}`, {
                    method: 'PATCH',
                    headers: {
                        'apikey': supabaseServiceKey,
                        'Authorization': `Bearer ${supabaseServiceKey}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        measurements_status: 'submitted',
                        updated_at: new Date().toISOString()
                    })
                });

                // Sync to user profile if needed
                try {
                    await fetch(`${supabaseUrl}/functions/v1/profile-sync`, {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${supabaseServiceKey}`,
                            'apikey': supabaseServiceKey,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            action: 'sync_measurement_data',
                            user_id: userId,
                            measurement_data: measurement_data,
                            sync_target: 'wedding_measurements'
                        })
                    });
                } catch (error) {
                    console.warn('Non-critical: Failed to sync to profile:', error);
                }

                return new Response(JSON.stringify({
                    success: true,
                    data: {
                        measurement: newMeasurement[0],
                        message: 'Measurements submitted successfully'
                    }
                }), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });

            default:
                // Default: return current measurements
                const defaultMeasurementsResponse = await fetch(`${supabaseUrl}/rest/v1/wedding_measurements?party_member_id=eq.${member.id}&is_current=eq.true&order=created_at.desc`, {
                    headers: {
                        'apikey': supabaseServiceKey,
                        'Authorization': `Bearer ${supabaseServiceKey}`,
                        'Content-Type': 'application/json'
                    }
                });

                let defaultMeasurements = [];
                if (defaultMeasurementsResponse.ok) {
                    defaultMeasurements = await defaultMeasurementsResponse.json();
                }

                return new Response(JSON.stringify({
                    success: true,
                    data: {
                        member: {
                            id: member.id,
                            firstName: member.first_name,
                            lastName: member.last_name,
                            measurementsStatus: member.measurements_status || 'pending'
                        },
                        measurements: defaultMeasurements.length > 0 ? defaultMeasurements[0] : null,
                        hasCurrentMeasurements: defaultMeasurements.length > 0
                    }
                }), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
        }

    } catch (error) {
        console.error('Groomsmen measurements error:', error);

        const errorResponse = {
            success: false,
            error: {
                code: 'MEASUREMENTS_ERROR',
                message: error.message || 'An unexpected error occurred'
            }
        };

        return new Response(JSON.stringify(errorResponse), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});