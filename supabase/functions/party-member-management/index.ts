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
        const { action, member_data, member_id, wedding_id, filters, update_data } = await req.json();
        
        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
        const supabaseUrl = Deno.env.get('SUPABASE_URL');
        
        if (!serviceRoleKey || !supabaseUrl) {
            throw new Error('Supabase configuration missing');
        }

        const headers = {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'apikey': serviceRoleKey,
            'Content-Type': 'application/json'
        };

        switch (action) {
            case 'invite_party_member': {
                const inviteCode = generateInviteCode();
                const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
                
                const memberRecord = {
                    wedding_id: member_data.wedding_id,
                    first_name: member_data.first_name,
                    last_name: member_data.last_name,
                    email: member_data.email,
                    phone: member_data.phone,
                    role: member_data.role,
                    custom_role_title: member_data.custom_role_title,
                    invite_code: inviteCode,
                    invite_status: 'pending',
                    invite_expires_at: expiresAt.toISOString(),
                    special_requests: member_data.special_requests,
                    address: member_data.address,
                    emergency_contact: member_data.emergency_contact
                };

                const response = await fetch(`${supabaseUrl}/rest/v1/wedding_party_members`, {
                    method: 'POST',
                    headers: { ...headers, 'Prefer': 'return=representation' },
                    body: JSON.stringify(memberRecord)
                });

                if (!response.ok) {
                    throw new Error(`Failed to create party member: ${await response.text()}`);
                }

                const member = await response.json();
                
                // Create invitation record
                await createInvitationRecord(member[0], supabaseUrl, headers);
                
                // Send invitation email
                await sendInvitationEmail(member[0], supabaseUrl, headers);
                
                return new Response(JSON.stringify({ 
                    data: {
                        member: member[0],
                        invite_code: inviteCode,
                        invite_url: `${getBaseUrl()}/wedding-invitation/${inviteCode}`
                    }
                }), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
            }

            case 'accept_invitation': {
                const inviteCode = member_data.invite_code;
                const userId = member_data.user_id;
                
                // Find member by invite code
                const memberResponse = await fetch(
                    `${supabaseUrl}/rest/v1/wedding_party_members?invite_code=eq.${inviteCode}`,
                    { headers }
                );
                
                if (!memberResponse.ok) {
                    throw new Error('Failed to find invitation');
                }
                
                const members = await memberResponse.json();
                if (members.length === 0) {
                    throw new Error('Invalid invitation code');
                }
                
                const member = members[0];
                
                // Check if invitation is still valid
                if (new Date(member.invite_expires_at) < new Date()) {
                    throw new Error('Invitation has expired');
                }
                
                // Update member with user ID and acceptance
                const updateResponse = await fetch(`${supabaseUrl}/rest/v1/wedding_party_members?id=eq.${member.id}`, {
                    method: 'PATCH',
                    headers,
                    body: JSON.stringify({
                        user_id: userId,
                        invite_status: 'accepted',
                        accepted_at: new Date().toISOString(),
                        updated_at: new Date().toISOString()
                    })
                });
                
                if (!updateResponse.ok) {
                    throw new Error('Failed to accept invitation');
                }
                
                // Create initial timeline tasks for this member
                await createMemberTimelineTasks(member.id, member.wedding_id, supabaseUrl, headers);
                
                return new Response(JSON.stringify({ 
                    data: {
                        member_id: member.id,
                        wedding_id: member.wedding_id,
                        role: member.role,
                        success: true
                    }
                }), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
            }

            case 'get_party_member': {
                const query = member_id 
                    ? `id=eq.${member_id}`
                    : `wedding_id=eq.${wedding_id}`;
                    
                let selectFields = '*';
                if (filters?.include_measurements) {
                    selectFields += ',measurements:wedding_measurements(*)';
                }
                if (filters?.include_outfits) {
                    selectFields += ',outfits:wedding_outfits(*)';
                }
                if (filters?.include_tasks) {
                    selectFields += ',tasks:wedding_timeline_tasks(*)';
                }

                const response = await fetch(
                    `${supabaseUrl}/rest/v1/wedding_party_members?${query}&select=${selectFields}`,
                    { headers }
                );

                if (!response.ok) {
                    throw new Error(`Failed to fetch party member(s): ${await response.text()}`);
                }

                const members = await response.json();
                
                return new Response(JSON.stringify({ 
                    data: member_id ? (members[0] || null) : members 
                }), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
            }

            case 'update_party_member': {
                const updateFields = {
                    ...update_data,
                    updated_at: new Date().toISOString()
                };
                
                // Calculate completion percentage if status fields are updated
                if (update_data.measurements_status || update_data.outfit_status || update_data.payment_status) {
                    updateFields.overall_completion_percentage = calculateMemberCompletion({
                        measurements_status: update_data.measurements_status,
                        outfit_status: update_data.outfit_status,
                        payment_status: update_data.payment_status
                    });
                }

                const response = await fetch(`${supabaseUrl}/rest/v1/wedding_party_members?id=eq.${member_id}`, {
                    method: 'PATCH',
                    headers,
                    body: JSON.stringify(updateFields)
                });

                if (!response.ok) {
                    throw new Error(`Failed to update party member: ${await response.text()}`);
                }

                // Update wedding progress
                const memberResponse = await fetch(
                    `${supabaseUrl}/rest/v1/wedding_party_members?id=eq.${member_id}&select=wedding_id`,
                    { headers }
                );
                
                if (memberResponse.ok) {
                    const member = await memberResponse.json();
                    if (member[0]) {
                        await updateWeddingProgress(member[0].wedding_id, supabaseUrl, headers);
                    }
                }

                return new Response(JSON.stringify({ data: { success: true } }), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
            }

            case 'get_member_dashboard': {
                // Get comprehensive member data for dashboard
                const memberResponse = await fetch(
                    `${supabaseUrl}/rest/v1/wedding_party_members?id=eq.${member_id}&select=*,wedding:weddings(*),measurements:wedding_measurements(*),outfits:wedding_outfits(*),tasks:wedding_timeline_tasks(*)`,
                    { headers }
                );

                if (!memberResponse.ok) {
                    throw new Error('Failed to fetch member dashboard data');
                }

                const members = await memberResponse.json();
                if (members.length === 0) {
                    throw new Error('Member not found');
                }

                const member = members[0];
                const dashboardData = calculateMemberDashboard(member);

                return new Response(JSON.stringify({ data: dashboardData }), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
            }

            case 'send_reminder': {
                const memberResponse = await fetch(
                    `${supabaseUrl}/rest/v1/wedding_party_members?id=eq.${member_id}`,
                    { headers }
                );
                
                if (!memberResponse.ok) {
                    throw new Error('Member not found');
                }
                
                const members = await memberResponse.json();
                const member = members[0];
                
                // Send reminder based on member's current status
                const reminderType = determineReminderType(member);
                await sendReminderEmail(member, reminderType, supabaseUrl, headers);
                
                // Update reminder count
                await fetch(`${supabaseUrl}/rest/v1/wedding_party_members?id=eq.${member_id}`, {
                    method: 'PATCH',
                    headers,
                    body: JSON.stringify({
                        reminder_count: (member.reminder_count || 0) + 1,
                        last_reminder_sent: new Date().toISOString(),
                        updated_at: new Date().toISOString()
                    })
                });

                return new Response(JSON.stringify({ data: { success: true, reminder_type: reminderType } }), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
            }

            case 'bulk_invite': {
                const members = member_data.members;
                const results = [];
                
                for (const memberData of members) {
                    try {
                        const inviteCode = generateInviteCode();
                        const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
                        
                        const memberRecord = {
                            wedding_id: memberData.wedding_id,
                            first_name: memberData.first_name,
                            last_name: memberData.last_name,
                            email: memberData.email,
                            phone: memberData.phone,
                            role: memberData.role,
                            custom_role_title: memberData.custom_role_title,
                            invite_code: inviteCode,
                            invite_status: 'pending',
                            invite_expires_at: expiresAt.toISOString(),
                            special_requests: memberData.special_requests
                        };
                        
                        const response = await fetch(`${supabaseUrl}/rest/v1/wedding_party_members`, {
                            method: 'POST',
                            headers: { ...headers, 'Prefer': 'return=representation' },
                            body: JSON.stringify(memberRecord)
                        });
                        
                        if (response.ok) {
                            const member = await response.json();
                            await createInvitationRecord(member[0], supabaseUrl, headers);
                            await sendInvitationEmail(member[0], supabaseUrl, headers);
                            
                            results.push({
                                success: true,
                                member: member[0],
                                invite_code: inviteCode
                            });
                        } else {
                            results.push({
                                success: false,
                                error: `Failed to create ${memberData.first_name} ${memberData.last_name}`,
                                member_data: memberData
                            });
                        }
                    } catch (error) {
                        results.push({
                            success: false,
                            error: error.message,
                            member_data: memberData
                        });
                    }
                }

                return new Response(JSON.stringify({ data: { results } }), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
            }

            default:
                throw new Error(`Unknown action: ${action}`);
        }

    } catch (error) {
        console.error('Party member management error:', error);
        
        return new Response(JSON.stringify({
            error: {
                code: 'PARTY_MEMBER_MANAGEMENT_ERROR',
                message: error.message
            }
        }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});

// Helper functions
function generateInviteCode() {
    return Math.random().toString(36).substr(2, 8).toUpperCase();
}

function getBaseUrl() {
    // This should be configurable based on environment
    return 'https://your-wedding-portal.com';
}

async function createInvitationRecord(member, supabaseUrl, headers) {
    const invitationRecord = {
        wedding_id: member.wedding_id,
        email: member.email,
        first_name: member.first_name,
        last_name: member.last_name,
        role: member.role,
        invite_code: member.invite_code,
        expires_at: member.invite_expires_at,
        custom_message: `You've been invited to join the wedding party coordination for ${member.first_name}'s wedding!`
    };

    await fetch(`${supabaseUrl}/rest/v1/wedding_invitations`, {
        method: 'POST',
        headers,
        body: JSON.stringify(invitationRecord)
    });
}

async function sendInvitationEmail(member, supabaseUrl, headers) {
    // Send email via existing send-email function
    const emailData = {
        emailType: 'wedding_invitation',
        recipientData: {
            email: member.email,
            first_name: member.first_name,
            last_name: member.last_name,
            role: member.role
        },
        weddingData: {
            invite_code: member.invite_code,
            invite_url: `${getBaseUrl()}/wedding-invitation/${member.invite_code}`,
            expires_at: member.invite_expires_at
        }
    };

    await fetch(`${supabaseUrl}/functions/v1/send-email`, {
        method: 'POST',
        headers,
        body: JSON.stringify(emailData)
    });

    // Update invitation sent timestamp
    await fetch(`${supabaseUrl}/rest/v1/wedding_party_members?id=eq.${member.id}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({
            invited_at: new Date().toISOString(),
            invite_status: 'sent',
            updated_at: new Date().toISOString()
        })
    });
}

async function createMemberTimelineTasks(memberId, weddingId, supabaseUrl, headers) {
    const tasks = [
        {
            wedding_id: weddingId,
            task_name: 'Submit Measurements',
            description: 'Provide accurate body measurements for outfit sizing',
            category: 'measurements',
            assigned_to: 'party_member',
            assigned_member_id: memberId,
            due_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 14 days
            priority: 'high',
            auto_created: true
        },
        {
            wedding_id: weddingId,
            task_name: 'Review Outfit Options',
            description: 'Review and select from curated outfit options',
            category: 'selection',
            assigned_to: 'party_member',
            assigned_member_id: memberId,
            due_date: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 21 days
            priority: 'medium',
            auto_created: true
        }
    ];

    await fetch(`${supabaseUrl}/rest/v1/wedding_timeline_tasks`, {
        method: 'POST',
        headers,
        body: JSON.stringify(tasks)
    });
}

function calculateMemberCompletion(statusData) {
    let completionScore = 0;
    
    // Measurements (30% weight)
    if (statusData.measurements_status === 'confirmed') completionScore += 30;
    else if (statusData.measurements_status === 'submitted') completionScore += 20;
    
    // Outfit selection (40% weight)
    if (statusData.outfit_status === 'confirmed') completionScore += 40;
    else if (statusData.outfit_status === 'selected') completionScore += 25;
    
    // Payment (30% weight)
    if (statusData.payment_status === 'paid') completionScore += 30;
    else if (statusData.payment_status === 'partial') completionScore += 15;
    
    return Math.min(completionScore, 100);
}

function calculateMemberDashboard(member) {
    const wedding = member.wedding;
    const measurements = member.measurements || [];
    const outfits = member.outfits || [];
    const tasks = member.tasks || [];
    
    // Calculate days until wedding
    const weddingDate = new Date(wedding.wedding_date);
    const now = new Date();
    const daysUntilWedding = Math.ceil((weddingDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    // Calculate task summary
    const totalTasks = tasks.filter(t => t.assigned_member_id === member.id).length;
    const completedTasks = tasks.filter(t => t.assigned_member_id === member.id && t.status === 'completed').length;
    const pendingTasks = tasks.filter(t => t.assigned_member_id === member.id && t.status === 'pending').length;
    
    return {
        member: {
            id: member.id,
            first_name: member.first_name,
            last_name: member.last_name,
            role: member.role,
            custom_role_title: member.custom_role_title,
            overall_completion_percentage: member.overall_completion_percentage
        },
        wedding: {
            id: wedding.id,
            wedding_code: wedding.wedding_code,
            wedding_date: wedding.wedding_date,
            venue_name: wedding.venue_name,
            formality_level: wedding.formality_level,
            color_scheme: wedding.color_scheme,
            days_until_wedding: daysUntilWedding
        },
        progress: {
            measurements_status: member.measurements_status,
            outfit_status: member.outfit_status,
            payment_status: member.payment_status,
            has_measurements: measurements.length > 0,
            has_outfit_selection: outfits.length > 0,
            current_measurements: measurements.find(m => m.is_current) || null
        },
        tasks: {
            total: totalTasks,
            completed: completedTasks,
            pending: pendingTasks,
            completion_percentage: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
            next_task: tasks.find(t => t.assigned_member_id === member.id && t.status === 'pending') || null
        }
    };
}

function determineReminderType(member) {
    if (member.measurements_status === 'pending') return 'measurements';
    if (member.outfit_status === 'pending') return 'outfit_selection';
    if (member.payment_status === 'pending') return 'payment';
    return 'general_progress';
}

async function sendReminderEmail(member, reminderType, supabaseUrl, headers) {
    const emailData = {
        emailType: `wedding_reminder_${reminderType}`,
        recipientData: {
            email: member.email,
            first_name: member.first_name,
            last_name: member.last_name,
            role: member.role
        },
        memberData: {
            member_id: member.id,
            measurements_status: member.measurements_status,
            outfit_status: member.outfit_status,
            payment_status: member.payment_status
        }
    };

    await fetch(`${supabaseUrl}/functions/v1/send-email`, {
        method: 'POST',
        headers,
        body: JSON.stringify(emailData)
    });
}

async function updateWeddingProgress(weddingId, supabaseUrl, headers) {
    // Get all party members and calculate overall progress
    const membersResponse = await fetch(
        `${supabaseUrl}/rest/v1/wedding_party_members?wedding_id=eq.${weddingId}`,
        { headers }
    );
    
    if (!membersResponse.ok) return;
    
    const members = await membersResponse.json();
    
    if (members.length === 0) return;
    
    const totalProgress = members.reduce((sum, member) => sum + (member.overall_completion_percentage || 0), 0);
    const averageProgress = Math.round(totalProgress / members.length);
    
    await fetch(`${supabaseUrl}/rest/v1/weddings?id=eq.${weddingId}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({
            completion_percentage: averageProgress,
            updated_at: new Date().toISOString()
        })
    });
}