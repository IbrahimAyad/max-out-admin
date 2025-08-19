import { useState, useEffect } from 'react'
import { ArrowLeft, Shirt, CheckCircle, Clock, AlertCircle } from 'lucide-react'
import { MobileLayout } from '@/components/MobileLayout'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { supabase } from '@/lib/supabase'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

export function OutfitPage() {
  const [outfitData, setOutfitData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    loadOutfitData()
  }, [])

  const loadOutfitData = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('groomsmen-outfit')
      
      if (error) {
        throw new Error(error.message)
      }

      setOutfitData(data.data)
    } catch (error: any) {
      console.error('Load outfit error:', error)
      if (!error.message.includes('No outfit')) {
        toast.error(error.message || 'Failed to load outfit data')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleApproval = async (approved: boolean, notes: string = '') => {
    try {
      const { data, error } = await supabase.functions.invoke('groomsmen-outfit/approve', {
        body: { approved, notes }
      })
      
      if (error || !data) {
        throw new Error(error?.message || 'Failed to submit approval')
      }

      if (data.error) {
        throw new Error(data.error.message)
      }

      toast.success(approved ? 'Outfit approved!' : 'Feedback submitted!')
      await loadOutfitData()
    } catch (error: any) {
      console.error('Approval error:', error)
      toast.error(error.message || 'Failed to submit approval')
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
            <h1 className="text-xl font-bold text-gray-900">Your Outfit</h1>
            <p className="text-sm text-gray-600">Review and approve your wedding outfit</p>
          </div>
        </div>

        {!outfitData?.hasOutfitAssigned ? (
          /* No Outfit Assigned */
          <div className="bg-white rounded-2xl shadow-lg p-6 text-center space-y-4">
            <div className="bg-blue-50 rounded-full p-6 w-24 h-24 mx-auto flex items-center justify-center">
              <Shirt className="h-12 w-12 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Outfit Assignment Pending</h2>
              <p className="text-gray-600">
                Your outfit will be assigned after your measurements are reviewed by our team.
              </p>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-700">
                <Clock className="inline h-4 w-4 mr-1" />
                Typically takes 1-2 business days after measurement submission
              </p>
            </div>
          </div>
        ) : (
          /* Outfit Details */
          <div className="space-y-6">
            {/* Outfit Status */}
            <div className={`rounded-2xl p-4 ${
              outfitData.outfit.approvals.approvedByMember 
                ? 'bg-green-50 border border-green-200'
                : 'bg-yellow-50 border border-yellow-200'
            }`}>
              <div className="flex items-center space-x-2 mb-2">
                {outfitData.outfit.approvals.approvedByMember ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-yellow-600" />
                )}
                <span className={`font-medium ${
                  outfitData.outfit.approvals.approvedByMember ? 'text-green-900' : 'text-yellow-900'
                }`}>
                  {outfitData.outfit.approvals.approvedByMember ? 'Outfit Approved' : 'Awaiting Your Approval'}
                </span>
              </div>
              {outfitData.outfit.approvals.approvalNotes && (
                <p className={`text-sm ${
                  outfitData.outfit.approvals.approvedByMember ? 'text-green-700' : 'text-yellow-700'
                }`}>
                  {outfitData.outfit.approvals.approvalNotes}
                </p>
              )}
            </div>

            {/* Outfit Items */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Outfit Components</h3>
              <div className="space-y-3">
                {Object.entries(outfitData.outfit.items).map(([key, item]: [string, any]) => {
                  if (!item) return null
                  return (
                    <div key={key} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="font-medium text-gray-900 capitalize">
                        {key.replace(/([A-Z])/g, ' $1').toLowerCase()}
                      </span>
                      <span className="text-sm text-gray-600">
                        Product ID: {item.productId}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Sizing Details */}
            {outfitData.outfit.sizingDetails && Object.keys(outfitData.outfit.sizingDetails).length > 0 && (
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Sizes</h3>
                <div className="grid grid-cols-2 gap-4">
                  {Object.entries(outfitData.outfit.sizingDetails).map(([key, value]: [string, any]) => (
                    <div key={key} className="text-center p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm font-medium text-gray-900 capitalize">{key}</p>
                      <p className="text-lg font-bold text-blue-600">{value}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Cost Breakdown */}
            {outfitData.outfit.costs.total > 0 && (
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Cost Breakdown</h3>
                <div className="space-y-2">
                  {outfitData.outfit.costs.totalRental > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Rental Items</span>
                      <span className="font-medium">${outfitData.outfit.costs.totalRental}</span>
                    </div>
                  )}
                  {outfitData.outfit.costs.totalPurchase > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Purchase Items</span>
                      <span className="font-medium">${outfitData.outfit.costs.totalPurchase}</span>
                    </div>
                  )}
                  {outfitData.outfit.costs.alterations > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Alterations</span>
                      <span className="font-medium">${outfitData.outfit.costs.alterations}</span>
                    </div>
                  )}
                  <div className="border-t pt-2 flex justify-between font-semibold">
                    <span>Total</span>
                    <span>${outfitData.outfit.costs.total}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Approval Buttons */}
            {outfitData.canApprove && (
              <div className="space-y-4">
                <button
                  onClick={() => handleApproval(true)}
                  className="w-full bg-green-600 text-white py-4 px-6 rounded-2xl font-medium hover:bg-green-700 transition-colors"
                >
                  Approve Outfit
                </button>
                <button
                  onClick={() => {
                    const notes = prompt('Please provide feedback or specific requests:')
                    if (notes !== null) {
                      handleApproval(false, notes)
                    }
                  }}
                  className="w-full bg-yellow-600 text-white py-4 px-6 rounded-2xl font-medium hover:bg-yellow-700 transition-colors"
                >
                  Request Changes
                </button>
              </div>
            )}

            {/* Timeline Info */}
            {outfitData.outfit.timeline && (
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Timeline</h3>
                <div className="space-y-2 text-sm">
                  {outfitData.outfit.timeline.selectionDeadline && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Selection Deadline</span>
                      <span>{new Date(outfitData.outfit.timeline.selectionDeadline).toLocaleDateString()}</span>
                    </div>
                  )}
                  {outfitData.outfit.timeline.fittingScheduledDate && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Fitting Date</span>
                      <span>{new Date(outfitData.outfit.timeline.fittingScheduledDate).toLocaleDateString()}</span>
                    </div>
                  )}
                  {outfitData.outfit.timeline.expectedDeliveryDate && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Expected Delivery</span>
                      <span>{new Date(outfitData.outfit.timeline.expectedDeliveryDate).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </MobileLayout>
  )
}