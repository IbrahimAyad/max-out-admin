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
        const memberResponse = await fetch(`${supabaseUrl}/rest/v1/wedding_party_members?email=eq.${userEmail}&select=*,weddings(wedding_date)`, {
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
        const wedding = member.weddings;
        const url = new URL(req.url);
        const method = req.method;

        if (method === 'GET') {
            // Get timeline and tasks for this member
            const status = url.searchParams.get('status'); // 'all', 'pending', 'completed', 'overdue'
            const priority = url.searchParams.get('priority'); // 'high', 'medium', 'low'
            
            let query = `wedding_id=eq.${member.wedding_id}&and=(assigned_member_id.eq.${member.id},or(assigned_to.eq.party_member,assigned_to.eq.${member.role}))`;
            
            // Add status filter
            if (status && status !== 'all') {
                if (status === 'overdue') {
                    const today = new Date().toISOString().split('T')[0];
                    query += `&due_date.lt.${today}&status.neq.completed`;
                } else {
                    query += `&status.eq.${status}`;
                }
            }
            
            // Add priority filter
            if (priority) {
                query += `&priority.eq.${priority}`;
            }

            const tasksResponse = await fetch(`${supabaseUrl}/rest/v1/wedding_timeline_tasks?${query}&select=*&order=due_date.asc.nullslast,priority.desc,created_at.asc`, {
                headers: {
                    'apikey': supabaseAnonKey,
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            const tasks = tasksResponse.ok ? await tasksResponse.json() : [];

            // Process tasks to add calculated fields
            const today = new Date();
            const weddingDate = new Date(wedding.wedding_date);
            
            const processedTasks = tasks.map(task => {
                const dueDate = task.due_date ? new Date(task.due_date) : null;
                const isOverdue = dueDate && dueDate < today && task.status !== 'completed';
                const daysUntilDue = dueDate ? Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)) : null;
                const isUrgent = daysUntilDue !== null && daysUntilDue <= 7 && daysUntilDue >= 0;
                
                return {
                    id: task.id,
                    taskName: task.task_name,
                    description: task.description,
                    category: task.category,
                    phase: task.phase,
                    assignedTo: task.assigned_to,
                    dueDate: task.due_date,
                    startDate: task.start_date,
                    estimatedDuration: task.estimated_duration_hours,
                    priority: task.priority,
                    status: task.status,
                    completionPercentage: task.completion_percentage || 0,
                    isOverdue,
                    isUrgent,
                    daysUntilDue,
                    autoCreated: task.auto_created,
                    parentTaskId: task.parent_task_id,
                    dependentTaskIds: task.dependent_task_ids || [],
                    reminderSent: task.reminder_sent,
                    escalationLevel: task.escalation_level || 0,
                    startedAt: task.started_at,
                    completedAt: task.completed_at,
                    notes: task.notes,
                    completionNotes: task.completion_notes,
                    createdAt: task.created_at,
                    updatedAt: task.updated_at
                };
            });

            // Calculate summary statistics
            const totalTasks = processedTasks.length;
            const completedTasks = processedTasks.filter(t => t.status === 'completed').length;
            const pendingTasks = processedTasks.filter(t => t.status !== 'completed').length;
            const overdueTasks = processedTasks.filter(t => t.isOverdue).length;
            const urgentTasks = processedTasks.filter(t => t.isUrgent).length;
            
            const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

            // Group tasks by category
            const tasksByCategory = processedTasks.reduce((acc, task) => {
                const category = task.category || 'General';
                if (!acc[category]) {
                    acc[category] = [];
                }
                acc[category].push(task);
                return acc;
            }, {});

            // Create timeline milestones
            const daysUntilWedding = Math.ceil((weddingDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
            
            const milestones = [
                {
                    name: 'Invitation Accepted',
                    date: member.accepted_at,
                    completed: !!member.accepted_at,
                    category: 'Setup'
                },
                {
                    name: 'Measurements Submitted',
                    date: null, // Would need to fetch from measurements table
                    completed: member.measurements_status === 'completed',
                    category: 'Measurements'
                },
                {
                    name: 'Outfit Approved',
                    date: null, // Would need to fetch from outfits table
                    completed: member.outfit_status === 'approved',
                    category: 'Outfit'
                },
                {
                    name: 'Payment Completed',
                    date: null,
                    completed: member.payment_status === 'completed',
                    category: 'Payment'
                },
                {
                    name: 'Wedding Day',
                    date: wedding.wedding_date,
                    completed: false,
                    category: 'Event',
                    daysUntil: daysUntilWedding
                }
            ];

            return new Response(JSON.stringify({
                data: {
                    tasks: processedTasks,
                    summary: {
                        totalTasks,
                        completedTasks,
                        pendingTasks,
                        overdueTasks,
                        urgentTasks,
                        completionRate
                    },
                    tasksByCategory,
                    milestones,
                    wedding: {
                        date: wedding.wedding_date,
                        daysUntil: daysUntilWedding
                    }
                }
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });

        } else if (method === 'POST' && url.pathname.endsWith('/update-task')) {
            // Update task status or completion
            const { taskId, status, completionPercentage, notes, startedAt, completedAt } = await req.json();

            if (!taskId) {
                throw new Error('Task ID is required');
            }

            const updateData = {
                updated_at: new Date().toISOString()
            };

            if (status !== undefined) {
                updateData.status = status;
                
                if (status === 'in_progress' && !startedAt) {
                    updateData.started_at = new Date().toISOString();
                }
                
                if (status === 'completed') {
                    updateData.completed_at = completedAt || new Date().toISOString();
                    updateData.completion_percentage = 100;
                }
            }

            if (completionPercentage !== undefined) {
                updateData.completion_percentage = Math.max(0, Math.min(100, completionPercentage));
            }

            if (notes !== undefined) {
                if (status === 'completed') {
                    updateData.completion_notes = notes;
                } else {
                    updateData.notes = notes;
                }
            }

            if (startedAt) {
                updateData.started_at = startedAt;
            }

            if (completedAt) {
                updateData.completed_at = completedAt;
            }

            const updateResponse = await fetch(`${supabaseUrl}/rest/v1/wedding_timeline_tasks?id=eq.${taskId}&assigned_member_id=eq.${member.id}`, {
                method: 'PATCH',
                headers: {
                    'apikey': supabaseAnonKey,
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    'Prefer': 'return=representation'
                },
                body: JSON.stringify(updateData)
            });

            if (!updateResponse.ok) {
                const errorText = await updateResponse.text();
                throw new Error(`Failed to update task: ${errorText}`);
            }

            const updatedTask = await updateResponse.json();

            // Create communication for task completion if applicable
            if (status === 'completed') {
                const communicationData = {
                    wedding_id: member.wedding_id,
                    sender_id: member.id,
                    sender_type: 'party_member',
                    recipient_types: ['coordinator', 'admin'],
                    message_type: 'task_completed',
                    subject: 'Task Completed',
                    message: `${member.first_name} ${member.last_name} has completed the task: ${updatedTask[0]?.task_name}${notes ? `\n\nNotes: ${notes}` : ''}`,
                    sent_at: new Date().toISOString(),
                    created_at: new Date().toISOString()
                };

                await fetch(`${supabaseUrl}/rest/v1/wedding_communications`, {
                    method: 'POST',
                    headers: {
                        'apikey': supabaseAnonKey,
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(communicationData)
                });
            }

            return new Response(JSON.stringify({
                data: {
                    task: updatedTask[0],
                    message: 'Task updated successfully'
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
        console.error('Groomsmen timeline error:', error);

        const errorResponse = {
            error: {
                code: 'TIMELINE_ERROR',
                message: error.message
            }
        };

        return new Response(JSON.stringify(errorResponse), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});