import React, { useState, useEffect } from 'react'
import { supabase, getCurrentUser } from './lib/supabase'
import { OrderManagementDashboard } from './components/OrderManagementDashboard'
import { AuthForm } from './components/AuthForm'
import { LoadingSpinner } from './components/LoadingSpinner'
import { Toaster } from 'react-hot-toast'
import './App.css'

function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check current user on mount
    async function checkUser() {
      try {
        const currentUser = await getCurrentUser()
        setUser(currentUser)
      } catch (error) {
        console.error('Error checking user:', error)
      } finally {
        setLoading(false)
      }
    }

    checkUser()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner />
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