import React, { useState } from 'react'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'
import type { ShippingRate, ShippingLabel } from '../types/order'

interface ShippingLabelGeneratorProps {
  orderId: string
  selectedRate: ShippingRate
  onLabelGenerated: (label: ShippingLabel) => void
}

export function ShippingLabelGenerator({ 
  orderId, 
  selectedRate, 
  onLabelGenerated 
}: ShippingLabelGeneratorProps) {
  const [generating, setGenerating] = useState(false)
  const [label, setLabel] = useState<ShippingLabel | null>(null)

  const generateLabel = async () => {
    try {
      setGenerating(true)
      
      const { data, error } = await supabase.functions.invoke('shipping-label', {
        body: {
          orderId,
          rateId: selectedRate.id
        }
      })

      if (error) {
        console.error('Label generation error:', error)
        toast.error('Failed to generate shipping label')
        return
      }

      if (data?.data) {
        const labelData = data.data as ShippingLabel
        setLabel(labelData)
        onLabelGenerated(labelData)
        toast.success('Shipping label generated successfully')
      } else {
        toast.error('Failed to generate shipping label')
      }
    } catch (error) {
      console.error('Error generating shipping label:', error)
      toast.error('Failed to generate shipping label')
    } finally {
      setGenerating(false)
    }
  }

  const downloadLabel = () => {
    if (label?.labelUrl) {
      window.open(label.labelUrl, '_blank')
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900">Shipping Label</h3>
        {!label && (
          <button
            onClick={generateLabel}
            disabled={generating}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
          >
            {generating ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Generating...
              </>
            ) : (
              'Generate Label'
            )}
          </button>
        )}
      </div>

      {/* Selected Rate Display */}
      <div className="mb-4 p-3 bg-blue-50 rounded-md border border-blue-200">
        <h4 className="text-sm font-medium text-blue-800 mb-2">Selected Shipping Option:</h4>
        <div className="flex justify-between items-center">
          <div>
            <p className="font-medium text-blue-900">
              {selectedRate.carrier} - {selectedRate.service}
            </p>
            <p className="text-sm text-blue-700">
              {selectedRate.delivery_days ? `${selectedRate.delivery_days} business days` : 'Delivery time varies'}
            </p>
          </div>
          <p className="font-medium text-blue-900">{selectedRate.rate}</p>
        </div>
      </div>

      {/* Label Information */}
      {label && (
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-green-50 rounded-md border border-green-200">
            <div>
              <h4 className="text-sm font-medium text-green-800">Label Generated Successfully</h4>
              <p className="text-sm text-green-700">Tracking Number: <span className="font-mono">{label.trackingNumber}</span></p>
              <p className="text-sm text-green-700">Carrier: {label.carrier}</p>
              <p className="text-sm text-green-700">Service: {label.service}</p>
              <p className="text-sm text-green-700">Cost: {label.cost}</p>
            </div>
            <button
              onClick={downloadLabel}
              className="inline-flex items-center px-3 py-2 border border-green-300 text-sm font-medium rounded-md text-green-700 bg-white hover:bg-green-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
              </svg>
              Download Label
            </button>
          </div>
        </div>
      )}

      {!label && (
        <p className="text-sm text-gray-500 text-center py-4">
          Generate a shipping label to print and attach to the package
        </p>
      )}
    </div>
  )
}