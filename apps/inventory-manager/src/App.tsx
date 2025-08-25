import React, { useEffect } from 'react'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { EnhancedInventoryManager } from './components/EnhancedInventoryManager'
import { LoginForm } from './components/LoginForm'
import './App.css'

function AppContent() {
  const { user, loading } = useAuth()

  useEffect(() => {
    console.log('AppContent rendered with user:', user, 'loading:', loading)
  }, [user, loading])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!user) {
    console.log('No user, showing login form')
    return <LoginForm />
  }

  console.log('User authenticated, showing inventory manager')
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <EnhancedInventoryManager />
      </div>
    </div>
  )
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}

export default App