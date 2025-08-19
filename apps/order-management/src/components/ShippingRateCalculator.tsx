import React, { useState } from 'react'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'
import type { ShippingRate } from '../types/order'

interface ShippingRateCalculatorProps {
  orderId: string
  shippingAddress: {
    name: string
    street1: string
    street2?: string
    city: string
    state: string
    zip: string
    country: string
  }
  onRatesCalculated: (rates: ShippingRate[]) => void
  onRateSelected: (rate: ShippingRate) => void
}

export function ShippingRateCalculator({ 
  orderId, 
  shippingAddress, 
  onRatesCalculated, 
  onRateSelected 
}: ShippingRateCalculatorProps) {
  const [calculating, setCalculating] = useState(false)
  const [rates, setRates] = useState<ShippingRate[]>([])
  const [selectedRate, setSelectedRate] = useState<ShippingRate | null>(null)

  const calculateRates = async () => {
    try {
      setCalculating(true)
      
      const { data, error } = await supabase.functions.invoke('shipping-rates', {
        body: {
          orderId,
          toAddress: {
            name: shippingAddress.name,
            street1: shippingAddress.street1,
            street2: shippingAddress.street2 || '',
            city: shippingAddress.city,
            state: shippingAddress.state,
            zip: shippingAddress.zip,
            country: shippingAddress.country || 'US'
          },
          weight: 16, // Default weight in ounces
          dimensions: {
            length: 12,
            width: 9,
            height: 3
          }
        }
      })

      if (error) {
        console.error('Shipping rates error:', error)
        toast.error('Failed to calculate shipping rates')
        return
      }

      if (data?.data?.rates) {
        setRates(data.data.rates)
        onRatesCalculated(data.data.rates)
        toast.success('Shipping rates calculated successfully')
      } else {
        toast.error('No shipping rates available')
      }
    } catch (error) {
      console.error('Error calculating shipping rates:', error)
      toast.error('Failed to calculate shipping rates')
    } finally {
      setCalculating(false)
    }
  }

  const handleRateSelection = (rate: ShippingRate) => {
    setSelectedRate(rate)
    onRateSelected(rate)
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900">Shipping Rate Calculator</h3>
        <button
          onClick={calculateRates}
          disabled={calculating}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
        >
          {calculating ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Calculating...
            </>
          ) : (
            'Calculate Rates'
          )}
        </button>
      </div>

      {/* Shipping Address Display */}
      <div className="mb-4 p-3 bg-gray-50 rounded-md">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Shipping To:</h4>
        <div className="text-sm text-gray-600">
          <p>{shippingAddress.name}</p>
          <p>{shippingAddress.street1}</p>
          {shippingAddress.street2 && <p>{shippingAddress.street2}</p>}
          <p>{shippingAddress.city}, {shippingAddress.state} {shippingAddress.zip}</p>
          <p>{shippingAddress.country}</p>
        </div>
      </div>

      {/* Shipping Rates */}
      {rates.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-700">Available Shipping Options:</h4>
          {rates.map((rate) => (
            <div
              key={rate.id}
              className={`p-3 border rounded-md cursor-pointer transition-colors ${
                selectedRate?.id === rate.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => handleRateSelection(rate)}
            >
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-medium text-gray-900">
                    {rate.carrier} - {rate.service}
                  </p>
                  <p className="text-sm text-gray-600">
                    {rate.delivery_days ? `${rate.delivery_days} business days` : 'Delivery time varies'}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-gray-900">{rate.rate}</p>
                  {rate.delivery_date && (
                    <p className="text-xs text-gray-500">
                      Est. {new Date(rate.delivery_date).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {rates.length === 0 && (
        <p className="text-sm text-gray-500 text-center py-4">
          Click "Calculate Rates" to see available shipping options
        </p>
      )}
    </div>
  )
}