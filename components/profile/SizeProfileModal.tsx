// SizeProfileModal.tsx
// Modal component for size profile - useful for product pages

import React, { useState, useEffect } from 'react'
import { ProfileAPI, MenswearMeasurement } from '../../lib/profile-api'

interface SizeProfileModalProps {
  onClose: () => void
  productId?: string
  onMeasurementsSaved?: (measurements: MenswearMeasurement) => void
}

export function SizeProfileModal({ onClose, productId, onMeasurementsSaved }: SizeProfileModalProps) {
  const [measurements, setMeasurements] = useState<Partial<MenswearMeasurement>>({
    preferred_fit: 'regular',
    measurement_unit: 'imperial',
    measured_by: 'self'
  })
  
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [hasExistingMeasurements, setHasExistingMeasurements] = useState(false)

  useEffect(() => {
    loadExistingMeasurements()
  }, [])

  const loadExistingMeasurements = async () => {
    setLoading(true)
    try {
      const existingMeasurements = await ProfileAPI.getMeasurements()
      if (existingMeasurements) {
        setMeasurements(existingMeasurements)
        setHasExistingMeasurements(true)
      }
    } catch (error) {
      console.error('Error loading measurements:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setMessage('')

    try {
      const savedMeasurements = await ProfileAPI.saveMeasurements(measurements)
      
      if (savedMeasurements) {
        setMessage('Size profile saved successfully!')
        onMeasurementsSaved?.(savedMeasurements)
        
        // Close modal after a brief delay
        setTimeout(() => {
          onClose()
        }, 1500)
      }
    } catch (error: any) {
      setMessage(error.message || 'Failed to save measurements')
    } finally {
      setSaving(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    
    if (name === 'chest' || name === 'waist' || name === 'height' || name === 'weight') {
      setMeasurements(prev => ({ ...prev, [name]: parseFloat(value) || undefined }))
    } else {
      setMeasurements(prev => ({ ...prev, [name]: value }))
    }
  }

  const getRecommendedSize = () => {
    // Simple size recommendation logic
    if (measurements.chest && measurements.waist) {
      const chest = measurements.chest
      if (chest <= 36) return '36R'
      if (chest <= 38) return '38R'
      if (chest <= 40) return '40R'
      if (chest <= 42) return '42R'
      if (chest <= 44) return '44R'
      return '46R'
    }
    return null
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              {hasExistingMeasurements ? 'Update Size Profile' : 'Create Size Profile'}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {hasExistingMeasurements 
                ? 'Update your measurements for the perfect fit'
                : 'Help us find your perfect fit'
              }
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              <span className="ml-2 text-gray-600">Loading your measurements...</span>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
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

              {/* Key Measurements */}
              <div className="grid grid-cols-2 gap-4">
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
                    required
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
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </div>

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
                    required
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
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Fit Preference */}
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

              {/* Size Recommendation */}
              {getRecommendedSize() && (
                <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                  <h4 className="text-sm font-medium text-blue-800 mb-1">
                    Recommended Size
                  </h4>
                  <p className="text-sm text-blue-700">
                    Based on your measurements, we recommend size <strong>{getRecommendedSize()}</strong>
                  </p>
                </div>
              )}

              {/* Status Message */}
              {message && (
                <div className={`p-3 rounded-md text-sm ${
                  message.includes('success') 
                    ? 'bg-green-50 text-green-800 border border-green-200'
                    : 'bg-red-50 text-red-800 border border-red-200'
                }`}>
                  {message}
                </div>
              )}

              {/* Footer */}
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Size Profile'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

export default SizeProfileModal