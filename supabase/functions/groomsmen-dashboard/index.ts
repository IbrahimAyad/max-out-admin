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
        
        // Get authorization header to extract user
        const authHeader = req.headers.get('authorization');
        const token = authHeader?.replace('Bearer ', '');
        
        if (!token) {
            throw new Error('No authorization token provided');
        }
        
        // Get current user from Supabase
        const userResponse = await fetch(`${supabaseUrl}/auth/v1/user`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'apikey': Deno.env.get('SUPABASE_ANON_KEY')!
            }
        });
        
        if (!userResponse.ok) {
            throw new Error('Invalid authorization token');
        }
        
        const user = await userResponse.json();
        const userId = user.id;
        
        // Get party member data for this user
        const partyMemberResponse = await fetch(`${supabaseUrl}/rest/v1/wedding_party_members?user_id=eq.${userId}&select=*,weddings(*)`, {
            headers: {
                'Authorization': `Bearer ${supabaseKey}`,
                'apikey': supabaseKey,
                'Content-Type': 'application/json'
            }
        });
        
        if (!partyMemberResponse.ok) {
            throw new Error('Failed to fetch party member data');
        }
        
        const partyMembers = await partyMemberResponse.json();
        
        if (partyMembers.length === 0) {
            throw new Error('User is not a wedding party member');
        }
        
        const member = partyMembers[0];
        const wedding = member.weddings;
        
        if (!wedding) {
            throw new Error('No wedding data found');
        }
        
        // Calculate days until wedding
        const weddingDate = new Date(wedding.wedding_date);
        const today = new Date();
        const daysUntilWedding = Math.ceil((weddingDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        
        // Calculate completion percentage
        const completionItems = {
            invitation_accepted: member.invitation_status === 'accepted',
            measurements_submitted: member.measurements_status === 'submitted' || member.measurements_status === 'approved',
            outfit_assigned: member.outfit_status !== 'pending',
            outfit_approved: member.outfit_status === 'approved',
            payment_completed: member.payment_status === 'completed'
        };
        
        const completedItems = Object.values(completionItems).filter(Boolean).length;
        const completionPercentage = Math.round((completedItems / 5) * 100);
        
        // Get pending tasks
        const pendingTasks = [];
        const urgentTasks = [];
        
        if (!completionItems.invitation_accepted) {
            urgentTasks.push({
                id: 'accept_invitation',
                taskName: 'Accept Wedding Invitation',
                dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
                priority: 'urgent'
            });
        }
        
        if (!completionItems.measurements_submitted) {
            const dueDate = new Date(weddingDate.getTime() - 60 * 24 * 60 * 60 * 1000); // 60 days before wedding
            (dueDate < new Date() ? urgentTasks : pendingTasks).push({
                id: 'submit_measurements',
                taskName: 'Submit Measurements',
                dueDate: dueDate.toISOString(),
                priority: dueDate < new Date() ? 'urgent' : 'normal'
            });
        }
        
        if (!completionItems.outfit_approved && completionItems.outfit_assigned) {
            pendingTasks.push({
                id: 'approve_outfit',
                taskName: 'Review and Approve Outfit',
                dueDate: new Date(weddingDate.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days before
                priority: 'normal'
            });
        }
        
        // Get recent communications
        const communicationsResponse = await fetch(`${supabaseUrl}/rest/v1/wedding_communications?party_member_id=eq.${member.id}&order=created_at.desc&limit=5`, {
            headers: {
                'Authorization': `Bearer ${supabaseKey}`,
                'apikey': supabaseKey,
                'Content-Type': 'application/json'
            }
        });
        
        let recentCommunications = [];
        let unreadCount = 0;
        
        if (communicationsResponse.ok) {
            recentCommunications = await communicationsResponse.json();
            
            // Count unread messages
            const unreadResponse = await fetch(`${supabaseUrl}/rest/v1/wedding_communications?party_member_id=eq.${member.id}&read_status=eq.false`, {
                headers: {
                    'Authorization': `Bearer ${supabaseKey}`,
                    'apikey': supabaseKey,
                    'Content-Type': 'application/json'
                }
            });
            
            if (unreadResponse.ok) {
                const unreadMessages = await unreadResponse.json();
                unreadCount = unreadMessages.length;
            }
        }
        
        // Determine quick actions based on current status
        const quickActions = {
            submitMeasurements: !completionItems.measurements_submitted,
            viewOutfit: completionItems.outfit_assigned,
            approveOutfit: completionItems.outfit_assigned && !completionItems.outfit_approved,
            checkMessages: unreadCount > 0,
            updateProfile: true
        };
        
        const dashboardData = {
            member: {
                firstName: member.first_name || 'Member',
                lastName: member.last_name || '',
                role: member.role || 'Groomsman',
                customRoleTitle: member.custom_role_title
            },
            wedding: {
                weddingDate: wedding.wedding_date,
                daysUntilWedding: Math.max(0, daysUntilWedding),
                venueName: wedding.venue_name,
                venueCity: wedding.venue_city,
                venueState: wedding.venue_state,
                theme: wedding.theme,
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
                pending: pendingTasks,
                urgent: urgentTasks,
                overdueCount: urgentTasks.length
            },
            communications: {
                recent: recentCommunications,
                unreadCount
            },
            quickActions
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
                code: 'GROOMSMEN_DASHBOARD_ERROR',
                message: error.message || 'Failed to load dashboard data'
            }
        };

        return new Response(JSON.stringify(errorResponse), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});