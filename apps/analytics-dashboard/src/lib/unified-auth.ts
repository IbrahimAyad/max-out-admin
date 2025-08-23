// Unified Authentication API for Wedding Portal System
// Provides seamless authentication bridging between all portals

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://gvcswimqaxvylgxbklbz.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd2Y3N3aW1xYXh2eWxneGJrbGJ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM3NjA1MzAsImV4cCI6MjA2OTMzNjUzMH0.UZdiGcJXUV5VYetjWXV26inmbj2yXdiT03Z6t_5Lg24'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

export interface UnifiedAuthResponse {
  success: boolean
  data?: {
    user: any
    session: any
    profile: any
    wedding?: any
    invitation?: any
    wedding_code?: string
    invite_code?: string
    access_levels?: any
    is_new_user?: boolean
  }
  error?: {
    code: string
    message: string
  }
}

export interface SessionInfo {
  user_id: string
  profile: any
  access_levels: {
    enhanced_profile: boolean
    couples_portal: boolean
    groomsmen_portal: boolean
    admin_portal: boolean
  }
  couple_wedding: any
  party_member_data: any
  portal_context: {
    current_portal: string
    available_portals: string[]
    primary_role: string
  }
}

/**
 * Unified Authentication API
 * Bridges different authentication methods across all wedding portals
 */
