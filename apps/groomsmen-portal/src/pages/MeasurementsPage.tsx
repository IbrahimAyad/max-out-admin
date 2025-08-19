import { useState, useEffect } from 'react'
import { 
  Ruler, 
  Camera, 
  CheckCircle, 
  AlertCircle, 
  Info,
  ArrowLeft,
  Save
} from 'lucide-react'
import { MobileLayout } from '@/components/MobileLayout'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'

interface MeasurementData {
  chest: number | ''
  waist: number | ''
  hips: number | ''
  shoulder_width: number | ''
  sleeve_length: number | ''
  inseam: number | ''
  neck: number | ''
  height: number | ''
  weight: number | ''
}

interface FitPreferences {
  fit_type: 'slim' | 'regular' | 'loose'
  jacket_length: 'short' | 'regular' | 'long'
  trouser_style: 'slim' | 'straight' | 'relaxed'
}

export function MeasurementsPage() {
  const [measurements, setMeasurements] = useState<MeasurementData>({
    chest: '',
    waist: '',
    hips: '',
    shoulder_width: '',
    sleeve_length: '',
    inseam: '',
    neck: '',
    height: '',
    weight: ''
  })
  
  const [fitPreferences, setFitPreferences] = useState<FitPreferences>({
    fit_type: 'regular',
    jacket_length: 'regular',
    trouser_style: 'straight'
  })
  
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [currentMeasurements, setCurrentMeasurements] = useState<any>(null)
  const [showInstructions, setShowInstructions] = useState(false)
  
  const navigate = useNavigate()

  useEffect(() => {
    loadCurrentMeasurements()
  }, [])

  const loadCurrentMeasurements = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('groomsmen-measurements')
      
      if (error) {
        throw new Error(error.message)
      }

      if (data?.data?.measurements) {
        const current = data.data.measurements
        setCurrentMeasurements(current)
        setMeasurements(current.measurements || {})
        setFitPreferences(current.fit_preferences || {
          fit_type: 'regular',
          jacket_length: 'regular',
          trouser_style: 'straight'
        })
        setNotes(current.notes || '')
      }
    } catch (error: any) {
      console.error('Load measurements error:', error)
      // Don't show error toast for first time users
    } finally {
      setLoading(false)
    }
  }

  const handleMeasurementChange = (key: keyof MeasurementData, value: string) => {
    const numValue = value === '' ? '' : parseFloat(value)
    setMeasurements(prev => ({ ...prev, [key]: numValue }))
  }

  const handleSubmit = async () => {
    // Validate required measurements
    const requiredFields: (keyof MeasurementData)[] = [
      'chest', 'waist', 'hips', 'shoulder_width', 'sleeve_length', 'inseam', 'neck'
    ]
    
    const missingFields = requiredFields.filter(field => !measurements[field])
    
    if (missingFields.length > 0) {
      toast.error(`Please provide all required measurements`)
      return
    }

    setSaving(true)
    try {
      const { data, error } = await supabase.functions.invoke('groomsmen-measurements', {
        body: {
          measurements,
          fitPreferences,
          measurementMethod: 'self_measured',
          notes,
          specialConsiderations: {}
        }
      })
      
      if (error || !data) {
        throw new Error(error?.message || 'Failed to submit measurements')
      }

      if (data.error) {
        throw new Error(data.error.message)
      }

      toast.success('Measurements submitted successfully!')
      
      // Show size recommendations if available
      if (data.data.sizeRecommendations) {
        const recs = data.data.sizeRecommendations
        toast.success(
          `Size recommendations: Jacket ${recs.jacket}, Shirt ${recs.shirt.size}, Trouser ${recs.trouser.size}`,
          { duration: 6000 }
        )
      }
      
      // Refresh data
      await loadCurrentMeasurements()
      
    } catch (error: any) {
      console.error('Submit measurements error:', error)
      toast.error(error.message || 'Failed to submit measurements')
    } finally {
      setSaving(false)
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
            <h1 className="text-xl font-bold text-gray-900">Measurements</h1>
            <p className="text-sm text-gray-600">Provide your body measurements</p>
          </div>
        </div>

        {/* Current Status */}
        {currentMeasurements && (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-4">
            <div className="flex items-center space-x-2 mb-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span className="font-medium text-green-900">Measurements Submitted</span>
            </div>
            <p className="text-sm text-green-700">
              Confidence Score: {currentMeasurements.confidence_score}%
            </p>
            <p className="text-xs text-green-600 mt-1">
              Submitted: {new Date(currentMeasurements.created_at).toLocaleDateString()}
            </p>
          </div>
        )}

        {/* Instructions Toggle */}
        <div className="bg-white rounded-2xl shadow-lg">
          <button
            onClick={() => setShowInstructions(!showInstructions)}
            className="w-full p-4 flex items-center justify-between text-left"
          >
            <div className="flex items-center space-x-2">
              <Info className="h-5 w-5 text-blue-600" />
              <span className="font-medium text-gray-900">Measurement Instructions</span>
            </div>
            <div className={`transform transition-transform ${showInstructions ? 'rotate-180' : ''}`}>
              ▼
            </div>
          </button>
          
          {showInstructions && (
            <div className="px-4 pb-4 space-y-3 text-sm text-gray-600">
              <div>
                <strong>Chest:</strong> Measure around the fullest part of your chest, under your arms
              </div>
              <div>
                <strong>Waist:</strong> Measure around your natural waistline
              </div>
              <div>
                <strong>Hips:</strong> Measure around the fullest part of your hips
              </div>
              <div>
                <strong>Shoulder Width:</strong> Measure from shoulder seam to shoulder seam
              </div>
              <div>
                <strong>Sleeve Length:</strong> Measure from shoulder to wrist
              </div>
              <div>
                <strong>Inseam:</strong> Measure from crotch to ankle
              </div>
              <div>
                <strong>Neck:</strong> Measure around your neck where a collar would sit
              </div>
            </div>
          )}
        </div>

        {/* Measurement Form */}
        <div className="bg-white rounded-2xl shadow-lg p-6 space-y-6">
          <h3 className="text-lg font-semibold text-gray-900">Body Measurements (inches)</h3>
          
          <div className="grid grid-cols-2 gap-4">
            {[
              { key: 'chest', label: 'Chest *', placeholder: '42' },
              { key: 'waist', label: 'Waist *', placeholder: '34' },
              { key: 'hips', label: 'Hips *', placeholder: '40' },
              { key: 'shoulder_width', label: 'Shoulder *', placeholder: '18' },
              { key: 'sleeve_length', label: 'Sleeve *', placeholder: '34' },
              { key: 'inseam', label: 'Inseam *', placeholder: '32' },
              { key: 'neck', label: 'Neck *', placeholder: '16' },
              { key: 'height', label: 'Height', placeholder: '70' },
            ].map(({ key, label, placeholder }) => (
              <div key={key}>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {label}
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  value={measurements[key as keyof MeasurementData]}
                  onChange={(e) => handleMeasurementChange(key as keyof MeasurementData, e.target.value)}
                  placeholder={placeholder}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            ))}
            
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Weight (lbs)
              </label>
              <input
                type="number"
                min="0"
                value={measurements.weight}
                onChange={(e) => handleMeasurementChange('weight', e.target.value)}
                placeholder="180"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Fit Preferences */}
        <div className="bg-white rounded-2xl shadow-lg p-6 space-y-6">
          <h3 className="text-lg font-semibold text-gray-900">Fit Preferences</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Overall Fit Type
              </label>
              <div className="grid grid-cols-3 gap-2">
                {['slim', 'regular', 'loose'].map((type) => (
                  <button
                    key={type}
                    onClick={() => setFitPreferences(prev => ({ ...prev, fit_type: type as any }))}
                    className={`p-3 rounded-lg border text-sm font-medium ${
                      fitPreferences.fit_type === type
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-gray-700 border-gray-300'
                    }`}
                  >
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Jacket Length
              </label>
              <div className="grid grid-cols-3 gap-2">
                {['short', 'regular', 'long'].map((length) => (
                  <button
                    key={length}
                    onClick={() => setFitPreferences(prev => ({ ...prev, jacket_length: length as any }))}
                    className={`p-3 rounded-lg border text-sm font-medium ${
                      fitPreferences.jacket_length === length
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-gray-700 border-gray-300'
                    }`}
                  >
                    {length.charAt(0).toUpperCase() + length.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Trouser Style
              </label>
              <div className="grid grid-cols-3 gap-2">
                {['slim', 'straight', 'relaxed'].map((style) => (
                  <button
                    key={style}
                    onClick={() => setFitPreferences(prev => ({ ...prev, trouser_style: style as any }))}
                    className={`p-3 rounded-lg border text-sm font-medium ${
                      fitPreferences.trouser_style === style
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-gray-700 border-gray-300'
                    }`}
                  >
                    {style.charAt(0).toUpperCase() + style.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Additional Notes
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Any special fit requirements or preferences..."
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Submit Button */}
        <button
          onClick={handleSubmit}
          disabled={saving}
          className="w-full bg-blue-600 text-white py-4 px-6 rounded-2xl font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
        >
          {saving ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              <span>Submitting...</span>
            </>
          ) : (
            <>
              <Save size={20} />
              <span>Submit Measurements</span>
            </>
          )}
        </button>
        
        <p className="text-xs text-gray-500 text-center">
          * Required measurements for accurate sizing
        </p>
      </div>
    </MobileLayout>
  )
}