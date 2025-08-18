import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { 
  Calendar, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  Filter,
  Plus,
  MoreHorizontal
} from 'lucide-react'
import { weddingPortalAPI } from '@/lib/supabase'

export function TimelinePage() {
  const [weddingId] = useState(() => localStorage.getItem('wedding_id') || '')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterCategory, setFilterCategory] = useState('all')

  // Get wedding tasks
  const { data: tasks, isLoading } = useQuery({
    queryKey: ['wedding-tasks', weddingId, filterStatus, filterCategory],
    queryFn: () => weddingPortalAPI.getTasks(weddingId, { 
      status: filterStatus !== 'all' ? filterStatus : undefined,
      category: filterCategory !== 'all' ? filterCategory : undefined,
      include_member_details: true
    }),
    enabled: !!weddingId
  })

  const taskList = tasks?.data || []

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-600" />
      case 'overdue':
        return <AlertTriangle className="w-5 h-5 text-red-600" />
      case 'in_progress':
        return <Clock className="w-5 h-5 text-blue-600" />
      default:
        return <Clock className="w-5 h-5 text-gray-400" />
    }
  }

  const getPriorityColor = (priority: string) => {
    const colors = {
      critical: 'border-red-500 bg-red-50',
      high: 'border-orange-500 bg-orange-50',
      medium: 'border-yellow-500 bg-yellow-50',
      low: 'border-gray-300 bg-gray-50'
    }
    return colors[priority as keyof typeof colors] || colors.low
  }

  const getDaysUntilDue = (dueDate: string) => {
    const due = new Date(dueDate)
    const today = new Date()
    const diffTime = due.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4" />
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg shadow p-6">
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-2" />
                <div className="h-3 bg-gray-200 rounded w-3/4" />
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Wedding Timeline</h1>
          <p className="text-gray-600">Track your wedding preparation progress</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="border border-gray-300 rounded px-3 py-1 text-sm focus:ring-2 focus:ring-rose-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="overdue">Overdue</option>
            </select>
          </div>
          <div className="flex items-center space-x-2">
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="border border-gray-300 rounded px-3 py-1 text-sm focus:ring-2 focus:ring-rose-500 focus:border-transparent"
            >
              <option value="all">All Categories</option>
              <option value="setup">Setup</option>
              <option value="measurements">Measurements</option>
              <option value="selection">Selection</option>
              <option value="payment">Payment</option>
              <option value="fitting">Fitting</option>
              <option value="delivery">Delivery</option>
            </select>
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="space-y-4">
        {taskList.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No tasks found</h3>
            <p className="text-gray-600">
              {filterStatus !== 'all' || filterCategory !== 'all'
                ? 'Try adjusting your filters to see more tasks'
                : 'Your wedding timeline will appear here as tasks are created'}
            </p>
          </div>
        ) : (
          taskList.map((task: any) => {
            const daysUntil = getDaysUntilDue(task.due_date)
            const isOverdue = daysUntil < 0 && task.status !== 'completed'
            
            return (
              <div 
                key={task.id} 
                className={`bg-white rounded-lg shadow-lg border-l-4 p-6 ${getPriorityColor(task.priority)}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4">
                    {getStatusIcon(task.status)}
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{task.task_name}</h3>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          task.priority === 'critical' ? 'bg-red-100 text-red-700' :
                          task.priority === 'high' ? 'bg-orange-100 text-orange-700' :
                          task.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-700'
                        }`}>
                          {task.priority}
                        </span>
                      </div>
                      <p className="text-gray-600 mb-3">{task.description}</p>
                      
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-4 h-4" />
                          <span>Due: {formatDate(task.due_date)}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <span>Category: {task.category}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <span>Assigned to: {task.assigned_to}</span>
                        </div>
                      </div>
                      
                      {/* Due date warning */}
                      {isOverdue && (
                        <div className="mt-2 flex items-center space-x-2 text-red-600">
                          <AlertTriangle className="w-4 h-4" />
                          <span className="text-sm font-medium">Overdue by {Math.abs(daysUntil)} days</span>
                        </div>
                      )}
                      
                      {!isOverdue && daysUntil >= 0 && daysUntil <= 7 && task.status !== 'completed' && (
                        <div className="mt-2 flex items-center space-x-2 text-orange-600">
                          <Clock className="w-4 h-4" />
                          <span className="text-sm font-medium">
                            {daysUntil === 0 ? 'Due today' : 
                             daysUntil === 1 ? 'Due tomorrow' :
                             `Due in ${daysUntil} days`}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <span className={`px-3 py-1 text-sm font-medium rounded-full ${
                      task.status === 'completed' ? 'bg-green-100 text-green-700' :
                      task.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                      task.status === 'overdue' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'
                    }`}>
                      {task.status.replace('_', ' ')}
                    </span>
                    <button className="text-gray-400 hover:text-gray-600 transition-colors">
                      <MoreHorizontal className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
