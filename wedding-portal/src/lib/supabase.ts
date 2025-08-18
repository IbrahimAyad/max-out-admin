import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://gvcswimqaxvylgxbklbz.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd2Y3N3aW1xYXh2eWxneGJrbGJ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM3NjA1MzAsImV4cCI6MjA2OTMzNjUzMH0.UZdiGcJXUV5VYetjWXV26inmbj2yXdiT03Z6t_5Lg24'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Wedding Portal API functions
export const weddingPortalAPI = {
  // Wedding Management
  getWeddingByCode: async (weddingCode: string) => {
    const { data, error } = await supabase.functions.invoke('wedding-management', {
      method: 'POST',
      body: { action: 'get_wedding_by_code', filters: { wedding_code: weddingCode } }
    })
    if (error) throw error
    return data
  },

  getWeddingDashboard: async (weddingId: string) => {
    const { data, error } = await supabase.functions.invoke('wedding-management', {
      method: 'POST',
      body: { action: 'get_wedding_dashboard', wedding_id: weddingId }
    })
    if (error) throw error
    return data
  },

  updateWedding: async (weddingId: string, updateData: any) => {
    const { data, error } = await supabase.functions.invoke('wedding-management', {
      method: 'POST',
      body: { action: 'update_wedding', wedding_id: weddingId, update_data: updateData }
    })
    if (error) throw error
    return data
  },

  // Party Member Management
  invitePartyMember: async (memberData: any) => {
    const { data, error } = await supabase.functions.invoke('party-member-management', {
      method: 'POST',
      body: { action: 'invite_party_member', member_data: memberData }
    })
    if (error) throw error
    return data
  },

  getPartyMembers: async (weddingId: string, filters?: any) => {
    const { data, error } = await supabase.functions.invoke('party-member-management', {
      method: 'POST',
      body: { action: 'get_party_member', wedding_id: weddingId, filters }
    })
    if (error) throw error
    return data
  },

  updatePartyMember: async (memberId: string, updateData: any) => {
    const { data, error } = await supabase.functions.invoke('party-member-management', {
      method: 'POST',
      body: { action: 'update_party_member', member_id: memberId, update_data: updateData }
    })
    if (error) throw error
    return data
  },

  // Advanced Timeline Management
  getTasks: async (weddingId: string, filters?: any) => {
    const { data, error } = await supabase.functions.invoke('wedding-timeline-management', {
      method: 'POST',
      body: { action: 'get_tasks', wedding_id: weddingId, filters }
    })
    if (error) throw error
    return data
  },

  updateTask: async (taskId: string, taskData: any) => {
    const { data, error } = await supabase.functions.invoke('wedding-timeline-management', {
      method: 'POST',
      body: { action: 'update_task', task_id: taskId, task_data: taskData }
    })
    if (error) throw error
    return data
  },

  completeTask: async (taskId: string, completionData?: any) => {
    const { data, error } = await supabase.functions.invoke('wedding-timeline-management', {
      method: 'POST',
      body: { action: 'complete_task', task_id: taskId, task_data: { completion_data: completionData } }
    })
    if (error) throw error
    return data
  },

  // NEW: Automated Timeline Management
  generateTimeline: async (weddingId: string, customTimeline?: any) => {
    const { data, error } = await supabase.functions.invoke('automated-timeline-management', {
      method: 'POST',
      body: { action: 'generate', weddingId, customTimeline }
    })
    if (error) throw error
    return data
  },

  updateTimelineProgress: async (weddingId: string, partyMemberId?: string) => {
    const { data, error } = await supabase.functions.invoke('automated-timeline-management', {
      method: 'POST',
      body: { action: 'update', weddingId, partyMemberId }
    })
    if (error) throw error
    return data
  },

  checkUpcomingDeadlines: async (weddingId: string) => {
    const { data, error } = await supabase.functions.invoke('automated-timeline-management', {
      method: 'POST',
      body: { action: 'check_deadlines', weddingId }
    })
    if (error) throw error
    return data
  },

  scheduleReminders: async (weddingId: string) => {
    const { data, error } = await supabase.functions.invoke('automated-timeline-management', {
      method: 'POST',
      body: { action: 'schedule_reminders', weddingId }
    })
    if (error) throw error
    return data
  },

  // Communication & Email Automation
  sendMessage: async (weddingId: string, messageData: any) => {
    const { data, error } = await supabase.functions.invoke('wedding-communications', {
      method: 'POST',
      body: { action: 'send_message', wedding_id: weddingId, message_data: messageData }
    })
    if (error) throw error
    return data
  },

  getMessages: async (weddingId: string, filters?: any) => {
    const { data, error } = await supabase.functions.invoke('wedding-communications', {
      method: 'POST',
      body: { action: 'get_messages', wedding_id: weddingId, filters }
    })
    if (error) throw error
    return data
  },

  // NEW: SendGrid Email Automation
  sendAutomatedEmail: async (weddingId: string, emailType: string, partyMemberIds?: string[], customData?: any, scheduleDate?: string) => {
    const { data, error } = await supabase.functions.invoke('sendgrid-wedding-automation', {
      method: 'POST',
      body: { emailType, weddingId, partyMemberIds, customData, scheduleDate }
    })
    if (error) throw error
    return data
  },

  // Outfit Coordination & AI Styling
  getOutfitSelections: async (memberId: string, filters?: any) => {
    const { data, error } = await supabase.functions.invoke('wedding-outfit-coordination', {
      method: 'POST',
      body: { action: 'get_outfit_selections', member_id: memberId, filters }
    })
    if (error) throw error
    return data
  },

  approveOutfit: async (outfitId: string, approvalData: any) => {
    const { data, error } = await supabase.functions.invoke('wedding-outfit-coordination', {
      method: 'POST',
      body: { 
        action: 'approve_outfit', 
        outfit_id: outfitId, 
        outfit_data: { 
          approval_data: approvalData,
          approver_type: 'couple'
        }
      }
    })
    if (error) throw error
    return data
  },

  // NEW: AI-Powered Outfit Coordination
  analyzeOutfitCoordination: async (weddingId: string, preferences?: any, budgetConstraints?: any) => {
    const { data, error } = await supabase.functions.invoke('ai-outfit-coordination', {
      method: 'POST',
      body: { action: 'analyze', weddingId, preferences, budgetConstraints }
    })
    if (error) throw error
    return data
  },

  getOutfitRecommendations: async (weddingId: string, preferences?: any, budgetConstraints?: any) => {
    const { data, error } = await supabase.functions.invoke('ai-outfit-coordination', {
      method: 'POST',
      body: { action: 'recommend', weddingId, preferences, budgetConstraints }
    })
    if (error) throw error
    return data
  },

  validateOutfitCoordination: async (weddingId: string, preferences?: any) => {
    const { data, error } = await supabase.functions.invoke('ai-outfit-coordination', {
      method: 'POST',
      body: { action: 'validate', weddingId, preferences }
    })
    if (error) throw error
    return data
  },

  optimizeForBudget: async (weddingId: string, budgetConstraints: any) => {
    const { data, error } = await supabase.functions.invoke('ai-outfit-coordination', {
      method: 'POST',
      body: { action: 'optimize', weddingId, budgetConstraints }
    })
    if (error) throw error
    return data
  },

  // NEW: Smart Measurement System
  validateMeasurements: async (partyMemberId: string, measurements: any, preferences?: any) => {
    const { data, error } = await supabase.functions.invoke('smart-measurement-system', {
      method: 'POST',
      body: { action: 'validate', partyMemberId, measurements, preferences }
    })
    if (error) throw error
    return data
  },

  getSizeRecommendations: async (partyMemberId: string, measurements: any) => {
    const { data, error } = await supabase.functions.invoke('smart-measurement-system', {
      method: 'POST',
      body: { action: 'recommend', partyMemberId, measurements }
    })
    if (error) throw error
    return data
  },

  analyzePhotoMeasurements: async (partyMemberId: string, photoData: any) => {
    const { data, error } = await supabase.functions.invoke('smart-measurement-system', {
      method: 'POST',
      body: { action: 'analyze_photo', partyMemberId, photoData }
    })
    if (error) throw error
    return data
  },

  getMeasurementTips: async (partyMemberId: string, preferences?: any) => {
    const { data, error } = await supabase.functions.invoke('smart-measurement-system', {
      method: 'POST',
      body: { action: 'generate_tips', partyMemberId, preferences }
    })
    if (error) throw error
    return data
  },

  // NEW: Wedding-Specific Payment Processing
  createWeddingPayment: async (weddingId: string, paymentType: string, partyMemberIds: string[], customerEmail: string) => {
    const { data, error } = await supabase.functions.invoke('stripe-wedding-payment', {
      method: 'POST',
      body: { weddingId, paymentType, partyMemberIds, customerEmail }
    })
    if (error) throw error
    return data
  },

  // NEW: Coordinated Shipping
  createWeddingShipment: async (weddingOrderId: string, deliveryMode?: string, targetDeliveryDate?: string) => {
    const { data, error } = await supabase.functions.invoke('easypost-wedding-shipping', {
      method: 'POST',
      body: { weddingOrderId, deliveryMode, targetDeliveryDate }
    })
    if (error) throw error
    return data
  },

  // Analytics & Insights
  getWeddingAnalytics: async (weddingId: string, analysisType?: string) => {
    const { data, error } = await supabase
      .from('wedding_analytics')
      .select('*')
      .eq('wedding_id', weddingId)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return { data }
  },

  getAdvancedAnalytics: async (weddingId: string, analysisType?: string) => {
    const { data, error } = await supabase
      .from('wedding_analytics_enhanced')
      .select('*')
      .eq('wedding_id', weddingId)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return { data }
  }
}

// Authentication helpers
export const auth = {
  signIn: async (email: string, password: string) => {
    return await supabase.auth.signInWithPassword({ email, password })
  },

  signUp: async (email: string, password: string, metadata?: any) => {
    return await supabase.auth.signUp({ 
      email, 
      password,
      options: {
        data: metadata
      }
    })
  },

  signOut: async () => {
    return await supabase.auth.signOut()
  },

  getCurrentUser: () => {
    return supabase.auth.getUser()
  },

  onAuthStateChange: (callback: (event: string, session: any) => void) => {
    return supabase.auth.onAuthStateChange(callback)
  }
}
