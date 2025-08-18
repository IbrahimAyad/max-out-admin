import { useState, useEffect } from 'react'
import { ArrowLeft, Calendar, CheckCircle, Clock, AlertTriangle, User } from 'lucide-react'
import { MobileLayout } from '@/components/MobileLayout'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { supabase } from '@/lib/supabase'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

export function TimelinePage() {
  const [timelineData, setTimelineData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const navigate = useNavigate()

  useEffect(() => {
    loadTimelineData()
  }, [filter])

  const loadTimelineData = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('groomsmen-timeline', {
        body: { status: filter }
      })
      
      if (error) {
        throw new Error(error.message)
      }

      setTimelineData(data.data)
    } catch (error: any) {
      console.error('Load timeline error:', error)
      toast.error(error.message || 'Failed to load timeline data')
    } finally {
      setLoading(false)
    }
  }

  const updateTaskStatus = async (taskId: string, status: string, notes?: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('groomsmen-timeline/update-task', {
        body: { taskId, status, notes }
      })
      
      if (error || !data) {
        throw new Error(error?.message || 'Failed to update task')
      }

      if (data.error) {
        throw new Error(data.error.message)
      }

      toast.success('Task updated successfully!')
      await loadTimelineData()
    } catch (error: any) {
      console.error('Update task error:', error)
      toast.error(error.message || 'Failed to update task')
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

  const getTaskIcon = (task: any) => {
    if (task.status === 'completed') return <CheckCircle className="h-5 w-5 text-green-600" />
    if (task.isOverdue) return <AlertTriangle className="h-5 w-5 text-red-600" />
    if (task.isUrgent) return <Clock className="h-5 w-5 text-orange-600" />
    return <div className="h-5 w-5 border-2 border-gray-300 rounded-full" />
  }

  const getTaskColor = (task: any) => {
    if (task.status === 'completed') return 'bg-green-50 border-green-200'
    if (task.isOverdue) return 'bg-red-50 border-red-200'
    if (task.isUrgent) return 'bg-orange-50 border-orange-200'
    return 'bg-white border-gray-200'
  }

  return (
    <MobileLayout>
      <div className="p-4 space-y-6">
        {/* Header */}
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/dashboard')}
            className="p-2 rounded-lg bg-white shadow-md"
          >
            <ArrowLeft size={20} className="text-gray-600" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Timeline</h1>
            <p className="text-sm text-gray-600">Your wedding preparation tasks</p>
          </div>
        </div>

        {/* Wedding Countdown */}
        {timelineData?.wedding && (
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-6 text-white text-center">
            <Calendar className="h-8 w-8 mx-auto mb-2" />
            <h2 className="text-xl font-semibold">
              {timelineData.wedding.daysUntil} Days Until Wedding
            </h2>
            <p className="text-blue-100">
              {new Date(timelineData.wedding.date).toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </p>
          </div>
        )}

        {/* Summary Stats */}
        {timelineData?.summary && (
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Progress Summary</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <p className="text-2xl font-bold text-green-600">{timelineData.summary.completedTasks}</p>
                <p className="text-sm text-green-700">Completed</p>
              </div>
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <p className="text-2xl font-bold text-blue-600">{timelineData.summary.pendingTasks}</p>
                <p className="text-sm text-blue-700">Pending</p>
              </div>
              {timelineData.summary.urgentTasks > 0 && (
                <div className="text-center p-3 bg-orange-50 rounded-lg">
                  <p className="text-2xl font-bold text-orange-600">{timelineData.summary.urgentTasks}</p>
                  <p className="text-sm text-orange-700">Urgent</p>
                </div>
              )}
              {timelineData.summary.overdueTasks > 0 && (
                <div className="text-center p-3 bg-red-50 rounded-lg">
                  <p className="text-2xl font-bold text-red-600">{timelineData.summary.overdueTasks}</p>
                  <p className="text-sm text-red-700">Overdue</p>
                </div>
              )}
            </div>
            <div className="mt-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-600">Overall Progress</span>
                <span className="text-sm font-semibold text-gray-900">{timelineData.summary.completionRate}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${timelineData.summary.completionRate}%` }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Filter Buttons */}
        <div className="flex space-x-2 overflow-x-auto">
          {[
            { key: 'all', label: 'All Tasks' },
            { key: 'pending', label: 'Pending' },
            { key: 'completed', label: 'Completed' },
            { key: 'overdue', label: 'Overdue' }
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${
                filter === key
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-600 border border-gray-300'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Milestones */}
        {timelineData?.milestones && (
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Key Milestones</h3>
            <div className="space-y-3">
              {timelineData.milestones.map((milestone: any, index: number) => (
                <div key={index} className="flex items-center space-x-3">
                  {milestone.completed ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <div className="h-5 w-5 border-2 border-gray-300 rounded-full" />
                  )}
                  <div className="flex-1">
                    <p className={`text-sm font-medium ${
                      milestone.completed ? 'text-gray-900' : 'text-gray-500'
                    }`}>
                      {milestone.name}
                    </p>
                    {milestone.date && (
                      <p className="text-xs text-gray-500">
                        {new Date(milestone.date).toLocaleDateString()}
                      </p>
                    )}
                    {milestone.daysUntil !== undefined && (
                      <p className="text-xs text-gray-500">
                        {milestone.daysUntil} days remaining
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tasks List */}
        {timelineData?.tasks && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Tasks</h3>
            {timelineData.tasks.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-lg p-6 text-center">
                <p className="text-gray-500">No tasks found for the selected filter.</p>
              </div>
            ) : (
              timelineData.tasks.map((task: any) => (
                <div key={task.id} className={`rounded-2xl shadow-lg p-4 border ${getTaskColor(task)}`}>
                  <div className="flex items-start space-x-3">
                    <div className="mt-1">
                      {getTaskIcon(task)}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{task.taskName}</h4>
                      {task.description && (
                        <p className="text-sm text-gray-600 mt-1">{task.description}</p>
                      )}
                      <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                        <span className="capitalize">{task.category}</span>
                        {task.dueDate && (
                          <span>
                            Due: {new Date(task.dueDate).toLocaleDateString()}
                          </span>
                        )}
                        <span className="capitalize bg-gray-100 px-2 py-1 rounded">
                          {task.priority}
                        </span>
                      </div>
                      {task.status !== 'completed' && (
                        <div className="mt-3 flex space-x-2">
                          <button
                            onClick={() => updateTaskStatus(task.id, 'in_progress')}
                            className="text-xs bg-blue-600 text-white px-3 py-1 rounded"
                          >
                            Start
                          </button>
                          <button
                            onClick={() => {
                              const notes = prompt('Any completion notes?')
                              updateTaskStatus(task.id, 'completed', notes || '')
                            }}
                            className="text-xs bg-green-600 text-white px-3 py-1 rounded"
                          >
                            Complete
                          </button>
                        </div>
                      )}
                      {task.completionNotes && (
                        <div className="mt-2 p-2 bg-gray-50 rounded text-xs text-gray-600">
                          <strong>Notes:</strong> {task.completionNotes}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </MobileLayout>
  )
}