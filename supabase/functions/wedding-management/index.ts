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
        const { action, wedding_data, wedding_id, filters, update_data } = await req.json();
        
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
            case 'create_wedding': {
                // Generate unique wedding code
                const weddingCode = generateWeddingCode();
                
                const weddingRecord = {
                    wedding_code: weddingCode,
                    primary_customer_id: wedding_data.primary_customer_id,
                    partner_customer_id: wedding_data.partner_customer_id,
                    wedding_date: wedding_data.wedding_date,
                    venue_name: wedding_data.venue_name,
                    venue_address: wedding_data.venue_address,
                    venue_city: wedding_data.venue_city,
                    venue_state: wedding_data.venue_state,
                    venue_country: wedding_data.venue_country || 'US',
                    guest_count: wedding_data.guest_count,
                    wedding_theme: wedding_data.wedding_theme,
                    formality_level: wedding_data.formality_level,
                    color_scheme: wedding_data.color_scheme,
                    style_inspiration: wedding_data.style_inspiration,
                    budget_range: wedding_data.budget_range,
                    total_budget: wedding_data.total_budget,
                    allocated_menswear_budget: wedding_data.allocated_menswear_budget,
                    special_instructions: wedding_data.special_instructions,
                    timeline_preferences: wedding_data.timeline_preferences,
                    requires_rush_service: wedding_data.requires_rush_service || false,
                    coordination_level: wedding_data.coordination_level || 'standard',
                    status: 'planning',
                    completion_percentage: 0,
                    current_phase: 'setup'
                };

                const response = await fetch(`${supabaseUrl}/rest/v1/weddings`, {
                    method: 'POST',
                    headers: { ...headers, 'Prefer': 'return=representation' },
                    body: JSON.stringify(weddingRecord)
                });

                if (!response.ok) {
                    throw new Error(`Failed to create wedding: ${await response.text()}`);
                }

                const wedding = await response.json();
                
                // Create initial timeline tasks
                await createInitialTimelineTasks(wedding[0].id, wedding_data.wedding_date, supabaseUrl, headers);
                
                return new Response(JSON.stringify({ 
                    data: {
                        wedding: wedding[0],
                        wedding_code: weddingCode
                    }
                }), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
            }

            case 'get_wedding': {
                let query = `${supabaseUrl}/rest/v1/weddings?id=eq.${wedding_id}&select=*`;
                
                if (filters?.include_party_members) {
                    query += ',party_members:wedding_party_members(*)';
                }
                
                if (filters?.include_tasks) {
                    query += ',tasks:wedding_timeline_tasks(*)';
                }
                
                if (filters?.include_analytics) {
                    query += ',analytics:wedding_analytics(*)';
                }

                const response = await fetch(query, { headers });

                if (!response.ok) {
                    throw new Error(`Failed to fetch wedding: ${await response.text()}`);
                }

                const wedding = await response.json();
                return new Response(JSON.stringify({ data: wedding[0] || null }), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
            }

            case 'update_wedding': {
                const response = await fetch(`${supabaseUrl}/rest/v1/weddings?id=eq.${wedding_id}`, {
                    method: 'PATCH',
                    headers,
                    body: JSON.stringify({
                        ...update_data,
                        updated_at: new Date().toISOString()
                    })
                });

                if (!response.ok) {
                    throw new Error(`Failed to update wedding: ${await response.text()}`);
                }

                // Recalculate completion percentage if needed
                if (update_data.status || Object.keys(update_data).length > 1) {
                    await updateWeddingProgress(wedding_id, supabaseUrl, headers);
                }

                return new Response(JSON.stringify({ data: { success: true } }), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
            }

            case 'get_wedding_by_code': {
                const weddingCode = filters?.wedding_code;
                if (!weddingCode) {
                    throw new Error('Wedding code is required');
                }

                const response = await fetch(
                    `${supabaseUrl}/rest/v1/weddings?wedding_code=eq.${weddingCode}&select=*,party_members:wedding_party_members(*)`,
                    { headers }
                );

                if (!response.ok) {
                    throw new Error(`Failed to fetch wedding: ${await response.text()}`);
                }

                const wedding = await response.json();
                return new Response(JSON.stringify({ data: wedding[0] || null }), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
            }

            case 'get_wedding_dashboard': {
                // Get comprehensive dashboard data
                const weddingResponse = await fetch(
                    `${supabaseUrl}/rest/v1/weddings?id=eq.${wedding_id}&select=*,party_members:wedding_party_members(*),tasks:wedding_timeline_tasks(status,due_date,priority),communications:wedding_communications(*)`,
                    { headers }
                );

                if (!weddingResponse.ok) {
                    throw new Error('Failed to fetch wedding dashboard data');
                }

                const wedding = await weddingResponse.json();
                const dashboardData = calculateDashboardMetrics(wedding[0]);

                return new Response(JSON.stringify({ data: dashboardData }), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
            }

            case 'advance_wedding_phase': {
                const currentPhase = update_data.current_phase;
                const nextPhase = determineNextPhase(currentPhase);
                
                await fetch(`${supabaseUrl}/rest/v1/weddings?id=eq.${wedding_id}`, {
                    method: 'PATCH',
                    headers,
                    body: JSON.stringify({
                        current_phase: nextPhase,
                        updated_at: new Date().toISOString()
                    })
                });

                // Create phase-specific tasks
                await createPhaseSpecificTasks(wedding_id, nextPhase, supabaseUrl, headers);

                return new Response(JSON.stringify({ data: { current_phase: nextPhase } }), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
            }

            case 'get_wedding_analytics': {
                const analyticsResponse = await fetch(
                    `${supabaseUrl}/rest/v1/wedding_analytics?wedding_id=eq.${wedding_id}&order=created_at.desc&limit=1`,
                    { headers }
                );

                if (!analyticsResponse.ok) {
                    throw new Error('Failed to fetch analytics');
                }

                const analytics = await analyticsResponse.json();
                
                // Generate fresh analytics if none exist or data is stale
                if (!analytics.length || isAnalyticsStale(analytics[0])) {
                    const freshAnalytics = await generateWeddingAnalytics(wedding_id, supabaseUrl, headers);
                    return new Response(JSON.stringify({ data: freshAnalytics }), {
                        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                    });
                }

                return new Response(JSON.stringify({ data: analytics[0] }), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
            }

            default:
                throw new Error(`Unknown action: ${action}`);
        }

    } catch (error) {
        console.error('Wedding management error:', error);
        
        return new Response(JSON.stringify({
            error: {
                code: 'WEDDING_MANAGEMENT_ERROR',
                message: error.message
            }
        }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});

// Helper functions
function generateWeddingCode() {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substr(2, 4).toUpperCase();
    return `WED-${timestamp}-${random}`;
}

async function createInitialTimelineTasks(weddingId, weddingDate, supabaseUrl, headers) {
    const tasks = [
        {
            wedding_id: weddingId,
            task_name: 'Send Party Member Invitations',
            description: 'Invite all wedding party members to the coordination platform',
            category: 'setup',
            phase: 'planning',
            assigned_to: 'couple',
            due_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 3 days
            priority: 'high',
            auto_created: true
        },
        {
            wedding_id: weddingId,
            task_name: 'Collect Measurements from All Members',
            description: 'Ensure all party members submit accurate measurements',
            category: 'measurements',
            phase: 'preparation',
            assigned_to: 'party',
            due_date: new Date(new Date(weddingDate).getTime() - 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 60 days before
            priority: 'critical',
            auto_created: true
        },
        {
            wedding_id: weddingId,
            task_name: 'Finalize Outfit Selections',
            description: 'All party members must select and approve their outfits',
            category: 'selection',
            phase: 'preparation',
            assigned_to: 'party',
            due_date: new Date(new Date(weddingDate).getTime() - 45 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 45 days before
            priority: 'critical',
            auto_created: true
        },
        {
            wedding_id: weddingId,
            task_name: 'Complete Payment Processing',
            description: 'Finalize payments for all orders',
            category: 'payment',
            phase: 'execution',
            assigned_to: 'couple',
            due_date: new Date(new Date(weddingDate).getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days before
            priority: 'high',
            auto_created: true
        },
        {
            wedding_id: weddingId,
            task_name: 'Schedule Final Fittings',
            description: 'Arrange final fitting appointments for any necessary alterations',
            category: 'fitting',
            phase: 'execution',
            assigned_to: 'coordinator',
            due_date: new Date(new Date(weddingDate).getTime() - 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 14 days before
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

async function updateWeddingProgress(weddingId, supabaseUrl, headers) {
    // Get all party members and their progress
    const membersResponse = await fetch(
        `${supabaseUrl}/rest/v1/wedding_party_members?wedding_id=eq.${weddingId}`,
        { headers }
    );
    
    if (!membersResponse.ok) return;
    
    const members = await membersResponse.json();
    
    if (members.length === 0) return;
    
    // Calculate overall completion percentage
    const totalMembers = members.length;
    const totalProgress = members.reduce((sum, member) => sum + (member.overall_completion_percentage || 0), 0);
    const averageProgress = Math.round(totalProgress / totalMembers);
    
    // Update wedding completion percentage
    await fetch(`${supabaseUrl}/rest/v1/weddings?id=eq.${weddingId}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({
            completion_percentage: averageProgress,
            updated_at: new Date().toISOString()
        })
    });
}

function determineNextPhase(currentPhase) {
    const phases = ['setup', 'planning', 'measurements', 'selection', 'orders', 'production', 'fulfillment', 'completion'];
    const currentIndex = phases.indexOf(currentPhase);
    return phases[currentIndex + 1] || 'completion';
}

async function createPhaseSpecificTasks(weddingId, phase, supabaseUrl, headers) {
    const phaseTaskTemplates = {
        measurements: [
            {
                task_name: 'AI Measurement Analysis',
                description: 'Process and validate all submitted measurements using AI',
                category: 'measurements',
                priority: 'high',
                assigned_to: 'coordinator'
            }
        ],
        selection: [
            {
                task_name: 'Style Coordination Review',
                description: 'Ensure all outfit selections are coordinated and match wedding theme',
                category: 'selection',
                priority: 'high',
                assigned_to: 'coordinator'
            }
        ],
        orders: [
            {
                task_name: 'Process Group Orders',
                description: 'Place all approved orders with vendors',
                category: 'orders',
                priority: 'critical',
                assigned_to: 'coordinator'
            }
        ]
    };

    const tasks = phaseTaskTemplates[phase];
    if (!tasks) return;

    const taskRecords = tasks.map(task => ({
        wedding_id: weddingId,
        ...task,
        phase,
        due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 days from now
        auto_created: true
    }));

    await fetch(`${supabaseUrl}/rest/v1/wedding_timeline_tasks`, {
        method: 'POST',
        headers,
        body: JSON.stringify(taskRecords)
    });
}

function calculateDashboardMetrics(wedding) {
    const partyMembers = wedding.party_members || [];
    const tasks = wedding.tasks || [];
    const communications = wedding.communications || [];
    
    // Calculate progress metrics
    const totalMembers = partyMembers.length;
    const membersWithMeasurements = partyMembers.filter(m => m.measurements_status === 'confirmed').length;
    const membersWithOutfits = partyMembers.filter(m => m.outfit_status === 'confirmed').length;
    const membersWithPayments = partyMembers.filter(m => m.payment_status === 'paid').length;
    
    // Calculate task metrics
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.status === 'completed').length;
    const overdueTasks = tasks.filter(t => t.status === 'overdue').length;
    const upcomingTasks = tasks.filter(t => {
        const dueDate = new Date(t.due_date);
        const now = new Date();
        const daysDiff = (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
        return daysDiff <= 7 && daysDiff > 0 && t.status === 'pending';
    }).length;
    
    // Calculate timeline metrics
    const weddingDate = new Date(wedding.wedding_date);
    const now = new Date();
    const daysUntilWedding = Math.ceil((weddingDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    return {
        wedding: {
            id: wedding.id,
            wedding_code: wedding.wedding_code,
            wedding_date: wedding.wedding_date,
            status: wedding.status,
            completion_percentage: wedding.completion_percentage,
            days_until_wedding: daysUntilWedding
        },
        party_progress: {
            total_members: totalMembers,
            measurements_completed: membersWithMeasurements,
            outfits_selected: membersWithOutfits,
            payments_completed: membersWithPayments,
            measurements_percentage: totalMembers > 0 ? Math.round((membersWithMeasurements / totalMembers) * 100) : 0,
            outfits_percentage: totalMembers > 0 ? Math.round((membersWithOutfits / totalMembers) * 100) : 0,
            payments_percentage: totalMembers > 0 ? Math.round((membersWithPayments / totalMembers) * 100) : 0
        },
        task_summary: {
            total_tasks: totalTasks,
            completed_tasks: completedTasks,
            overdue_tasks: overdueTasks,
            upcoming_tasks: upcomingTasks,
            completion_percentage: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
        },
        communication_summary: {
            total_messages: communications.length,
            recent_messages: communications.filter(c => {
                const messageDate = new Date(c.created_at);
                const daysDiff = (now.getTime() - messageDate.getTime()) / (1000 * 60 * 60 * 24);
                return daysDiff <= 7;
            }).length
        }
    };
}

function isAnalyticsStale(analytics) {
    const now = new Date();
    const analyticsDate = new Date(analytics.snapshot_date);
    const daysDiff = (now.getTime() - analyticsDate.getTime()) / (1000 * 60 * 60 * 24);
    return daysDiff > 1; // Refresh daily
}

async function generateWeddingAnalytics(weddingId, supabaseUrl, headers) {
    // Fetch all wedding data for analytics
    const [weddingResponse, membersResponse, ordersResponse] = await Promise.all([
        fetch(`${supabaseUrl}/rest/v1/weddings?id=eq.${weddingId}`, { headers }),
        fetch(`${supabaseUrl}/rest/v1/wedding_party_members?wedding_id=eq.${weddingId}`, { headers }),
        fetch(`${supabaseUrl}/rest/v1/wedding_orders?wedding_id=eq.${weddingId}`, { headers })
    ]);
    
    const wedding = await weddingResponse.json();
    const members = await membersResponse.json();
    const orders = await ordersResponse.json();
    
    // Calculate analytics
    const analytics = {
        wedding_id: weddingId,
        total_party_size: members.length,
        completed_members: members.filter(m => 
            m.measurements_status === 'confirmed' && 
            m.outfit_status === 'confirmed' && 
            m.payment_status === 'paid'
        ).length,
        completion_rate: members.length > 0 ? 
            members.filter(m => m.overall_completion_percentage === 100).length / members.length : 0,
        total_revenue: orders.reduce((sum, order) => {
            // This would need to be calculated from linked orders table
            return sum + 0; // Placeholder
        }, 0),
        average_member_spend: 0, // Calculate from orders
        snapshot_date: new Date().toISOString().split('T')[0]
    };
    
    // Save analytics
    await fetch(`${supabaseUrl}/rest/v1/wedding_analytics`, {
        method: 'POST',
        headers,
        body: JSON.stringify(analytics)
    });
    
    return analytics;
}