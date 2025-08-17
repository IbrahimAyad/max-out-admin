import React, { useState, useEffect } from 'react'
import { supabase, getCurrentUser } from './lib/supabase'
import { OrderManagementDashboard } from './components/OrderManagementDashboard'
import { AuthForm } from './components/AuthForm'
import { LoadingSpinner } from './components/LoadingSpinner'
import { Toaster } from 'react-hot-toast'
import toast from 'react-hot-toast'
import './App.css'

function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [authError, setAuthError] = useState('')

  useEffect(() => {
    // Check current user on mount
    async function checkUser() {
      try {
        console.log('Checking authentication status...')
        
        // First try to get existing session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError) {
          console.error('Session error:', sessionError)
          setAuthError('Session error: ' + sessionError.message)
        }
        
        if (session?.user) {
          console.log('Found existing session:', session.user.email)
          setUser(session.user)
        } else {
          console.log('No existing session found')
          // Try getCurrentUser as fallback
          const currentUser = await getCurrentUser()
          if (currentUser) {
            console.log('Found user via getCurrentUser:', currentUser.email)
            setUser(currentUser)
          } else {
            console.log('No authenticated user found')
          }
        }
      } catch (error) {
        console.error('Error checking user:', error)
        setAuthError('Authentication check failed: ' + error.message)
        toast.error('Authentication system error. Please refresh the page.')
      } finally {
        setLoading(false)
      }
    }

    checkUser()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state changed:', event, session?.user?.email || 'No user')
      
      if (event === 'SIGNED_IN' && session?.user) {
        setUser(session.user)
        setAuthError('')
        toast.success('Successfully signed in!')
      } else if (event === 'SIGNED_OUT') {
        setUser(null)
        setAuthError('')
        toast.success('Successfully signed out!')
      } else if (event === 'TOKEN_REFRESHED') {
        console.log('Token refreshed successfully')
        if (session?.user) {
          setUser(session.user)
        }
      } else if (event === 'USER_UPDATED') {
        if (session?.user) {
          setUser(session.user)
        }
      }
      
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner className="w-8 h-8 mx-auto mb-4" />
          <p className="text-gray-600">Initializing KCT Menswear Dashboard...</p>
          {authError && (
            <p className="text-red-600 text-sm mt-2 max-w-md">{authError}</p>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster position="top-right" />
      {user ? (
        <OrderManagementDashboard user={user} />
      ) : (
        <AuthForm />
      )}
    </div>
  )
}

export default App