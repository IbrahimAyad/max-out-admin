import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { 
  Shirt, 
  CheckCircle, 
  X, 
  Eye, 
  Star,
  AlertTriangle
} from 'lucide-react'
import { weddingPortalAPI } from '@/lib/supabase'

export function OutfitCoordination() {
  const [weddingId] = useState(() => localStorage.getItem('wedding_id') || '')
  const [selectedMember, setSelectedMember] = useState<string | null>(null)

  // Get party members with their outfit selections
  const { data: partyMembers, isLoading } = useQuery({
    queryKey: ['party-members-outfits', weddingId],
    queryFn: () => weddingPortalAPI.getPartyMembers(weddingId, { include_outfits: true, include_measurements: true }),
    enabled: !!weddingId
  })

  const members = partyMembers?.data || []

  const getOutfitStatus = (member: any) => {
    if (member.outfit_status === 'confirmed') {
      return { color: 'text-green-600 bg-green-100', label: 'Approved', icon: CheckCircle }
    } else if (member.outfit_status === 'selected') {
      return { color: 'text-yellow-600 bg-yellow-100', label: 'Pending Approval', icon: AlertTriangle }
    } else {
      return { color: 'text-gray-600 bg-gray-100', label: 'Not Selected', icon: X }
    }
  }

  const handleApproveOutfit = (memberId: string, outfitId: string) => {
    // Implementation would go here
    console.log('Approving outfit for member:', memberId, outfitId)
  }

  const handleRequestChanges = (memberId: string, outfitId: string) => {
    // Implementation would go here
    console.log('Requesting changes for outfit:', memberId, outfitId)
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg shadow p-6">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                <div className="h-3 bg-gray-200 rounded w-1/2 mb-4" />
                <div className="h-32 bg-gray-200 rounded" />
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
          <h1 className="text-2xl font-bold text-gray-900">Outfit Coordination</h1>
          <p className="text-gray-600">Review and approve wedding party outfits</p>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center space-x-3">
            <Shirt className="w-8 h-8 text-blue-600" />
            <div>
              <p className="text-sm text-gray-600">Total Outfits</p>
              <p className="text-2xl font-bold text-gray-900">{members.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center space-x-3">
            <CheckCircle className="w-8 h-8 text-green-600" />
            <div>
              <p className="text-sm text-gray-600">Approved</p>
              <p className="text-2xl font-bold text-gray-900">
                {members.filter(m => m.outfit_status === 'confirmed').length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center space-x-3">
            <AlertTriangle className="w-8 h-8 text-yellow-600" />
            <div>
              <p className="text-sm text-gray-600">Pending Review</p>
              <p className="text-2xl font-bold text-gray-900">
                {members.filter(m => m.outfit_status === 'selected').length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center space-x-3">
            <X className="w-8 h-8 text-red-600" />
            <div>
              <p className="text-sm text-gray-600">Not Selected</p>
              <p className="text-2xl font-bold text-gray-900">
                {members.filter(m => m.outfit_status === 'pending').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Outfit Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {members.map((member: any) => {
          const outfitStatus = getOutfitStatus(member)
          const StatusIcon = outfitStatus.icon
          
          return (
            <div key={member.id} className="bg-white rounded-lg shadow-lg overflow-hidden">
              {/* Member Header */}
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="bg-gray-200 text-gray-600 w-10 h-10 rounded-full flex items-center justify-center font-medium">
                      {member.first_name[0]}{member.last_name[0]}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {member.first_name} {member.last_name}
                      </h3>
                      <p className="text-sm text-gray-600">{member.role.replace('_', ' ')}</p>
                    </div>
                  </div>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full flex items-center space-x-1 ${outfitStatus.color}`}>
                    <StatusIcon className="w-3 h-3" />
                    <span>{outfitStatus.label}</span>
                  </span>
                </div>
              </div>
              
              {/* Outfit Preview */}
              <div className="p-4">
                {member.outfit_status !== 'pending' ? (
                  <div className="space-y-4">
                    {/* Outfit Image Placeholder */}
                    <div className="bg-gray-100 rounded-lg h-48 flex items-center justify-center">
                      <div className="text-center">
                        <Shirt className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-500">Outfit Preview</p>
                      </div>
                    </div>
                    
                    {/* Outfit Details */}
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Jacket:</span>
                        <span className="font-medium">Classic Black Tuxedo</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Shirt:</span>
                        <span className="font-medium">White Formal Shirt</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Tie:</span>
                        <span className="font-medium">Black Bow Tie</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Shoes:</span>
                        <span className="font-medium">Black Patent Leather</span>
                      </div>
                    </div>
                    
                    {/* Coordination Score */}
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700">Style Coordination</span>
                        <div className="flex items-center space-x-1">
                          {[...Array(5)].map((_, i) => (
                            <Star 
                              key={i} 
                              className={`w-4 h-4 ${i < 4 ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} 
                            />
                          ))}
                        </div>
                      </div>
                      <p className="text-xs text-gray-600">Excellent match with wedding theme</p>
                    </div>
                    
                    {/* Action Buttons */}
                    {member.outfit_status === 'selected' && (
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleApproveOutfit(member.id, 'outfit_id')}
                          className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center space-x-1"
                        >
                          <CheckCircle className="w-4 h-4" />
                          <span>Approve</span>
                        </button>
                        <button
                          onClick={() => handleRequestChanges(member.id, 'outfit_id')}
                          className="flex-1 bg-gray-600 text-white py-2 rounded-lg hover:bg-gray-700 transition-colors"
                        >
                          Request Changes
                        </button>
                      </div>
                    )}
                    
                    {member.outfit_status === 'confirmed' && (
                      <div className="flex items-center space-x-2">
                        <button className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-1">
                          <Eye className="w-4 h-4" />
                          <span>View Details</span>
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Shirt className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <h4 className="font-medium text-gray-900 mb-1">No Outfit Selected</h4>
                    <p className="text-sm text-gray-600 mb-4">
                      Waiting for {member.first_name} to select their outfit
                    </p>
                    <button className="text-rose-600 hover:text-rose-700 text-sm font-medium">
                      Send Reminder
                    </button>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Style Guide */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Wedding Style Guide</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Color Palette</h4>
            <div className="flex space-x-2 mb-3">
              <div className="w-8 h-8 bg-black rounded-full" title="Black" />
              <div className="w-8 h-8 bg-white border border-gray-300 rounded-full" title="White" />
              <div className="w-8 h-8 bg-gray-400 rounded-full" title="Silver" />
            </div>
            <p className="text-sm text-gray-600">Classic black-tie elegance</p>
          </div>
          
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Formality Level</h4>
            <span className="inline-block px-3 py-1 bg-purple-100 text-purple-800 text-sm font-medium rounded-full mb-2">
              Black Tie
            </span>
            <p className="text-sm text-gray-600">Formal evening wear required</p>
          </div>
          
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Style Notes</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Peak lapel tuxedos preferred</li>
              <li>• Black bow ties required</li>
              <li>• Patent leather shoes</li>
              <li>• White pocket squares</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
