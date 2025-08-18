import React, { useState, useEffect } from 'react'
import { profileApi, UserProfile } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'
import { Textarea } from '../components/ui/textarea'
import { Badge } from '../components/ui/badge'
import { Progress } from '../components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs'
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar'
import { User, Phone, MapPin, CreditCard, Settings, Award, TrendingUp } from 'lucide-react'
import { MeasurementsInterface } from './MeasurementsInterface'
import { StyleProfileInterface } from './StyleProfileInterface'

interface ProfileDashboardProps {
  profile: UserProfile | null
  onProfileUpdate: (profile: UserProfile) => void
}

export function ProfileDashboard({ profile, onProfileUpdate }: ProfileDashboardProps) {
  const { user } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState<Partial<UserProfile>>({})
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    if (profile) {
      setFormData(profile)
    }
  }, [profile])

  const handleSave = async () => {
    if (!user) return

    setLoading(true)
    try {
      const updatedProfile = await profileApi.updateProfile(formData)
      onProfileUpdate(updatedProfile)
      setIsEditing(false)
    } catch (error) {
      console.error('Error updating profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const getCompletionScore = () => {
    if (!profile) return 0
    
    const fields = [
      profile.first_name,
      profile.last_name,
      profile.phone,
      profile.date_of_birth,
      profile.address_line_1,
      profile.city,
      profile.state,
      profile.size_profile?.chest,
      profile.size_profile?.waist,
      profile.size_profile?.inseam
    ]
    
    const completedFields = fields.filter(field => field && field.toString().length > 0)
    return Math.round((completedFields.length / fields.length) * 100)
  }

  const getCustomerTierColor = (tier: string) => {
    switch (tier) {
      case 'Platinum': return 'bg-purple-100 text-purple-800'
      case 'Gold': return 'bg-yellow-100 text-yellow-800'
      case 'Silver': return 'bg-gray-100 text-gray-800'
      default: return 'bg-orange-100 text-orange-800'
    }
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-slate-200 rounded-full mx-auto mb-4 animate-pulse"></div>
          <p className="text-slate-600">Loading your profile...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 mb-2">Profile Management</h1>
              <p className="text-slate-600">Manage your personal information, measurements, and style preferences</p>
            </div>
            <div className="flex items-center gap-4">
              <Badge className={`px-3 py-1 ${getCustomerTierColor(profile.customer_tier)}`}>
                {profile.customer_tier} Member
              </Badge>
              {profile.vip_status && (
                <Badge className="bg-amber-100 text-amber-800 px-3 py-1">
                  <Award className="w-3 h-3 mr-1" />
                  VIP
                </Badge>
              )}
            </div>
          </div>

          {/* Profile Completion */}
          <Card className="border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-slate-900">Profile Completion</h3>
                  <p className="text-sm text-slate-600">Complete your profile to get better recommendations</p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-slate-900">{getCompletionScore()}%</div>
                </div>
              </div>
              <Progress value={getCompletionScore()} className="h-2" />
            </CardContent>
          </Card>
        </div>

        {/* Navigation Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-8">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <User className="w-4 h-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="measurements" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Measurements
            </TabsTrigger>
            <TabsTrigger value="style" className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Style Profile
            </TabsTrigger>
            <TabsTrigger value="preferences" className="flex items-center gap-2">
              <CreditCard className="w-4 h-4" />
              Preferences
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Personal Information */}
              <Card className="lg:col-span-2 border-0 shadow-sm">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-slate-900">Personal Information</CardTitle>
                      <CardDescription>Your basic profile information</CardDescription>
                    </div>
                    <Button
                      variant={isEditing ? "outline" : "default"}
                      onClick={() => setIsEditing(!isEditing)}
                      className="bg-slate-900 hover:bg-slate-800"
                    >
                      {isEditing ? 'Cancel' : 'Edit'}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="first_name" className="text-slate-700">First Name</Label>
                      <Input
                        id="first_name"
                        value={formData.first_name || ''}
                        onChange={(e) => setFormData({...formData, first_name: e.target.value})}
                        disabled={!isEditing}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="last_name" className="text-slate-700">Last Name</Label>
                      <Input
                        id="last_name"
                        value={formData.last_name || ''}
                        onChange={(e) => setFormData({...formData, last_name: e.target.value})}
                        disabled={!isEditing}
                        className="mt-1"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="email" className="text-slate-700">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email || ''}
                      disabled
                      className="mt-1 bg-slate-50"
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="phone" className="text-slate-700">Phone</Label>
                      <Input
                        id="phone"
                        value={formData.phone || ''}
                        onChange={(e) => setFormData({...formData, phone: e.target.value})}
                        disabled={!isEditing}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="date_of_birth" className="text-slate-700">Date of Birth</Label>
                      <Input
                        id="date_of_birth"
                        type="date"
                        value={formData.date_of_birth || ''}
                        onChange={(e) => setFormData({...formData, date_of_birth: e.target.value})}
                        disabled={!isEditing}
                        className="mt-1"
                      />
                    </div>
                  </div>

                  {isEditing && (
                    <div className="flex gap-2 pt-4">
                      <Button
                        onClick={handleSave}
                        disabled={loading}
                        className="bg-slate-900 hover:bg-slate-800"
                      >
                        {loading ? 'Saving...' : 'Save Changes'}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Stats Panel */}
              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="text-slate-900">Account Summary</CardTitle>
                  <CardDescription>Your activity and engagement</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
                        <TrendingUp className="w-4 h-4 text-emerald-600" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-slate-900">Total Spent</div>
                        <div className="text-xs text-slate-600">${profile.total_spent.toFixed(2)}</div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <CreditCard className="w-4 h-4 text-blue-600" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-slate-900">Total Orders</div>
                        <div className="text-xs text-slate-600">{profile.total_orders}</div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                        <Award className="w-4 h-4 text-purple-600" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-slate-900">Engagement Score</div>
                        <div className="text-xs text-slate-600">{profile.engagement_score}/100</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Address Information */}
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-slate-900">
                  <MapPin className="w-5 h-5" />
                  Address Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <Label htmlFor="address_line_1" className="text-slate-700">Street Address</Label>
                    <Input
                      id="address_line_1"
                      value={formData.address_line_1 || ''}
                      onChange={(e) => setFormData({...formData, address_line_1: e.target.value})}
                      disabled={!isEditing}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="city" className="text-slate-700">City</Label>
                    <Input
                      id="city"
                      value={formData.city || ''}
                      onChange={(e) => setFormData({...formData, city: e.target.value})}
                      disabled={!isEditing}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="state" className="text-slate-700">State</Label>
                    <Input
                      id="state"
                      value={formData.state || ''}
                      onChange={(e) => setFormData({...formData, state: e.target.value})}
                      disabled={!isEditing}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="postal_code" className="text-slate-700">ZIP Code</Label>
                    <Input
                      id="postal_code"
                      value={formData.postal_code || ''}
                      onChange={(e) => setFormData({...formData, postal_code: e.target.value})}
                      disabled={!isEditing}
                      className="mt-1"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Measurements Tab */}
          <TabsContent value="measurements">
            <MeasurementsInterface />
          </TabsContent>

          {/* Style Profile Tab */}
          <TabsContent value="style">
            <StyleProfileInterface />
          </TabsContent>

          {/* Preferences Tab */}
          <TabsContent value="preferences">
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-slate-900">Communication Preferences</CardTitle>
                <CardDescription>Manage how you receive notifications and updates</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="font-medium text-slate-900">Order Notifications</h4>
                    <div className="space-y-3">
                      <label className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          checked={profile.notification_preferences?.email_orders || false}
                          className="rounded border-slate-300"
                        />
                        <span className="text-sm text-slate-700">Email notifications for orders</span>
                      </label>
                      <label className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          checked={profile.notification_preferences?.sms_orders || false}
                          className="rounded border-slate-300"
                        />
                        <span className="text-sm text-slate-700">SMS notifications for orders</span>
                      </label>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <h4 className="font-medium text-slate-900">Marketing Communications</h4>
                    <div className="space-y-3">
                      <label className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          checked={profile.notification_preferences?.email_marketing || false}
                          className="rounded border-slate-300"
                        />
                        <span className="text-sm text-slate-700">Email marketing and promotions</span>
                      </label>
                      <label className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          checked={profile.notification_preferences?.email_recommendations || false}
                          className="rounded border-slate-300"
                        />
                        <span className="text-sm text-slate-700">Personalized product recommendations</span>
                      </label>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}