import React, { createContext, useContext, useEffect, useState } from 'react'
import { unifiedAuthAPI } from '@/lib/unified-auth'
import type { User } from '@supabase/supabase-js'

interface AuthContextType {
  user: User | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<any>
  signUp: (email: string, password: string, metadata?: any) => Promise<any>
  signOut: () => Promise<any>
  // New unified auth methods
  authenticateWithWeddingCode: (weddingCode: string, email: string, password: string, userData?: any) => Promise<any>
  validateWeddingCode: (weddingCode: string) => Promise<any>
  linkUserToWedding: (userId: string, weddingCode: string) => Promise<any>
  syncProfileData: (userId: string, profileData?: any) => Promise<any>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    unifiedAuthAPI.getCurrentUser().then(({ user }) => {
      setUser(user)
      setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = unifiedAuthAPI.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const value = {
    user,
    loading,
    signIn: async (email: string, password: string) => {
      const result = await unifiedAuthAPI.signInWithEmail(email, password)
      if (result.success) {
        return { data: result.data, error: null }
      } else {
        return { data: null, error: result.error }
      }
    },
    signUp: async (email: string, password: string, metadata?: any) => {
      const result = await unifiedAuthAPI.signUpWithEmail(email, password, metadata)
      if (result.success) {
        return { data: result.data, error: null }
      } else {
        return { data: null, error: result.error }
      }
    },
    signOut: async () => {
      const result = await unifiedAuthAPI.signOut()
      if (result.success) {
        return { error: null }
      } else {
        return { error: result.error }
      }
    },
    // New unified auth methods
    authenticateWithWeddingCode: unifiedAuthAPI.authenticateWithWeddingCode,
    validateWeddingCode: unifiedAuthAPI.validateWeddingCode,
    linkUserToWedding: unifiedAuthAPI.linkUserToWedding,
    syncProfileData: unifiedAuthAPI.syncProfileData
  }

  return (
    <AuthContext.Provider value={value}>
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
