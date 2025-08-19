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
                
                let profile;
                if (profiles.length === 0) {
                    // Create new profile if it doesn't exist
                    const createResponse = await fetch(`${supabaseUrl}/rest/v1/user_profiles`, {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${supabaseKey}`,
                            'apikey': supabaseKey,
                            'Content-Type': 'application/json',
                            'Prefer': 'return=representation'
                        },
                        body: JSON.stringify({
                            user_id,
                            ...profile_data,
                            created_at: new Date().toISOString(),
                            updated_at: new Date().toISOString()
                        })
                    });
                    
                    if (!createResponse.ok) {
                        const errorText = await createResponse.text();
                        throw new Error(`Failed to create profile: ${errorText}`);
                    }
                    
                    const createdProfiles = await createResponse.json();
                    profile = createdProfiles[0];
                } else {
                    profile = profiles[0];
                    
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
                            const errorText = await updateResponse.text();
                            throw new Error(`Failed to update profile: ${errorText}`);
                        }
                        
                        const updatedProfiles = await updateResponse.json();
                        profile = updatedProfiles[0];
                    }
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
                
                // Ensure profile exists first
                const profileCheckResponse = await fetch(`${supabaseUrl}/rest/v1/user_profiles?user_id=eq.${user_id}`, {
                    headers: {
                        'Authorization': `Bearer ${supabaseKey}`,
                        'apikey': supabaseKey,
                        'Content-Type': 'application/json'
                    }
                });
                
                let profileExists = false;
                if (profileCheckResponse.ok) {
                    const existingProfiles = await profileCheckResponse.json();
                    profileExists = existingProfiles.length > 0;
                }
                
                if (!profileExists) {
                    // Create profile first
                    await fetch(`${supabaseUrl}/rest/v1/user_profiles`, {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${supabaseKey}`,
                            'apikey': supabaseKey,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            user_id,
                            size_profile: measurement_data,
                            measurements: measurement_data,
                            created_at: new Date().toISOString(),
                            updated_at: new Date().toISOString()
                        })
                    });
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
                    const errorText = await profileUpdateResponse.text();
                    throw new Error(`Failed to update profile measurements: ${errorText}`);
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
                let unifiedProfile = null;
                
                // First check if user exists in auth.users
                const userExistsResponse = await fetch(`${supabaseUrl}/rest/v1/rpc/check_user_exists`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${supabaseKey}`,
                        'apikey': supabaseKey,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ user_id_param: user_id })
                });
                
                let userExists = false;
                if (userExistsResponse.ok) {
                    const result = await userExistsResponse.json();
                    userExists = result;
                } else {
                    // Fallback: try to get user profile anyway
                    console.warn('Could not check if user exists, proceeding with profile check');
                    userExists = true;
                }
                
                if (!userExists) {
                    // Return minimal profile data for non-existent users
                    return new Response(JSON.stringify({
                        success: true,
                        data: {
                            profile: null,
                            access_levels: {
                                enhanced_profile: false,
                                couples_portal: false,
                                groomsmen_portal: false,
                                admin_portal: false
                            },
                            wedding_party_data: null,
                            couple_wedding_data: null,
                            portal_context: {
                                current_portal: 'unified_auth',
                                available_portals: [],
                                primary_role: 'guest'
                            },
                            unified_access: false,
                            user_exists: false
                        }
                    }), {
                        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                    });
                }
                
                // Try to get existing profile
                const unifiedProfileResponse = await fetch(`${supabaseUrl}/rest/v1/user_profiles?user_id=eq.${user_id}&select=*`, {
                    headers: {
                        'Authorization': `Bearer ${supabaseKey}`,
                        'apikey': supabaseKey,
                        'Content-Type': 'application/json'
                    }
                });
                
                if (!unifiedProfileResponse.ok) {
                    const errorText = await unifiedProfileResponse.text();
                    console.error('Failed to fetch profile:', errorText);
                    throw new Error(`Failed to fetch profile: ${errorText}`);
                }
                
                const unifiedProfiles = await unifiedProfileResponse.json();
                
                if (unifiedProfiles.length === 0) {
                    // Create a basic profile for this user
                    try {
                        const createProfileResponse = await fetch(`${supabaseUrl}/rest/v1/user_profiles`, {
                            method: 'POST',
                            headers: {
                                'Authorization': `Bearer ${supabaseKey}`,
                                'apikey': supabaseKey,
                                'Content-Type': 'application/json',
                                'Prefer': 'return=representation'
                            },
                            body: JSON.stringify({
                                user_id,
                                created_at: new Date().toISOString(),
                                updated_at: new Date().toISOString(),
                                unified_auth_enabled: true,
                                account_status: 'active',
                                customer_segment: 'regular',
                                customer_tier: 'Bronze',
                                country: 'US',
                                total_orders: 0,
                                total_spent: 0,
                                average_order_value: 0,
                                lifetime_value: 0,
                                engagement_score: 0,
                                repeat_customer: false,
                                vip_status: false,
                                is_wedding_customer: false,
                                email_verified: false,
                                backup_email_verified: false,
                                onboarding_completed: false
                            })
                        });
                        
                        if (!createProfileResponse.ok) {
                            const errorText = await createProfileResponse.text();
                            console.error('Failed to create profile:', errorText);
                            
                            // If profile creation fails, return a minimal response to prevent auth failure
                            return new Response(JSON.stringify({
                                success: true,
                                data: {
                                    profile: {
                                        user_id,
                                        unified_auth_enabled: true,
                                        created_at: new Date().toISOString(),
                                        profile_creation_failed: true
                                    },
                                    access_levels: {
                                        enhanced_profile: true,
                                        couples_portal: false,
                                        groomsmen_portal: false,
                                        admin_portal: false
                                    },
                                    wedding_party_data: null,
                                    couple_wedding_data: null,
                                    portal_context: {
                                        current_portal: 'unified_auth',
                                        available_portals: ['enhanced_profile'],
                                        primary_role: 'customer'
                                    },
                                    unified_access: true,
                                    creation_error: errorText
                                }
                            }), {
                                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                            });
                        }
                        
                        const createdProfiles = await createProfileResponse.json();
                        unifiedProfile = createdProfiles[0];
                    } catch (createError) {
                        console.error('Profile creation error:', createError);
                        
                        // Return minimal profile to prevent auth failure
                        return new Response(JSON.stringify({
                            success: true,
                            data: {
                                profile: {
                                    user_id,
                                    unified_auth_enabled: true,
                                    created_at: new Date().toISOString(),
                                    profile_creation_failed: true
                                },
                                access_levels: {
                                    enhanced_profile: true,
                                    couples_portal: false,
                                    groomsmen_portal: false,
                                    admin_portal: false
                                },
                                wedding_party_data: null,
                                couple_wedding_data: null,
                                portal_context: {
                                    current_portal: 'unified_auth',
                                    available_portals: ['enhanced_profile'],
                                    primary_role: 'customer'
                                },
                                unified_access: true
                            }
                        }), {
                            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                        });
                    }
                } else {
                    unifiedProfile = unifiedProfiles[0];
                }
                
                // Get wedding-related data (non-critical)
                let weddingData = null;
                try {
                    const weddingDataResponse = await fetch(`${supabaseUrl}/rest/v1/wedding_party_members?user_id=eq.${user_id}&select=*`, {
                        headers: {
                            'Authorization': `Bearer ${supabaseKey}`,
                            'apikey': supabaseKey,
                            'Content-Type': 'application/json'
                        }
                    });
                    
                    if (weddingDataResponse.ok) {
                        const weddingMembers = await weddingDataResponse.json();
                        if (weddingMembers.length > 0) {
                            // Get wedding details for the first party member record
                            const weddingDetailResponse = await fetch(`${supabaseUrl}/rest/v1/weddings?id=eq.${weddingMembers[0].wedding_id}`, {
                                headers: {
                                    'Authorization': `Bearer ${supabaseKey}`,
                                    'apikey': supabaseKey,
                                    'Content-Type': 'application/json'
                                }
                            });
                            
                            if (weddingDetailResponse.ok) {
                                const weddingDetails = await weddingDetailResponse.json();
                                if (weddingDetails.length > 0) {
                                    weddingData = {
                                        party_member: weddingMembers[0],
                                        wedding: weddingDetails[0]
                                    };
                                }
                            }
                        }
                    }
                } catch (error) {
                    console.warn('Non-critical error fetching wedding data:', error);
                }
                
                // Get couple wedding data if applicable (non-critical)
                let coupleWedding = null;
                try {
                    const coupleWeddingResponse = await fetch(`${supabaseUrl}/rest/v1/weddings?or=(primary_customer_id.eq.${user_id},partner_customer_id.eq.${user_id})`, {
                        headers: {
                            'Authorization': `Bearer ${supabaseKey}`,
                            'apikey': supabaseKey,
                            'Content-Type': 'application/json'
                        }
                    });
                    
                    if (coupleWeddingResponse.ok) {
                        const coupleWeddings = await coupleWeddingResponse.json();
                        if (coupleWeddings.length > 0) {
                            coupleWedding = coupleWeddings[0];
                        }
                    }
                } catch (error) {
                    console.warn('Non-critical error fetching couple wedding data:', error);
                }
                
                // Determine access levels
                const accessLevels = {
                    enhanced_profile: true,
                    couples_portal: !!coupleWedding,
                    groomsmen_portal: !!weddingData,
                    admin_portal: false // This would be determined by admin role checks
                };
                
                return new Response(JSON.stringify({
                    success: true,
                    data: {
                        profile: unifiedProfile,
                        access_levels: accessLevels,
                        wedding_party_data: weddingData,
                        couple_wedding_data: coupleWedding,
                        portal_context: {
                            current_portal: 'unified_auth',
                            available_portals: [
                                'enhanced_profile',
                                ...(coupleWedding ? ['couples_portal'] : []),
                                ...(weddingData ? ['groomsmen_portal'] : [])
                            ],
                            primary_role: coupleWedding ? 'couple' : weddingData ? 'party_member' : 'customer'
                        },
                        unified_access: true
                    }
                }), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
                
            default:
                return new Response(JSON.stringify({
                    success: false,
                    error: {
                        code: 'INVALID_ACTION',
                        message: `Unknown action: ${action}`
                    }
                }), {
                    status: 400,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
        }
        
    } catch (error) {
        console.error('Profile sync error:', error);
        
        const errorResponse = {
            success: false,
            error: {
                code: 'PROFILE_SYNC_ERROR',
                message: error.message || 'An unexpected error occurred'
            }
        };

        return new Response(JSON.stringify(errorResponse), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});