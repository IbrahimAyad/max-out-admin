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
        const { action, task_data, task_id, wedding_id, member_id, filters } = await req.json();
        
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
            case 'create_task': {
                const taskRecord = {
                    wedding_id: task_data.wedding_id,
                    task_name: task_data.task_name,
                    description: task_data.description,
                    category: task_data.category,
                    phase: task_data.phase,
                    assigned_to: task_data.assigned_to,
                    assigned_member_id: task_data.assigned_member_id,
                    due_date: task_data.due_date,
                    start_date: task_data.start_date,
                    estimated_duration_hours: task_data.estimated_duration_hours,
                    priority: task_data.priority || 'medium',
                    status: 'pending',
                    auto_created: task_data.auto_created || false,
                    parent_task_id: task_data.parent_task_id,
                    dependent_task_ids: task_data.dependent_task_ids || [],
                    triggers_tasks: task_data.triggers_tasks || [],
                    reminder_schedule: task_data.reminder_schedule || {
                        '3_days_before': true,
                        '1_day_before': true,
                        'on_due_date': true
                    }
                };

                const response = await fetch(`${supabaseUrl}/rest/v1/wedding_timeline_tasks`, {
                    method: 'POST',
                    headers: { ...headers, 'Prefer': 'return=representation' },
                    body: JSON.stringify(taskRecord)
                });

                if (!response.ok) {
                    throw new Error(`Failed to create task: ${await response.text()}`);
                }

                const task = await response.json();
                
                // Schedule automatic reminders
                await scheduleTaskReminders(task[0], supabaseUrl, headers);

                return new Response(JSON.stringify({ data: task[0] }), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
            }

            case 'get_tasks': {
                let query = '';
                
                if (wedding_id) {
                    query += `wedding_id=eq.${wedding_id}`;
                }
                
                if (member_id) {
                    if (query) query += '&';
                    query += `assigned_member_id=eq.${member_id}`;
                }
                
                if (filters?.status) {
                    if (query) query += '&';
                    query += `status=eq.${filters.status}`;
                }
                
                if (filters?.category) {
                    if (query) query += '&';
                    query += `category=eq.${filters.category}`;
                }
                
                if (filters?.priority) {
                    if (query) query += '&';
                    query += `priority=eq.${filters.priority}`;
                }
                
                if (filters?.overdue_only) {
                    if (query) query += '&';
                    query += `due_date=lt.${new Date().toISOString().split('T')[0]}&status=neq.completed`;
                }
                
                if (filters?.upcoming_only) {
                    if (query) query += '&';
                    const oneWeekFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
                    query += `due_date=lte.${oneWeekFromNow}&due_date=gte.${new Date().toISOString().split('T')[0]}&status=neq.completed`;
                }
                
                query += '&order=due_date.asc,priority.desc';
                
                let selectFields = '*';
                if (filters?.include_member_details) {
                    selectFields += ',assigned_member:assigned_member_id(first_name,last_name,role)';
                }

                const response = await fetch(
                    `${supabaseUrl}/rest/v1/wedding_timeline_tasks?${query}&select=${selectFields}`,
                    { headers }
                );

                if (!response.ok) {
                    throw new Error(`Failed to fetch tasks: ${await response.text()}`);
                }

                const tasks = await response.json();
                
                // Add computed fields
                const enrichedTasks = tasks.map(task => ({
                    ...task,
                    is_overdue: new Date(task.due_date) < new Date() && task.status !== 'completed',
                    days_until_due: Math.ceil((new Date(task.due_date) - new Date()) / (1000 * 60 * 60 * 24))
                }));
                
                return new Response(JSON.stringify({ data: enrichedTasks }), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
            }

            case 'update_task': {
                const updateFields = {
                    ...task_data,
                    updated_at: new Date().toISOString()
                };
                
                // Handle status changes
                if (task_data.status) {
                    if (task_data.status === 'in_progress' && !updateFields.started_at) {
                        updateFields.started_at = new Date().toISOString();
                    }
                    
                    if (task_data.status === 'completed') {
                        updateFields.completed_at = new Date().toISOString();
                        updateFields.completion_percentage = 100;
                        
                        // Trigger dependent tasks
                        await triggerDependentTasks(task_id, supabaseUrl, headers);
                    }
                }

                const response = await fetch(`${supabaseUrl}/rest/v1/wedding_timeline_tasks?id=eq.${task_id}`, {
                    method: 'PATCH',
                    headers,
                    body: JSON.stringify(updateFields)
                });

                if (!response.ok) {
                    throw new Error(`Failed to update task: ${await response.text()}`);
                }

                return new Response(JSON.stringify({ data: { success: true } }), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
            }

            case 'complete_task': {
                const completionData = task_data.completion_data || {};
                
                const updateFields = {
                    status: 'completed',
                    completion_percentage: 100,
                    completed_at: new Date().toISOString(),
                    completion_notes: completionData.notes,
                    updated_at: new Date().toISOString()
                };

                const response = await fetch(`${supabaseUrl}/rest/v1/wedding_timeline_tasks?id=eq.${task_id}`, {
                    method: 'PATCH',
                    headers,
                    body: JSON.stringify(updateFields)
                });

                if (!response.ok) {
                    throw new Error(`Failed to complete task: ${await response.text()}`);
                }

                // Trigger dependent tasks
                await triggerDependentTasks(task_id, supabaseUrl, headers);
                
                // Update member progress if this is a member task
                await updateMemberProgressFromTask(task_id, supabaseUrl, headers);

                return new Response(JSON.stringify({ data: { success: true } }), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
            }

            case 'get_timeline': {
                // Get comprehensive timeline for wedding
                const tasksResponse = await fetch(
                    `${supabaseUrl}/rest/v1/wedding_timeline_tasks?wedding_id=eq.${wedding_id}&order=due_date.asc&select=*,assigned_member:assigned_member_id(first_name,last_name,role)`,
                    { headers }
                );
                
                if (!tasksResponse.ok) {
                    throw new Error('Failed to fetch timeline');
                }
                
                const tasks = await tasksResponse.json();
                
                // Group tasks by phase and calculate progress
                const timeline = generateTimelineView(tasks);

                return new Response(JSON.stringify({ data: timeline }), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
            }

            case 'get_critical_path': {
                // Analyze critical path for wedding timeline
                const tasksResponse = await fetch(
                    `${supabaseUrl}/rest/v1/wedding_timeline_tasks?wedding_id=eq.${wedding_id}&select=*`,
                    { headers }
                );
                
                if (!tasksResponse.ok) {
                    throw new Error('Failed to fetch tasks for critical path analysis');
                }
                
                const tasks = await tasksResponse.json();
                const criticalPath = calculateCriticalPath(tasks);

                return new Response(JSON.stringify({ data: criticalPath }), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
            }

            case 'send_reminders': {
                // Send reminders for upcoming or overdue tasks
                const now = new Date();
                const reminderDate = new Date(now.getTime() + 24 * 60 * 60 * 1000); // Tomorrow
                
                const tasksResponse = await fetch(
                    `${supabaseUrl}/rest/v1/wedding_timeline_tasks?wedding_id=eq.${wedding_id}&due_date=lte.${reminderDate.toISOString().split('T')[0]}&status=neq.completed&reminder_sent=eq.false&select=*,assigned_member:assigned_member_id(*),wedding:wedding_id(*)`,
                    { headers }
                );
                
                if (!tasksResponse.ok) {
                    throw new Error('Failed to fetch tasks for reminders');
                }
                
                const tasks = await tasksResponse.json();
                const reminderResults = [];
                
                for (const task of tasks) {
                    try {
                        if (task.assigned_member && task.assigned_member.email) {
                            await sendTaskReminder(task, supabaseUrl, headers);
                            
                            // Mark reminder as sent
                            await fetch(`${supabaseUrl}/rest/v1/wedding_timeline_tasks?id=eq.${task.id}`, {
                                method: 'PATCH',
                                headers,
                                body: JSON.stringify({
                                    reminder_sent: true,
                                    last_reminder_sent: new Date().toISOString(),
                                    updated_at: new Date().toISOString()
                                })
                            });
                            
                            reminderResults.push({
                                task_id: task.id,
                                success: true
                            });
                        }
                    } catch (error) {
                        reminderResults.push({
                            task_id: task.id,
                            success: false,
                            error: error.message
                        });
                    }
                }

                return new Response(JSON.stringify({ 
                    data: {
                        reminders_sent: reminderResults.filter(r => r.success).length,
                        total_attempts: reminderResults.length,
                        results: reminderResults
                    }
                }), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
            }

            case 'get_task_analytics': {
                const tasksResponse = await fetch(
                    `${supabaseUrl}/rest/v1/wedding_timeline_tasks?wedding_id=eq.${wedding_id}`,
                    { headers }
                );
                
                if (!tasksResponse.ok) {
                    throw new Error('Failed to fetch tasks for analytics');
                }
                
                const tasks = await tasksResponse.json();
                const analytics = calculateTaskAnalytics(tasks);

                return new Response(JSON.stringify({ data: analytics }), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
            }

            case 'bulk_create_tasks': {
                const tasksToCreate = task_data.tasks;
                const results = [];
                
                for (const taskData of tasksToCreate) {
                    try {
                        const response = await fetch(`${supabaseUrl}/rest/v1/wedding_timeline_tasks`, {
                            method: 'POST',
                            headers: { ...headers, 'Prefer': 'return=representation' },
                            body: JSON.stringify({
                                ...taskData,
                                auto_created: true
                            })
                        });
                        
                        if (response.ok) {
                            const task = await response.json();
                            results.push({ success: true, task: task[0] });
                        } else {
                            results.push({ success: false, error: await response.text(), taskData });
                        }
                    } catch (error) {
                        results.push({ success: false, error: error.message, taskData });
                    }
                }

                return new Response(JSON.stringify({ 
                    data: {
                        created_count: results.filter(r => r.success).length,
                        total_attempts: results.length,
                        results
                    }
                }), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
            }

            default:
                throw new Error(`Unknown action: ${action}`);
        }

    } catch (error) {
        console.error('Wedding timeline management error:', error);
        
        return new Response(JSON.stringify({
            error: {
                code: 'WEDDING_TIMELINE_MANAGEMENT_ERROR',
                message: error.message
            }
        }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});

// Helper functions
async function scheduleTaskReminders(task, supabaseUrl, headers) {
    const reminderSchedule = task.reminder_schedule || {};
    const dueDate = new Date(task.due_date);
    
    // This would typically integrate with a job scheduler
    // For now, we'll just mark that reminders should be sent
    console.log(`Scheduled reminders for task ${task.id} due on ${task.due_date}`);
}

async function triggerDependentTasks(completedTaskId, supabaseUrl, headers) {
    // Find tasks that depend on this completed task
    const dependentTasksResponse = await fetch(
        `${supabaseUrl}/rest/v1/wedding_timeline_tasks?dependent_task_ids.cs.["${completedTaskId}"]`,
        { headers }
    );
    
    if (!dependentTasksResponse.ok) return;
    
    const dependentTasks = await dependentTasksResponse.json();
    
    for (const task of dependentTasks) {
        // Check if all dependencies are complete
        const dependencies = task.dependent_task_ids || [];
        
        if (dependencies.length > 0) {
            const depTasksResponse = await fetch(
                `${supabaseUrl}/rest/v1/wedding_timeline_tasks?id=in.(${dependencies.join(',')})&select=id,status`,
                { headers }
            );
            
            if (depTasksResponse.ok) {
                const depTasks = await depTasksResponse.json();
                const allComplete = depTasks.every(dt => dt.status === 'completed');
                
                if (allComplete && task.status === 'pending') {
                    // Activate this task
                    await fetch(`${supabaseUrl}/rest/v1/wedding_timeline_tasks?id=eq.${task.id}`, {
                        method: 'PATCH',
                        headers,
                        body: JSON.stringify({
                            status: 'pending',
                            updated_at: new Date().toISOString()
                        })
                    });
                }
            }
        }
    }
}

async function updateMemberProgressFromTask(taskId, supabaseUrl, headers) {
    // Get task details
    const taskResponse = await fetch(
        `${supabaseUrl}/rest/v1/wedding_timeline_tasks?id=eq.${taskId}&select=assigned_member_id,category`,
        { headers }
    );
    
    if (!taskResponse.ok) return;
    
    const tasks = await taskResponse.json();
    const task = tasks[0];
    
    if (!task.assigned_member_id) return;
    
    // Update member status based on completed task category
    const statusUpdates = {};
    
    switch (task.category) {
        case 'measurements':
            statusUpdates.measurements_status = 'confirmed';
            break;
        case 'selection':
            statusUpdates.outfit_status = 'confirmed';
            break;
        case 'payment':
            statusUpdates.payment_status = 'paid';
            break;
    }
    
    if (Object.keys(statusUpdates).length > 0) {
        await fetch(`${supabaseUrl}/rest/v1/wedding_party_members?id=eq.${task.assigned_member_id}`, {
            method: 'PATCH',
            headers,
            body: JSON.stringify({
                ...statusUpdates,
                updated_at: new Date().toISOString()
            })
        });
    }
}

function generateTimelineView(tasks) {
    const phases = {
        setup: { name: 'Setup & Planning', tasks: [], progress: 0 },
        planning: { name: 'Planning & Coordination', tasks: [], progress: 0 },
        measurements: { name: 'Measurements Collection', tasks: [], progress: 0 },
        selection: { name: 'Outfit Selection', tasks: [], progress: 0 },
        approval: { name: 'Approvals', tasks: [], progress: 0 },
        orders: { name: 'Order Processing', tasks: [], progress: 0 },
        production: { name: 'Production & Fulfillment', tasks: [], progress: 0 },
        execution: { name: 'Final Execution', tasks: [], progress: 0 },
        completion: { name: 'Completion', tasks: [], progress: 0 }
    };
    
    // Group tasks by phase
    tasks.forEach(task => {
        const phase = task.phase || 'planning';
        if (phases[phase]) {
            phases[phase].tasks.push(task);
        }
    });
    
    // Calculate progress for each phase
    Object.keys(phases).forEach(phaseKey => {
        const phase = phases[phaseKey];
        if (phase.tasks.length > 0) {
            const completedTasks = phase.tasks.filter(t => t.status === 'completed').length;
            phase.progress = Math.round((completedTasks / phase.tasks.length) * 100);
        }
    });
    
    return {
        phases,
        overall_progress: calculateOverallProgress(tasks),
        critical_tasks: tasks.filter(t => t.priority === 'critical' && t.status !== 'completed'),
        overdue_tasks: tasks.filter(t => new Date(t.due_date) < new Date() && t.status !== 'completed'),
        upcoming_tasks: tasks.filter(t => {
            const dueDate = new Date(t.due_date);
            const now = new Date();
            const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
            return dueDate >= now && dueDate <= weekFromNow && t.status !== 'completed';
        })
    };
}

function calculateOverallProgress(tasks) {
    if (tasks.length === 0) return 0;
    
    const completedTasks = tasks.filter(t => t.status === 'completed').length;
    return Math.round((completedTasks / tasks.length) * 100);
}

function calculateCriticalPath(tasks) {
    // Simple critical path calculation
    // In a more sophisticated system, this would use proper CPM algorithms
    
    const criticalTasks = tasks.filter(task => {
        return task.priority === 'critical' || 
               task.category === 'measurements' || 
               task.category === 'orders';
    });
    
    const pathLength = criticalTasks.reduce((total, task) => {
        return total + (task.estimated_duration_hours || 8);
    }, 0);
    
    return {
        critical_tasks: criticalTasks,
        estimated_total_hours: pathLength,
        estimated_completion_date: calculateCompletionDate(criticalTasks),
        bottlenecks: identifyBottlenecks(tasks),
        risk_factors: identifyRiskFactors(criticalTasks)
    };
}

function calculateCompletionDate(criticalTasks) {
    const sortedTasks = criticalTasks.sort((a, b) => new Date(a.due_date) - new Date(b.due_date));
    const lastTask = sortedTasks[sortedTasks.length - 1];
    return lastTask ? lastTask.due_date : null;
}

function identifyBottlenecks(tasks) {
    // Identify tasks that are blocking others
    const bottlenecks = [];
    
    tasks.forEach(task => {
        if (task.triggers_tasks && task.triggers_tasks.length > 0 && task.status !== 'completed') {
            const isOverdue = new Date(task.due_date) < new Date();
            if (isOverdue || task.status === 'on_hold') {
                bottlenecks.push({
                    task_id: task.id,
                    task_name: task.task_name,
                    blocking_count: task.triggers_tasks.length,
                    reason: isOverdue ? 'overdue' : task.status
                });
            }
        }
    });
    
    return bottlenecks;
}

function identifyRiskFactors(tasks) {
    const risks = [];
    
    tasks.forEach(task => {
        const daysUntilDue = (new Date(task.due_date) - new Date()) / (1000 * 60 * 60 * 24);
        
        if (daysUntilDue < 0 && task.status !== 'completed') {
            risks.push({
                type: 'overdue',
                task_id: task.id,
                task_name: task.task_name,
                days_overdue: Math.abs(daysUntilDue)
            });
        } else if (daysUntilDue < 3 && task.status === 'pending') {
            risks.push({
                type: 'urgent',
                task_id: task.id,
                task_name: task.task_name,
                days_remaining: daysUntilDue
            });
        }
    });
    
    return risks;
}

function calculateTaskAnalytics(tasks) {
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.status === 'completed').length;
    const inProgressTasks = tasks.filter(t => t.status === 'in_progress').length;
    const overdueTasks = tasks.filter(t => new Date(t.due_date) < new Date() && t.status !== 'completed').length;
    
    const categoryBreakdown = {};
    const priorityBreakdown = {};
    const statusBreakdown = {};
    
    tasks.forEach(task => {
        categoryBreakdown[task.category] = (categoryBreakdown[task.category] || 0) + 1;
        priorityBreakdown[task.priority] = (priorityBreakdown[task.priority] || 0) + 1;
        statusBreakdown[task.status] = (statusBreakdown[task.status] || 0) + 1;
    });
    
    return {
        total_tasks: totalTasks,
        completed_tasks: completedTasks,
        in_progress_tasks: inProgressTasks,
        overdue_tasks: overdueTasks,
        completion_rate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
        category_breakdown: categoryBreakdown,
        priority_breakdown: priorityBreakdown,
        status_breakdown: statusBreakdown,
        average_completion_time: calculateAverageCompletionTime(tasks),
        upcoming_deadlines: getUpcomingDeadlines(tasks)
    };
}

function calculateAverageCompletionTime(tasks) {
    const completedTasks = tasks.filter(t => t.status === 'completed' && t.started_at && t.completed_at);
    
    if (completedTasks.length === 0) return 0;
    
    const totalTime = completedTasks.reduce((sum, task) => {
        const startTime = new Date(task.started_at);
        const endTime = new Date(task.completed_at);
        return sum + (endTime - startTime);
    }, 0);
    
    return Math.round(totalTime / completedTasks.length / (1000 * 60 * 60)); // Hours
}

function getUpcomingDeadlines(tasks) {
    const now = new Date();
    const oneWeekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    
    return tasks
        .filter(task => {
            const dueDate = new Date(task.due_date);
            return dueDate >= now && dueDate <= oneWeekFromNow && task.status !== 'completed';
        })
        .sort((a, b) => new Date(a.due_date) - new Date(b.due_date))
        .slice(0, 5) // Top 5 upcoming deadlines
        .map(task => ({
            task_id: task.id,
            task_name: task.task_name,
            due_date: task.due_date,
            priority: task.priority,
            days_remaining: Math.ceil((new Date(task.due_date) - now) / (1000 * 60 * 60 * 24))
        }));
}

async function sendTaskReminder(task, supabaseUrl, headers) {
    // Send reminder via wedding communications system
    const reminderMessage = {
        wedding_id: task.wedding_id,
        sender_type: 'system',
        recipient_ids: [task.assigned_member.user_id].filter(Boolean),
        message_type: 'reminder',
        subject: `Task Reminder: ${task.task_name}`,
        message: `Hi ${task.assigned_member.first_name}! This is a reminder that your task "${task.task_name}" is due on ${task.due_date}. Please complete it when you have a chance.`,
        sent_via: ['email'],
        sent_at: new Date().toISOString()
    };
    
    await fetch(`${supabaseUrl}/rest/v1/wedding_communications`, {
        method: 'POST',
        headers,
        body: JSON.stringify(reminderMessage)
    });
}