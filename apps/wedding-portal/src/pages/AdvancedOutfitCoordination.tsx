import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { 
  Sparkles, 
  Brain, 
  TrendingUp, 
  DollarSign, 
  CheckCircle, 
  AlertTriangle,
  Palette,
  Users,
  Target,
  Zap,
  BarChart3,
  Settings,
  Lightbulb,
  RefreshCw
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { weddingPortalAPI } from '@/lib/supabase'
import { toast } from 'react-hot-toast'

export function AdvancedOutfitCoordination() {
  const [weddingId] = useState(() => localStorage.getItem('wedding_id') || '')
  const [activeTab, setActiveTab] = useState('analysis')
  const [preferences, setPreferences] = useState({
    style: 'classic',
    colors: ['navy', 'gray'],
    formality: 'formal'
  })
  const [budgetConstraints, setBudgetConstraints] = useState({
    maxBudget: 5000,
    maxPerPerson: 500
  })
  const [autoOptimize, setAutoOptimize] = useState(true)
  
  const queryClient = useQueryClient()

  // AI Outfit Analysis
  const { data: analysisData, isLoading: analysisLoading, refetch: refetchAnalysis } = useQuery({
    queryKey: ['outfit-analysis', weddingId, preferences],
    queryFn: () => weddingPortalAPI.analyzeOutfitCoordination(weddingId, preferences, budgetConstraints),
    enabled: !!weddingId && activeTab === 'analysis'
  })

  // AI Recommendations
  const { data: recommendationsData, isLoading: recommendationsLoading } = useQuery({
    queryKey: ['outfit-recommendations', weddingId, preferences, budgetConstraints],
    queryFn: () => weddingPortalAPI.getOutfitRecommendations(weddingId, preferences, budgetConstraints),
    enabled: !!weddingId && activeTab === 'recommendations'
  })

  // Validation
  const { data: validationData, isLoading: validationLoading } = useQuery({
    queryKey: ['outfit-validation', weddingId, preferences],
    queryFn: () => weddingPortalAPI.validateOutfitCoordination(weddingId, preferences),
    enabled: !!weddingId && activeTab === 'validation'
  })

  // Budget Optimization
  const { data: optimizationData, isLoading: optimizationLoading } = useQuery({
    queryKey: ['budget-optimization', weddingId, budgetConstraints],
    queryFn: () => weddingPortalAPI.optimizeForBudget(weddingId, budgetConstraints),
    enabled: !!weddingId && activeTab === 'optimization'
  })

  // Auto-generate timeline
  const generateTimelineMutation = useMutation({
    mutationFn: () => weddingPortalAPI.generateTimeline(weddingId),
    onSuccess: () => {
      toast.success('AI timeline generated successfully!')
      queryClient.invalidateQueries({ queryKey: ['wedding-tasks'] })
    },
    onError: (error: any) => {
      toast.error('Failed to generate timeline: ' + error.message)
    }
  })

  const analysis = analysisData?.data?.analysis
  const recommendations = recommendationsData?.data?.recommendations
  const validation = validationData?.data?.validation
  const optimization = optimizationData?.data?.optimization

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600 bg-green-100'
    if (score >= 75) return 'text-blue-600 bg-blue-100'
    if (score >= 60) return 'text-yellow-600 bg-yellow-100'
    return 'text-red-600 bg-red-100'
  }

  const tabs = [
    { id: 'analysis', label: 'AI Analysis', icon: Brain },
    { id: 'recommendations', label: 'Recommendations', icon: Lightbulb },
    { id: 'validation', label: 'Validation', icon: CheckCircle },
    { id: 'optimization', label: 'Budget Optimizer', icon: DollarSign }
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg shadow-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center space-x-3 mb-2">
              <Sparkles className="w-8 h-8" />
              <h1 className="text-3xl font-bold">AI Outfit Coordination</h1>
            </div>
            <p className="text-purple-100">
              Advanced AI-powered styling and coordination for your wedding party
            </p>
          </div>
          <div className="text-right">
            <Button 
              onClick={() => generateTimelineMutation.mutate()}
              disabled={generateTimelineMutation.isPending}
              className="bg-white text-purple-600 hover:bg-purple-50 font-semibold"
            >
              {generateTimelineMutation.isPending ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Zap className="w-4 h-4 mr-2" />
              )}
              Generate AI Timeline
            </Button>
          </div>
        </div>
      </div>

      {/* Settings Panel */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center space-x-2">
            <Settings className="w-5 h-5" />
            <span>AI Preferences</span>
          </h3>
          <div className="flex items-center space-x-2">
            <Switch 
              checked={autoOptimize}
              onCheckedChange={setAutoOptimize}
            />
            <Label>Auto-optimize</Label>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label className="text-sm font-medium">Wedding Style</Label>
            <select 
              value={preferences.style}
              onChange={(e) => setPreferences({...preferences, style: e.target.value})}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            >
              <option value="classic">Classic</option>
              <option value="modern">Modern</option>
              <option value="traditional">Traditional</option>
              <option value="contemporary">Contemporary</option>
            </select>
          </div>
          
          <div>
            <Label className="text-sm font-medium">Formality Level</Label>
            <select 
              value={preferences.formality}
              onChange={(e) => setPreferences({...preferences, formality: e.target.value})}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            >
              <option value="casual">Casual</option>
              <option value="smart-casual">Smart Casual</option>
              <option value="semi-formal">Semi-Formal</option>
              <option value="formal">Formal</option>
              <option value="black-tie">Black Tie</option>
            </select>
          </div>
          
          <div>
            <Label className="text-sm font-medium">Budget per Person</Label>
            <input 
              type="number"
              value={budgetConstraints.maxPerPerson}
              onChange={(e) => setBudgetConstraints({...budgetConstraints, maxPerPerson: parseInt(e.target.value)})}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
        </div>
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
                    ? 'border-purple-500 text-purple-600'
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
        {/* AI Analysis Tab */}
        {activeTab === 'analysis' && (
          <div className="space-y-6">
            {analysisLoading ? (
              <div className="flex items-center justify-center py-12">
                <RefreshCw className="w-8 h-8 animate-spin text-purple-600" />
                <span className="ml-3 text-lg">AI is analyzing your coordination...</span>
              </div>
            ) : analysis ? (
              <>
                {/* Overall Score */}
                <Card className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-semibold">Coordination Analysis</h3>
                    <div className={`px-4 py-2 rounded-full font-bold text-lg ${getScoreColor(analysis.overallScore)}`}>
                      {analysis.overallScore}% Match
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center">
                      <div className="flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mx-auto mb-3">
                        <Palette className="w-8 h-8 text-blue-600" />
                      </div>
                      <h4 className="font-semibold mb-1">Color Harmony</h4>
                      <div className="text-2xl font-bold text-blue-600 mb-1">{analysis.colorHarmony}%</div>
                      <p className="text-sm text-gray-600">Color coordination</p>
                    </div>
                    
                    <div className="text-center">
                      <div className="flex items-center justify-center w-16 h-16 bg-purple-100 rounded-full mx-auto mb-3">
                        <Target className="w-8 h-8 text-purple-600" />
                      </div>
                      <h4 className="font-semibold mb-1">Style Consistency</h4>
                      <div className="text-2xl font-bold text-purple-600 mb-1">{analysis.styleConsistency}%</div>
                      <p className="text-sm text-gray-600">Style matching</p>
                    </div>
                    
                    <div className="text-center">
                      <div className="flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mx-auto mb-3">
                        <BarChart3 className="w-8 h-8 text-green-600" />
                      </div>
                      <h4 className="font-semibold mb-1">Formality Alignment</h4>
                      <div className="text-2xl font-bold text-green-600 mb-1">{analysis.formalityAlignment}%</div>
                      <p className="text-sm text-gray-600">Formality matching</p>
                    </div>
                  </div>
                </Card>

                {/* Insights and Issues */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Strengths */}
                  {analysis.strengths?.length > 0 && (
                    <Card className="p-6">
                      <h4 className="font-semibold text-green-700 mb-4 flex items-center space-x-2">
                        <CheckCircle className="w-5 h-5" />
                        <span>Strengths</span>
                      </h4>
                      <ul className="space-y-2">
                        {analysis.strengths.map((strength: string, index: number) => (
                          <li key={index} className="flex items-start space-x-2">
                            <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                            <span className="text-sm text-gray-700">{strength}</span>
                          </li>
                        ))}
                      </ul>
                    </Card>
                  )}

                  {/* Issues */}
                  {analysis.issues?.length > 0 && (
                    <Card className="p-6">
                      <h4 className="font-semibold text-red-700 mb-4 flex items-center space-x-2">
                        <AlertTriangle className="w-5 h-5" />
                        <span>Issues to Address</span>
                      </h4>
                      <ul className="space-y-2">
                        {analysis.issues.map((issue: string, index: number) => (
                          <li key={index} className="flex items-start space-x-2">
                            <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                            <span className="text-sm text-gray-700">{issue}</span>
                          </li>
                        ))}
                      </ul>
                    </Card>
                  )}
                </div>

                {/* AI Insights */}
                {analysis.insights?.length > 0 && (
                  <Card className="p-6">
                    <h4 className="font-semibold text-purple-700 mb-4 flex items-center space-x-2">
                      <Brain className="w-5 h-5" />
                      <span>AI Insights</span>
                    </h4>
                    <div className="space-y-3">
                      {analysis.insights.map((insight: string, index: number) => (
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
                <h3 className="text-lg font-medium text-gray-900 mb-2">Start AI Analysis</h3>
                <p className="text-gray-600 mb-4">Let our AI analyze your wedding party coordination</p>
                <Button onClick={() => refetchAnalysis()} className="bg-purple-600 hover:bg-purple-700">
                  <Sparkles className="w-4 h-4 mr-2" />
                  Analyze Coordination
                </Button>
              </Card>
            )}
          </div>
        )}

        {/* AI Recommendations Tab */}
        {activeTab === 'recommendations' && (
          <div className="space-y-6">
            {recommendationsLoading ? (
              <div className="flex items-center justify-center py-12">
                <RefreshCw className="w-8 h-8 animate-spin text-purple-600" />
                <span className="ml-3 text-lg">Generating AI recommendations...</span>
              </div>
            ) : recommendations ? (
              <>
                {/* Foundation Recommendation */}
                {recommendations.foundation && (
                  <Card className="p-6">
                    <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
                      <Target className="w-5 h-5 text-blue-600" />
                      <span>Foundation Outfit</span>
                    </h3>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <p className="text-sm text-blue-800 mb-2">
                        <strong>Role:</strong> {recommendations.foundation.member?.role || 'Groom'}
                      </p>
                      <p className="text-sm text-blue-700">{recommendations.foundation.reasoning}</p>
                    </div>
                  </Card>
                )}

                {/* Party Recommendations */}
                {recommendations.partyRecommendations?.length > 0 && (
                  <Card className="p-6">
                    <h3 className="text-lg font-semibold mb-4">Party Member Recommendations</h3>
                    <div className="space-y-4">
                      {recommendations.partyRecommendations.map((rec: any, index: number) => (
                        <div key={index} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="font-medium">{rec.member?.user_profiles?.full_name || `Member ${index + 1}`}</h4>
                            <Badge variant="outline">{rec.member?.role}</Badge>
                          </div>
                          
                          {rec.topRecommendations?.length > 0 && (
                            <div className="space-y-2">
                              <p className="text-sm font-medium text-gray-700">Top Recommendations:</p>
                              {rec.topRecommendations.slice(0, 2).map((product: any, prodIndex: number) => (
                                <div key={prodIndex} className="flex items-center justify-between bg-gray-50 rounded p-3">
                                  <div>
                                    <p className="font-medium text-sm">{product.name}</p>
                                    <p className="text-xs text-gray-600">Score: {Math.round(product.coordinationScore || 0)}/100</p>
                                  </div>
                                  <div className="text-right">
                                    <p className="font-semibold">${product.price || 0}</p>
                                    <Badge className="bg-green-100 text-green-800 text-xs">
                                      {product.primary_color}
                                    </Badge>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                          
                          {rec.reasoning && (
                            <p className="text-sm text-gray-600 mt-3 italic">{rec.reasoning}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </Card>
                )}
              </>
            ) : (
              <Card className="p-12 text-center">
                <Lightbulb className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Generate Recommendations</h3>
                <p className="text-gray-600">Get AI-powered outfit recommendations for your party</p>
              </Card>
            )}
          </div>
        )}

        {/* Validation Tab */}
        {activeTab === 'validation' && (
          <div className="space-y-6">
            {validationLoading ? (
              <div className="flex items-center justify-center py-12">
                <RefreshCw className="w-8 h-8 animate-spin text-purple-600" />
                <span className="ml-3 text-lg">Validating coordination...</span>
              </div>
            ) : validation ? (
              <>
                {/* Validation Summary */}
                <Card className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-semibold">Coordination Validation</h3>
                    <div className={`px-4 py-2 rounded-full font-bold ${validation.isValid ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {validation.isValid ? 'Valid' : 'Issues Found'}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <div className="text-2xl font-bold text-gray-900">{validation.memberValidations?.length || 0}</div>
                      <p className="text-sm text-gray-600">Members Checked</p>
                    </div>
                    <div className="text-center p-4 bg-red-50 rounded-lg">
                      <div className="text-2xl font-bold text-red-600">{validation.issues?.length || 0}</div>
                      <p className="text-sm text-gray-600">Critical Issues</p>
                    </div>
                    <div className="text-center p-4 bg-yellow-50 rounded-lg">
                      <div className="text-2xl font-bold text-yellow-600">{validation.warnings?.length || 0}</div>
                      <p className="text-sm text-gray-600">Warnings</p>
                    </div>
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">{validation.suggestions?.length || 0}</div>
                      <p className="text-sm text-gray-600">Suggestions</p>
                    </div>
                  </div>
                </Card>

                {/* Issues and Warnings */}
                {(validation.issues?.length > 0 || validation.warnings?.length > 0) && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {validation.issues?.length > 0 && (
                      <Card className="p-6">
                        <h4 className="font-semibold text-red-700 mb-4 flex items-center space-x-2">
                          <AlertTriangle className="w-5 h-5" />
                          <span>Critical Issues</span>
                        </h4>
                        <ul className="space-y-2">
                          {validation.issues.map((issue: string, index: number) => (
                            <li key={index} className="flex items-start space-x-2">
                              <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                              <span className="text-sm text-gray-700">{issue}</span>
                            </li>
                          ))}
                        </ul>
                      </Card>
                    )}

                    {validation.warnings?.length > 0 && (
                      <Card className="p-6">
                        <h4 className="font-semibold text-yellow-700 mb-4 flex items-center space-x-2">
                          <AlertTriangle className="w-5 h-5" />
                          <span>Warnings</span>
                        </h4>
                        <ul className="space-y-2">
                          {validation.warnings.map((warning: string, index: number) => (
                            <li key={index} className="flex items-start space-x-2">
                              <AlertTriangle className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                              <span className="text-sm text-gray-700">{warning}</span>
                            </li>
                          ))}
                        </ul>
                      </Card>
                    )}
                  </div>
                )}
              </>
            ) : (
              <Card className="p-12 text-center">
                <CheckCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Validate Coordination</h3>
                <p className="text-gray-600">Check your coordination for issues and improvements</p>
              </Card>
            )}
          </div>
        )}

        {/* Budget Optimization Tab */}
        {activeTab === 'optimization' && (
          <div className="space-y-6">
            {optimizationLoading ? (
              <div className="flex items-center justify-center py-12">
                <RefreshCw className="w-8 h-8 animate-spin text-purple-600" />
                <span className="ml-3 text-lg">Optimizing budget...</span>
              </div>
            ) : optimization ? (
              <>
                {/* Budget Summary */}
                <Card className="p-6">
                  <h3 className="text-xl font-semibold mb-6">Budget Optimization</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-gray-900 mb-1">${optimization.currentTotal}</div>
                      <p className="text-sm text-gray-600">Current Total</p>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-blue-600 mb-1">${optimization.optimizedTotal}</div>
                      <p className="text-sm text-gray-600">Optimized Total</p>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-green-600 mb-1">${optimization.savings}</div>
                      <p className="text-sm text-gray-600">Potential Savings</p>
                    </div>
                  </div>
                </Card>

                {/* Optimization Recommendations */}
                {optimization.alternatives?.length > 0 && (
                  <Card className="p-6">
                    <h4 className="font-semibold mb-4">Cost-Saving Opportunities</h4>
                    <div className="space-y-4">
                      {optimization.alternatives.map((alt: any, index: number) => (
                        <div key={index} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-3">
                            <h5 className="font-medium">{alt.member?.user_profiles?.full_name}</h5>
                            <Badge className="bg-green-100 text-green-800">
                              Save ${alt.savings}
                            </Badge>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <p className="text-sm font-medium text-gray-700 mb-1">Current Selection</p>
                              <div className="bg-gray-50 rounded p-3">
                                <p className="font-medium">{alt.currentOutfit?.item_name}</p>
                                <p className="text-sm text-gray-600">${alt.currentOutfit?.price}</p>
                              </div>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-700 mb-1">Recommended Alternative</p>
                              <div className="bg-green-50 rounded p-3">
                                <p className="font-medium">{alt.alternative?.name}</p>
                                <p className="text-sm text-gray-600">${alt.alternative?.price}</p>
                              </div>
                            </div>
                          </div>
                          
                          <p className="text-sm text-gray-600 mt-3 italic">{alt.reasoning}</p>
                        </div>
                      ))}
                    </div>
                  </Card>
                )}
              </>
            ) : (
              <Card className="p-12 text-center">
                <DollarSign className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Optimize Budget</h3>
                <p className="text-gray-600">Find cost-saving opportunities while maintaining quality</p>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  )
}