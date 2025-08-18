import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'
import type { TrackingInfo } from '../types/order'

interface TrackingDisplayProps {
  orderId: string
  trackingNumber?: string
  onTrackingUpdate?: (info: TrackingInfo) => void
}

export function TrackingDisplay({ 
  orderId, 
  trackingNumber,
  onTrackingUpdate 
}: TrackingDisplayProps) {
  const [tracking, setTracking] = useState<TrackingInfo | null>(null)
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  const fetchTrackingInfo = async (refresh = false) => {
    if (!trackingNumber && !orderId) return
    
    try {
      setLoading(!refresh)
      setRefreshing(refresh)
      
      const params = new URLSearchParams()
      if (trackingNumber) params.append('tracking_number', trackingNumber)
      if (orderId) params.append('order_id', orderId)
      
      const response = await fetch(
        `https://gvcswimqaxvylgxbklbz.supabase.co/functions/v1/shipping-tracking?${params.toString()}`,
        {
          headers: {
            'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd2Y3N3aW1xYXh2eWxneGJrbGJ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM3NjA1MzAsImV4cCI6MjA2OTMzNjUzMH0.UZdiGcJXUV5VYetjWXV26inmbj2yXdiT03Z6t_5Lg24`,
            'Content-Type': 'application/json'
          }
        }
      )

      if (!response.ok) {
        throw new Error('Failed to fetch tracking information')
      }

      const result = await response.json()
      
      if (result.data) {
        setTracking(result.data)
        onTrackingUpdate?.(result.data)
        if (refresh) {
          toast.success('Tracking information updated')
        }
      } else {
        toast.error('No tracking information available')
      }
    } catch (error) {
      console.error('Error fetching tracking info:', error)
      toast.error('Failed to fetch tracking information')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    if (trackingNumber || orderId) {
      fetchTrackingInfo()
    }
  }, [trackingNumber, orderId])

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'delivered': return 'text-green-800 bg-green-100'
      case 'out_for_delivery': return 'text-blue-800 bg-blue-100'
      case 'in_transit': return 'text-yellow-800 bg-yellow-100'
      case 'pre_transit': return 'text-gray-800 bg-gray-100'
      case 'exception': return 'text-red-800 bg-red-100'
      default: return 'text-gray-800 bg-gray-100'
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    )
  }

  if (!tracking && (trackingNumber || orderId)) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="text-center py-8">
          <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>
          <p className="text-gray-500">No tracking information available</p>
          <button
            onClick={() => fetchTrackingInfo(true)}
            className="mt-2 text-blue-600 hover:text-blue-500 text-sm"
          >
            Refresh tracking info
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900">Package Tracking</h3>
        <button
          onClick={() => fetchTrackingInfo(true)}
          disabled={refreshing}
          className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
        >
          {refreshing ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2"></div>
          ) : (
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          )}
          Refresh
        </button>
      </div>

      {tracking && (
        <div className="space-y-4">
          {/* Tracking Header */}
          <div className="p-4 bg-gray-50 rounded-md">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-700">Tracking Number</p>
                <p className="text-lg font-mono text-gray-900">{tracking.trackingNumber}</p>
                <p className="text-sm text-gray-600">{tracking.carrier}</p>
              </div>
              <div className="text-right">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(tracking.status)}`}>
                  {tracking.status.replace('_', ' ').toUpperCase()}
                </span>
                {tracking.estimatedDeliveryDate && (
                  <p className="text-sm text-gray-600 mt-1">
                    Est. Delivery: {new Date(tracking.estimatedDeliveryDate).toLocaleDateString()}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Tracking Events */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3">Tracking History</h4>
            <div className="space-y-3">
              {tracking.events.map((event, index) => (
                <div key={`${event.datetime}-${index}`} className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <div className={`w-3 h-3 rounded-full ${index === 0 ? 'bg-blue-500' : 'bg-gray-300'}`}></div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{event.message}</p>
                        {event.location && (
                          <p className="text-sm text-gray-600">{event.location}</p>
                        )}
                      </div>
                      <p className="text-sm text-gray-500">
                        {new Date(event.datetime).toLocaleDateString()} {new Date(event.datetime).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Last Updated */}
          <div className="text-xs text-gray-500 text-center pt-4 border-t">
            Last updated: {new Date(tracking.lastUpdated).toLocaleString()}
          </div>
        </div>
      )}
    </div>
  )
}