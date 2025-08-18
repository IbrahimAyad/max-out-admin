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

  // Timeline Management  
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

  // Communication
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

  // Outfit Coordination
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
