import React, { useState, useEffect } from 'react'
import { ShippingRateCalculator } from './ShippingRateCalculator'
import { ShippingLabelGenerator } from './ShippingLabelGenerator'
import { TrackingDisplay } from './TrackingDisplay'
import type { Order, ShippingRate, ShippingLabel, TrackingInfo } from '../types/order'
import toast from 'react-hot-toast'

interface ShippingManagerProps {
  order: Order
  onOrderUpdate: (updates: Partial<Order>) => void
}

export function ShippingManager({ order, onOrderUpdate }: ShippingManagerProps) {
  const [selectedRate, setSelectedRate] = useState<ShippingRate | null>(null)
  const [shippingLabel, setShippingLabel] = useState<ShippingLabel | null>(null)
  const [trackingInfo, setTrackingInfo] = useState<TrackingInfo | null>(null)
  const [activeTab, setActiveTab] = useState<'rates' | 'label' | 'tracking'>('rates')

  // Check if order has shipping address
  const hasShippingAddress = order.shipping_address_line_1 && 
                            order.shipping_city && 
                            order.shipping_state && 
                            order.shipping_postal_code

  const shippingAddress = hasShippingAddress ? {
    name: `${order.shipping_first_name || ''} ${order.shipping_last_name || ''}`.trim() || order.customer_name,
    street1: order.shipping_address_line_1!,
    street2: order.shipping_address_line_2,
    city: order.shipping_city!,
    state: order.shipping_state!,
    zip: order.shipping_postal_code!,
    country: order.shipping_country || 'US'
  } : null

  // Determine initial tab based on order status
  useEffect(() => {
    if (order.tracking_number) {
      setActiveTab('tracking')
    } else if (order.shipping_label_url) {
      setActiveTab('label')
    } else {
      setActiveTab('rates')
    }
  }, [order])

  const handleRatesCalculated = (rates: ShippingRate[]) => {
    // Rates are calculated and displayed
  }

  const handleRateSelected = (rate: ShippingRate) => {
    setSelectedRate(rate)
    toast.success(`Selected ${rate.carrier} ${rate.service} - ${rate.rate}`)
  }

  const handleLabelGenerated = (label: ShippingLabel) => {
    setShippingLabel(label)
    
    // Update order with shipping information
    const updates = {
      shipping_label_url: label.labelUrl,
      tracking_number: label.trackingNumber,
      carrier: label.carrier,
      service_type: label.service,
      shipping_cost: parseFloat(label.cost.replace('$', '')),
      easypost_shipment_id: label.shipmentId,
      tracking_status: 'label_created',
      status: 'processing' as const,
      shipped_at: new Date().toISOString()
    }
    
    onOrderUpdate(updates)
    setActiveTab('tracking')
    toast.success('Order updated with shipping information')
  }

  const handleTrackingUpdate = (info: TrackingInfo) => {
    setTrackingInfo(info)
    
    // Update order with latest tracking status
    const updates = {
      tracking_status: info.status,
      estimated_delivery_date: info.estimatedDeliveryDate
    }
    
    onOrderUpdate(updates)
  }

  const getTabClass = (tab: string) => {
    const baseClass = "px-4 py-2 text-sm font-medium rounded-md transition-colors"
    return activeTab === tab
      ? `${baseClass} bg-blue-600 text-white`
      : `${baseClass} text-gray-600 hover:text-gray-800 hover:bg-gray-100`
  }

  const canCalculateRates = hasShippingAddress && !order.tracking_number
  const canGenerateLabel = selectedRate && !order.shipping_label_url
  const canShowTracking = order.tracking_number

  if (!hasShippingAddress) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="text-center py-8">
          <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Shipping Address</h3>
          <p className="text-gray-600">This order doesn't have a complete shipping address.</p>
          <p className="text-sm text-gray-500 mt-2">Shipping management will be available once a shipping address is provided.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Shipping Status Overview */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Shipping Management</h3>
        
        {/* Progress Indicators */}
        <div className="flex items-center space-x-4 mb-6">
          <div className={`flex items-center space-x-2 ${
            canCalculateRates ? 'text-blue-600' : 'text-green-600'
          }`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              canCalculateRates ? 'bg-blue-100' : 'bg-green-100'
            }`}>
              {canCalculateRates ? '1' : '✓'}
            </div>
            <span className="text-sm font-medium">Calculate Rates</span>
          </div>
          
          <div className="flex-1 h-px bg-gray-200"></div>
          
          <div className={`flex items-center space-x-2 ${
            canGenerateLabel ? 'text-blue-600' : order.shipping_label_url ? 'text-green-600' : 'text-gray-400'
          }`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              canGenerateLabel ? 'bg-blue-100' : 
              order.shipping_label_url ? 'bg-green-100' : 'bg-gray-100'
            }`}>
              {order.shipping_label_url ? '✓' : '2'}
            </div>
            <span className="text-sm font-medium">Generate Label</span>
          </div>
          
          <div className="flex-1 h-px bg-gray-200"></div>
          
          <div className={`flex items-center space-x-2 ${
            canShowTracking ? 'text-green-600' : 'text-gray-400'
          }`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              canShowTracking ? 'bg-green-100' : 'bg-gray-100'
            }`}>
              {canShowTracking ? '✓' : '3'}
            </div>
            <span className="text-sm font-medium">Track Package</span>
          </div>
        </div>

        {/* Current Status */}
        <div className="p-3 bg-gray-50 rounded-md">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm font-medium text-gray-700">Current Status</p>
              <p className="text-lg text-gray-900">
                {order.tracking_status ? 
                  order.tracking_status.replace('_', ' ').toUpperCase() : 
                  'Ready for Shipping'
                }
              </p>
            </div>
            {order.tracking_number && (
              <div className="text-right">
                <p className="text-sm text-gray-600">Tracking Number</p>
                <p className="font-mono text-sm text-gray-900">{order.tracking_number}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-1">
          <button
            onClick={() => setActiveTab('rates')}
            className={getTabClass('rates')}
            disabled={!canCalculateRates && activeTab !== 'rates'}
          >
            Shipping Rates
          </button>
          <button
            onClick={() => setActiveTab('label')}
            className={getTabClass('label')}
            disabled={!selectedRate && !order.shipping_label_url}
          >
            Shipping Label
          </button>
          <button
            onClick={() => setActiveTab('tracking')}
            className={getTabClass('tracking')}
            disabled={!canShowTracking}
          >
            Package Tracking
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'rates' && (
          <ShippingRateCalculator
            orderId={order.id}
            shippingAddress={shippingAddress!}
            onRatesCalculated={handleRatesCalculated}
            onRateSelected={handleRateSelected}
          />
        )}
        
        {activeTab === 'label' && selectedRate && (
          <ShippingLabelGenerator
            orderId={order.id}
            selectedRate={selectedRate}
            onLabelGenerated={handleLabelGenerated}
          />
        )}
        
        {activeTab === 'tracking' && order.tracking_number && (
          <TrackingDisplay
            orderId={order.id}
            trackingNumber={order.tracking_number}
            onTrackingUpdate={handleTrackingUpdate}
          />
        )}
      </div>
    </div>
  )
}