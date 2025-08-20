import React, { useState, useEffect } from 'react'
import { styleApi, emailApi, StyleProfile, UserProfile } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'
import { Badge } from '../components/ui/badge'
import { Progress } from '../components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs'
import { Palette, Star, ShoppingBag, TrendingUp, Heart, Award } from 'lucide-react'

export function StyleProfileInterface() {
  const [styleProfile, setStyleProfile] = useState<Partial<StyleProfile>>({
    color_preferences: [],
    brand_preferences: [],
    fabric_preferences: [],
    pattern_preferences: [],
    style_goals: []
  })
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('personality')
  const [recommendations, setRecommendations] = useState<any>(null)

  useEffect(() => {
    loadStyleProfile()
    loadRecommendations()
  }, [])

  const loadStyleProfile = async () => {
    try {
      const data = await styleApi.getStyleProfile()
      if (data) {
        setStyleProfile(data)
      }
    } catch (error) {
      console.error('Error loading style profile:', error)
    }
  }

  const loadRecommendations = async () => {
    try {
      const data = await styleApi.getRecommendations()
      setRecommendations(data)
    } catch (error) {
      console.error('Error loading recommendations:', error)
    }
  }

  const handleSave = async () => {
    setLoading(true)
    try {
      await styleApi.saveStyleProfile(styleProfile)
      // Reload recommendations after saving
      const newRecommendations = await styleApi.getRecommendations()
      setRecommendations(newRecommendations)
      
      // Send style recommendations update email if we have recommendations
      if (newRecommendations && newRecommendations.suits?.length > 0) {
        // We need the user profile to send the email
        // This would typically be passed as a prop or retrieved from context
        // For now, we'll just log it - in a real app you'd get this from parent component
        console.log('Style recommendations updated - email would be sent here')
      }
    } catch (error) {
      console.error('Error saving style profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const getProfileCompleteness = () => {
    const requiredFields = [
      styleProfile.style_personality,
      styleProfile.body_type,
      styleProfile.color_preferences?.length,
      styleProfile.lifestyle_preferences,
      styleProfile.occasion_preferences
    ]
    const completedFields = requiredFields.filter(field => field && field !== 0)
    return Math.round((completedFields.length / requiredFields.length) * 100)
  }

  const colorOptions = [
    { name: 'Navy Blue', value: 'navy', class: 'bg-blue-900' },
    { name: 'Charcoal Grey', value: 'charcoal', class: 'bg-gray-800' },
    { name: 'Classic Black', value: 'black', class: 'bg-black' },
    { name: 'Burgundy', value: 'burgundy', class: 'bg-red-900' },
    { name: 'Forest Green', value: 'forest', class: 'bg-green-800' },
    { name: 'Camel', value: 'camel', class: 'bg-yellow-700' },
    { name: 'Light Blue', value: 'lightblue', class: 'bg-blue-400' },
    { name: 'White', value: 'white', class: 'bg-white border' }
  ]

  const stylePersonalities = [
    { value: 'classic', label: 'Classic & Timeless', description: 'Traditional, refined, and sophisticated' },
    { value: 'modern', label: 'Modern & Contemporary', description: 'Clean lines, minimalist, current trends' },
    { value: 'creative', label: 'Creative & Artistic', description: 'Unique, expressive, bold choices' },
    { value: 'business', label: 'Business Professional', description: 'Corporate-ready, polished, authoritative' },
    { value: 'casual', label: 'Smart Casual', description: 'Relaxed yet put-together, versatile' },
    { value: 'trendy', label: 'Fashion Forward', description: 'Latest trends, statement pieces, cutting-edge' }
  ]

  const bodyTypes = [
    { value: 'athletic', label: 'Athletic Build', description: 'Broad shoulders, defined waist' },
    { value: 'slim', label: 'Slim Build', description: 'Lean frame, narrow shoulders' },
    { value: 'average', label: 'Average Build', description: 'Balanced proportions' },
    { value: 'heavy', label: 'Full Build', description: 'Fuller frame, emphasis on comfort' }
  ]

  const fabricPreferences = [
    'Cotton', 'Wool', 'Linen', 'Silk', 'Cashmere', 'Denim', 'Leather', 'Performance Fabrics'
  ]

  const patternPreferences = [
    'Solid Colors', 'Pinstripes', 'Checks', 'Plaids', 'Herringbone', 'Tweed', 'Polka Dots', 'Geometric'
  ]

  const toggleArrayItem = (array: string[], item: string) => {
    const newArray = array.includes(item)
      ? array.filter(i => i !== item)
      : [...array, item]
    return newArray
  }

  return (
    <div className="space-y-6">
      {/* Header with Progress */}
      <Card className="border-0 shadow-sm bg-gradient-to-r from-slate-50 to-slate-100">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Style Profile</h2>
              <p className="text-slate-600">Define your personal style preferences for tailored recommendations</p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-slate-900 mb-1">{getProfileCompleteness()}%</div>
              <div className="text-sm text-slate-600">Complete</div>
            </div>
          </div>
          <Progress value={getProfileCompleteness()} className="h-3" />
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="personality" className="flex items-center gap-2">
            <Star className="w-4 h-4" />
            Personality
          </TabsTrigger>
          <TabsTrigger value="preferences" className="flex items-center gap-2">
            <Palette className="w-4 h-4" />
            Preferences
          </TabsTrigger>
          <TabsTrigger value="lifestyle" className="flex items-center gap-2">
            <Heart className="w-4 h-4" />
            Lifestyle
          </TabsTrigger>
          <TabsTrigger value="recommendations" className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Recommendations
          </TabsTrigger>
        </TabsList>

        {/* Style Personality */}
        <TabsContent value="personality" className="mt-6 space-y-6">
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-slate-900">
                <Star className="w-5 h-5" />
                Style Personality
              </CardTitle>
              <CardDescription>
                Choose the style that best represents your personal aesthetic
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {stylePersonalities.map((style) => (
                  <div
                    key={style.value}
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      styleProfile.style_personality === style.value
                        ? 'border-slate-900 bg-slate-50'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                    onClick={() => setStyleProfile({...styleProfile, style_personality: style.value})}
                  >
                    <h4 className="font-semibold text-slate-900 mb-2">{style.label}</h4>
                    <p className="text-sm text-slate-600">{style.description}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-slate-900">Body Type</CardTitle>
              <CardDescription>
                Help us recommend the most flattering fits for your build
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {bodyTypes.map((body) => (
                  <div
                    key={body.value}
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      styleProfile.body_type === body.value
                        ? 'border-slate-900 bg-slate-50'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                    onClick={() => setStyleProfile({...styleProfile, body_type: body.value})}
                  >
                    <h4 className="font-semibold text-slate-900 mb-2">{body.label}</h4>
                    <p className="text-sm text-slate-600">{body.description}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Color & Pattern Preferences */}
        <TabsContent value="preferences" className="mt-6 space-y-6">
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-slate-900">
                <Palette className="w-5 h-5" />
                Color Preferences
              </CardTitle>
              <CardDescription>
                Select your favorite colors for clothing recommendations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 md:grid-cols-8 gap-3">
                {colorOptions.map((color) => (
                  <div
                    key={color.value}
                    className="text-center cursor-pointer"
                    onClick={() => {
                      const newColors = toggleArrayItem(styleProfile.color_preferences || [], color.value)
                      setStyleProfile({...styleProfile, color_preferences: newColors})
                    }}
                  >
                    <div className={`w-12 h-12 rounded-lg mb-2 mx-auto ${color.class} ${
                      styleProfile.color_preferences?.includes(color.value)
                        ? 'ring-2 ring-slate-900 ring-offset-2'
                        : 'hover:ring-2 hover:ring-slate-300 hover:ring-offset-2'
                    }`} />
                    <div className="text-xs text-slate-600">{color.name}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-slate-900">Fabric Preferences</CardTitle>
                <CardDescription>Materials you prefer to wear</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2">
                  {fabricPreferences.map((fabric) => (
                    <Badge
                      key={fabric}
                      variant={styleProfile.fabric_preferences?.includes(fabric) ? 'default' : 'outline'}
                      className="justify-center cursor-pointer p-2"
                      onClick={() => {
                        const newFabrics = toggleArrayItem(styleProfile.fabric_preferences || [], fabric)
                        setStyleProfile({...styleProfile, fabric_preferences: newFabrics})
                      }}
                    >
                      {fabric}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-slate-900">Pattern Preferences</CardTitle>
                <CardDescription>Patterns and textures you like</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2">
                  {patternPreferences.map((pattern) => (
                    <Badge
                      key={pattern}
                      variant={styleProfile.pattern_preferences?.includes(pattern) ? 'default' : 'outline'}
                      className="justify-center cursor-pointer p-2"
                      onClick={() => {
                        const newPatterns = toggleArrayItem(styleProfile.pattern_preferences || [], pattern)
                        setStyleProfile({...styleProfile, pattern_preferences: newPatterns})
                      }}
                    >
                      {pattern}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Lifestyle */}
        <TabsContent value="lifestyle" className="mt-6">
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-slate-900">
                <Heart className="w-5 h-5" />
                Lifestyle & Occasions
              </CardTitle>
              <CardDescription>
                Help us understand when and where you'll wear your clothes
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label className="text-slate-700 font-medium mb-3 block">Primary Occasions (Select all that apply)</Label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {['Work/Business', 'Social Events', 'Casual Outings', 'Special Occasions', 'Travel', 'Wedding Events', 'Date Nights', 'Weekend Wear'].map((occasion) => (
                    <label key={occasion} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        className="rounded border-slate-300"
                        checked={styleProfile.occasion_preferences?.[occasion] || false}
                        onChange={(e) => {
                          const newOccasions = {
                            ...styleProfile.occasion_preferences,
                            [occasion]: e.target.checked
                          }
                          setStyleProfile({...styleProfile, occasion_preferences: newOccasions})
                        }}
                      />
                      <span className="text-sm text-slate-700">{occasion}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-slate-700 font-medium mb-3 block">Budget Range</Label>
                <Select 
                  value={styleProfile.budget_preferences?.range || ''} 
                  onValueChange={(value) => 
                    setStyleProfile({
                      ...styleProfile, 
                      budget_preferences: { ...styleProfile.budget_preferences, range: value }
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select your typical budget range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="budget">Budget Conscious ($50-$200)</SelectItem>
                    <SelectItem value="moderate">Moderate ($200-$500)</SelectItem>
                    <SelectItem value="premium">Premium ($500-$1000)</SelectItem>
                    <SelectItem value="luxury">Luxury ($1000+)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Recommendations */}
        <TabsContent value="recommendations" className="mt-6">
          <div className="space-y-6">
            {recommendations && (
              <>
                {recommendations.suits?.length > 0 && (
                  <Card className="border-0 shadow-sm">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-slate-900">
                        <Award className="w-5 h-5" />
                        Suit Recommendations
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {recommendations.suits.map((suit: any, index: number) => (
                          <div key={index} className="p-4 bg-slate-50 rounded-lg">
                            <h4 className="font-semibold text-slate-900 mb-2">{suit.title}</h4>
                            <p className="text-sm text-slate-600 mb-2">{suit.description}</p>
                            {suit.size && (
                              <Badge variant="outline" className="text-xs">{suit.size}</Badge>
                            )}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {recommendations.fit_advice?.length > 0 && (
                  <Card className="border-0 shadow-sm">
                    <CardHeader>
                      <CardTitle className="text-slate-900">Fit Recommendations</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {recommendations.fit_advice.map((advice: string, index: number) => (
                          <div key={index} className="flex items-start gap-2">
                            <div className="w-2 h-2 bg-slate-400 rounded-full mt-2 flex-shrink-0"></div>
                            <p className="text-slate-700">{advice}</p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={loading}
          className="bg-slate-900 hover:bg-slate-800 px-8"
        >
          {loading ? 'Saving...' : 'Save Style Profile'}
        </Button>
      </div>
    </div>
  )
}