export const unifiedAuthAPI = {
  
  /**
   * Wedding Code Authentication (Couples Portal)
   * Validates wedding code and authenticates/creates user account
   */
  async authenticateWithWeddingCode(weddingCode: string, email: string, password: string, userData?: any): Promise<UnifiedAuthResponse> {
    try {
      const { data, error } = await supabase.functions.invoke('wedding-code-auth', {
        body: {
          action: 'authenticate_with_wedding_code',
          wedding_code: weddingCode,
          email,
          password,
          user_data: userData
        }
      })
      
      if (error) throw error
      return data
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'WEDDING_CODE_AUTH_ERROR',
          message: error.message
        }
      }
    }
  },

  /**
   * Validate Wedding Code
   * Check if wedding code is valid before authentication
   */
  async validateWeddingCode(weddingCode: string): Promise<UnifiedAuthResponse> {
    try {
      const { data, error } = await supabase.functions.invoke('wedding-code-auth', {
        body: {
          action: 'validate_wedding_code',
          wedding_code: weddingCode
        }
      })
      
      if (error) throw error
      return data
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'WEDDING_CODE_VALIDATION_ERROR',
          message: error.message
        }
      }
    }
  },

  /**
   * Link Existing User to Wedding
   * Connect authenticated user to wedding via wedding code
   */
  async linkUserToWedding(userId: string, weddingCode: string): Promise<UnifiedAuthResponse> {
    try {
      const { data, error } = await supabase.functions.invoke('wedding-code-auth', {
        body: {
          action: 'link_existing_user_to_wedding',
          user_id: userId,
          wedding_code: weddingCode
        }
      })
      
      if (error) throw error
      return data
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'WEDDING_LINKING_ERROR',
          message: error.message
        }
      }
    }
  },

  /**
   * Invitation Code Authentication (Groomsmen Portal)
   * Validates invitation code and authenticates/creates user account
   */
  async authenticateWithInvitation(inviteCode: string, email: string, password: string, userData?: any): Promise<UnifiedAuthResponse> {
    try {
      const { data, error } = await supabase.functions.invoke('invitation-code-auth', {
        body: {
          action: 'authenticate_with_invitation',
          invite_code: inviteCode,
          email,
          password,
          user_data: userData
        }
      })
      
      if (error) throw error
      return data
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'INVITATION_AUTH_ERROR',
          message: error.message
        }
      }
    }
  },

  /**
   * Validate Invitation Code
   * Check if invitation code is valid before authentication
   */
  async validateInvitationCode(inviteCode: string): Promise<UnifiedAuthResponse> {
    try {
      const { data, error } = await supabase.functions.invoke('invitation-code-auth', {
        body: {
          action: 'validate_invitation_code',
          invite_code: inviteCode
        }
      })
      
      if (error) throw error
      return data
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'INVITATION_VALIDATION_ERROR',
          message: error.message
        }
      }
    }
  },

  /**
   * Accept Invitation
   * Mark invitation as accepted for existing user
   */
  async acceptInvitation(inviteCode: string, userId: string): Promise<UnifiedAuthResponse> {
    try {
      const { data, error } = await supabase.functions.invoke('invitation-code-auth', {
        body: {
          action: 'accept_invitation',
          invite_code: inviteCode,
          user_id: userId
        }
      })
      
      if (error) throw error
      return data
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'INVITATION_ACCEPTANCE_ERROR',
          message: error.message
        }
      }
    }
  },

  /**
   * Traditional Email/Password Authentication
   * Standard Supabase authentication for existing users
   */
  async signInWithEmail(email: string, password: string): Promise<UnifiedAuthResponse> {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      
      if (error) throw error
      
      // Get unified profile data
      const profileData = await this.getUnifiedProfile(data.user.id)
      
      return {
        success: true,
        data: {
          user: data.user,
          session: data.session,
          profile: profileData.data?.profile || {},
          wedding: profileData.data?.wedding,
          access_levels: profileData.data?.access_levels
        }
      }
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'EMAIL_AUTH_ERROR',
          message: error.message
        }
      }
    }
  },

  /**
   * Sign Up with Email/Password
   * Create new user account with traditional method
   */
  async signUpWithEmail(email: string, password: string, metadata?: any): Promise<UnifiedAuthResponse> {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata
        }
      })
      
      if (error) throw error
      
      if (data.user) {
        // Sync profile data after signup
        await this.syncProfileData(data.user.id, {
          email: data.user.email,
          ...metadata
        })
      }
      
      return {
        success: true,
        data: {
          user: data.user,
          session: data.session,
          profile: {},
          is_new_user: true
        }
      }
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'SIGNUP_ERROR',
          message: error.message
        }
      }
    }
  },

  /**
   * Sign Out
   * Universal sign out from all portals
   */
  async signOut(): Promise<UnifiedAuthResponse> {
    try {
      const { error } = await supabase.auth.signOut()
      
      if (error) throw error
      
      return {
        success: true
      }
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'SIGNOUT_ERROR',
          message: error.message
        }
      }
    }
  },

  /**
   * Get Current User Session
   * Retrieve current authentication session
   */
  async getCurrentSession(): Promise<any> {
    const { data: { session }, error } = await supabase.auth.getSession()
    return { session, error }
  },

  /**
   * Get Current User
   * Retrieve current authenticated user
   */
  async getCurrentUser(): Promise<any> {
    const { data: { user }, error } = await supabase.auth.getUser()
    return { user, error }
  },

  /**
   * Create Cross-Portal Session
   * Create session that works across all wedding portals
   */
  async createCrossPortalSession(userId: string, portalType: string): Promise<{ sessionInfo: SessionInfo }> {
    try {
      const { data, error } = await supabase.functions.invoke('session-manager', {
        body: {
          action: 'create_cross_portal_session',
          user_id: userId,
          portal_type: portalType
        }
      })
      
      if (error) throw error
      return data
    } catch (error) {
      throw new Error(`Failed to create cross-portal session: ${error.message}`)
    }
  },

  /**
   * Validate Portal Access
   * Check if user has access to specific portal
   */
  async validatePortalAccess(userId: string, portalName: string): Promise<{ hasAccess: boolean; accessReason: string }> {
    try {
      const { data, error } = await supabase.functions.invoke('session-manager', {
        body: {
          action: 'validate_portal_access',
          user_id: userId,
          portal_name: portalName
        }
      })
      
      if (error) throw error
      return data
    } catch (error) {
      throw new Error(`Failed to validate portal access: ${error.message}`)
    }
  },

  /**
   * Switch Portal Context
   * Change user context when switching between portals
   */
  async switchPortalContext(userId: string, targetPortal: string, contextData?: any): Promise<any> {
    try {
      const { data, error } = await supabase.functions.invoke('session-manager', {
        body: {
          action: 'switch_portal_context',
          user_id: userId,
          target_portal: targetPortal,
          context_data: contextData
        }
      })
      
      if (error) throw error
      return data
    } catch (error) {
      throw new Error(`Failed to switch portal context: ${error.message}`)
    }
  },

  /**
   * Sync Profile Data
   * Synchronize user profile data across all portals
   */
  async syncProfileData(userId: string, profileData?: any, syncTarget?: string): Promise<any> {
    try {
      const { data, error } = await supabase.functions.invoke('profile-sync', {
        body: {
          action: 'sync_profile_data',
          user_id: userId,
          profile_data: profileData,
          sync_target: syncTarget
        }
      })
      
      if (error) throw error
      return data
    } catch (error) {
      throw new Error(`Failed to sync profile data: ${error.message}`)
    }
  },

  /**
   * Sync Measurement Data
   * Synchronize measurement data across wedding and profile systems
   */
  async syncMeasurementData(userId: string, measurementData: any, syncTarget?: string): Promise<any> {
    try {
      const { data, error } = await supabase.functions.invoke('profile-sync', {
        body: {
          action: 'sync_measurement_data',
          user_id: userId,
          measurement_data: measurementData,
          sync_target: syncTarget
        }
      })
      
      if (error) throw error
      return data
    } catch (error) {
      throw new Error(`Failed to sync measurement data: ${error.message}`)
    }
  },

  /**
   * Get Unified Profile
   * Get complete unified profile data across all systems
   */
  async getUnifiedProfile(userId: string): Promise<UnifiedAuthResponse> {
    try {
      const { data, error } = await supabase.functions.invoke('profile-sync', {
        body: {
          action: 'get_unified_profile',
          user_id: userId
        }
      })
      
      if (error) throw error
      return data
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'UNIFIED_PROFILE_ERROR',
          message: error.message
        }
      }
    }
  },

  /**
   * Generate Invitation Code (Admin Feature)
   * Create invitation codes for groomsmen
   */
  async generateInvitationCode(weddingId: string, memberData: any): Promise<UnifiedAuthResponse> {
    try {
      const { data, error } = await supabase.functions.invoke('session-manager', {
        body: {
          action: 'generate_invitation_code',
          wedding_id: weddingId,
          member_data: memberData
        }
      })
      
      if (error) throw error
      return data
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'INVITATION_GENERATION_ERROR',
          message: error.message
        }
      }
    }
  },

  /**
   * List Wedding Party Members (Admin Feature)
   * Get all party members for a specific wedding
   */
  async getWeddingPartyMembers(weddingId: string): Promise<UnifiedAuthResponse> {
    try {
      const { data, error } = await supabase.functions.invoke('session-manager', {
        body: {
          action: 'get_wedding_party_members',
          wedding_id: weddingId
        }
      })
      
      if (error) throw error
      return data
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'PARTY_MEMBERS_ERROR',
          message: error.message
        }
      }
    }
  },

  /**
   * Migration Utilities
   */
  migration: {
    /**
     * Generate Migration Report
     * Identify accounts that need migration to unified system
     */
    async generateReport(): Promise<any> {
      try {
        const { data, error } = await supabase.functions.invoke('user-migration', {
          body: {
            action: 'generate_migration_report'
          }
        })
        
        if (error) throw error
        return data
      } catch (error) {
        throw new Error(`Failed to generate migration report: ${error.message}`)
      }
    },

    /**
     * Migrate Wedding Accounts
     * Migrate existing wedding portal accounts to unified system
     */
    async migrateAccounts(accounts: any[]): Promise<any> {
      try {
        const { data, error } = await supabase.functions.invoke('user-migration', {
          body: {
            action: 'migrate_wedding_accounts',
            migration_data: {
              wedding_accounts: accounts
            }
          }
        })
        
        if (error) throw error
        return data
      } catch (error) {
        throw new Error(`Failed to migrate accounts: ${error.message}`)
      }
    },

    /**
     * Bulk User Migration
     * Migrate all users from old systems to unified system
     */
    async bulkMigration(): Promise<any> {
      try {
        const { data, error } = await supabase.functions.invoke('user-migration', {
          body: {
            action: 'bulk_migration'
          }
        })
        
        if (error) throw error
        return data
      } catch (error) {
        throw new Error(`Failed to perform bulk migration: ${error.message}`)
      }
    }
  },

  /**
   * Authentication State Management
   */
  auth: {
    /**
     * Listen to authentication state changes
     */
    onAuthStateChange: (callback: (event: string, session: any) => void) => {
      return supabase.auth.onAuthStateChange(callback)
    },

    /**
     * Get current session
     */
    getSession: () => supabase.auth.getSession(),

    /**
     * Get current user
     */
    getUser: () => supabase.auth.getUser()
  }
}

// Export Supabase client for direct access if needed
export { supabase }
export default unifiedAuthAPI