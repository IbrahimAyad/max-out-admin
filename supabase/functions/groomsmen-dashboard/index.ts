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

        // Get party member data using service role key
        const memberResponse = await fetch(`${supabaseUrl}/rest/v1/wedding_party_members?user_id=eq.${userId}`, {
            headers: {
                'apikey': supabaseServiceKey,
                'Authorization': `Bearer ${supabaseServiceKey}`,
                'Content-Type': 'application/json'
            }
        });

        if (!memberResponse.ok) {
            const errorText = await memberResponse.text();
            console.error('Failed to fetch party member data:', errorText);
            throw new Error('Failed to fetch party member data');
        }

        const members = await memberResponse.json();

        if (members.length === 0) {
            return new Response(JSON.stringify({
                error: {
                    code: 'MEMBER_NOT_FOUND',
                    message: 'No wedding party membership found for this user'
                }
            }), {
                status: 404,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        const member = members[0];
        
        // Get wedding data separately
        const weddingResponse = await fetch(`${supabaseUrl}/rest/v1/weddings?id=eq.${member.wedding_id}`, {
            headers: {
                'apikey': supabaseServiceKey,
                'Authorization': `Bearer ${supabaseServiceKey}`,
                'Content-Type': 'application/json'
            }
        });

        let wedding = null;
        if (weddingResponse.ok) {
            const weddings = await weddingResponse.json();
            wedding = weddings.length > 0 ? weddings[0] : null;
        }

        if (!wedding) {
            // Return basic dashboard data without wedding details
            wedding = {
                id: member.wedding_id,
                wedding_code: 'UNKNOWN',
                wedding_date: '2025-12-31',
                venue_name: 'TBD',
                venue_city: 'TBD',
                venue_state: 'TBD',
                wedding_theme: 'Classic',
                color_scheme: {}
            };
        }

        // Calculate days until wedding
        const weddingDate = new Date(wedding.wedding_date);
        const today = new Date();
        const daysUntilWedding = Math.ceil((weddingDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

        // Get tasks, communications, measurements, and outfits with proper error handling
        let tasks = [];
        let communications = [];
        let measurements = [];
        let outfits = [];

        try {
            // Get tasks (non-critical)
            const tasksResponse = await fetch(`${supabaseUrl}/rest/v1/wedding_timeline_tasks?wedding_id=eq.${member.wedding_id}&assigned_member_id=eq.${member.id}&order=due_date.asc&limit=5`, {
                headers: {
                    'apikey': supabaseServiceKey,
                    'Authorization': `Bearer ${supabaseServiceKey}`,
                    'Content-Type': 'application/json'
                }
            });

            if (tasksResponse.ok) {
                tasks = await tasksResponse.json();
            }
        } catch (error) {
            console.warn('Non-critical: Failed to fetch tasks:', error);
        }

        try {
            // Get communications (non-critical)
            const communicationsResponse = await fetch(`${supabaseUrl}/rest/v1/wedding_communications?wedding_id=eq.${member.wedding_id}&order=created_at.desc&limit=3`, {
                headers: {
                    'apikey': supabaseServiceKey,
                    'Authorization': `Bearer ${supabaseServiceKey}`,
                    'Content-Type': 'application/json'
                }
            });

            if (communicationsResponse.ok) {
                communications = await communicationsResponse.json();
            }
        } catch (error) {
            console.warn('Non-critical: Failed to fetch communications:', error);
        }

        try {
            // Get measurements (non-critical)
            const measurementsResponse = await fetch(`${supabaseUrl}/rest/v1/wedding_measurements?party_member_id=eq.${member.id}&is_current=eq.true`, {
                headers: {
                    'apikey': supabaseServiceKey,
                    'Authorization': `Bearer ${supabaseServiceKey}`,
                    'Content-Type': 'application/json'
                }
            });

            if (measurementsResponse.ok) {
                measurements = await measurementsResponse.json();
            }
        } catch (error) {
            console.warn('Non-critical: Failed to fetch measurements:', error);
        }

        try {
            // Get outfits (non-critical)
            const outfitResponse = await fetch(`${supabaseUrl}/rest/v1/wedding_outfits?party_member_id=eq.${member.id}`, {
                headers: {
                    'apikey': supabaseServiceKey,
                    'Authorization': `Bearer ${supabaseServiceKey}`,
                    'Content-Type': 'application/json'
                }
            });

            if (outfitResponse.ok) {
                outfits = await outfitResponse.json();
            }
        } catch (error) {
            console.warn('Non-critical: Failed to fetch outfits:', error);
        }

        const hasCurrentMeasurements = measurements.length > 0;
        const hasOutfitAssigned = outfits.length > 0;

        // Calculate completion status
        const completionItems = {
            invitation_accepted: !!member.accepted_at,
            measurements_submitted: hasCurrentMeasurements,
            outfit_assigned: hasOutfitAssigned,
            outfit_approved: hasOutfitAssigned && outfits[0]?.approved_by_member,
            payment_completed: member.payment_status === 'completed'
        };

        const completedItems = Object.values(completionItems).filter(Boolean).length;
        const totalItems = Object.keys(completionItems).length;
        const completionPercentage = Math.round((completedItems / totalItems) * 100);

        // Identify urgent tasks (due within 7 days)
        const urgentTasks = tasks.filter(task => {
            if (!task.due_date) return false;
            const dueDate = new Date(task.due_date);
            const daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
            return daysUntilDue <= 7 && daysUntilDue >= 0;
        });

        // Build dashboard data
        const dashboardData = {
            member: {
                id: member.id,
                firstName: member.first_name,
                lastName: member.last_name,
                role: member.role,
                customRoleTitle: member.custom_role_title,
                email: member.email,
                phone: member.phone
            },
            wedding: {
                id: wedding.id,
                weddingCode: wedding.wedding_code,
                weddingDate: wedding.wedding_date,
                daysUntilWedding,
                venueName: wedding.venue_name,
                venueCity: wedding.venue_city,
                venueState: wedding.venue_state,
                theme: wedding.wedding_theme,
                colorScheme: wedding.color_scheme
            },
            progress: {
                completionPercentage,
                completionItems,
                measurementsStatus: member.measurements_status || 'pending',
                outfitStatus: member.outfit_status || 'pending',
                paymentStatus: member.payment_status || 'pending'
            },
            tasks: {
                pending: tasks,
                urgent: urgentTasks,
                overdueCount: tasks.filter(task => {
                    if (!task.due_date) return false;
                    return new Date(task.due_date) < today;
                }).length
            },
            communications: {
                recent: communications,
                unreadCount: communications.filter(comm => {
                    const readBy = comm.read_by || {};
                    return !readBy[member.id];
                }).length
            },
            quickActions: {
                submitMeasurements: !hasCurrentMeasurements,
                viewOutfit: hasOutfitAssigned,
                approveOutfit: hasOutfitAssigned && !outfits[0]?.approved_by_member,
                checkMessages: communications.length > 0,
                updateProfile: !member.phone || !member.address
            }
        };

        return new Response(JSON.stringify({
            success: true,
            data: dashboardData
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Groomsmen dashboard error:', error);

        const errorResponse = {
            success: false,
            error: {
                code: 'DASHBOARD_ERROR',
                message: error.message || 'An unexpected error occurred'
            }
        };

        return new Response(JSON.stringify(errorResponse), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});