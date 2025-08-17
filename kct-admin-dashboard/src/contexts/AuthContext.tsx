import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<any>
  signOut: () => Promise<any>
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
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        if (sessionError) {
          console.warn('Session error (may be normal on first load):', sessionError)
        }
        setSession(session)
        
        // Get user data
        if (session?.user) {
          setUser(session.user)
        } else {
          // Fallback to getUser if session doesn't have user
          const { data: { user }, error: userError } = await supabase.auth.getUser()
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
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
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
    return await supabase.auth.signInWithPassword({ email, password })
  }

  async function signOut() {
    return await supabase.auth.signOut()
  }

  return (
    <AuthContext.Provider value={{ user, session, loading, signIn, signOut }}>
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