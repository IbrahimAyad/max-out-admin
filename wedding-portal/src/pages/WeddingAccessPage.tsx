import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Heart, Lock, Mail, Key, ArrowRight, CheckCircle } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { weddingPortalAPI } from '@/lib/supabase'

export function WeddingAccessPage() {
  const [accessMethod, setAccessMethod] = useState<'code' | 'login'>('code')
  const [weddingCode, setWeddingCode] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [step, setStep] = useState<'access' | 'create-account' | 'login'>('access')
  const [weddingData, setWeddingData] = useState<any>(null)
  
  const { signIn, signUp } = useAuth()
  const navigate = useNavigate()

  const handleWeddingCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    
    try {
      const response = await weddingPortalAPI.getWeddingByCode(weddingCode)
      if (response.data) {
        setWeddingData(response.data)
        setStep('create-account')
      } else {
        setError('Invalid wedding code. Please check and try again.')
      }
    } catch (error: any) {
      setError('Unable to find wedding with this code')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    
    try {
      const { error: signUpError } = await signUp(email, password, {
        wedding_code: weddingCode,
        wedding_role: 'couple',
        full_name: `${weddingData.primary_customer_name || 'Wedding Couple'}`
      })
      
      if (signUpError) {
        setError(signUpError.message)
      } else {
        // Store wedding context in localStorage
        localStorage.setItem('wedding_id', weddingData.id)
        localStorage.setItem('wedding_code', weddingCode)
        navigate('/wedding')
      }
    } catch (error: any) {
      setError('Failed to create account. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    
    try {
      const { error: signInError } = await signIn(email, password)
      
      if (signInError) {
        setError(signInError.message)
      } else {
        navigate('/wedding')
      }
    } catch (error: any) {
      setError('Failed to sign in. Please check your credentials.')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-pink-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-rose-600 rounded-full flex items-center justify-center">
            <Heart className="h-8 w-8 text-white" />
          </div>
          <h2 className="mt-6 text-3xl font-bold text-gray-900">KCT Wedding Portal</h2>
          <p className="mt-2 text-sm text-gray-600">
            {step === 'access' && 'Access your wedding coordination portal'}
            {step === 'create-account' && 'Create your account to continue'}
            {step === 'login' && 'Sign in to your wedding portal'}
          </p>
        </div>

        {/* Wedding Code Access */}
        {step === 'access' && (
          <div className="bg-white rounded-lg shadow-lg p-8 space-y-6">
            {/* Access Method Toggle */}
            <div className="flex rounded-lg border border-gray-200 p-1">
              <button
                onClick={() => setAccessMethod('code')}
                className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors ${
                  accessMethod === 'code'
                    ? 'bg-rose-600 text-white'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Wedding Code
              </button>
              <button
                onClick={() => setAccessMethod('login')}
                className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors ${
                  accessMethod === 'login'
                    ? 'bg-rose-600 text-white'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Existing Account
              </button>
            </div>

            {accessMethod === 'code' ? (
              <form onSubmit={handleWeddingCodeSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Wedding Code
                  </label>
                  <div className="relative">
                    <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                    <input
                      type="text"
                      value={weddingCode}
                      onChange={(e) => setWeddingCode(e.target.value.toUpperCase())}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                      placeholder="WED-XXXXXXXX-XXXX"
                      required
                    />
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    Enter the wedding code provided by KCT Menswear
                  </p>
                </div>
                
                <button
                  type="submit"
                  disabled={loading || !weddingCode}
                  className="w-full bg-rose-600 text-white py-3 rounded-lg hover:bg-rose-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 transition-colors"
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                  ) : (
                    <>
                      <span>Access Wedding Portal</span>
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </form>
            ) : (
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                      placeholder="your@email.com"
                      required
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                      placeholder="Password"
                      required
                    />
                  </div>
                </div>
                
                <button
                  type="submit"
                  disabled={loading || !email || !password}
                  className="w-full bg-rose-600 text-white py-3 rounded-lg hover:bg-rose-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 transition-colors"
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                  ) : (
                    <>
                      <span>Sign In</span>
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </form>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}
          </div>
        )}

        {/* Create Account */}
        {step === 'create-account' && weddingData && (
          <div className="bg-white rounded-lg shadow-lg p-8 space-y-6">
            {/* Wedding Info */}
            <div className="bg-rose-50 rounded-lg p-4">
              <div className="flex items-center space-x-3 mb-3">
                <CheckCircle className="h-6 w-6 text-rose-600" />
                <h3 className="text-lg font-semibold text-gray-900">Wedding Found!</h3>
              </div>
              <div className="space-y-2 text-sm text-gray-700">
                <p><strong>Code:</strong> {weddingCode}</p>
                <p><strong>Date:</strong> {formatDate(weddingData.wedding_date)}</p>
                <p><strong>Venue:</strong> {weddingData.venue_name}</p>
                <p><strong>Location:</strong> {weddingData.venue_city}, {weddingData.venue_state}</p>
              </div>
            </div>

            <form onSubmit={handleCreateAccount} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                    placeholder="your@email.com"
                    required
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Create Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                    placeholder="Create a secure password"
                    required
                    minLength={6}
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Password must be at least 6 characters long
                </p>
              </div>
              
              <button
                type="submit"
                disabled={loading || !email || !password}
                className="w-full bg-rose-600 text-white py-3 rounded-lg hover:bg-rose-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 transition-colors"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                ) : (
                  <>
                    <span>Create Account & Enter Portal</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>

            <div className="text-center">
              <button
                onClick={() => setStep('access')}
                className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                ← Back to wedding code entry
              </button>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="text-center">
          <p className="text-xs text-gray-500">
            Powered by KCT Menswear • Wedding Coordination Portal
          </p>
        </div>
      </div>
    </div>
  )
}
