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
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        
        const requestData = await req.json();
        const { action, user_id, profile_data, measurement_data, sync_target } = requestData;
        
        switch (action) {
            case 'sync_profile_data':
                // Sync user profile data across all wedding portals
                const profileResponse = await fetch(`${supabaseUrl}/rest/v1/user_profiles?user_id=eq.${user_id}`, {
                    headers: {
                        'Authorization': `Bearer ${supabaseKey}`,
                        'apikey': supabaseKey,
                        'Content-Type': 'application/json'
                    }
                });
                
                if (!profileResponse.ok) {
                    throw new Error('Failed to fetch user profile');
                }
                
                const profiles = await profileResponse.json();
                
                if (profiles.length === 0) {
                    throw new Error('User profile not found');
                }
                
                let profile = profiles[0];
                
                // Update profile with new data if provided
                if (profile_data) {
                    const updateResponse = await fetch(`${supabaseUrl}/rest/v1/user_profiles?user_id=eq.${user_id}`, {
                        method: 'PATCH',
                        headers: {
                            'Authorization': `Bearer ${supabaseKey}`,
                            'apikey': supabaseKey,
                            'Content-Type': 'application/json',
                            'Prefer': 'return=representation'
                        },
                        body: JSON.stringify({
                            ...profile_data,
                            updated_at: new Date().toISOString()
                        })
                    });
                    
                    if (!updateResponse.ok) {
                        throw new Error('Failed to update profile');
                    }
                    
                    const updatedProfiles = await updateResponse.json();
                    profile = updatedProfiles[0];
                }
                
                // Sync to wedding party member records if user is a party member
                const partyMemberResponse = await fetch(`${supabaseUrl}/rest/v1/wedding_party_members?user_id=eq.${user_id}`, {
                    headers: {
                        'Authorization': `Bearer ${supabaseKey}`,
                        'apikey': supabaseKey,
                        'Content-Type': 'application/json'
                    }
                });
                
                if (partyMemberResponse.ok) {
                    const partyMembers = await partyMemberResponse.json();
                    
                    // Update party member records with profile data
                    for (const member of partyMembers) {
                        const syncData: any = {};
                        
                        if (profile.first_name && profile.first_name !== member.first_name) {
                            syncData.first_name = profile.first_name;
                        }
                        if (profile.last_name && profile.last_name !== member.last_name) {
                            syncData.last_name = profile.last_name;
                        }
                        if (profile.email && profile.email !== member.email) {
                            syncData.email = profile.email;
                        }
                        if (profile.phone && profile.phone !== member.phone) {
                            syncData.phone = profile.phone;
                        }
                        
                        if (Object.keys(syncData).length > 0) {
                            syncData.updated_at = new Date().toISOString();
                            
                            await fetch(`${supabaseUrl}/rest/v1/wedding_party_members?id=eq.${member.id}`, {
                                method: 'PATCH',
                                headers: {
                                    'Authorization': `Bearer ${supabaseKey}`,
                                    'apikey': supabaseKey,
                                    'Content-Type': 'application/json'
                                },
                                body: JSON.stringify(syncData)
                            });
                        }
                    }
                }
                
                return new Response(JSON.stringify({
                    success: true,
                    data: {
                        profile,
                        sync_complete: true,
                        message: 'Profile data synchronized across all portals'
                    }
                }), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
                
            case 'sync_measurement_data':
                // Sync measurement data across wedding and profile systems
                if (!measurement_data) {
                    throw new Error('Measurement data is required');
                }
                
                // Update user profile with measurements
                const profileUpdateResponse = await fetch(`${supabaseUrl}/rest/v1/user_profiles?user_id=eq.${user_id}`, {
                    method: 'PATCH',
                    headers: {
                        'Authorization': `Bearer ${supabaseKey}`,
                        'apikey': supabaseKey,
                        'Content-Type': 'application/json',
                        'Prefer': 'return=representation'
                    },
                    body: JSON.stringify({
                        size_profile: measurement_data,
                        measurements: measurement_data,
                        measurement_history: {
                            last_updated: new Date().toISOString(),
                            source: sync_target || 'profile_sync',
                            measurements: measurement_data
                        },
                        updated_at: new Date().toISOString()
                    })
                });
                
                if (!profileUpdateResponse.ok) {
                    throw new Error('Failed to update profile measurements');
                }
                
                const updatedProfile = await profileUpdateResponse.json();
                
                // Sync to wedding party member measurements if applicable
                const memberResponse = await fetch(`${supabaseUrl}/rest/v1/wedding_party_members?user_id=eq.${user_id}`, {
                    headers: {
                        'Authorization': `Bearer ${supabaseKey}`,
                        'apikey': supabaseKey,
                        'Content-Type': 'application/json'
                    }
                });
                
                if (memberResponse.ok) {
                    const members = await memberResponse.json();
                    
                    for (const member of members) {
                        // Update party member measurements
                        await fetch(`${supabaseUrl}/rest/v1/wedding_party_members?id=eq.${member.id}`, {
                            method: 'PATCH',
                            headers: {
                                'Authorization': `Bearer ${supabaseKey}`,
                                'apikey': supabaseKey,
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({
                                measurements: measurement_data,
                                measurements_status: 'submitted',
                                updated_at: new Date().toISOString()
                            })
                        });
                        
                        // Create wedding measurement record
                        await fetch(`${supabaseUrl}/rest/v1/wedding_measurements`, {
                            method: 'POST',
                            headers: {
                                'Authorization': `Bearer ${supabaseKey}`,
                                'apikey': supabaseKey,
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({
                                party_member_id: member.id,
                                measurements: measurement_data,
                                measurement_date: new Date().toISOString(),
                                notes: `Synced from profile system at ${new Date().toISOString()}`
                            })
                        });
                    }
                }
                
                return new Response(JSON.stringify({
                    success: true,
                    data: {
                        profile: updatedProfile[0],
                        measurement_sync_complete: true,
                        message: 'Measurements synchronized across all systems'
                    }
                }), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
                
            case 'get_unified_profile':
                // Get complete unified profile data for user across all systems
                const unifiedProfileResponse = await fetch(`${supabaseUrl}/rest/v1/user_profiles?user_id=eq.${user_id}&select=*`, {
                    headers: {
                        'Authorization': `Bearer ${supabaseKey}`,
                        'apikey': supabaseKey,
                        'Content-Type': 'application/json'
                    }
                });
                
                if (!unifiedProfileResponse.ok) {
                    throw new Error('Failed to fetch profile');
                }
                
                const unifiedProfiles = await unifiedProfileResponse.json();
                
                if (unifiedProfiles.length === 0) {
                    throw new Error('Profile not found');
                }
                
                const unifiedProfile = unifiedProfiles[0];
                
                // Get wedding-related data
                const weddingDataResponse = await fetch(`${supabaseUrl}/rest/v1/wedding_party_members?user_id=eq.${user_id}&select=*,weddings!inner(*)`, {
                    headers: {
                        'Authorization': `Bearer ${supabaseKey}`,
                        'apikey': supabaseKey,
                        'Content-Type': 'application/json'
                    }
                });
                
                let weddingData = null;
                if (weddingDataResponse.ok) {
                    const weddingMembers = await weddingDataResponse.json();
                    if (weddingMembers.length > 0) {
                        weddingData = {
                            party_member: weddingMembers[0],
                            wedding: weddingMembers[0].weddings
                        };
                    }
                }
                
                // Get couple wedding data if applicable
                const coupleWeddingResponse = await fetch(`${supabaseUrl}/rest/v1/weddings?or=(primary_customer_id.eq.${user_id},partner_customer_id.eq.${user_id})`, {
                    headers: {
                        'Authorization': `Bearer ${supabaseKey}`,
                        'apikey': supabaseKey,
                        'Content-Type': 'application/json'
                    }
                });
                
                let coupleWedding = null;
                if (coupleWeddingResponse.ok) {
                    const coupleWeddings = await coupleWeddingResponse.json();
                    if (coupleWeddings.length > 0) {
                        coupleWedding = coupleWeddings[0];
                    }
                }
                
                return new Response(JSON.stringify({
                    success: true,
                    data: {
                        profile: unifiedProfile,
                        wedding_party_data: weddingData,
                        couple_wedding_data: coupleWedding,
                        access_level: coupleWedding ? 'couple' : weddingData ? 'party_member' : 'customer',
                        unified_access: true
                    }
                }), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
                
            default:
                throw new Error(`Unknown action: ${action}`);
        }
        
    } catch (error) {
        console.error('Profile sync error:', error);
        
        const errorResponse = {
            success: false,
            error: {
                code: 'PROFILE_SYNC_ERROR',
                message: error.message
            }
        };

        return new Response(JSON.stringify(errorResponse), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});