import React, { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useForm } from 'react-hook-form'
import { Navigate } from 'react-router-dom'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'

interface LoginForm {
  email: string
  password: string
}

export default function Login() {
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { user, signIn } = useAuth()
  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>()

  // Redirect if already logged in
  if (user) {
    return <Navigate to="/dashboard" replace />
  }

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true)
    try {
      const { error } = await signIn(data.email, data.password)
      if (error) {
        toast.error(error.message || 'Failed to sign in')
      } else {
        toast.success('Welcome back!')
      }
    } catch (error: any) {
      toast.error('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Logo */}
        <div className="flex justify-center">
          <div className="flex items-center">
            <div className="h-12 w-12 bg-black rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">KCT</span>
            </div>
            <span className="ml-3 text-2xl font-semibold text-black">Menswear</span>
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-bold text-neutral-900">
          Admin Dashboard
        </h2>
        <p className="mt-2 text-center text-sm text-neutral-600">
          Sign in to manage your luxury menswear business
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-sm border border-neutral-200 sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-neutral-700">
                Email address
              </label>
              <div className="mt-1">
                <input
                  {...register('email', {
                    required: 'Email is required',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Please enter a valid email address'
                    }
                  })}
                  type="email"
                  autoComplete="email"
                  className="appearance-none block w-full px-3 py-2 border border-neutral-300 rounded-md placeholder-neutral-400 focus:outline-none focus:ring-black focus:border-black sm:text-sm transition-colors"
                  placeholder="Enter your email"
                />
                {errors.email && (
                  <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>
                )}
              </div>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-neutral-700">
                Password
              </label>
              <div className="mt-1 relative">
                <input
                  {...register('password', {
                    required: 'Password is required',
                    minLength: {
                      value: 6,
                      message: 'Password must be at least 6 characters'
                    }
                  })}
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  className="appearance-none block w-full px-3 py-2 pr-10 border border-neutral-300 rounded-md placeholder-neutral-400 focus:outline-none focus:ring-black focus:border-black sm:text-sm transition-colors"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-neutral-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-neutral-400" />
                  )}
                </button>
                {errors.password && (
                  <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>
                )}
              </div>
            </div>

            {/* Submit Button */}
            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-black hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Signing in...
                  </>
                ) : (
                  'Sign in'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}