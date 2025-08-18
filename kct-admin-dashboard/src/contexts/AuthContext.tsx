import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { unifiedAuthAPI } from '../lib/unified-auth'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<any>
  signOut: () => Promise<any>
  // New unified auth methods for admin portal
  createCrossPortalSession: (userId: string, portalType: string) => Promise<any>
  validatePortalAccess: (userId: string, portalName: string) => Promise<any>
  generateInvitationCode: (weddingId: string, memberData: any) => Promise<any>
  getWeddingPartyMembers: (weddingId: string) => Promise<any>
  syncProfileData: (userId: string, profileData?: any) => Promise<any>
  migration: {
    generateReport: () => Promise<any>
    migrateAccounts: (accounts: any[]) => Promise<any>
    bulkMigration: () => Promise<any>
  }
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  // Load user on mount (one-time check)
  useEffect(() => {
    async function loadUser() {
      setLoading(true)
      try {
        // Get current session first
        const { session, error: sessionError } = await unifiedAuthAPI.getCurrentSession()
        if (sessionError) {
          console.warn('Session error (may be normal on first load):', sessionError)
        }
        setSession(session)
        
        // Get user data
        if (session?.user) {
          setUser(session.user)
        } else {
          // Fallback to getUser if session doesn't have user
          const { user, error: userError } = await unifiedAuthAPI.getCurrentUser()
          if (userError && userError.message !== 'Auth session missing!') {
            console.error('Error loading user:', userError)
          }
          setUser(user)
        }
      } catch (error) {
        console.warn('Auth initialization error:', error)
      } finally {
        setLoading(false)
      }
    }
    loadUser()

    // Set up auth listener - KEEP SIMPLE, avoid any async operations in callback
    const { data: { subscription } } = unifiedAuthAPI.auth.onAuthStateChange(
      (event, session) => {
        // NEVER use any async operations in callback
        if (event === 'SIGNED_OUT') {
          setUser(null)
          setSession(null)
        } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          setUser(session?.user || null)
          setSession(session)
        } else {
          setUser(session?.user || null)
          setSession(session)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  // Auth methods
  async function signIn(email: string, password: string) {
    const result = await unifiedAuthAPI.signInWithEmail(email, password)
    if (result.success) {
      return { data: result.data, error: null }
    } else {
      return { data: null, error: result.error }
    }
  }

  async function signOut() {
    const result = await unifiedAuthAPI.signOut()
    if (result.success) {
      return { error: null }
    } else {
      return { error: result.error }
    }
  }

  return (
    <AuthContext.Provider value={{ 
      user, 
      session, 
      loading, 
      signIn, 
      signOut,
      // New unified auth methods for admin portal
      createCrossPortalSession: unifiedAuthAPI.createCrossPortalSession,
      validatePortalAccess: unifiedAuthAPI.validatePortalAccess,
      generateInvitationCode: unifiedAuthAPI.generateInvitationCode,
      getWeddingPartyMembers: unifiedAuthAPI.getWeddingPartyMembers,
      syncProfileData: unifiedAuthAPI.syncProfileData,
      migration: unifiedAuthAPI.migration
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}