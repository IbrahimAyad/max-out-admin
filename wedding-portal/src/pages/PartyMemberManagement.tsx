import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { 
  Users, 
  Plus, 
  Mail, 
  Phone, 
  MoreHorizontal, 
  CheckCircle,
  Clock,
  AlertTriangle,
  X,
  Send,
  UserPlus,
  Edit
} from 'lucide-react'
import { weddingPortalAPI } from '@/lib/supabase'

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
  invite_code?: string
}

export function PartyMemberManagement() {
  const [weddingId] = useState(() => localStorage.getItem('wedding_id') || '')
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false)
  const [selectedMember, setSelectedMember] = useState<PartyMember | null>(null)
  const queryClient = useQueryClient()

  // Get party members
  const { data: partyMembers, isLoading } = useQuery({
    queryKey: ['party-members', weddingId],
    queryFn: () => weddingPortalAPI.getPartyMembers(weddingId, { include_measurements: true, include_outfits: true }),
    enabled: !!weddingId
  })

  const members = partyMembers?.data || []

  const getStatusColor = (status: string) => {
    const colors = {
      pending: 'text-yellow-600 bg-yellow-100',
      submitted: 'text-blue-600 bg-blue-100',
      confirmed: 'text-green-600 bg-green-100',
      paid: 'text-green-600 bg-green-100',
      sent: 'text-blue-600 bg-blue-100',
      accepted: 'text-green-600 bg-green-100',
      declined: 'text-red-600 bg-red-100'
    }
    return colors[status as keyof typeof colors] || 'text-gray-600 bg-gray-100'
  }

  const getRoleDisplayName = (role: string) => {
    const roles = {
      best_man: 'Best Man',
      groomsman: 'Groomsman',
      usher: 'Usher',
      groom: 'Groom',
      father: 'Father of Groom',
      coordinator: 'Wedding Coordinator'
    }
    return roles[role as keyof typeof roles] || role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-64 mb-2" />
            <div className="h-4 bg-gray-200 rounded w-48" />
          </div>
          <div className="h-10 bg-gray-200 rounded w-32" />
        </div>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg shadow p-6 animate-pulse">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gray-200 rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-48" />
                  <div className="h-3 bg-gray-200 rounded w-32" />
                </div>
                <div className="space-x-2 flex">
                  <div className="h-6 bg-gray-200 rounded w-16" />
                  <div className="h-6 bg-gray-200 rounded w-16" />
                  <div className="h-6 bg-gray-200 rounded w-16" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Wedding Party Management</h1>
          <p className="text-gray-600">Invite and coordinate your wedding party members</p>
        </div>
        <button
          onClick={() => setIsInviteModalOpen(true)}
          className="bg-rose-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-rose-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Invite Member</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center space-x-3">
            <Users className="w-8 h-8 text-blue-600" />
            <div>
              <p className="text-sm text-gray-600">Total Members</p>
              <p className="text-2xl font-bold text-gray-900">{members.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center space-x-3">
            <CheckCircle className="w-8 h-8 text-green-600" />
            <div>
              <p className="text-sm text-gray-600">Confirmed</p>
              <p className="text-2xl font-bold text-gray-900">
                {members.filter(m => m.invite_status === 'accepted').length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center space-x-3">
            <Clock className="w-8 h-8 text-yellow-600" />
            <div>
              <p className="text-sm text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-gray-900">
                {members.filter(m => m.invite_status === 'pending' || m.invite_status === 'sent').length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center space-x-3">
            <AlertTriangle className="w-8 h-8 text-orange-600" />
            <div>
              <p className="text-sm text-gray-600">Need Attention</p>
              <p className="text-2xl font-bold text-gray-900">
                {members.filter(m => m.overall_completion_percentage < 50).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Members List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Wedding Party Members</h3>
        </div>
        
        {members.length === 0 ? (
          <div className="p-6 text-center">
            <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No party members yet</h3>
            <p className="text-gray-600 mb-4">
              Start building your wedding party by sending invitations
            </p>
            <button
              onClick={() => setIsInviteModalOpen(true)}
              className="bg-rose-600 text-white px-4 py-2 rounded-lg hover:bg-rose-700 transition-colors"
            >
              Send First Invitation
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {members.map((member) => (
              <div key={member.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="bg-gray-200 text-gray-600 w-12 h-12 rounded-full flex items-center justify-center font-medium">
                      {member.first_name[0]}{member.last_name[0]}
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900">
                        {member.first_name} {member.last_name}
                      </h4>
                      <p className="text-gray-600">{getRoleDisplayName(member.role)}</p>
                      <div className="flex items-center space-x-4 mt-1">
                        <div className="flex items-center space-x-1 text-sm text-gray-500">
                          <Mail className="w-4 h-4" />
                          <span>{member.email}</span>
                        </div>
                        {member.phone && (
                          <div className="flex items-center space-x-1 text-sm text-gray-500">
                            <Phone className="w-4 h-4" />
                            <span>{member.phone}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    {/* Status Badges */}
                    <div className="flex flex-col space-y-2">
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(member.invite_status)}`}>
                          {member.invite_status === 'sent' ? 'Invited' : 
                           member.invite_status === 'accepted' ? 'Confirmed' :
                           member.invite_status === 'pending' ? 'Pending' : 
                           member.invite_status}
                        </span>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(member.measurements_status)}`}>
                          Measurements: {member.measurements_status}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(member.outfit_status)}`}>
                          Outfit: {member.outfit_status}
                        </span>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(member.payment_status)}`}>
                          Payment: {member.payment_status}
                        </span>
                      </div>
                    </div>
                    
                    {/* Progress */}
                    <div className="text-right min-w-[80px]">
                      <p className="text-sm font-medium text-gray-900">
                        {member.overall_completion_percentage || 0}% complete
                      </p>
                      <div className="w-16 bg-gray-200 rounded-full h-2 mt-1">
                        <div 
                          className={`h-2 rounded-full transition-all duration-300 ${
                            (member.overall_completion_percentage || 0) >= 80 ? 'bg-green-600' :
                            (member.overall_completion_percentage || 0) >= 50 ? 'bg-blue-600' :
                            (member.overall_completion_percentage || 0) >= 25 ? 'bg-yellow-600' : 'bg-red-600'
                          }`}
                          style={{ width: `${member.overall_completion_percentage || 0}%` }}
                        />
                      </div>
                    </div>
                    
                    <button
                      onClick={() => setSelectedMember(member)}
                      className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <MoreHorizontal className="w-5 h-5" />
                    </button>
                  </div>
                </div>
                
                {/* Invitation Details */}
                {member.invite_status === 'pending' && member.invite_code && (
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-blue-900">Invitation Ready</p>
                        <p className="text-xs text-blue-700">Share this link with {member.first_name}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <code className="text-xs bg-white px-2 py-1 rounded border">
                          {window.location.origin}/wedding-invitation/{member.invite_code}
                        </code>
                        <button className="text-blue-600 hover:text-blue-700">
                          <Send className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Invite Member Modal */}
      <InviteMemberModal 
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        weddingId={weddingId}
      />
      
      {/* Member Details Modal */}
      {selectedMember && (
        <MemberDetailsModal 
          member={selectedMember}
          onClose={() => setSelectedMember(null)}
        />
      )}
    </div>
  )
}

// Invite Member Modal Component
function InviteMemberModal({ isOpen, onClose, weddingId }: { 
  isOpen: boolean
  onClose: () => void
  weddingId: string
}) {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    role: 'groomsman',
    special_requests: ''
  })
  const queryClient = useQueryClient()

  const inviteMutation = useMutation({
    mutationFn: weddingPortalAPI.invitePartyMember,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['party-members'] })
      onClose()
      setFormData({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        role: 'groomsman',
        special_requests: ''
      })
    }
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    inviteMutation.mutate({
      ...formData,
      wedding_id: weddingId
    })
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Invite Party Member</h2>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
              <input
                type="text"
                value={formData.first_name}
                onChange={(e) => setFormData(prev => ({ ...prev, first_name: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
              <input
                type="text"
                value={formData.last_name}
                onChange={(e) => setFormData(prev => ({ ...prev, last_name: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                required
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-rose-500 focus:border-transparent"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Phone (Optional)</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-rose-500 focus:border-transparent"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
            <select
              value={formData.role}
              onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-rose-500 focus:border-transparent"
            >
              <option value="groomsman">Groomsman</option>
              <option value="best_man">Best Man</option>
              <option value="usher">Usher</option>
              <option value="father">Father of Groom</option>
              <option value="coordinator">Wedding Coordinator</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Special Requests (Optional)</label>
            <textarea
              value={formData.special_requests}
              onChange={(e) => setFormData(prev => ({ ...prev, special_requests: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-rose-500 focus:border-transparent"
              rows={3}
              placeholder="Any special sizing, fit preferences, or requests..."
            />
          </div>
          
          <div className="flex items-center justify-end space-x-4 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={inviteMutation.isPending}
              className="px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {inviteMutation.isPending ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
              ) : (
                <UserPlus className="w-4 h-4" />
              )}
              <span>Send Invitation</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Member Details Modal Component
function MemberDetailsModal({ member, onClose }: { 
  member: PartyMember
  onClose: () => void
}) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {member.first_name} {member.last_name}
          </h2>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <div className="p-6 space-y-6">
          {/* Member Info */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-3">Member Information</h3>
            <div className="space-y-2 text-sm">
              <p><strong>Role:</strong> {member.role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</p>
              <p><strong>Email:</strong> {member.email}</p>
              {member.phone && <p><strong>Phone:</strong> {member.phone}</p>}
            </div>
          </div>
          
          {/* Progress */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-3">Progress Overview</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Overall Completion</span>
                <span className="font-semibold">{member.overall_completion_percentage || 0}%</span>
              </div>
              <div className="bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-rose-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${member.overall_completion_percentage || 0}%` }}
                />
              </div>
            </div>
          </div>
          
          {/* Status Details */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-3">Status Details</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Invitation</span>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(member.invite_status)}`}>
                  {member.invite_status}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Measurements</span>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(member.measurements_status)}`}>
                  {member.measurements_status}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Outfit</span>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(member.outfit_status)}`}>
                  {member.outfit_status}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Payment</span>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(member.payment_status)}`}>
                  {member.payment_status}
                </span>
              </div>
            </div>
          </div>
          
          {/* Actions */}
          <div className="flex items-center space-x-3 pt-4 border-t border-gray-200">
            <button className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center space-x-2">
              <Mail className="w-4 h-4" />
              <span>Send Message</span>
            </button>
            <button className="flex-1 bg-rose-600 text-white py-2 rounded-lg hover:bg-rose-700 transition-colors flex items-center justify-center space-x-2">
              <Edit className="w-4 h-4" />
              <span>Edit Details</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function getStatusColor(status: string) {
  const colors = {
    pending: 'text-yellow-600 bg-yellow-100',
    submitted: 'text-blue-600 bg-blue-100',
    confirmed: 'text-green-600 bg-green-100',
    paid: 'text-green-600 bg-green-100',
    sent: 'text-blue-600 bg-blue-100',
    accepted: 'text-green-600 bg-green-100',
    declined: 'text-red-600 bg-red-100'
  }
  return colors[status as keyof typeof colors] || 'text-gray-600 bg-gray-100'
}
