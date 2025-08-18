import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { 
  ArrowLeft,
  Heart,
  Users,
  Calendar,
  MapPin,
  Clock,
  CheckCircle,
  AlertTriangle,
  Mail,
  Phone,
  MoreHorizontal,
  Plus,
  Filter,
  Search,
  TrendingUp,
  DollarSign,
  Package,
  Settings
} from 'lucide-react'
import { weddingAPI } from '../lib/supabase'
import { StaffAssignment } from './StaffAssignment'
import { WeddingOrders } from './WeddingOrders'
import { WeddingAnalytics } from './WeddingAnalytics'

interface WeddingDetailsProps {
  weddingId: string
  onBack: () => void
}

interface PartyMember {
  id: string
  first_name: string
  last_name: string
  email: string
  phone?: string
  role: string
  invite_status: string
  measurements_status: string
  outfit_status: string
  payment_status: string
  overall_completion_percentage: number
}

interface Task {
  id: string
  task_name: string
  description: string
  due_date: string
  priority: string
  status: string
  assigned_to: string
  category: string
}

export function WeddingDetails({ weddingId, onBack }: WeddingDetailsProps) {
  const [activeTab, setActiveTab] = useState('overview')
  const queryClient = useQueryClient()

  // Get wedding dashboard data
  const { data: weddingDashboard, isLoading } = useQuery({
    queryKey: ['wedding-dashboard', weddingId],
    queryFn: () => weddingAPI.getWeddingDashboard(weddingId)
  })

  // Get party members
  const { data: partyMembers } = useQuery({
    queryKey: ['party-members', weddingId],
    queryFn: () => weddingAPI.getPartyMembers(weddingId, { include_measurements: true, include_outfits: true })
  })

  // Get tasks
  const { data: tasks } = useQuery({
    queryKey: ['wedding-tasks', weddingId],
    queryFn: () => weddingAPI.getTasks(weddingId, { include_member_details: true })
  })

  const dashboard = weddingDashboard?.data
  const members = partyMembers?.data || []
  const taskList = tasks?.data || []

  const getStatusColor = (status: string, type: 'member' | 'task' = 'member') => {
    if (type === 'member') {
      const colors = {
        pending: 'text-yellow-600 bg-yellow-100',
        submitted: 'text-blue-600 bg-blue-100', 
        confirmed: 'text-green-600 bg-green-100',
        paid: 'text-green-600 bg-green-100'
      }
      return colors[status as keyof typeof colors] || 'text-gray-600 bg-gray-100'
    } else {
      const colors = {
        pending: 'text-yellow-600 bg-yellow-100',
        in_progress: 'text-blue-600 bg-blue-100',
        completed: 'text-green-600 bg-green-100',
        overdue: 'text-red-600 bg-red-100'
      }
      return colors[status as keyof typeof colors] || 'text-gray-600 bg-gray-100'
    }
  }

  const getPriorityColor = (priority: string) => {
    const colors = {
      low: 'text-gray-600',
      medium: 'text-yellow-600',
      high: 'text-orange-600',
      critical: 'text-red-600'
    }
    return colors[priority as keyof typeof colors] || 'text-gray-600'
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-lg">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-64 mb-2" />
            <div className="h-4 bg-gray-200 rounded w-32" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg shadow p-6 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-24 mb-2" />
              <div className="h-8 bg-gray-200 rounded w-16" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (!dashboard) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Wedding not found</h3>
        <p className="text-gray-600 mb-4">The wedding you're looking for doesn't exist or has been removed.</p>
        <button
          onClick={onBack}
          className="bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors"
        >
          Back to Weddings
        </button>
      </div>
    )
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Heart },
    { id: 'members', label: 'Party Members', icon: Users },
    { id: 'timeline', label: 'Timeline', icon: Calendar },
    { id: 'communication', label: 'Communication', icon: Mail },
    { id: 'staff', label: 'Staff Assignment', icon: Users },
    { id: 'orders', label: 'Orders', icon: Clock },
    { id: 'analytics', label: 'Analytics', icon: TrendingUp }
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button 
            onClick={onBack}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center space-x-3">
            <Heart className="w-8 h-8 text-rose-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{dashboard.wedding.wedding_code}</h1>
              <p className="text-gray-600">
                {formatDate(dashboard.wedding.wedding_date)} • {dashboard.wedding.days_until_wedding} days to go
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <span className="px-3 py-1 text-sm font-medium bg-blue-100 text-blue-800 rounded-full">
            {dashboard.wedding.status}
          </span>
        </div>
      </div>

      {/* Progress Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-600">Overall Progress</p>
            <CheckCircle className="w-5 h-5 text-green-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{dashboard.wedding.completion_percentage}%</p>
          <div className="mt-2 bg-gray-200 rounded-full h-2">
            <div 
              className="bg-green-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${dashboard.wedding.completion_percentage}%` }}
            />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-600">Party Members</p>
            <Users className="w-5 h-5 text-blue-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{dashboard.party_progress.total_members}</p>
          <p className="text-sm text-gray-500 mt-1">
            {dashboard.party_progress.measurements_completed} measurements complete
          </p>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-600">Tasks</p>
            <Clock className="w-5 h-5 text-orange-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {dashboard.task_summary.completed_tasks}/{dashboard.task_summary.total_tasks}
          </p>
          <p className="text-sm text-gray-500 mt-1">
            {dashboard.task_summary.overdue_tasks} overdue
          </p>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-600">Payments</p>
            <CheckCircle className="w-5 h-5 text-green-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{dashboard.party_progress.payments_percentage}%</p>
          <p className="text-sm text-gray-500 mt-1">
            {dashboard.party_progress.payments_completed} completed
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6">
            {tabs.map((tab) => {
              const IconComponent = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-black text-black'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <IconComponent className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              )
            })}
          </nav>
        </div>
        
        <div className="p-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Progress Overview</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">Measurements</p>
                        <p className="text-sm text-gray-600">
                          {dashboard.party_progress.measurements_completed} of {dashboard.party_progress.total_members} complete
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-blue-600">{dashboard.party_progress.measurements_percentage}%</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">Outfit Selection</p>
                        <p className="text-sm text-gray-600">
                          {dashboard.party_progress.outfits_selected} of {dashboard.party_progress.total_members} selected
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-purple-600">{dashboard.party_progress.outfits_percentage}%</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">Payments</p>
                        <p className="text-sm text-gray-600">
                          {dashboard.party_progress.payments_completed} of {dashboard.party_progress.total_members} paid
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-green-600">{dashboard.party_progress.payments_percentage}%</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Upcoming Deadlines</h3>
                  <div className="space-y-3">
                    {taskList.filter(task => task.status !== 'completed').slice(0, 5).map((task) => (
                      <div key={task.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-900 text-sm">{task.task_name}</p>
                          <p className="text-xs text-gray-600">{formatDate(task.due_date)}</p>
                        </div>
                        <span className={`text-xs font-medium ${getPriorityColor(task.priority)}`}>
                          {task.priority}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {activeTab === 'members' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Party Members</h3>
                <button className="bg-black text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-gray-800 transition-colors">
                  <Plus className="w-4 h-4" />
                  <span>Invite Member</span>
                </button>
              </div>
              
              <div className="space-y-3">
                {members.map((member: PartyMember) => (
                  <div key={member.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="bg-gray-200 text-gray-600 w-10 h-10 rounded-full flex items-center justify-center font-medium">
                        {member.first_name[0]}{member.last_name[0]}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {member.first_name} {member.last_name}
                        </p>
                        <p className="text-sm text-gray-600">{member.role}</p>
                        <p className="text-sm text-gray-500">{member.email}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      <div className="text-center">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(member.measurements_status)}`}>
                          Measurements
                        </span>
                      </div>
                      <div className="text-center">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(member.outfit_status)}`}>
                          Outfit
                        </span>
                      </div>
                      <div className="text-center">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(member.payment_status)}`}>
                          Payment
                        </span>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">{member.overall_completion_percentage}%</p>
                      </div>
                      <MoreHorizontal className="w-4 h-4 text-gray-400" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {activeTab === 'timeline' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Wedding Timeline</h3>
                <div className="flex items-center space-x-2">
                  <Filter className="w-4 h-4 text-gray-400" />
                  <select className="border border-gray-300 rounded px-3 py-1 text-sm">
                    <option>All Tasks</option>
                    <option>Pending</option>
                    <option>In Progress</option>
                    <option>Completed</option>
                    <option>Overdue</option>
                  </select>
                </div>
              </div>
              
              <div className="space-y-3">
                {taskList.map((task: Task) => (
                  <div key={task.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className={`w-3 h-3 rounded-full ${task.status === 'completed' ? 'bg-green-600' : task.status === 'overdue' ? 'bg-red-600' : 'bg-gray-400'}`} />
                      <div>
                        <p className="font-medium text-gray-900">{task.task_name}</p>
                        <p className="text-sm text-gray-600">{task.description}</p>
                        <p className="text-xs text-gray-500">Due: {formatDate(task.due_date)}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(task.status, 'task')}`}>
                        {task.status.replace('_', ' ')}
                      </span>
                      <span className={`text-xs font-medium ${getPriorityColor(task.priority)}`}>
                        {task.priority}
                      </span>
                      <MoreHorizontal className="w-4 h-4 text-gray-400" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {activeTab === 'communication' && (
            <div className="text-center py-12">
              <Mail className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Communication Center</h3>
              <p className="text-gray-600 mb-4">Send messages and updates to the wedding party</p>
              <button className="bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors">
                Compose Message
              </button>
            </div>
          )}
          
          {activeTab === 'staff' && (
            <StaffAssignment weddingId={weddingId} />
          )}
          
          {activeTab === 'orders' && (
            <WeddingOrders weddingId={weddingId} />
          )}
          
          {activeTab === 'analytics' && (
            <WeddingAnalytics weddingId={weddingId} />
          )}
        </div>
      </div>
    </div>
  )
}
