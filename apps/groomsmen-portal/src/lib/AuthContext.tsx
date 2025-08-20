import React, { createContext, useContext, useEffect, useState } from 'react'
import { unifiedAuthAPI } from '@/lib/unified-auth'
import { User } from '@supabase/supabase-js'

interface AuthContextType {
  user: User | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<any>
  signUp: (email: string, password: string) => Promise<any>
  signOut: () => Promise<any>
  // New unified auth methods for groomsmen portal
  authenticateWithInvitation: (inviteCode: string, email: string, password: string, userData?: any) => Promise<any>
  validateInvitationCode: (inviteCode: string) => Promise<any>
  acceptInvitation: (inviteCode: string, userId: string) => Promise<any>
  syncProfileData: (userId: string, profileData?: any) => Promise<any>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    async function getInitialSession() {
      try {
        const { user } = await unifiedAuthAPI.getCurrentUser()
        setUser(user)
      } catch (error) {
        console.error('Error getting initial session:', error)
      } finally {
        setLoading(false)
      }
    }

    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = unifiedAuthAPI.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user || null)
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email: string, password: string) => {
    const result = await unifiedAuthAPI.signInWithEmail(email, password)
    if (result.success) {
      return { data: result.data, error: null }
    } else {
      return { data: null, error: result.error }
    }
  }

  const signUp = async (email: string, password: string) => {
    const result = await unifiedAuthAPI.signUpWithEmail(email, password)
    if (result.success) {
      return { data: result.data, error: null }
    } else {
      return { data: null, error: result.error }
    }
  }

  const signOut = async () => {
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
      loading,
      signIn,
      signUp,
      signOut,
      // New unified auth methods
      authenticateWithInvitation: unifiedAuthAPI.authenticateWithInvitation,
      validateInvitationCode: unifiedAuthAPI.validateInvitationCode,
      acceptInvitation: unifiedAuthAPI.acceptInvitation,
      syncProfileData: unifiedAuthAPI.syncProfileData
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