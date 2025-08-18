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
    const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2.39.3');
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const requestData = await req.json();
    const { 
      action, // 'generate', 'update', 'check_deadlines', 'schedule_reminders'
      weddingId,
      partyMemberId = null,
      customTimeline = null,
      forceUpdate = false
    } = requestData;
    
    // Validate required fields
    if (!action || !weddingId) {
      throw new Error('Missing required fields: action, weddingId');
    }
    
    let result;
    
    switch (action) {
      case 'generate':
        result = await generateWeddingTimeline(weddingId, supabase, customTimeline);
        break;
        
      case 'update':
        result = await updateTimelineProgress(weddingId, partyMemberId, supabase);
        break;
        
      case 'check_deadlines':
        result = await checkUpcomingDeadlines(weddingId, supabase);
        break;
        
      case 'schedule_reminders':
        result = await scheduleAutomatedReminders(weddingId, supabase);
        break;
        
      default:
        throw new Error(`Unknown action: ${action}`);
    }
    
    return new Response(
      JSON.stringify({
        data: {
          action,
          weddingId,
          ...result
        }
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
    
  } catch (error) {
    console.error('Timeline management error:', error);
    
    const errorResponse = {
      error: {
        code: 'TIMELINE_MANAGEMENT_ERROR',
        message: error.message
      }
    };
    
    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

// Generate comprehensive wedding timeline
async function generateWeddingTimeline(weddingId, supabase, customTimeline) {
  // Get wedding details
  const { data: wedding, error: weddingError } = await supabase
    .from('weddings')
    .select(`
      *,
      wedding_party_members(
        *,
        user_profiles(full_name, email)
      )
    `)
    .eq('id', weddingId)
    .single();
    
  if (weddingError || !wedding) {
    throw new Error('Wedding not found');
  }
  
  const weddingDate = new Date(wedding.wedding_date);
  const today = new Date();
  const daysUntilWedding = Math.ceil((weddingDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  
  // Define timeline templates based on wedding complexity
  const complexityLevel = determineWeddingComplexity(wedding);
  const timelineTemplate = getTimelineTemplate(complexityLevel, daysUntilWedding);
  
  // Merge with custom timeline if provided
  const finalTimeline = customTimeline ? mergeTimelines(timelineTemplate, customTimeline) : timelineTemplate;
  
  // Generate tasks for each party member
  const timelineTasks = [];
  
  for (const task of finalTimeline.tasks) {
    if (task.appliesToAll) {
      // Create task for each party member
      for (const member of wedding.wedding_party_members) {
        const taskData = createTaskForMember(task, member, wedding, daysUntilWedding);
        timelineTasks.push(taskData);
      }
    } else if (task.roles && task.roles.length > 0) {
      // Create task for specific roles
      const relevantMembers = wedding.wedding_party_members.filter(member => 
        task.roles.includes(member.role)
      );
      
      for (const member of relevantMembers) {
        const taskData = createTaskForMember(task, member, wedding, daysUntilWedding);
        timelineTasks.push(taskData);
      }
    } else {
      // Wedding-level task (not member-specific)
      const taskData = {
        wedding_id: weddingId,
        party_member_id: null,
        task_type: task.type,
        task_title: task.title,
        task_description: task.description,
        priority: task.priority,
        due_date: calculateDueDate(weddingDate, task.daysBeforeWedding),
        estimated_duration: task.estimatedDuration,
        category: task.category,
        dependencies: task.dependencies || [],
        reminder_settings: task.reminders || getDefaultReminders(task.priority),
        status: 'pending',
        auto_reminder_enabled: true,
      };
      timelineTasks.push(taskData);
    }
  }
  
  // Clear existing timeline tasks if force update
  const { error: deleteError } = await supabase
    .from('wedding_timeline_tasks')
    .delete()
    .eq('wedding_id', weddingId);
    
  if (deleteError) {
    console.error('Failed to clear existing timeline:', deleteError);
  }
  
  // Insert new timeline tasks
  const { data: insertedTasks, error: insertError } = await supabase
    .from('wedding_timeline_tasks')
    .insert(timelineTasks)
    .select();
    
  if (insertError) {
    throw new Error('Failed to create timeline tasks: ' + insertError.message);
  }
  
  // Store timeline analytics
  const { error: analyticsError } = await supabase
    .from('wedding_analytics')
    .insert({
      wedding_id: weddingId,
      analysis_type: 'timeline_generation',
      analysis_data: {
        complexity_level: complexityLevel,
        days_until_wedding: daysUntilWedding,
        total_tasks: timelineTasks.length,
        party_size: wedding.wedding_party_members.length,
        timeline_template: finalTimeline.name,
      },
      insights: [
        `Generated ${timelineTasks.length} timeline tasks`,
        `Wedding complexity: ${complexityLevel}`,
        `${daysUntilWedding} days until wedding`,
      ],
    });
    
  if (analyticsError) {
    console.error('Failed to store timeline analytics:', analyticsError);
  }
  
  return {
    timeline: {
      template: finalTimeline.name,
      complexityLevel,
      daysUntilWedding,
      totalTasks: timelineTasks.length,
      tasks: insertedTasks,
    },
    summary: generateTimelineSummary(insertedTasks, wedding),
  };
}

// Update timeline progress for party members
async function updateTimelineProgress(weddingId, partyMemberId, supabase) {
  // Get current tasks
  let tasksQuery = supabase
    .from('wedding_timeline_tasks')
    .select('*')
    .eq('wedding_id', weddingId);
    
  if (partyMemberId) {
    tasksQuery = tasksQuery.eq('party_member_id', partyMemberId);
  }
  
  const { data: tasks, error: tasksError } = await tasksQuery;
  
  if (tasksError) {
    throw new Error('Failed to fetch timeline tasks');
  }
  
  const progress = {
    totalTasks: tasks.length,
    completedTasks: tasks.filter(t => t.status === 'completed').length,
    pendingTasks: tasks.filter(t => t.status === 'pending').length,
    overdueTasks: tasks.filter(t => t.status === 'pending' && new Date(t.due_date) < new Date()).length,
    upcomingTasks: tasks.filter(t => {
      const dueDate = new Date(t.due_date);
      const inThreeDays = new Date();
      inThreeDays.setDate(inThreeDays.getDate() + 3);
      return t.status === 'pending' && dueDate <= inThreeDays;
    }).length,
  };
  
  progress.completionPercentage = progress.totalTasks > 0 
    ? Math.round((progress.completedTasks / progress.totalTasks) * 100)
    : 0;
    
  // Identify critical path tasks
  const criticalTasks = tasks.filter(t => t.priority === 'high' && t.status === 'pending');
  const blockedTasks = tasks.filter(t => 
    t.dependencies && 
    t.dependencies.some(dep => 
      tasks.find(task => task.task_type === dep && task.status !== 'completed')
    )
  );
  
  // Update wedding progress
  const { error: updateError } = await supabase
    .from('weddings')
    .update({
      completion_percentage: progress.completionPercentage,
      updated_at: new Date().toISOString(),
    })
    .eq('id', weddingId);
    
  if (updateError) {
    console.error('Failed to update wedding progress:', updateError);
  }
  
  return {
    progress,
    criticalTasks: criticalTasks.map(t => ({ id: t.id, title: t.task_title, dueDate: t.due_date })),
    blockedTasks: blockedTasks.map(t => ({ id: t.id, title: t.task_title, dependencies: t.dependencies })),
    recommendations: generateProgressRecommendations(progress, criticalTasks, blockedTasks),
  };
}

// Check upcoming deadlines and priorities
async function checkUpcomingDeadlines(weddingId, supabase) {
  const today = new Date();
  const inOneWeek = new Date();
  inOneWeek.setDate(today.getDate() + 7);
  
  // Get upcoming tasks
  const { data: upcomingTasks, error: tasksError } = await supabase
    .from('wedding_timeline_tasks')
    .select(`
      *,
      wedding_party_members(
        role,
        user_profiles(full_name, email)
      )
    `)
    .eq('wedding_id', weddingId)
    .eq('status', 'pending')
    .lte('due_date', inOneWeek.toISOString())
    .order('due_date', { ascending: true });
    
  if (tasksError) {
    throw new Error('Failed to fetch upcoming tasks');
  }
  
  // Categorize by urgency
  const now = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(now.getDate() + 1);
  const thisWeek = new Date();
  thisWeek.setDate(now.getDate() + 7);
  
  const deadlines = {
    overdue: upcomingTasks.filter(t => new Date(t.due_date) < now),
    today: upcomingTasks.filter(t => {
      const due = new Date(t.due_date);
      return due >= now && due < tomorrow;
    }),
    thisWeek: upcomingTasks.filter(t => {
      const due = new Date(t.due_date);
      return due >= tomorrow && due <= thisWeek;
    }),
  };
  
  // Identify escalation needs
  const escalations = {
    criticalOverdue: deadlines.overdue.filter(t => t.priority === 'high'),
    missingDependencies: upcomingTasks.filter(t => 
      t.dependencies && t.dependencies.length > 0
    ),
    resourceConstraints: upcomingTasks.filter(t => 
      t.requires_coordination && !t.coordinator_assigned
    ),
  };
  
  return {
    deadlines,
    escalations,
    summary: {
      totalUpcoming: upcomingTasks.length,
      overdue: deadlines.overdue.length,
      critical: deadlines.overdue.filter(t => t.priority === 'high').length,
      needsAttention: escalations.criticalOverdue.length + escalations.missingDependencies.length,
    },
    recommendations: generateDeadlineRecommendations(deadlines, escalations),
  };
}

// Schedule automated reminders
async function scheduleAutomatedReminders(weddingId, supabase) {
  // Get tasks that need reminders
  const { data: tasks, error: tasksError } = await supabase
    .from('wedding_timeline_tasks')
    .select(`
      *,
      wedding_party_members(
        user_profiles(full_name, email)
      )
    `)
    .eq('wedding_id', weddingId)
    .eq('status', 'pending')
    .eq('auto_reminder_enabled', true)
    .is('reminder_sent_at', null);
    
  if (tasksError) {
    throw new Error('Failed to fetch tasks for reminders');
  }
  
  const scheduledReminders = [];
  const now = new Date();
  
  for (const task of tasks) {
    const dueDate = new Date(task.due_date);
    const reminderSettings = task.reminder_settings || getDefaultReminders(task.priority);
    
    for (const reminderDay of reminderSettings.daysBefore) {
      const reminderDate = new Date(dueDate);
      reminderDate.setDate(dueDate.getDate() - reminderDay);
      
      // Only schedule future reminders
      if (reminderDate > now) {
        const reminderData = {
          taskId: task.id,
          partyMemberId: task.party_member_id,
          reminderDate: reminderDate.toISOString(),
          reminderType: getReminderType(reminderDay, task.priority),
          emailType: getEmailTypeForTask(task.task_type),
          message: generateReminderMessage(task, reminderDay),
        };
        
        scheduledReminders.push(reminderData);
      }
    }
  }
  
  // Store reminder schedule
  const { error: reminderError } = await supabase
    .from('wedding_reminder_schedule')
    .insert(scheduledReminders.map(r => ({
      wedding_id: weddingId,
      task_id: r.taskId,
      party_member_id: r.partyMemberId,
      reminder_date: r.reminderDate,
      reminder_type: r.reminderType,
      email_type: r.emailType,
      message: r.message,
      status: 'scheduled',
    })));
    
  if (reminderError) {
    console.error('Failed to schedule reminders:', reminderError);
  }
  
  return {
    scheduledCount: scheduledReminders.length,
    reminderTypes: {
      immediate: scheduledReminders.filter(r => r.reminderType === 'immediate').length,
      gentle: scheduledReminders.filter(r => r.reminderType === 'gentle').length,
      urgent: scheduledReminders.filter(r => r.reminderType === 'urgent').length,
    },
    nextReminder: scheduledReminders.sort((a, b) => 
      new Date(a.reminderDate).getTime() - new Date(b.reminderDate).getTime()
    )[0],
  };
}

// Helper functions
function determineWeddingComplexity(wedding) {
  const partySize = wedding.wedding_party_members?.length || 0;
  const hasCustomizations = wedding.style !== 'classic';
  const isRushOrder = (() => {
    const weddingDate = new Date(wedding.wedding_date);
    const daysUntil = Math.ceil((weddingDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    return daysUntil < 60;
  })();
  
  if (partySize >= 8 || hasCustomizations || isRushOrder) {
    return 'complex';
  } else if (partySize >= 4) {
    return 'moderate';
  } else {
    return 'simple';
  }
}

function getTimelineTemplate(complexity, daysUntilWedding) {
  const templates = {
    simple: {
      name: 'Simple Wedding Timeline',
      tasks: [
        {
          type: 'invitation_acceptance',
          title: 'Accept Wedding Party Invitation',
          description: 'Accept your invitation to join the wedding party',
          daysBeforeWedding: Math.min(daysUntilWedding - 1, 90),
          priority: 'high',
          category: 'onboarding',
          appliesToAll: true,
          estimatedDuration: 10,
        },
        {
          type: 'measurement_submission',
          title: 'Submit Measurements',
          description: 'Provide accurate measurements for outfit sizing',
          daysBeforeWedding: Math.min(daysUntilWedding - 5, 60),
          priority: 'high',
          category: 'measurements',
          appliesToAll: true,
          estimatedDuration: 30,
        },
        {
          type: 'outfit_approval',
          title: 'Review and Approve Outfit',
          description: 'Review your assigned outfit and provide approval',
          daysBeforeWedding: Math.min(daysUntilWedding - 10, 45),
          priority: 'medium',
          category: 'styling',
          appliesToAll: true,
          estimatedDuration: 15,
        },
        {
          type: 'final_fitting',
          title: 'Attend Final Fitting',
          description: 'Final fitting appointment for any adjustments',
          daysBeforeWedding: 14,
          priority: 'medium',
          category: 'fitting',
          appliesToAll: true,
          estimatedDuration: 60,
        },
      ],
    },
    moderate: {
      name: 'Moderate Wedding Timeline',
      tasks: [
        // All simple tasks plus additional coordination
        {
          type: 'style_coordination',
          title: 'Style Coordination Meeting',
          description: 'Coordinate styles and colors with the wedding party',
          daysBeforeWedding: Math.min(daysUntilWedding - 3, 75),
          priority: 'medium',
          category: 'coordination',
          roles: ['groom', 'best_man'],
          estimatedDuration: 45,
        },
        {
          type: 'accessory_selection',
          title: 'Select Accessories',
          description: 'Choose complementary accessories for your outfit',
          daysBeforeWedding: 30,
          priority: 'low',
          category: 'styling',
          appliesToAll: true,
          estimatedDuration: 20,
        },
      ],
    },
    complex: {
      name: 'Complex Wedding Timeline',
      tasks: [
        // All previous tasks plus detailed coordination
        {
          type: 'custom_styling',
          title: 'Custom Styling Consultation',
          description: 'Detailed styling consultation for complex requirements',
          daysBeforeWedding: Math.min(daysUntilWedding - 5, 90),
          priority: 'high',
          category: 'consultation',
          roles: ['groom'],
          estimatedDuration: 90,
        },
        {
          type: 'group_coordination',
          title: 'Group Coordination Check',
          description: 'Verify coordination across all party members',
          daysBeforeWedding: 21,
          priority: 'medium',
          category: 'coordination',
          appliesToAll: false,
          estimatedDuration: 30,
        },
      ],
    },
  };
  
  // Merge templates for complex weddings
  if (complexity === 'moderate') {
    templates.moderate.tasks = [...templates.simple.tasks, ...templates.moderate.tasks];
  } else if (complexity === 'complex') {
    templates.complex.tasks = [...templates.simple.tasks, ...templates.moderate.tasks, ...templates.complex.tasks];
  }
  
  return templates[complexity];
}

function createTaskForMember(task, member, wedding, daysUntilWedding) {
  return {
    wedding_id: wedding.id,
    party_member_id: member.id,
    task_type: task.type,
    task_title: task.title,
    task_description: task.description,
    priority: task.priority,
    due_date: calculateDueDate(new Date(wedding.wedding_date), task.daysBeforeWedding),
    estimated_duration: task.estimatedDuration,
    category: task.category,
    dependencies: task.dependencies || [],
    reminder_settings: task.reminders || getDefaultReminders(task.priority),
    status: 'pending',
    auto_reminder_enabled: true,
  };
}

function calculateDueDate(weddingDate, daysBeforeWedding) {
  const dueDate = new Date(weddingDate);
  dueDate.setDate(dueDate.getDate() - daysBeforeWedding);
  return dueDate.toISOString();
}

function getDefaultReminders(priority) {
  const reminderSettings = {
    high: { daysBefore: [7, 3, 1], frequency: 'daily' },
    medium: { daysBefore: [7, 2], frequency: 'every_other_day' },
    low: { daysBefore: [5], frequency: 'weekly' },
  };
  
  return reminderSettings[priority] || reminderSettings.medium;
}

function generateTimelineSummary(tasks, wedding) {
  const categorySummary = tasks.reduce((acc, task) => {
    acc[task.category] = (acc[task.category] || 0) + 1;
    return acc;
  }, {});
  
  const prioritySummary = tasks.reduce((acc, task) => {
    acc[task.priority] = (acc[task.priority] || 0) + 1;
    return acc;
  }, {});
  
  return {
    totalTasks: tasks.length,
    partySize: wedding.wedding_party_members.length,
    categorySummary,
    prioritySummary,
    estimatedTotalTime: tasks.reduce((sum, task) => sum + (task.estimated_duration || 0), 0),
  };
}

function generateProgressRecommendations(progress, criticalTasks, blockedTasks) {
  const recommendations = [];
  
  if (progress.overdueTasks > 0) {
    recommendations.push(`${progress.overdueTasks} overdue tasks need immediate attention`);
  }
  
  if (criticalTasks.length > 0) {
    recommendations.push(`${criticalTasks.length} high-priority tasks require focus`);
  }
  
  if (blockedTasks.length > 0) {
    recommendations.push(`${blockedTasks.length} tasks are blocked by dependencies`);
  }
  
  if (progress.completionPercentage < 50) {
    recommendations.push('Consider accelerating timeline to ensure timely completion');
  }
  
  return recommendations;
}

function generateDeadlineRecommendations(deadlines, escalations) {
  const recommendations = [];
  
  if (escalations.criticalOverdue.length > 0) {
    recommendations.push('Immediate escalation needed for critical overdue tasks');
  }
  
  if (deadlines.today.length > 0) {
    recommendations.push(`${deadlines.today.length} tasks due today - prioritize completion`);
  }
  
  if (escalations.missingDependencies.length > 0) {
    recommendations.push('Resolve dependency blockers to unblock downstream tasks');
  }
  
  return recommendations;
}

function getReminderType(daysBefore, priority) {
  if (daysBefore <= 1 || priority === 'high') return 'urgent';
  if (daysBefore <= 3) return 'important';
  return 'gentle';
}

function getEmailTypeForTask(taskType) {
  const emailTypeMap = {
    'measurement_submission': 'measurement_reminder',
    'outfit_approval': 'outfit_approval',
    'final_fitting': 'fitting_reminder',
    'invitation_acceptance': 'invitation_reminder',
  };
  
  return emailTypeMap[taskType] || 'general_reminder';
}

function generateReminderMessage(task, daysBefore) {
  if (daysBefore === 0) {
    return `${task.task_title} is due today! Please complete this task as soon as possible.`;
  } else if (daysBefore === 1) {
    return `Reminder: ${task.task_title} is due tomorrow. Don't forget to complete this important task.`;
  } else {
    return `Upcoming: ${task.task_title} is due in ${daysBefore} days. Plan ahead to complete this on time.`;
  }
}

function mergeTimelines(baseTimeline, customTimeline) {
  // Simple merge - in a real implementation, this would be more sophisticated
  return {
    ...baseTimeline,
    name: customTimeline.name || baseTimeline.name,
    tasks: [...baseTimeline.tasks, ...(customTimeline.tasks || [])],
  };
}