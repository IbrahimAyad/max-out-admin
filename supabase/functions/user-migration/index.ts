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
        const { action, migration_data, batch_size } = requestData;
        
        switch (action) {
            case 'migrate_wedding_accounts':
                // Migrate existing wedding portal accounts to unified system
                const { wedding_accounts } = migration_data;
                const results = [];
                
                for (const account of wedding_accounts) {
                    try {
                        // Create Supabase Auth user if not exists
                        let authUser = null;
                        
                        // Try to get existing user by email
                        const existingUserResponse = await fetch(`${supabaseUrl}/auth/v1/admin/users`, {
                            headers: {
                                'Authorization': `Bearer ${supabaseKey}`,
                                'apikey': supabaseKey,
                                'Content-Type': 'application/json'
                            }
                        });
                        
                        if (existingUserResponse.ok) {
                            const users = await existingUserResponse.json();
                            authUser = users.users.find(user => user.email === account.email);
                        }
                        
                        if (!authUser) {
                            // Create new auth user
                            const createUserResponse = await fetch(`${supabaseUrl}/auth/v1/admin/users`, {
                                method: 'POST',
                                headers: {
                                    'Authorization': `Bearer ${supabaseKey}`,
                                    'apikey': supabaseKey,
                                    'Content-Type': 'application/json'
                                },
                                body: JSON.stringify({
                                    email: account.email,
                                    password: account.password || generateRandomPassword(),
                                    email_confirm: true,
                                    user_metadata: {
                                        migrated_from: account.source_portal,
                                        migration_date: new Date().toISOString(),
                                        ...account.metadata
                                    }
                                })
                            });
                            
                            if (!createUserResponse.ok) {
                                const errorData = await createUserResponse.json();
                                throw new Error(`Failed to create auth user: ${errorData.msg}`);
                            }
                            
                            authUser = await createUserResponse.json();
                        }
                        
                        // Create or update user profile
                        const profileData = {
                            user_id: authUser.id,
                            email: account.email,
                            first_name: account.first_name,
                            last_name: account.last_name,
                            phone: account.phone,
                            wedding_role: account.wedding_role,
                            is_wedding_customer: true,
                            wedding_preferences: {
                                migrated_from: account.source_portal,
                                original_account_id: account.original_id,
                                wedding_code: account.wedding_code,
                                invite_code: account.invite_code
                            },
                            size_profile: account.measurements || {},
                            notification_preferences: account.notification_preferences || {
                                email_orders: true,
                                email_marketing: false,
                                sms_orders: false,
                                sms_marketing: false
                            },
                            created_at: account.original_created_at || new Date().toISOString(),
                            updated_at: new Date().toISOString()
                        };
                        
                        // Check if profile already exists
                        const existingProfileResponse = await fetch(`${supabaseUrl}/rest/v1/user_profiles?user_id=eq.${authUser.id}`, {
                            headers: {
                                'Authorization': `Bearer ${supabaseKey}`,
                                'apikey': supabaseKey,
                                'Content-Type': 'application/json'
                            }
                        });
                        
                        let profile = null;
                        if (existingProfileResponse.ok) {
                            const existingProfiles = await existingProfileResponse.json();
                            if (existingProfiles.length > 0) {
                                // Update existing profile
                                const updateProfileResponse = await fetch(`${supabaseUrl}/rest/v1/user_profiles?user_id=eq.${authUser.id}`, {
                                    method: 'PATCH',
                                    headers: {
                                        'Authorization': `Bearer ${supabaseKey}`,
                                        'apikey': supabaseKey,
                                        'Content-Type': 'application/json',
                                        'Prefer': 'return=representation'
                                    },
                                    body: JSON.stringify(profileData)
                                });
                                
                                if (updateProfileResponse.ok) {
                                    const updatedProfiles = await updateProfileResponse.json();
                                    profile = updatedProfiles[0];
                                }
                            } else {
                                // Create new profile
                                const createProfileResponse = await fetch(`${supabaseUrl}/rest/v1/user_profiles`, {
                                    method: 'POST',
                                    headers: {
                                        'Authorization': `Bearer ${supabaseKey}`,
                                        'apikey': supabaseKey,
                                        'Content-Type': 'application/json',
                                        'Prefer': 'return=representation'
                                    },
                                    body: JSON.stringify(profileData)
                                });
                                
                                if (createProfileResponse.ok) {
                                    const createdProfiles = await createProfileResponse.json();
                                    profile = createdProfiles[0];
                                }
                            }
                        }
                        
                        // Update wedding party member if applicable
                        if (account.party_member_id) {
                            await fetch(`${supabaseUrl}/rest/v1/wedding_party_members?id=eq.${account.party_member_id}`, {
                                method: 'PATCH',
                                headers: {
                                    'Authorization': `Bearer ${supabaseKey}`,
                                    'apikey': supabaseKey,
                                    'Content-Type': 'application/json'
                                },
                                body: JSON.stringify({
                                    user_id: authUser.id,
                                    updated_at: new Date().toISOString()
                                })
                            });
                        }
                        
                        // Update wedding couple link if applicable
                        if (account.wedding_id && account.wedding_role === 'couple') {
                            const weddingUpdateField = account.is_primary ? 'primary_customer_id' : 'partner_customer_id';
                            
                            await fetch(`${supabaseUrl}/rest/v1/weddings?id=eq.${account.wedding_id}`, {
                                method: 'PATCH',
                                headers: {
                                    'Authorization': `Bearer ${supabaseKey}`,
                                    'apikey': supabaseKey,
                                    'Content-Type': 'application/json'
                                },
                                body: JSON.stringify({
                                    [weddingUpdateField]: authUser.id,
                                    updated_at: new Date().toISOString()
                                })
                            });
                        }
                        
                        results.push({
                            success: true,
                            account: account,
                            migrated_user_id: authUser.id,
                            profile_created: !!profile
                        });
                        
                    } catch (error) {
                        results.push({
                            success: false,
                            account: account,
                            error: error.message
                        });
                    }
                }
                
                return new Response(JSON.stringify({
                    success: true,
                    data: {
                        migration_results: results,
                        total_processed: results.length,
                        successful_migrations: results.filter(r => r.success).length,
                        failed_migrations: results.filter(r => !r.success).length
                    }
                }), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
                
            case 'generate_migration_report':
                // Generate report of accounts that need migration
                const migrationCandidates = [];
                
                // Find wedding party members without user_id
                const orphanMembersResponse = await fetch(`${supabaseUrl}/rest/v1/wedding_party_members?user_id=is.null&select=*,weddings!inner(*)`, {
                    headers: {
                        'Authorization': `Bearer ${supabaseKey}`,
                        'apikey': supabaseKey,
                        'Content-Type': 'application/json'
                    }
                });
                
                if (orphanMembersResponse.ok) {
                    const orphanMembers = await orphanMembersResponse.json();
                    
                    for (const member of orphanMembers) {
                        migrationCandidates.push({
                            type: 'party_member',
                            id: member.id,
                            email: member.email,
                            first_name: member.first_name,
                            last_name: member.last_name,
                            wedding_code: member.weddings.wedding_code,
                            role: member.role,
                            invite_status: member.invite_status,
                            needs_auth_account: true
                        });
                    }
                }
                
                // Find weddings without linked customer accounts
                const orphanWeddingsResponse = await fetch(`${supabaseUrl}/rest/v1/weddings?primary_customer_id=is.null&select=*`, {
                    headers: {
                        'Authorization': `Bearer ${supabaseKey}`,
                        'apikey': supabaseKey,
                        'Content-Type': 'application/json'
                    }
                });
                
                if (orphanWeddingsResponse.ok) {
                    const orphanWeddings = await orphanWeddingsResponse.json();
                    
                    for (const wedding of orphanWeddings) {
                        migrationCandidates.push({
                            type: 'wedding_couple',
                            id: wedding.id,
                            wedding_code: wedding.wedding_code,
                            wedding_date: wedding.wedding_date,
                            needs_couple_account: true
                        });
                    }
                }
                
                return new Response(JSON.stringify({
                    success: true,
                    data: {
                        migration_candidates: migrationCandidates,
                        total_candidates: migrationCandidates.length,
                        party_members_needing_accounts: migrationCandidates.filter(c => c.type === 'party_member').length,
                        weddings_needing_couples: migrationCandidates.filter(c => c.type === 'wedding_couple').length
                    }
                }), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
                
            default:
                throw new Error(`Unknown action: ${action}`);
        }
        
    } catch (error) {
        console.error('User migration error:', error);
        
        const errorResponse = {
            success: false,
            error: {
                code: 'USER_MIGRATION_ERROR',
                message: error.message
            }
        };

        return new Response(JSON.stringify(errorResponse), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});

// Helper function to generate random password for migrated accounts
function generateRandomPassword() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < 16; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
}