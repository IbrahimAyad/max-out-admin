// SizeProfileForm.tsx
// Size measurement component for your Next.js site

import React, { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

interface SizeProfile {
  suit_size?: string
  chest?: number
  waist?: number
  inseam?: number
  sleeve?: number
  neck?: number
  shoulder_width?: number
  jacket_length?: number
  trouser_rise?: number
  height?: number
  weight?: number
  shoe_size?: number
  preferred_fit: 'slim' | 'regular' | 'relaxed'
  measurement_unit: 'imperial' | 'metric'
  notes?: string
  measured_by: 'self' | 'professional'
}

interface SizeProfileFormProps {
  onUpdate?: () => void
  className?: string
  showTitle?: boolean
}

export function SizeProfileForm({ onUpdate, className = '', showTitle = true }: SizeProfileFormProps) {
  const [measurements, setMeasurements] = useState<SizeProfile>({
    preferred_fit: 'regular',
    measurement_unit: 'imperial',
    measured_by: 'self'
  })
  
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [initialLoad, setInitialLoad] = useState(true)

  useEffect(() => {
    loadMeasurements()
  }, [])

  const loadMeasurements = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('profile-management', {
        body: { action: 'get_measurements' }
      })

      if (error) {
        console.error('Error loading measurements:', error)
        return
      }

      if (data?.success && data?.data) {
        setMeasurements({
          ...measurements,
          ...data.data
        })
      }
    } catch (error) {
      console.error('Error loading measurements:', error)
    } finally {
      setInitialLoad(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      const { data, error } = await supabase.functions.invoke('profile-management', {
        body: {
          action: 'create_measurements',
          measurements
        }
      })

      if (error) {
        throw new Error(error.message)
      }

      if (!data?.success) {
        throw new Error(data?.error?.message || 'Failed to save measurements')
      }

      setMessage('Size profile saved successfully!')
      onUpdate?.() // Refresh parent component
    } catch (error: any) {
      setMessage(error.message || 'Failed to save measurements')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    
    if (name === 'chest' || name === 'waist' || name === 'inseam' || name === 'sleeve' || 
        name === 'neck' || name === 'shoulder_width' || name === 'jacket_length' || 
        name === 'trouser_rise' || name === 'height' || name === 'weight' || name === 'shoe_size') {
      setMeasurements(prev => ({ ...prev, [name]: parseFloat(value) || undefined }))
    } else {
      setMeasurements(prev => ({ ...prev, [name]: value }))
    }
  }

  if (initialLoad) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="h-6 bg-gray-200 rounded mb-4"></div>
        <div className="space-y-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-4 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className={`space-y-6 ${className}`}>
      {showTitle && (
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Size Profile</h2>
          <p className="text-gray-600 mt-2">
            Help us recommend the perfect fit by providing your measurements.
          </p>
        </div>
      )}

      {/* Measurement Unit */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Measurement Unit
        </label>
        <div className="flex space-x-4">
          <label className="flex items-center">
            <input
              type="radio"
              name="measurement_unit"
              value="imperial"
              checked={measurements.measurement_unit === 'imperial'}
              onChange={handleChange}
              className="mr-2"
            />
            Imperial (inches/lbs)
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              name="measurement_unit"
              value="metric"
              checked={measurements.measurement_unit === 'metric'}
              onChange={handleChange}
              className="mr-2"
            />
            Metric (cm/kg)
          </label>
        </div>
      </div>

      {/* Basic Measurements */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="suit_size" className="block text-sm font-medium text-gray-700">
            Suit Size
          </label>
          <input
            type="text"
            id="suit_size"
            name="suit_size"
            value={measurements.suit_size || ''}
            onChange={handleChange}
            placeholder="e.g., 42R, 40L"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label htmlFor="preferred_fit" className="block text-sm font-medium text-gray-700">
            Preferred Fit
          </label>
          <select
            id="preferred_fit"
            name="preferred_fit"
            value={measurements.preferred_fit}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          >
            <option value="slim">Slim Fit</option>
            <option value="regular">Regular Fit</option>
            <option value="relaxed">Relaxed Fit</option>
          </select>
        </div>
      </div>

      {/* Body Measurements */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900">Body Measurements</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="chest" className="block text-sm font-medium text-gray-700">
              Chest ({measurements.measurement_unit === 'imperial' ? 'inches' : 'cm'})
            </label>
            <input
              type="number"
              id="chest"
              name="chest"
              value={measurements.chest || ''}
              onChange={handleChange}
              step="0.5"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label htmlFor="waist" className="block text-sm font-medium text-gray-700">
              Waist ({measurements.measurement_unit === 'imperial' ? 'inches' : 'cm'})
            </label>
            <input
              type="number"
              id="waist"
              name="waist"
              value={measurements.waist || ''}
              onChange={handleChange}
              step="0.5"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label htmlFor="neck" className="block text-sm font-medium text-gray-700">
              Neck ({measurements.measurement_unit === 'imperial' ? 'inches' : 'cm'})
            </label>
            <input
              type="number"
              id="neck"
              name="neck"
              value={measurements.neck || ''}
              onChange={handleChange}
              step="0.5"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="sleeve" className="block text-sm font-medium text-gray-700">
              Sleeve ({measurements.measurement_unit === 'imperial' ? 'inches' : 'cm'})
            </label>
            <input
              type="number"
              id="sleeve"
              name="sleeve"
              value={measurements.sleeve || ''}
              onChange={handleChange}
              step="0.5"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label htmlFor="inseam" className="block text-sm font-medium text-gray-700">
              Inseam ({measurements.measurement_unit === 'imperial' ? 'inches' : 'cm'})
            </label>
            <input
              type="number"
              id="inseam"
              name="inseam"
              value={measurements.inseam || ''}
              onChange={handleChange}
              step="0.5"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label htmlFor="shoe_size" className="block text-sm font-medium text-gray-700">
              Shoe Size
            </label>
            <input
              type="number"
              id="shoe_size"
              name="shoe_size"
              value={measurements.shoe_size || ''}
              onChange={handleChange}
              step="0.5"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="height" className="block text-sm font-medium text-gray-700">
              Height ({measurements.measurement_unit === 'imperial' ? 'inches' : 'cm'})
            </label>
            <input
              type="number"
              id="height"
              name="height"
              value={measurements.height || ''}
              onChange={handleChange}
              step="0.5"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label htmlFor="weight" className="block text-sm font-medium text-gray-700">
              Weight ({measurements.measurement_unit === 'imperial' ? 'lbs' : 'kg'})
            </label>
            <input
              type="number"
              id="weight"
              name="weight"
              value={measurements.weight || ''}
              onChange={handleChange}
              step="0.5"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>
        </div>
      </div>

      {/* Additional Information */}
      <div>
        <label htmlFor="measured_by" className="block text-sm font-medium text-gray-700">
          Measured By
        </label>
        <select
          id="measured_by"
          name="measured_by"
          value={measurements.measured_by}
          onChange={handleChange}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
        >
          <option value="self">Self-measured</option>
          <option value="professional">Professional tailor</option>
        </select>
      </div>

      <div>
        <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
          Notes (Optional)
        </label>
        <textarea
          id="notes"
          name="notes"
          value={measurements.notes || ''}
          onChange={handleChange}
          rows={3}
          placeholder="Any additional notes about your measurements or fit preferences..."
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
        />
      </div>

      {/* Submit Button */}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={loading}
          className="bg-indigo-600 text-white px-6 py-2 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
        >
          {loading ? 'Saving...' : 'Save Size Profile'}
        </button>
      </div>

      {/* Status Message */}
      {message && (
        <div className={`p-4 rounded-md ${
          message.includes('success') 
            ? 'bg-green-50 text-green-800 border border-green-200'
            : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {message}
        </div>
      )}
    </form>
  )
}

export default SizeProfileForm