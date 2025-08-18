import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Heart, Users, Calendar } from 'lucide-react'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { useAuth } from '@/lib/AuthContext'
import toast from 'react-hot-toast'

export function InvitationPage() {
  const [inviteCode, setInviteCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [weddingInfo, setWeddingInfo] = useState<any>(null)
  const { validateInvitationCode } = useAuth()
  const navigate = useNavigate()

  const validateInvitation = async () => {
    if (!inviteCode.trim()) {
      toast.error('Please enter your invitation code')
      return
    }

    setLoading(true)
    try {
      // Use unified authentication validation
      const result = await validateInvitationCode(inviteCode.trim().toUpperCase())
      
      if (result.success && result.data?.invitation && result.data?.wedding) {
        // Store invitation and wedding data
        setWeddingInfo(result.data.wedding)
        toast.success('Invitation validated! Please sign in or create an account.')
        
        // Store invitation data in sessionStorage for the next step
        sessionStorage.setItem('invitationData', JSON.stringify({
          invitation: result.data.invitation,
          wedding: result.data.wedding,
          invite_code: inviteCode.trim().toUpperCase()
        }))
        
        // Redirect to login page
        navigate('/login')
      } else {
        throw new Error(result.error?.message || 'Invalid invitation code')
      }
      
    } catch (error: any) {
      console.error('Invitation validation error:', error)
      toast.error(error.message || 'Invalid invitation code')
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="bg-white rounded-full p-6 shadow-lg">
              <Heart className="h-12 w-12 text-blue-600" />
            </div>
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">KCT Menswear</h1>
            <p className="text-lg text-gray-600 mt-2">Wedding Party Portal</p>
          </div>
        </div>

        {/* Welcome Message */}
        <div className="bg-white rounded-2xl shadow-lg p-6 space-y-4">
          <div className="text-center space-y-2">
            <h2 className="text-xl font-semibold text-gray-900">Welcome!</h2>
            <p className="text-gray-600">
              Enter your invitation code to access your personalized wedding experience
            </p>
          </div>

          {/* Features Preview */}
          <div className="grid grid-cols-2 gap-4 mt-6">
            <div className="text-center space-y-2">
              <div className="bg-blue-50 rounded-lg p-3">
                <Users className="h-6 w-6 text-blue-600 mx-auto" />
              </div>
              <p className="text-sm text-gray-600">Your Outfit</p>
            </div>
            <div className="text-center space-y-2">
              <div className="bg-blue-50 rounded-lg p-3">
                <Calendar className="h-6 w-6 text-blue-600 mx-auto" />
              </div>
              <p className="text-sm text-gray-600">Timeline</p>
            </div>
          </div>
        </div>

        {/* Invitation Code Form */}
        <div className="bg-white rounded-2xl shadow-lg p-6 space-y-6">
          <div className="space-y-4">
            <label htmlFor="inviteCode" className="block text-sm font-medium text-gray-700">
              Invitation Code
            </label>
            <input
              id="inviteCode"
              type="text"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
              placeholder="Enter your code"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center text-lg font-mono tracking-widest"
              maxLength={20}
            />
            <p className="text-xs text-gray-500 text-center">
              Check your invitation email for the code
            </p>
          </div>

          <button
            onClick={validateInvitation}
            disabled={loading || !inviteCode.trim()}
            className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Validating...' : 'Continue'}
          </button>
        </div>

        {/* Help Text */}
        <div className="text-center">
          <p className="text-sm text-gray-500">
            Need help? Contact your wedding coordinator
          </p>
        </div>
      </div>
    </div>
  )
}