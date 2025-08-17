import React, { useState } from 'react'
import { supabase } from '../lib/supabase'
import { LoadingSpinner } from './LoadingSpinner'
import toast from 'react-hot-toast'

export function AuthForm() {
  const [isLoading, setIsLoading] = useState(false)
  const [isSignUp, setIsSignUp] = useState(false)
  const [showDebug, setShowDebug] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: ''
  })

  // Quick admin account for testing
  const createTestAdmin = async () => {
    setIsLoading(true)
    try {
      const testEmail = 'admin@kctmenswear.com'
      const testPassword = 'KCTAdmin2025!'
      
      const { error } = await supabase.auth.signUp({
        email: testEmail,
        password: testPassword,
      })

      if (error) {
        // If user already exists, try to sign in
        if (error.message.includes('already registered')) {
          const { error: signInError } = await supabase.auth.signInWithPassword({
            email: testEmail,
            password: testPassword,
          })
          
          if (signInError) throw signInError
          toast.success('Successfully signed in with admin account!')
        } else {
          throw error
        }
      } else {
        toast.success('Admin account created! Please check email to confirm.')
      }
    } catch (error: any) {
      console.error('Test admin creation error:', error)
      toast.error(error.message || 'Failed to create test admin')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      console.log('Attempting authentication...', { email: formData.email, isSignUp })
      
      if (isSignUp) {
        if (formData.password !== formData.confirmPassword) {
          toast.error('Passwords do not match')
          return
        }

        if (formData.password.length < 6) {
          toast.error('Password must be at least 6 characters')
          return
        }

        const { data, error } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
        })

        if (error) throw error
        
        if (data.user && !data.user.email_confirmed_at) {
          toast.success('Please check your email to confirm your account')
        } else {
          toast.success('Account created and signed in!')
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        })

        if (error) throw error
        
        console.log('Sign in successful:', data.user?.email)
        toast.success('Successfully signed in!')
      }
    } catch (error: any) {
      console.error('Authentication error:', error)
      toast.error(error.message || 'An error occurred during authentication')
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            KCT Menswear
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {isSignUp ? 'Create your admin account' : 'Sign in to your admin account'}
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email" className="sr-only">Email address</label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Email address"
                value={formData.email}
                onChange={handleInputChange}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className={`appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 ${isSignUp ? '' : 'rounded-b-md'} focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm`}
                placeholder="Password"
                value={formData.password}
                onChange={handleInputChange}
              />
            </div>
            {isSignUp && (
              <div>
                <label htmlFor="confirmPassword" className="sr-only">Confirm Password</label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  required
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                  placeholder="Confirm password"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                />
              </div>
            )}
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {isLoading ? (
                <LoadingSpinner className="w-4 h-4" />
              ) : (
                isSignUp ? 'Sign up' : 'Sign in'
              )}
            </button>
          </div>

          <div className="text-center">
            <button
              type="button"
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-indigo-600 hover:text-indigo-500 text-sm"
            >
              {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
            </button>
          </div>
          
          <div className="text-center border-t pt-4">
            <button
              type="button"
              onClick={createTestAdmin}
              disabled={isLoading}
              className="w-full text-sm text-gray-600 hover:text-gray-800 bg-gray-100 hover:bg-gray-200 py-2 px-4 rounded-md transition-colors"
            >
              Quick Admin Access (Testing)
            </button>
          </div>
          
          <div className="text-center">
            <button
              type="button"
              onClick={() => setShowDebug(!showDebug)}
              className="text-xs text-gray-400 hover:text-gray-600"
            >
              Debug Info
            </button>
            
            {showDebug && (
              <div className="mt-2 p-3 bg-gray-50 rounded text-xs text-left">
                <p><strong>Supabase URL:</strong> {import.meta.env.VITE_SUPABASE_URL || 'Not loaded'}</p>
                <p><strong>Environment:</strong> {import.meta.env.MODE}</p>
                <p><strong>Build Time:</strong> {new Date().toISOString()}</p>
              </div>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}