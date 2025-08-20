import { useState, useRef } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { 
  Camera, 
  Upload, 
  Brain, 
  CheckCircle, 
  AlertTriangle, 
  Target, 
  Ruler, 
  TrendingUp, 
  Lightbulb, 
  Eye,
  Download,
  PlayCircle,
  RefreshCw
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { weddingPortalAPI } from '@/lib/supabase'
import { toast } from 'react-hot-toast'

export function SmartMeasurementSystem() {
  const [selectedMemberId, setSelectedMemberId] = useState('')
  const [measurements, setMeasurements] = useState({
    chest: '',
    waist: '',
    hips: '',
    neck: '',
    sleeve: '',
    inseam: '',
    jacket_length: '',
    height: '',
    weight: ''
  })
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [activeTab, setActiveTab] = useState('measure')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [weddingId] = useState(() => localStorage.getItem('wedding_id') || '')

  // Get party members
  const { data: partyMembersData } = useQuery({
    queryKey: ['party-members', weddingId],
    queryFn: () => weddingPortalAPI.getPartyMembers(weddingId),
    enabled: !!weddingId
  })

  // Measurement validation
  const validateMeasurementsMutation = useMutation({
    mutationFn: (data: { partyMemberId: string; measurements: any; preferences?: any }) => 
      weddingPortalAPI.validateMeasurements(data.partyMemberId, data.measurements, data.preferences),
    onSuccess: (data) => {
      toast.success('Measurements validated successfully!')
    },
    onError: (error: any) => {
      toast.error('Validation failed: ' + error.message)
    }
  })

  // Size recommendations
  const getSizeRecommendationsMutation = useMutation({
    mutationFn: (data: { partyMemberId: string; measurements: any }) => 
      weddingPortalAPI.getSizeRecommendations(data.partyMemberId, data.measurements),
    onSuccess: (data) => {
      toast.success('Size recommendations generated!')
    },
    onError: (error: any) => {
      toast.error('Failed to get recommendations: ' + error.message)
    }
  })

  // Photo analysis
  const analyzePhotoMutation = useMutation({
    mutationFn: (data: { partyMemberId: string; photoData: any }) => 
      weddingPortalAPI.analyzePhotoMeasurements(data.partyMemberId, data.photoData),
    onSuccess: (data) => {
      toast.success('Photo analyzed successfully!')
    },
    onError: (error: any) => {
      toast.error('Photo analysis failed: ' + error.message)
    }
  })

  // Measurement tips
  const { data: measurementTips, isLoading: tipsLoading } = useQuery({
    queryKey: ['measurement-tips', selectedMemberId],
    queryFn: () => weddingPortalAPI.getMeasurementTips(selectedMemberId),
    enabled: !!selectedMemberId && activeTab === 'tips'
  })

  const partyMembers = partyMembersData?.data || []
  const validationResult = validateMeasurementsMutation.data?.data
  const sizeRecommendations = getSizeRecommendationsMutation.data?.data
  const photoAnalysis = analyzePhotoMutation.data?.data
  const tips = measurementTips?.data

  const handleMeasurementChange = (field: string, value: string) => {
    setMeasurements(prev => ({ ...prev, [field]: value }))
  }

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setPhotoFile(file)
      // Convert to base64 for API
      const reader = new FileReader()
      reader.onload = () => {
        const photoData = {
          data: reader.result,
          filename: file.name,
          size: file.size
        }
        if (selectedMemberId) {
          analyzePhotoMutation.mutate({ partyMemberId: selectedMemberId, photoData })
        }
      }
      reader.readAsDataURL(file)
    }
  }

  const validateMeasurements = () => {
    if (!selectedMemberId) {
      toast.error('Please select a party member first')
      return
    }
    
    const numericMeasurements = Object.fromEntries(
      Object.entries(measurements).map(([key, value]) => [key, value ? parseFloat(value) : null])
    )
    
    validateMeasurementsMutation.mutate({
      partyMemberId: selectedMemberId,
      measurements: numericMeasurements
    })
  }

  const getSizeRecommendations = () => {
    if (!selectedMemberId) {
      toast.error('Please select a party member first')
      return
    }
    
    const numericMeasurements = Object.fromEntries(
      Object.entries(measurements).map(([key, value]) => [key, value ? parseFloat(value) : null])
    )
    
    getSizeRecommendationsMutation.mutate({
      partyMemberId: selectedMemberId,
      measurements: numericMeasurements
    })
  }

  const measurementFields = [
    { key: 'chest', label: 'Chest', unit: 'inches', required: true },
    { key: 'waist', label: 'Waist', unit: 'inches', required: true },
    { key: 'hips', label: 'Hips', unit: 'inches', required: false },
    { key: 'neck', label: 'Neck', unit: 'inches', required: true },
    { key: 'sleeve', label: 'Sleeve', unit: 'inches', required: true },
    { key: 'inseam', label: 'Inseam', unit: 'inches', required: true },
    { key: 'jacket_length', label: 'Jacket Length', unit: 'inches', required: false },
    { key: 'height', label: 'Height', unit: 'inches', required: false },
    { key: 'weight', label: 'Weight', unit: 'lbs', required: false }
  ]

  const tabs = [
    { id: 'measure', label: 'Measurements', icon: Ruler },
    { id: 'validate', label: 'AI Validation', icon: Brain },
    { id: 'recommend', label: 'Size Recommendations', icon: Target },
    { id: 'photo', label: 'Photo Analysis', icon: Camera },
    { id: 'tips', label: 'Measurement Tips', icon: Lightbulb }
  ]

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600 bg-green-100'
    if (score >= 75) return 'text-blue-600 bg-blue-100'
    if (score >= 60) return 'text-yellow-600 bg-yellow-100'
    return 'text-red-600 bg-red-100'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg shadow-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center space-x-3 mb-2">
              <Brain className="w-8 h-8" />
              <h1 className="text-3xl font-bold">Smart Measurement System</h1>
            </div>
            <p className="text-blue-100">
              AI-powered measurement validation and size recommendations
            </p>
          </div>
          <div className="text-right">
            <div className="flex items-center space-x-2">
              <Eye className="w-5 h-5" />
              <span className="text-sm">AI Vision Ready</span>
            </div>
          </div>
        </div>
      </div>

      {/* Member Selection */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Select Party Member</h3>
          <Badge variant="outline">{partyMembers.length} members</Badge>
        </div>
        
        <select 
          value={selectedMemberId}
          onChange={(e) => setSelectedMemberId(e.target.value)}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
        >
          <option value="">Choose a party member...</option>
          {partyMembers.map((member: any) => (
            <option key={member.id} value={member.id}>
              {member.full_name} - {member.role}
            </option>
          ))}
        </select>
      </Card>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 py-3 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            )
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="min-h-96">
        {/* Measurements Tab */}
        {activeTab === 'measure' && (
          <div className="space-y-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-6">Body Measurements</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {measurementFields.map((field) => (
                  <div key={field.key}>
                    <Label className="text-sm font-medium flex items-center space-x-1">
                      <span>{field.label}</span>
                      {field.required && <span className="text-red-500">*</span>}
                    </Label>
                    <div className="relative mt-1">
                      <input
                        type="number"
                        step="0.1"
                        value={measurements[field.key as keyof typeof measurements]}
                        onChange={(e) => handleMeasurementChange(field.key, e.target.value)}
                        placeholder={`Enter ${field.label.toLowerCase()}`}
                        className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm pr-16"
                      />
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                        <span className="text-gray-500 text-xs">{field.unit}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="flex space-x-4 mt-6">
                <Button 
                  onClick={validateMeasurements}
                  disabled={!selectedMemberId || validateMeasurementsMutation.isPending}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {validateMeasurementsMutation.isPending ? (
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Brain className="w-4 h-4 mr-2" />
                  )}
                  Validate with AI
                </Button>
                
                <Button 
                  onClick={getSizeRecommendations}
                  disabled={!selectedMemberId || getSizeRecommendationsMutation.isPending}
                  variant="outline"
                >
                  {getSizeRecommendationsMutation.isPending ? (
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Target className="w-4 h-4 mr-2" />
                  )}
                  Get Size Recommendations
                </Button>
              </div>
            </Card>
          </div>
        )}

        {/* AI Validation Tab */}
        {activeTab === 'validate' && (
          <div className="space-y-6">
            {validationResult ? (
              <>
                {/* Validation Summary */}
                <Card className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-semibold">AI Validation Results</h3>
                    <div className={`px-4 py-2 rounded-full font-bold ${getScoreColor(validationResult.confidenceScore || 0)}`}>
                      {validationResult.confidenceScore}% Confidence
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    <div className="text-center">
                      <div className={`text-3xl font-bold mb-1 ${
                        validationResult.isValid ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {validationResult.isValid ? '✓' : '✗'}
                      </div>
                      <p className="text-sm text-gray-600">Overall Valid</p>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-blue-600 mb-1">
                        {validationResult.bodyType || 'Unknown'}
                      </div>
                      <p className="text-sm text-gray-600">Body Type</p>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-purple-600 mb-1">
                        {validationResult.confidenceScore}%
                      </div>
                      <p className="text-sm text-gray-600">AI Confidence</p>
                    </div>
                  </div>

                  {/* Fit Recommendations */}
                  {validationResult.fitRecommendations && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h4 className="font-semibold text-blue-800 mb-2">Fit Recommendations</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="font-medium text-blue-700">Jacket: {validationResult.fitRecommendations.jacket}</p>
                        </div>
                        <div>
                          <p className="font-medium text-blue-700">Pants: {validationResult.fitRecommendations.pants}</p>
                        </div>
                      </div>
                      <p className="text-blue-600 text-sm mt-2 italic">{validationResult.fitRecommendations.notes}</p>
                    </div>
                  )}
                </Card>

                {/* Issues and Suggestions */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Issues */}
                  {validationResult.issues?.length > 0 && (
                    <Card className="p-6">
                      <h4 className="font-semibold text-red-700 mb-4 flex items-center space-x-2">
                        <AlertTriangle className="w-5 h-5" />
                        <span>Issues Found</span>
                      </h4>
                      <ul className="space-y-2">
                        {validationResult.issues.map((issue: string, index: number) => (
                          <li key={index} className="flex items-start space-x-2">
                            <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                            <span className="text-sm text-gray-700">{issue}</span>
                          </li>
                        ))}
                      </ul>
                    </Card>
                  )}

                  {/* Suggestions */}
                  {validationResult.suggestions?.length > 0 && (
                    <Card className="p-6">
                      <h4 className="font-semibold text-blue-700 mb-4 flex items-center space-x-2">
                        <Lightbulb className="w-5 h-5" />
                        <span>Suggestions</span>
                      </h4>
                      <ul className="space-y-2">
                        {validationResult.suggestions.map((suggestion: string, index: number) => (
                          <li key={index} className="flex items-start space-x-2">
                            <Lightbulb className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                            <span className="text-sm text-gray-700">{suggestion}</span>
                          </li>
                        ))}
                      </ul>
                    </Card>
                  )}
                </div>

                {/* AI Insights */}
                {validationResult.insights?.length > 0 && (
                  <Card className="p-6">
                    <h4 className="font-semibold text-purple-700 mb-4 flex items-center space-x-2">
                      <Brain className="w-5 h-5" />
                      <span>AI Insights</span>
                    </h4>
                    <div className="space-y-3">
                      {validationResult.insights.map((insight: string, index: number) => (
                        <div key={index} className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                          <p className="text-sm text-purple-800">{insight}</p>
                        </div>
                      ))}
                    </div>
                  </Card>
                )}
              </>
            ) : (
              <Card className="p-12 text-center">
                <Brain className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Validation Data</h3>
                <p className="text-gray-600 mb-4">Enter measurements and validate to see AI analysis</p>
                <Button onClick={() => setActiveTab('measure')} className="bg-blue-600 hover:bg-blue-700">
                  <Ruler className="w-4 h-4 mr-2" />
                  Go to Measurements
                </Button>
              </Card>
            )}
          </div>
        )}

        {/* Size Recommendations Tab */}
        {activeTab === 'recommend' && (
          <div className="space-y-6">
            {sizeRecommendations ? (
              <>
                {/* Recommendations Summary */}
                <Card className="p-6">
                  <h3 className="text-xl font-semibold mb-6">AI Size Recommendations</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    {Object.entries(sizeRecommendations.recommendedSizes || {}).map(([category, size]: [string, any]) => (
                      <div key={category} className="text-center p-4 bg-blue-50 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600 mb-1">{size}</div>
                        <p className="text-sm text-gray-600 capitalize">{category}</p>
                        <div className={`mt-2 px-2 py-1 rounded text-xs font-medium ${
                          getScoreColor(sizeRecommendations.confidenceScores?.[category] || 0)
                        }`}>
                          {sizeRecommendations.confidenceScores?.[category] || 0}% confidence
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <h4 className="font-semibold text-green-800 mb-2">Overall Confidence</h4>
                    <div className="flex items-center space-x-4">
                      <div className={`px-4 py-2 rounded-full font-bold text-lg ${getScoreColor(sizeRecommendations.overallConfidence || 0)}`}>
                        {sizeRecommendations.overallConfidence}%
                      </div>
                      <p className="text-green-700 text-sm">AI recommendation confidence</p>
                    </div>
                  </div>
                </Card>

                {/* Sizing Notes */}
                {sizeRecommendations.sizingNotes?.length > 0 && (
                  <Card className="p-6">
                    <h4 className="font-semibold mb-4 flex items-center space-x-2">
                      <Target className="w-5 h-5 text-blue-600" />
                      <span>Sizing Notes</span>
                    </h4>
                    <ul className="space-y-2">
                      {sizeRecommendations.sizingNotes.map((note: string, index: number) => (
                        <li key={index} className="flex items-start space-x-2">
                          <CheckCircle className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                          <span className="text-sm text-gray-700">{note}</span>
                        </li>
                      ))}
                    </ul>
                  </Card>
                )}

                {/* Alteration Suggestions */}
                {sizeRecommendations.alterationSuggestions?.length > 0 && (
                  <Card className="p-6">
                    <h4 className="font-semibold mb-4 flex items-center space-x-2">
                      <TrendingUp className="w-5 h-5 text-orange-600" />
                      <span>Alteration Suggestions</span>
                    </h4>
                    <ul className="space-y-2">
                      {sizeRecommendations.alterationSuggestions.map((suggestion: string, index: number) => (
                        <li key={index} className="flex items-start space-x-2">
                          <TrendingUp className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
                          <span className="text-sm text-gray-700">{suggestion}</span>
                        </li>
                      ))}
                    </ul>
                  </Card>
                )}
              </>
            ) : (
              <Card className="p-12 text-center">
                <Target className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Size Recommendations</h3>
                <p className="text-gray-600 mb-4">Generate recommendations based on measurements</p>
                <Button onClick={() => setActiveTab('measure')} className="bg-blue-600 hover:bg-blue-700">
                  <Ruler className="w-4 h-4 mr-2" />
                  Go to Measurements
                </Button>
              </Card>
            )}
          </div>
        )}

        {/* Photo Analysis Tab */}
        {activeTab === 'photo' && (
          <div className="space-y-6">
            {/* Photo Upload */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">AI Photo Analysis</h3>
              <p className="text-gray-600 mb-6">
                Upload a clear, well-lit photo for AI-assisted measurement extraction and validation.
              </p>
              
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
                
                {photoFile ? (
                  <div className="space-y-4">
                    <img 
                      src={URL.createObjectURL(photoFile)} 
                      alt="Uploaded photo" 
                      className="max-w-xs mx-auto rounded-lg"
                    />
                    <div>
                      <p className="font-medium">{photoFile.name}</p>
                      <p className="text-sm text-gray-500">{(photoFile.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <Upload className="w-12 h-12 text-gray-400 mx-auto" />
                    <div>
                      <p className="text-lg font-medium text-gray-900">Upload a photo</p>
                      <p className="text-sm text-gray-500">Drag and drop or click to select</p>
                    </div>
                  </div>
                )}
                
                <Button 
                  onClick={() => fileInputRef.current?.click()}
                  className="mt-4"
                  variant="outline"
                >
                  <Camera className="w-4 h-4 mr-2" />
                  {photoFile ? 'Change Photo' : 'Select Photo'}
                </Button>
              </div>
            </Card>

            {/* Photo Analysis Results */}
            {photoAnalysis && (
              <Card className="p-6">
                <h4 className="font-semibold mb-4 flex items-center space-x-2">
                  <Eye className="w-5 h-5 text-purple-600" />
                  <span>Photo Analysis Results</span>
                </h4>
                
                {photoAnalysis.photoAnalysisAvailable ? (
                  <div className="space-y-4">
                    {/* Quality Assessment */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h5 className="font-medium text-blue-800 mb-2">Photo Quality Assessment</h5>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        {Object.entries(photoAnalysis.qualityAssessment || {}).map(([key, value]: [string, any]) => (
                          <div key={key} className="text-center">
                            <div className={`font-medium ${
                              value === 'good' || value === 'clear' || value === 'appropriate' 
                                ? 'text-green-600' 
                                : value === 'acceptable' 
                                ? 'text-yellow-600' 
                                : 'text-red-600'
                            }`}>
                              {value}
                            </div>
                            <p className="text-blue-600 capitalize">{key.replace('_', ' ')}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    {/* Recommendations */}
                    {photoAnalysis.recommendations?.length > 0 && (
                      <div>
                        <h5 className="font-medium text-gray-800 mb-2">AI Recommendations</h5>
                        <ul className="space-y-2">
                          {photoAnalysis.recommendations.map((rec: string, index: number) => (
                            <li key={index} className="flex items-start space-x-2">
                              <Lightbulb className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                              <span className="text-sm text-gray-700">{rec}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Camera className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-600">Upload a photo to enable AI analysis</p>
                  </div>
                )}
              </Card>
            )}
          </div>
        )}

        {/* Measurement Tips Tab */}
        {activeTab === 'tips' && (
          <div className="space-y-6">
            {tipsLoading ? (
              <div className="flex items-center justify-center py-12">
                <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
                <span className="ml-3 text-lg">Loading measurement tips...</span>
              </div>
            ) : tips ? (
              <>
                {/* General Tips */}
                <Card className="p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
                    <Lightbulb className="w-5 h-5 text-yellow-600" />
                    <span>General Tips</span>
                  </h3>
                  <ul className="space-y-2">
                    {tips.generalTips?.map((tip: string, index: number) => (
                      <li key={index} className="flex items-start space-x-2">
                        <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-gray-700">{tip}</span>
                      </li>
                    ))}
                  </ul>
                </Card>

                {/* Tools Needed */}
                <Card className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Tools You'll Need</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {tips.toolsNeeded?.map((tool: string, index: number) => (
                      <div key={index} className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg">
                        <Ruler className="w-4 h-4 text-blue-500" />
                        <span className="text-sm text-gray-700">{tool}</span>
                      </div>
                    ))}
                  </div>
                </Card>

                {/* Step-by-Step Guide */}
                {tips.stepByStepGuide && (
                  <Card className="p-6">
                    <h3 className="text-lg font-semibold mb-4">Step-by-Step Guide</h3>
                    <div className="space-y-6">
                      {Object.entries(tips.stepByStepGuide).map(([measurement, guide]: [string, any]) => (
                        <div key={measurement} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex items-center space-x-2 mb-3">
                            <div className="bg-blue-600 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                              {guide.step}
                            </div>
                            <h4 className="font-medium capitalize">{measurement.replace('_', ' ')}</h4>
                          </div>
                          
                          <p className="text-sm text-gray-700 mb-3">{guide.instruction}</p>
                          
                          {guide.tips?.length > 0 && (
                            <div className="mb-3">
                              <p className="text-xs font-medium text-green-700 mb-1">Tips:</p>
                              <ul className="space-y-1">
                                {guide.tips.map((tip: string, tipIndex: number) => (
                                  <li key={tipIndex} className="text-xs text-green-600 flex items-start space-x-1">
                                    <span>•</span>
                                    <span>{tip}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                          
                          {guide.commonErrors?.length > 0 && (
                            <div>
                              <p className="text-xs font-medium text-red-700 mb-1">Avoid:</p>
                              <ul className="space-y-1">
                                {guide.commonErrors.map((error: string, errorIndex: number) => (
                                  <li key={errorIndex} className="text-xs text-red-600 flex items-start space-x-1">
                                    <span>•</span>
                                    <span>{error}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </Card>
                )}

                {/* Video Tutorials */}
                {tips.videoTutorials?.length > 0 && (
                  <Card className="p-6">
                    <h3 className="text-lg font-semibold mb-4">Video Tutorials</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {tips.videoTutorials.map((video: any, index: number) => (
                        <div key={index} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex items-center space-x-2 mb-2">
                            <PlayCircle className="w-5 h-5 text-blue-600" />
                            <span className="font-medium text-sm">{video.title}</span>
                          </div>
                          <p className="text-xs text-gray-600 mb-2">{video.duration}</p>
                          <p className="text-xs text-gray-700">{video.description}</p>
                        </div>
                      ))}
                    </div>
                  </Card>
                )}
              </>
            ) : selectedMemberId ? (
              <Card className="p-12 text-center">
                <Lightbulb className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Loading Tips...</h3>
                <p className="text-gray-600">Getting personalized measurement guidance</p>
              </Card>
            ) : (
              <Card className="p-12 text-center">
                <Lightbulb className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Member</h3>
                <p className="text-gray-600">Choose a party member to get personalized measurement tips</p>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  )
}