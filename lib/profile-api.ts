// profile-api.ts
// API utilities for Next.js integration

import { supabase } from './supabase' // Your existing Supabase client

export interface UserProfile {
  id?: string
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
  size_profile: any
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

export interface NotificationPreferences {
  sms_orders: boolean
  email_orders: boolean
  sms_marketing: boolean
  email_marketing: boolean
  email_recommendations: boolean
}

export interface MenswearMeasurement {
  id?: string
  user_profile_id?: string
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
  created_at?: string
  updated_at?: string
}

export interface StyleProfile {
  id?: string
  user_profile_id?: string
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
  created_at?: string
  updated_at?: string
}

// API Response types
interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: {
    code: string
    message: string
  }
}

// Profile API functions
export class ProfileAPI {
  /**
   * Get current user's profile
   */
  static async getProfile(): Promise<UserProfile | null> {
    try {
      const { data, error } = await supabase.functions.invoke('profile-management', {
        body: { action: 'get' }
      })
      
      if (error) {
        console.error('Profile API error:', error)
        return null
      }
      
      const response = data as ApiResponse<UserProfile>
      
      if (!response.success) {
        console.error('Profile operation failed:', response.error)
        return null
      }
      
      return response.data || null
    } catch (error) {
      console.error('Profile fetch error:', error)
      return null
    }
  }

  /**
   * Update user profile
   */
  static async updateProfile(profileData: Partial<UserProfile>): Promise<UserProfile | null> {
    try {
      const { data, error } = await supabase.functions.invoke('profile-management', {
        body: { 
          action: 'update',
          profile_data: profileData
        }
      })
      
      if (error) {
        throw new Error(error.message)
      }
      
      const response = data as ApiResponse<UserProfile>
      
      if (!response.success) {
        throw new Error(response.error?.message || 'Profile update failed')
      }
      
      return response.data || null
    } catch (error) {
      console.error('Profile update error:', error)
      throw error
    }
  }

  /**
   * Get user's size measurements
   */
  static async getMeasurements(): Promise<MenswearMeasurement | null> {
    try {
      const { data, error } = await supabase.functions.invoke('profile-management', {
        body: { action: 'get_measurements' }
      })
      
      if (error) {
        console.error('Measurements API error:', error)
        return null
      }
      
      const response = data as ApiResponse<MenswearMeasurement>
      
      if (!response.success) {
        console.error('Measurements operation failed:', response.error)
        return null
      }
      
      return response.data || null
    } catch (error) {
      console.error('Measurements fetch error:', error)
      return null
    }
  }

  /**
   * Save user's size measurements
   */
  static async saveMeasurements(measurements: Partial<MenswearMeasurement>): Promise<MenswearMeasurement | null> {
    try {
      const { data, error } = await supabase.functions.invoke('profile-management', {
        body: { 
          action: 'create_measurements',
          measurements
        }
      })
      
      if (error) {
        throw new Error(error.message)
      }
      
      const response = data as ApiResponse<MenswearMeasurement>
      
      if (!response.success) {
        throw new Error(response.error?.message || 'Measurements save failed')
      }
      
      return response.data || null
    } catch (error) {
      console.error('Measurements save error:', error)
      throw error
    }
  }

  /**
   * Get user's style profile
   */
  static async getStyleProfile(): Promise<StyleProfile | null> {
    try {
      const { data, error } = await supabase.functions.invoke('style-recommendations', {
        body: { action: 'get_style_profile' }
      })
      
      if (error) {
        console.error('Style profile API error:', error)
        return null
      }
      
      const response = data as ApiResponse<StyleProfile>
      
      if (!response.success) {
        console.error('Style profile operation failed:', response.error)
        return null
      }
      
      return response.data || null
    } catch (error) {
      console.error('Style profile fetch error:', error)
      return null
    }
  }

  /**
   * Save user's style profile
   */
  static async saveStyleProfile(styleData: Partial<StyleProfile>): Promise<StyleProfile | null> {
    try {
      const { data, error } = await supabase.functions.invoke('style-recommendations', {
        body: { 
          action: 'create_style_profile',
          style_data: styleData
        }
      })
      
      if (error) {
        throw new Error(error.message)
      }
      
      const response = data as ApiResponse<StyleProfile>
      
      if (!response.success) {
        throw new Error(response.error?.message || 'Style profile save failed')
      }
      
      return response.data || null
    } catch (error) {
      console.error('Style profile save error:', error)
      throw error
    }
  }

  /**
   * Get style recommendations for user
   */
  static async getRecommendations(): Promise<any[] | null> {
    try {
      const { data, error } = await supabase.functions.invoke('style-recommendations', {
        body: { action: 'recommend' }
      })
      
      if (error) {
        console.error('Recommendations API error:', error)
        return null
      }
      
      const response = data as ApiResponse<any[]>
      
      if (!response.success) {
        console.error('Recommendations operation failed:', response.error)
        return null
      }
      
      return response.data || []
    } catch (error) {
      console.error('Recommendations fetch error:', error)
      return null
    }
  }

  /**
   * Check if user is authenticated
   */
  static async isAuthenticated(): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      return !!user
    } catch (error) {
      return false
    }
  }

  /**
   * Get current authenticated user
   */
  static async getCurrentUser() {
    try {
      const { data: { user }, error } = await supabase.auth.getUser()
      if (error) throw error
      return user
    } catch (error) {
      console.error('Get user error:', error)
      return null
    }
  }
}

// Utility functions
export const profileUtils = {
  /**
   * Calculate profile completion percentage
   */
  calculateCompletionPercentage(profile: UserProfile | null): number {
    if (!profile) return 0
    
    const fields = [
      'first_name',
      'last_name', 
      'phone',
      'address_line_1',
      'city',
      'state',
      'postal_code'
    ]
    
    const completedFields = fields.filter(field => 
      profile[field as keyof UserProfile] && 
      String(profile[field as keyof UserProfile]).trim() !== ''
    )
    
    return Math.round((completedFields.length / fields.length) * 100)
  },

  /**
   * Format display name
   */
  getDisplayName(profile: UserProfile | null): string {
    if (!profile) return 'Guest'
    
    if (profile.display_name) return profile.display_name
    if (profile.first_name && profile.last_name) {
      return `${profile.first_name} ${profile.last_name}`
    }
    if (profile.first_name) return profile.first_name
    return profile.email.split('@')[0]
  },

  /**
   * Check if measurements are complete
   */
  areMeasurementsComplete(measurements: MenswearMeasurement | null): boolean {
    if (!measurements) return false
    
    const requiredFields = ['chest', 'waist', 'height', 'weight']
    return requiredFields.every(field => 
      measurements[field as keyof MenswearMeasurement] !== null &&
      measurements[field as keyof MenswearMeasurement] !== undefined
    )
  },

  /**
   * Format measurements for display
   */
  formatMeasurement(value: number | undefined, unit: 'imperial' | 'metric', type: 'length' | 'weight'): string {
    if (!value) return 'Not provided'
    
    if (type === 'length') {
      return unit === 'imperial' ? `${value}"` : `${value} cm`
    } else {
      return unit === 'imperial' ? `${value} lbs` : `${value} kg`
    }
  }
}

export default ProfileAPI