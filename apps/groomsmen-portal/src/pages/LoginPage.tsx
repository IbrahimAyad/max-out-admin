import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff, ArrowLeft } from 'lucide-react'
import { useAuth } from '@/lib/AuthContext'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import toast from 'react-hot-toast'

export function LoginPage() {
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [phone, setPhone] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [invitationData, setInvitationData] = useState<any>(null)
  
  const { signIn, authenticateWithInvitation, syncProfileData } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    // Check if we have invitation data
    const storedData = sessionStorage.getItem('invitationData')
    if (storedData) {
      const data = JSON.parse(storedData)
      setInvitationData(data)
      setEmail(data.invitation?.email || '')
      setFirstName(data.invitation?.first_name || '')
      setLastName(data.invitation?.last_name || '')
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (isSignUp) {
        // Validate sign up form
        if (password !== confirmPassword) {
          throw new Error('Passwords do not match')
        }
        if (password.length < 6) {
          throw new Error('Password must be at least 6 characters')
        }

        // Use unified authentication with invitation
        if (invitationData?.invite_code) {
          const authResult = await authenticateWithInvitation(
            invitationData.invite_code,
            email,
            password,
            {
              first_name: firstName,
              last_name: lastName,
              phone: phone,
              wedding_role: 'groomsman'
            }
          )
          
          if (authResult.success) {
            // Clear invitation data
            sessionStorage.removeItem('invitationData')
            
            // Sync profile data to ensure consistency across portals
            if (authResult.data?.user?.id) {
              await syncProfileData(authResult.data.user.id, {
                first_name: firstName,
                last_name: lastName,
                phone: phone,
                wedding_role: 'groomsman',
                invite_code: invitationData.invite_code
              })
            }
            
            toast.success('Welcome to the wedding party!')
            navigate('/dashboard')
          } else {
            throw new Error(authResult.error?.message || 'Failed to create account')
          }
        } else {
          throw new Error('Invitation data not found')
        }
        
      } else {
        // Sign in with existing account
        const { data, error } = await signIn(email, password)
        if (error) throw new Error(error.message)

        // If we have invitation data and successful login, accept the invitation
        if (invitationData?.invite_code && data?.user) {
          try {
            // Sync profile data to link invitation
            await syncProfileData(data.user.id, {
              invite_code: invitationData.invite_code,
              wedding_role: 'groomsman'
            })
            
            sessionStorage.removeItem('invitationData')
            toast.success('Successfully linked to wedding party!')
          } catch (linkError) {
            console.warn('Failed to link invitation:', linkError)
            // Don't fail the login for this
          }
        }

        toast.success('Signed in successfully!')
        navigate('/dashboard')
      }
    } catch (error: any) {
      console.error('Auth error:', error)
      toast.error(error.message || 'Authentication failed')
    } finally {
      setLoading(false)
    }
  }



  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4">
        <button
          onClick={() => navigate('/invitation')}
          className="flex items-center text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft size={20} className="mr-2" />
          Back
        </button>
      </div>

      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-6">
          {/* Wedding Info */}
          {invitationData?.wedding && (
            <div className="bg-white rounded-2xl shadow-lg p-6 text-center">
              <h2 className="text-lg font-semibold text-gray-900">
                {invitationData.wedding?.wedding_code || 'Wedding'}
              </h2>
              <p className="text-gray-600">
                {invitationData.wedding?.wedding_date && new Date(invitationData.wedding.wedding_date).toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
              {invitationData.wedding?.venue_name && (
                <p className="text-sm text-gray-500 mt-1">
                  {invitationData.wedding.venue_name}
                </p>
              )}
            </div>
          )}

          {/* Auth Form */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold text-gray-900">
                {isSignUp ? 'Create Account' : 'Sign In'}
              </h1>
              <p className="text-gray-600 mt-2">
                {isSignUp 
                  ? 'Join your wedding party portal'
                  : 'Access your wedding dashboard'
                }
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {isSignUp && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                        First Name
                      </label>
                      <input
                        id="firstName"
                        type="text"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
                        Last Name
                      </label>
                      <input
                        id="lastName"
                        type="text"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                      Phone Number
                    </label>
                    <input
                      id="phone"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </>
              )}
              
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={!!invitationData?.invitation?.email}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
                />
              </div>
              
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              
              {isSignUp && (
                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                    Confirm Password
                  </label>
                  <input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Please wait...' : (isSignUp ? 'Create Account' : 'Sign In')}
              </button>
            </form>

            <div className="mt-6 text-center">
              <button
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                {isSignUp 
                  ? 'Already have an account? Sign in'
                  : 'Need an account? Sign up'
                }
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}