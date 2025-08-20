import React, { useState, useEffect } from 'react'
import { profileApi, MenswearMeasurement } from '../lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'
import { Textarea } from '../components/ui/textarea'
import { Badge } from '../components/ui/badge'
import { Progress } from '../components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs'
import { Ruler, User, Shirt, Package, Info, CheckCircle, AlertCircle, Calendar } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '../components/ui/alert'

export function MeasurementsInterface() {
  const [measurements, setMeasurements] = useState<Partial<MenswearMeasurement>>({
    preferred_fit: 'regular',
    measurement_unit: 'imperial',
    measured_by: 'self',
    measurement_accuracy: 'estimated'
  })
  const [loading, setLoading] = useState(false)
  const [activeSection, setActiveSection] = useState('suit')

  useEffect(() => {
    loadMeasurements()
  }, [])

  const loadMeasurements = async () => {
    try {
      const data = await profileApi.getMeasurements()
      if (data) {
        setMeasurements(data)
      }
    } catch (error) {
      console.error('Error loading measurements:', error)
    }
  }

  const handleSave = async () => {
    setLoading(true)
    try {
      await profileApi.saveMeasurements(measurements)
      // Show success feedback
    } catch (error) {
      console.error('Error saving measurements:', error)
    } finally {
      setLoading(false)
    }
  }

  const getCompletionPercentage = () => {
    const requiredFields = ['chest', 'waist', 'inseam', 'sleeve', 'neck', 'shoulder_width']
    const completedFields = requiredFields.filter(field => measurements[field as keyof MenswearMeasurement])
    return Math.round((completedFields.length / requiredFields.length) * 100)
  }

  const getSuitSizeRecommendation = () => {
    if (!measurements.chest) return null
    
    const chest = measurements.chest
    let size = ''
    
    if (chest <= 36) size = '36'
    else if (chest <= 38) size = '38'
    else if (chest <= 40) size = '40'
    else if (chest <= 42) size = '42'
    else if (chest <= 44) size = '44'
    else if (chest <= 46) size = '46'
    else size = '48+'
    
    const height = measurements.height
    if (height && height < 68) size += 'S'
    else if (height && height > 74) size += 'L'
    else size += 'R'
    
    return size
  }

  const measurementSections = [
    {
      id: 'suit',
      title: 'Suit Measurements',
      icon: <Package className="w-5 h-5" />,
      description: 'Essential measurements for suits and jackets'
    },
    {
      id: 'shirt',
      title: 'Shirt Measurements',
      icon: <Shirt className="w-5 h-5" />,
      description: 'Measurements for dress shirts and casual wear'
    },
    {
      id: 'physical',
      title: 'Physical Stats',
      icon: <User className="w-5 h-5" />,
      description: 'Height, weight, and body measurements'
    }
  ]

  return (
    <div className="space-y-6">
      {/* Header with Progress */}
      <Card className="border-0 shadow-sm bg-gradient-to-r from-slate-50 to-slate-100">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Menswear Measurements</h2>
              <p className="text-slate-600">Precise measurements ensure the perfect fit for your garments</p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-slate-900 mb-1">{getCompletionPercentage()}%</div>
              <div className="text-sm text-slate-600">Complete</div>
            </div>
          </div>
          <Progress value={getCompletionPercentage()} className="h-3" />
          
          {getSuitSizeRecommendation() && (
            <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                <span className="text-sm font-medium text-emerald-900">
                  Recommended Suit Size: <strong>{getSuitSizeRecommendation()}</strong>
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Measurement Guide Alert */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle>Measurement Tips</AlertTitle>
        <AlertDescription>
          For the most accurate measurements, have someone help you or visit a professional tailor. 
          Measurements should be taken over undergarments only.
        </AlertDescription>
      </Alert>

      {/* Section Navigation */}
      <Tabs value={activeSection} onValueChange={setActiveSection}>
        <TabsList className="grid w-full grid-cols-3">
          {measurementSections.map((section) => (
            <TabsTrigger key={section.id} value={section.id} className="flex items-center gap-2">
              {section.icon}
              {section.title}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* Suit Measurements */}
        <TabsContent value="suit" className="mt-6">
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-slate-900">
                <Package className="w-5 h-5" />
                Suit & Jacket Measurements
              </CardTitle>
              <CardDescription>
                Essential measurements for suits, blazers, and sport coats
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="chest" className="text-slate-700 font-medium">Chest Circumference *</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Input
                      id="chest"
                      type="number"
                      step="0.25"
                      value={measurements.chest || ''}
                      onChange={(e) => setMeasurements({...measurements, chest: parseFloat(e.target.value)})}
                      placeholder="42"
                      className="flex-1"
                    />
                    <span className="text-sm text-slate-500 min-w-[50px]">
                      {measurements.measurement_unit === 'imperial' ? 'inches' : 'cm'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">Measure around fullest part of chest</p>
                </div>

                <div>
                  <Label htmlFor="waist" className="text-slate-700 font-medium">Waist Circumference *</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Input
                      id="waist"
                      type="number"
                      step="0.25"
                      value={measurements.waist || ''}
                      onChange={(e) => setMeasurements({...measurements, waist: parseFloat(e.target.value)})}
                      placeholder="34"
                      className="flex-1"
                    />
                    <span className="text-sm text-slate-500 min-w-[50px]">
                      {measurements.measurement_unit === 'imperial' ? 'inches' : 'cm'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">Measure at natural waistline</p>
                </div>

                <div>
                  <Label htmlFor="shoulder_width" className="text-slate-700 font-medium">Shoulder Width *</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Input
                      id="shoulder_width"
                      type="number"
                      step="0.25"
                      value={measurements.shoulder_width || ''}
                      onChange={(e) => setMeasurements({...measurements, shoulder_width: parseFloat(e.target.value)})}
                      placeholder="18"
                      className="flex-1"
                    />
                    <span className="text-sm text-slate-500 min-w-[50px]">
                      {measurements.measurement_unit === 'imperial' ? 'inches' : 'cm'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">Shoulder point to shoulder point</p>
                </div>
              </div>
              
              <div className="pt-4 border-t">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-slate-600">
                    Last updated: {measurements.updated_at 
                      ? new Date(measurements.updated_at).toLocaleDateString() 
                      : 'Never'
                    }
                  </div>
                  <Button
                    onClick={handleSave}
                    disabled={loading}
                    className="bg-slate-900 hover:bg-slate-800 px-8"
                  >
                    {loading ? 'Saving...' : 'Save Measurements'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}