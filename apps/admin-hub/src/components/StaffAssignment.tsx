import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { User, Plus, Mail, Phone, CheckCircle, Clock, AlertTriangle } from 'lucide-react'
import { weddingAPI } from '../lib/supabase'

interface StaffAssignmentProps {
  weddingId: string
}

export function StaffAssignment({ weddingId }: StaffAssignmentProps) {
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false)
  const queryClient = useQueryClient()

  // Get current staff assignments
  const { data: staffAssignments } = useQuery({
    queryKey: ['staff-assignments', weddingId],
    queryFn: () => weddingAPI.getWedding(weddingId, { include_staff: true })
  })

  // Mock staff list - in real implementation, this would come from user management system
  const availableStaff = [
    { id: '1', name: 'Sarah Johnson', role: 'Senior Coordinator', email: 'sarah@kct.com', phone: '(555) 123-4567', workload: 8 },
    { id: '2', name: 'Michael Chen', role: 'Coordinator', email: 'michael@kct.com', phone: '(555) 234-5678', workload: 12 },
    { id: '3', name: 'Emily Rodriguez', role: 'Assistant Coordinator', email: 'emily@kct.com', phone: '(555) 345-6789', workload: 6 }
  ]

  const assignCoordinatorMutation = useMutation({
    mutationFn: ({ coordinatorId }: { coordinatorId: string }) => 
      weddingAPI.assignCoordinator(weddingId, coordinatorId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff-assignments', weddingId] })
      setIsAssignModalOpen(false)
    }
  })

  const currentCoordinator = staffAssignments?.data?.coordinator

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Staff Assignment</h3>
        <button
          onClick={() => setIsAssignModalOpen(true)}
          className="bg-black text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-gray-800 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Assign Staff</span>
        </button>
      </div>

      {/* Current Coordinator */}
      {currentCoordinator ? (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="bg-blue-100 text-blue-600 w-12 h-12 rounded-full flex items-center justify-center">
                <User className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-lg font-semibold text-gray-900">Wedding Coordinator</h4>
                <p className="text-gray-600">{currentCoordinator.name}</p>
                <div className="flex items-center space-x-4 mt-1">
                  <div className="flex items-center space-x-1 text-sm text-gray-500">
                    <Mail className="w-4 h-4" />
                    <span>{currentCoordinator.email}</span>
                  </div>
                  <div className="flex items-center space-x-1 text-sm text-gray-500">
                    <Phone className="w-4 h-4" />
                    <span>{currentCoordinator.phone}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="text-right">
              <span className="px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full">
                Assigned
              </span>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
          <AlertTriangle className="w-12 h-12 text-yellow-600 mx-auto mb-4" />
          <h4 className="text-lg font-medium text-gray-900 mb-2">No Coordinator Assigned</h4>
          <p className="text-gray-600 mb-4">This wedding needs a coordinator to manage the process.</p>
          <button
            onClick={() => setIsAssignModalOpen(true)}
            className="bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 transition-colors"
          >
            Assign Coordinator
          </button>
        </div>
      )}

      {/* Staff Workload Overview */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h4 className="text-lg font-semibold text-gray-900 mb-4">Team Workload</h4>
        <div className="space-y-4">
          {availableStaff.map((staff) => {
            const workloadPercentage = Math.min((staff.workload / 15) * 100, 100)
            const isOverloaded = staff.workload > 12
            
            return (
              <div key={staff.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="bg-gray-200 text-gray-600 w-10 h-10 rounded-full flex items-center justify-center font-medium">
                    {staff.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{staff.name}</p>
                    <p className="text-sm text-gray-600">{staff.role}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">{staff.workload} active weddings</p>
                    <div className="w-32 bg-gray-200 rounded-full h-2 mt-1">
                      <div 
                        className={`h-2 rounded-full transition-all duration-300 ${
                          isOverloaded ? 'bg-red-500' : workloadPercentage > 80 ? 'bg-yellow-500' : 'bg-green-500'
                        }`}
                        style={{ width: `${workloadPercentage}%` }}
                      />
                    </div>
                  </div>
                  {isOverloaded && (
                    <AlertTriangle className="w-5 h-5 text-red-500" />
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Assignment Modal */}
      {isAssignModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Assign Wedding Coordinator</h3>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {availableStaff.map((staff) => (
                  <div 
                    key={staff.id} 
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                    onClick={() => assignCoordinatorMutation.mutate({ coordinatorId: staff.id })}
                  >
                    <div className="flex items-center space-x-4">
                      <div className="bg-gray-200 text-gray-600 w-10 h-10 rounded-full flex items-center justify-center font-medium">
                        {staff.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{staff.name}</p>
                        <p className="text-sm text-gray-600">{staff.role}</p>
                        <p className="text-xs text-gray-500">{staff.workload} active weddings</p>
                      </div>
                    </div>
                    {staff.workload > 12 && (
                      <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded-full">
                        Overloaded
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => setIsAssignModalOpen(false)}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}