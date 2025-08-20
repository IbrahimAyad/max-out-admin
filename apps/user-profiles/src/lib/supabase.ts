import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://gvcswimqaxvylgxbklbz.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd2Y3N3aW1xYXh2eWxneGJrbGJ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM3NjA1MzAsImV4cCI6MjA2OTMzNjUzMH0.UZdiGcJXUV5VYetjWXV26inmbj2yXdiT03Z6t_5Lg24'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Types for our enhanced user profile system
export interface UserProfile {
  id: string
  user_id?: string
  email: string
  display_name?: string
  first_name?: string
  last_name?: string
  phone?: string
  date_of_birth?: string
  gender?: string
  address_line_1?: string
  address_line_2?: string
  city?: string
  state?: string
  postal_code?: string
  country?: string
  total_orders: number
  total_spent: number
  average_order_value: number
  lifetime_value: number
  preferred_categories?: string[]
  customer_segment: string
  account_status: string
  acquisition_source?: string
  notes?: string
  last_order_date?: string
  customer_tier: string
  engagement_score: number
  repeat_customer: boolean
  vip_status: boolean
  primary_occasion?: string
  first_purchase_date?: string
  last_purchase_date?: string
  days_since_last_purchase?: number
  tags?: string
  shipping_address?: any
  migrated_from_customers_id?: string
  full_name?: string
  size_profile: SizeProfile
  notification_preferences: NotificationPreferences
  saved_addresses: any[]
  saved_payment_methods: any[]
  wishlist_items: any[]
  style_preferences: any
  measurements: any
  onboarding_completed: boolean
  email_verified: boolean
  is_wedding_customer: boolean
  wedding_preferences?: any
  measurement_history?: any
  wedding_role?: string
  created_at: string
  updated_at: string
}

export interface SizeProfile {
  suit_size?: string
  chest?: number
  waist?: number
  inseam?: number
  sleeve?: number
  neck?: number
  shoulder_width?: number
  jacket_length?: number
  trouser_rise?: number
  height?: number
  weight?: number
  shoe_size?: number
  preferred_fit: 'slim' | 'regular' | 'relaxed'
  measurement_unit: 'imperial' | 'metric'
  notes?: string
  last_measured?: string
  measured_by: 'self' | 'professional'
  measurement_history?: any[]
}

export interface NotificationPreferences {
  sms_orders: boolean
  email_orders: boolean
  sms_marketing: boolean
  email_marketing: boolean
  email_recommendations: boolean
}

export interface StyleProfile {
  id: string
  user_profile_id: string
  customer_id?: string
  body_type?: string
  style_personality?: string
  color_preferences: string[]
  fit_preferences: any
  size_preferences: any
  ai_insights: any
  lifestyle_preferences: any
  occasion_preferences: any
  budget_preferences: any
  brand_preferences: string[]
  fabric_preferences: string[]
  pattern_preferences: string[]
  style_goals: string[]
  inspiration_sources: string[]
  seasonal_preferences: any
  recommendation_history: any[]
  last_style_update: string
  created_at: string
  updated_at: string
}

export interface MenswearMeasurement {
  id: string
  user_profile_id: string
  suit_size?: string
  chest?: number
  waist?: number
  inseam?: number
  sleeve?: number
  neck?: number
  shoulder_width?: number
  jacket_length?: number
  trouser_rise?: number
  height?: number
  weight?: number
  shoe_size?: number
  hips?: number
  thigh?: number
  bicep?: number
  forearm?: number
  wrist?: number
  preferred_fit: 'slim' | 'regular' | 'relaxed'
  measurement_unit: 'imperial' | 'metric'
  notes?: string
  last_measured?: string
  measured_by: 'self' | 'professional'
  measurement_accuracy: 'estimated' | 'professional' | 'tailored'
  is_active: boolean
  created_at: string
  updated_at: string
}

// API Functions
export const profileApi = {
  async getProfile() {
    // Get current session to ensure we have a valid token
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError || !session) {
      throw new Error('Authentication required')
    }

    const { data, error } = await supabase.functions.invoke('profile-management', {
      body: { action: 'get' },
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`
      }
    })
    
    if (error) throw error
    return data.data
  },

  async updateProfile(profileData: Partial<UserProfile>) {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError || !session) {
      throw new Error('Authentication required')
    }

    const { data, error } = await supabase.functions.invoke('profile-management', {
      body: { profile_data: profileData, action: 'update' },
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`
      }
    })
    
    if (error) throw error
    return data.data
  },

  async getMeasurements() {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError || !session) {
      throw new Error('Authentication required')
    }

    const { data, error } = await supabase.functions.invoke('profile-management', {
      body: { action: 'get_measurements' },
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`
      }
    })
    
    if (error) throw error
    return data.data
  },

  async saveMeasurements(measurements: Partial<MenswearMeasurement>) {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError || !session) {
      throw new Error('Authentication required')
    }

    const { data, error } = await supabase.functions.invoke('profile-management', {
      body: { measurements, action: 'create_measurements' },
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`
      }
    })
    
    if (error) throw error
    return data.data
  }
}

export const styleApi = {
  async getStyleProfile() {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError || !session) {
      throw new Error('Authentication required')
    }

    const { data, error } = await supabase.functions.invoke('style-recommendations', {
      body: { action: 'get_style_profile' },
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`
      }
    })
    
    if (error) throw error
    return data.data
  },

  async saveStyleProfile(styleData: Partial<StyleProfile>) {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError || !session) {
      throw new Error('Authentication required')
    }

    const { data, error } = await supabase.functions.invoke('style-recommendations', {
      body: { style_data: styleData, action: 'create_style_profile' },
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`
      }
    })
    
    if (error) throw error
    return data.data
  },

  async getRecommendations() {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError || !session) {
      throw new Error('Authentication required')
    }

    const { data, error } = await supabase.functions.invoke('style-recommendations', {
      body: { action: 'recommend' },
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`
      }
    })
    
    if (error) throw error
    return data.data
  }
}

// Email Notifications API
export const emailApi = {
  async sendNotification(emailType: string, recipientEmail: string, data?: any) {
    const { data: response, error } = await supabase.functions.invoke('email-notifications', {
      body: {
        email_type: emailType,
        recipient_email: recipientEmail,
        data: data || {}
      },
      headers: {
        'Content-Type': 'application/json'
      }
    })
    
    if (error) throw error
    return response
  },

  async sendProfileCompletionReminder(userProfile: UserProfile, completionPercentage: number) {
    return this.sendNotification('profile_completion_reminder', userProfile.email, {
      first_name: userProfile.first_name,
      completion_percentage: completionPercentage,
      profile_url: 'https://r7l04rp7iyef.space.minimax.io'
    })
  },

  async sendStyleRecommendationsUpdate(userProfile: UserProfile, recommendations: any[]) {
    return this.sendNotification('style_recommendations_update', userProfile.email, {
      first_name: userProfile.first_name,
      style_personality: userProfile.style_preferences?.style_personality,
      recommendations: recommendations,
      recommendations_url: 'https://r7l04rp7iyef.space.minimax.io'
    })
  },

  async sendMeasurementReminder(userProfile: UserProfile) {
    return this.sendNotification('measurement_reminder', userProfile.email, {
      first_name: userProfile.first_name,
      measurements_url: 'https://r7l04rp7iyef.space.minimax.io'
    })
  },

  async sendWelcomeEmail(userProfile: UserProfile) {
    return this.sendNotification('welcome', userProfile.email, {
      first_name: userProfile.first_name,
      profile_url: 'https://r7l04rp7iyef.space.minimax.io'
    })
  }
}