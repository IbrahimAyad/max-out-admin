import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { 
  Heart, 
  Users, 
  Calendar, 
  CheckCircle, 
  Clock, 
  AlertTriangle,
  TrendingUp,
  Mail,
  Phone,
  MapPin,
  Plus,
  ArrowRight
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { weddingPortalAPI } from '@/lib/supabase'

export function WeddingDashboard() {
  const [weddingId] = useState(() => localStorage.getItem('wedding_id') || '')
  const [weddingCode] = useState(() => localStorage.getItem('wedding_code') || '')
  const queryClient = useQueryClient()

  // Get wedding dashboard data
  const { data: weddingDashboard, isLoading } = useQuery({
    queryKey: ['wedding-dashboard', weddingId],
    queryFn: () => weddingPortalAPI.getWeddingDashboard(weddingId),
    enabled: !!weddingId
  })

  // Get party members
  const { data: partyMembers } = useQuery({
    queryKey: ['party-members', weddingId],
    queryFn: () => weddingPortalAPI.getPartyMembers(weddingId),
    enabled: !!weddingId
  })

  // Get upcoming tasks
  const { data: tasks } = useQuery({
    queryKey: ['wedding-tasks', weddingId],
    queryFn: () => weddingPortalAPI.getTasks(weddingId, { upcoming_only: true }),
    enabled: !!weddingId
  })

  const dashboard = weddingDashboard?.data
  const members = partyMembers?.data || []
  const taskList = tasks?.data || []

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const getProgressColor = (percentage: number) => {
    if (percentage >= 80) return 'text-green-600 bg-green-100'
    if (percentage >= 60) return 'text-blue-600 bg-blue-100'
    if (percentage >= 40) return 'text-yellow-600 bg-yellow-100'
    return 'text-red-600 bg-red-100'
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg shadow p-6">
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-2" />
                <div className="h-8 bg-gray-200 rounded w-1/3" />
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!dashboard) {
    return (
      <div className="text-center py-12">
        <Heart className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Wedding Not Found</h3>
        <p className="text-gray-600">Unable to load your wedding information. Please try again.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-rose-500 to-pink-600 rounded-lg shadow-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">
              Welcome to Your Wedding Portal
            </h1>
            <p className="text-rose-100 mb-4">
              {dashboard.wedding.wedding_code} • {formatDate(dashboard.wedding.wedding_date)}
            </p>
            <div className="flex items-center space-x-4 text-sm">
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4" />
                <span>{dashboard.wedding.days_until_wedding} days to go</span>
              </div>
              <div className="flex items-center space-x-2">
                <Users className="w-4 h-4" />
                <span>{dashboard.party_progress.total_members} party members</span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold mb-1">{dashboard.wedding.completion_percentage}%</div>
            <div className="text-rose-100 text-sm">Complete</div>
            <div className="mt-2 bg-white bg-opacity-20 rounded-full h-2 w-32">
              <div 
                className="bg-white h-2 rounded-full transition-all duration-500"
                style={{ width: `${dashboard.wedding.completion_percentage}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Progress Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-100 text-blue-600 p-3 rounded-lg">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Measurements</h3>
                <p className="text-sm text-gray-600">Party member sizing</p>
              </div>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Completed</span>
              <span className="font-semibold">
                {dashboard.party_progress.measurements_completed}/{dashboard.party_progress.total_members}
              </span>
            </div>
            <div className="bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${dashboard.party_progress.measurements_percentage}%` }}
              />
            </div>
            <p className={`text-sm font-medium px-2 py-1 rounded-full inline-block ${getProgressColor(dashboard.party_progress.measurements_percentage)}`}>
              {dashboard.party_progress.measurements_percentage}% Complete
            </p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="bg-purple-100 text-purple-600 p-3 rounded-lg">
                <CheckCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Outfit Selection</h3>
                <p className="text-sm text-gray-600">Style coordination</p>
              </div>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Selected</span>
              <span className="font-semibold">
                {dashboard.party_progress.outfits_selected}/{dashboard.party_progress.total_members}
              </span>
            </div>
            <div className="bg-gray-200 rounded-full h-2">
              <div 
                className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${dashboard.party_progress.outfits_percentage}%` }}
              />
            </div>
            <p className={`text-sm font-medium px-2 py-1 rounded-full inline-block ${getProgressColor(dashboard.party_progress.outfits_percentage)}`}>
              {dashboard.party_progress.outfits_percentage}% Complete
            </p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="bg-green-100 text-green-600 p-3 rounded-lg">
                <TrendingUp className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Payments</h3>
                <p className="text-sm text-gray-600">Order processing</p>
              </div>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Paid</span>
              <span className="font-semibold">
                {dashboard.party_progress.payments_completed}/{dashboard.party_progress.total_members}
              </span>
            </div>
            <div className="bg-gray-200 rounded-full h-2">
              <div 
                className="bg-green-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${dashboard.party_progress.payments_percentage}%` }}
              />
            </div>
            <p className={`text-sm font-medium px-2 py-1 rounded-full inline-block ${getProgressColor(dashboard.party_progress.payments_percentage)}`}>
              {dashboard.party_progress.payments_percentage}% Complete
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Party Members */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Wedding Party Status</h3>
            <Link 
              to="/wedding/party" 
              className="text-rose-600 hover:text-rose-700 text-sm font-medium flex items-center space-x-1"
            >
              <span>Manage All</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          
          <div className="space-y-4">
            {members.slice(0, 4).map((member: any) => (
              <div key={member.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="bg-gray-200 text-gray-600 w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium">
                    {member.first_name[0]}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
                      {member.first_name} {member.last_name}
                    </p>
                    <p className="text-sm text-gray-600">{member.role}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">
                    {member.overall_completion_percentage || 0}%
                  </p>
                  <div className="w-16 bg-gray-200 rounded-full h-1 mt-1">
                    <div 
                      className="bg-rose-600 h-1 rounded-full"
                      style={{ width: `${member.overall_completion_percentage || 0}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
            
            {members.length === 0 && (
              <div className="text-center py-8">
                <Users className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-500 text-sm mb-3">No party members added yet</p>
                <Link 
                  to="/wedding/party"
                  className="bg-rose-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-rose-700 transition-colors inline-flex items-center space-x-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Invite Your First Member</span>
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Upcoming Tasks */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Upcoming Tasks</h3>
            <Link 
              to="/wedding/timeline" 
              className="text-rose-600 hover:text-rose-700 text-sm font-medium flex items-center space-x-1"
            >
              <span>View Timeline</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          
          <div className="space-y-4">
            {taskList.slice(0, 5).map((task: any) => (
              <div key={task.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${
                    task.priority === 'critical' ? 'bg-red-500' :
                    task.priority === 'high' ? 'bg-orange-500' :
                    task.priority === 'medium' ? 'bg-yellow-500' : 'bg-gray-500'
                  }`} />
                  <div>
                    <p className="font-medium text-gray-900 text-sm">{task.task_name}</p>
                    <p className="text-xs text-gray-600">
                      Due: {new Date(task.due_date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                  task.priority === 'critical' ? 'bg-red-100 text-red-700' :
                  task.priority === 'high' ? 'bg-orange-100 text-orange-700' :
                  task.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-700'
                }`}>
                  {task.priority}
                </span>
              </div>
            ))}
            
            {taskList.length === 0 && (
              <div className="text-center py-8">
                <CheckCircle className="w-8 h-8 text-green-400 mx-auto mb-2" />
                <p className="text-gray-500 text-sm">All caught up! No upcoming tasks.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link 
            to="/wedding/party"
            className="flex flex-col items-center p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors group"
          >
            <Users className="w-8 h-8 text-blue-600 mb-2 group-hover:scale-110 transition-transform" />
            <span className="text-sm font-medium text-gray-900">Invite Members</span>
          </Link>
          
          <Link 
            to="/wedding/timeline"
            className="flex flex-col items-center p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors group"
          >
            <Calendar className="w-8 h-8 text-purple-600 mb-2 group-hover:scale-110 transition-transform" />
            <span className="text-sm font-medium text-gray-900">View Timeline</span>
          </Link>
          
          <Link 
            to="/wedding/outfits"
            className="flex flex-col items-center p-4 bg-rose-50 rounded-lg hover:bg-rose-100 transition-colors group"
          >
            <CheckCircle className="w-8 h-8 text-rose-600 mb-2 group-hover:scale-110 transition-transform" />
            <span className="text-sm font-medium text-gray-900">Review Outfits</span>
          </Link>
          
          <Link 
            to="/wedding/communication"
            className="flex flex-col items-center p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors group"
          >
            <Mail className="w-8 h-8 text-green-600 mb-2 group-hover:scale-110 transition-transform" />
            <span className="text-sm font-medium text-gray-900">Send Update</span>
          </Link>
        </div>
      </div>
    </div>
  )
}
