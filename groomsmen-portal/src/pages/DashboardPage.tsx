import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Calendar, 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  Users, 
  MapPin, 
  Shirt,
  Ruler,
  MessageCircle,
  ArrowRight
} from 'lucide-react'
import { MobileLayout } from '@/components/MobileLayout'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'

interface DashboardData {
  member: {
    firstName: string
    lastName: string
    role: string
    customRoleTitle?: string
  }
  wedding: {
    weddingDate: string
    daysUntilWedding: number
    venueName?: string
    venueCity?: string
    venueState?: string
    theme?: string
    colorScheme?: any
  }
  progress: {
    completionPercentage: number
    completionItems: {
      invitation_accepted: boolean
      measurements_submitted: boolean
      outfit_assigned: boolean
      outfit_approved: boolean
      payment_completed: boolean
    }
    measurementsStatus: string
    outfitStatus: string
    paymentStatus: string
  }
  tasks: {
    pending: any[]
    urgent: any[]
    overdueCount: number
  }
  communications: {
    recent: any[]
    unreadCount: number
  }
  quickActions: {
    submitMeasurements: boolean
    viewOutfit: boolean
    approveOutfit: boolean
    checkMessages: boolean
    updateProfile: boolean
  }
}

export function DashboardPage() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('groomsmen-dashboard')
      
      if (error || !data) {
        throw new Error(error?.message || 'Failed to load dashboard data')
      }

      if (data.error) {
        throw new Error(data.error.message)
      }

      setDashboardData(data.data)
    } catch (error: any) {
      console.error('Dashboard load error:', error)
      toast.error(error.message || 'Failed to load dashboard')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <MobileLayout showNav={false}>
        <div className="h-screen flex items-center justify-center">
          <LoadingSpinner />
        </div>
      </MobileLayout>
    )
  }

  if (!dashboardData) {
    return (
      <MobileLayout showNav={false}>
        <div className="h-screen flex items-center justify-center p-4">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Unable to load dashboard</h2>
            <p className="text-gray-600 mb-4">Please try refreshing the page</p>
            <button
              onClick={loadDashboardData}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg"
            >
              Retry
            </button>
          </div>
        </div>
      </MobileLayout>
    )
  }

  const { member, wedding, progress, tasks, communications, quickActions } = dashboardData

  return (
    <MobileLayout>
      <div className="p-4 space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome, {member.firstName}!
          </h1>
          <p className="text-gray-600">
            {member.customRoleTitle || member.role}
          </p>
        </div>

        {/* Wedding Countdown */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-6 text-white">
          <div className="text-center space-y-2">
            <Calendar className="h-8 w-8 mx-auto mb-3" />
            <h2 className="text-xl font-semibold">
              {wedding.daysUntilWedding} Days Until Wedding
            </h2>
            <p className="text-blue-100">
              {new Date(wedding.weddingDate).toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </p>
            {wedding.venueName && (
              <div className="flex items-center justify-center text-blue-100 text-sm mt-2">
                <MapPin size={14} className="mr-1" />
                {wedding.venueName}
                {wedding.venueCity && `, ${wedding.venueCity}`}
              </div>
            )}
          </div>
        </div>

        {/* Progress Overview */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Your Progress</h3>
            <span className="text-2xl font-bold text-blue-600">
              {progress.completionPercentage}%
            </span>
          </div>
          
          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
            <div 
              className="bg-blue-600 h-3 rounded-full transition-all duration-300"
              style={{ width: `${progress.completionPercentage}%` }}
            />
          </div>

          {/* Progress Items */}
          <div className="space-y-3">
            {[
              { key: 'invitation_accepted', label: 'Invitation Accepted' },
              { key: 'measurements_submitted', label: 'Measurements Submitted' },
              { key: 'outfit_assigned', label: 'Outfit Assigned' },
              { key: 'outfit_approved', label: 'Outfit Approved' },
              { key: 'payment_completed', label: 'Payment Completed' }
            ].map(({ key, label }) => {
              const completed = progress.completionItems[key as keyof typeof progress.completionItems]
              return (
                <div key={key} className="flex items-center space-x-3">
                  {completed ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <div className="h-5 w-5 border-2 border-gray-300 rounded-full" />
                  )}
                  <span className={`text-sm ${completed ? 'text-gray-900' : 'text-gray-500'}`}>
                    {label}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-4">
            {quickActions.submitMeasurements && (
              <button
                onClick={() => navigate('/measurements')}
                className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left hover:bg-blue-100 transition-colors"
              >
                <Ruler className="h-6 w-6 text-blue-600 mb-2" />
                <p className="text-sm font-medium text-blue-900">Submit Measurements</p>
              </button>
            )}
            
            {quickActions.viewOutfit && (
              <button
                onClick={() => navigate('/outfit')}
                className="bg-green-50 border border-green-200 rounded-lg p-4 text-left hover:bg-green-100 transition-colors"
              >
                <Shirt className="h-6 w-6 text-green-600 mb-2" />
                <p className="text-sm font-medium text-green-900">View Outfit</p>
              </button>
            )}
            
            {quickActions.checkMessages && (
              <button
                onClick={() => navigate('/communications')}
                className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-left hover:bg-yellow-100 transition-colors"
              >
                <MessageCircle className="h-6 w-6 text-yellow-600 mb-2" />
                <p className="text-sm font-medium text-yellow-900">Check Messages</p>
                {communications.unreadCount > 0 && (
                  <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-500 rounded-full">
                    {communications.unreadCount}
                  </span>
                )}
              </button>
            )}
            
            <button
              onClick={() => navigate('/timeline')}
              className="bg-purple-50 border border-purple-200 rounded-lg p-4 text-left hover:bg-purple-100 transition-colors"
            >
              <Clock className="h-6 w-6 text-purple-600 mb-2" />
              <p className="text-sm font-medium text-purple-900">View Timeline</p>
            </button>
          </div>
        </div>

        {/* Urgent Tasks */}
        {tasks.urgent.length > 0 && (
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center space-x-2 mb-4">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              <h3 className="text-lg font-semibold text-gray-900">Urgent Tasks</h3>
            </div>
            <div className="space-y-3">
              {tasks.urgent.slice(0, 3).map((task: any) => (
                <div key={task.id} className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border border-orange-200">
                  <div>
                    <p className="text-sm font-medium text-orange-900">{task.taskName}</p>
                    <p className="text-xs text-orange-600">
                      Due: {new Date(task.dueDate).toLocaleDateString()}
                    </p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-orange-600" />
                </div>
              ))}
            </div>
            <button
              onClick={() => navigate('/timeline')}
              className="w-full mt-4 text-orange-600 font-medium text-sm"
            >
              View All Tasks
            </button>
          </div>
        )}

        {/* Recent Messages */}
        {communications.recent.length > 0 && (
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Recent Messages</h3>
              {communications.unreadCount > 0 && (
                <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                  {communications.unreadCount} new
                </span>
              )}
            </div>
            <div className="space-y-3">
              {communications.recent.slice(0, 2).map((message: any) => (
                <div key={message.id} className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm font-medium text-gray-900">{message.subject}</p>
                  <p className="text-xs text-gray-600 mt-1">
                    {new Date(message.createdAt).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
            <button
              onClick={() => navigate('/communications')}
              className="w-full mt-4 text-blue-600 font-medium text-sm"
            >
              View All Messages
            </button>
          </div>
        )}
      </div>
    </MobileLayout>
  )
}