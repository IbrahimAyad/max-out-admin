// pages/examples/customer-account.tsx
// Complete example of integrating profile system into your Next.js site

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { ProfileAPI, UserProfile, MenswearMeasurement, profileUtils } from '../../lib/profile-api'
import { CustomerProfileForm } from '../../components/profile/CustomerProfileForm'
import { SizeProfileForm } from '../../components/profile/SizeProfileForm'
import { supabase } from '../../lib/supabase'

interface TabProps {
  activeTab: string
  setActiveTab: (tab: string) => void
}

function ProfileTabs({ activeTab, setActiveTab }: TabProps) {
  const tabs = [
    { id: 'profile', name: 'Profile', icon: '👤' },
    { id: 'measurements', name: 'Size Profile', icon: '📏' },
    { id: 'preferences', name: 'Preferences', icon: '⚙️' },
    { id: 'orders', name: 'Order History', icon: '📦' }
  ]

  return (
    <div className="border-b border-gray-200">
      <nav className="-mb-px flex space-x-8">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`${
              activeTab === tab.id
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2`}
          >
            <span>{tab.icon}</span>
            <span>{tab.name}</span>
          </button>
        ))}
      </nav>
    </div>
  )
}

function ProfileOverview({ profile, measurements }: { profile: UserProfile | null, measurements: MenswearMeasurement | null }) {
  const completionPercentage = profileUtils.calculateCompletionPercentage(profile)
  const measurementsComplete = profileUtils.areMeasurementsComplete(measurements)
  const displayName = profileUtils.getDisplayName(profile)

  return (
    <div className="bg-white rounded-lg shadow p-6 mb-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Welcome back, {displayName}!</h2>
          <p className="text-gray-600 mt-1">
            {profile?.is_wedding_customer 
              ? `Wedding Customer • ${profile.wedding_role || 'Member'}` 
              : 'Regular Customer'
            }
          </p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-indigo-600">{completionPercentage}%</div>
          <div className="text-sm text-gray-500">Profile Complete</div>
        </div>
      </div>
      
      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="font-medium text-gray-900 mb-2">Account Status</h3>
          <p className="text-sm text-gray-600">
            {profile?.customer_tier || 'Standard'} Customer
          </p>
          <p className="text-sm text-gray-600">
            {profile?.total_orders || 0} orders
          </p>
        </div>
        
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="font-medium text-gray-900 mb-2">Size Profile</h3>
          <p className={`text-sm ${
            measurementsComplete ? 'text-green-600' : 'text-orange-600'
          }`}>
            {measurementsComplete ? '✓ Complete' : '⚠ Incomplete'}
          </p>
          {measurements?.suit_size && (
            <p className="text-sm text-gray-600">Size: {measurements.suit_size}</p>
          )}
        </div>
        
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="font-medium text-gray-900 mb-2">Preferences</h3>
          <p className="text-sm text-gray-600">
            {measurements?.preferred_fit || 'Not set'} fit
          </p>
          <p className="text-sm text-gray-600">
            {profile?.notification_preferences?.email_marketing ? 'Marketing emails on' : 'Marketing emails off'}
          </p>
        </div>
      </div>
    </div>
  )
}

function OrderHistory({ profile }: { profile: UserProfile | null }) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Orders</h3>
      {profile?.total_orders && profile.total_orders > 0 ? (
        <div className="space-y-4">
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="font-medium text-gray-900">Order History</h4>
                <p className="text-sm text-gray-600 mt-1">
                  Total Orders: {profile.total_orders}
                </p>
                <p className="text-sm text-gray-600">
                  Total Spent: ${profile.total_spent?.toFixed(2) || '0.00'}
                </p>
              </div>
              <span className="text-sm font-medium text-green-600">Active Customer</span>
            </div>
          </div>
          <p className="text-sm text-gray-500 text-center py-4">
            Connect this to your existing order history system
          </p>
        </div>
      ) : (
        <div className="text-center py-8">
          <div className="text-gray-400 text-4xl mb-4">📦</div>
          <h4 className="text-lg font-medium text-gray-900 mb-2">No orders yet</h4>
          <p className="text-gray-600 mb-4">Start shopping to see your order history here.</p>
          <button className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700">
            Browse Products
          </button>
        </div>
      )}
    </div>
  )
}

function Preferences({ profile, onUpdate }: { profile: UserProfile | null, onUpdate: () => void }) {
  const [preferences, setPreferences] = useState({
    email_marketing: profile?.notification_preferences?.email_marketing || false,
    sms_marketing: profile?.notification_preferences?.sms_marketing || false,
    email_orders: profile?.notification_preferences?.email_orders || true,
    sms_orders: profile?.notification_preferences?.sms_orders || false,
    email_recommendations: profile?.notification_preferences?.email_recommendations || true
  })
  
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  const handleSave = async () => {
    setSaving(true)
    setMessage('')
    
    try {
      await ProfileAPI.updateProfile({
        notification_preferences: preferences
      })
      
      setMessage('Preferences saved successfully!')
      onUpdate()
    } catch (error: any) {
      setMessage(error.message || 'Failed to save preferences')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Notification Preferences</h3>
      
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-medium text-gray-900">Email Marketing</h4>
            <p className="text-sm text-gray-600">Receive promotional emails and special offers</p>
          </div>
          <input
            type="checkbox"
            checked={preferences.email_marketing}
            onChange={(e) => setPreferences(prev => ({ ...prev, email_marketing: e.target.checked }))}
            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
          />
        </div>
        
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-medium text-gray-900">Order Updates (Email)</h4>
            <p className="text-sm text-gray-600">Get email updates about your orders</p>
          </div>
          <input
            type="checkbox"
            checked={preferences.email_orders}
            onChange={(e) => setPreferences(prev => ({ ...prev, email_orders: e.target.checked }))}
            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
          />
        </div>
        
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-medium text-gray-900">Style Recommendations</h4>
            <p className="text-sm text-gray-600">Receive personalized style recommendations</p>
          </div>
          <input
            type="checkbox"
            checked={preferences.email_recommendations}
            onChange={(e) => setPreferences(prev => ({ ...prev, email_recommendations: e.target.checked }))}
            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
          />
        </div>
      </div>
      
      <div className="mt-6 flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Preferences'}
        </button>
      </div>
      
      {message && (
        <div className={`mt-4 p-3 rounded-md text-sm ${
          message.includes('success') 
            ? 'bg-green-50 text-green-800 border border-green-200'
            : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {message}
        </div>
      )}
    </div>
  )
}

export default function CustomerAccount() {
  const router = useRouter()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [measurements, setMeasurements] = useState<MenswearMeasurement | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('profile')
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const currentUser = await ProfileAPI.getCurrentUser()
      
      if (!currentUser) {
        router.push('/auth/login')
        return
      }
      
      setUser(currentUser)
      await loadProfile()
    } catch (error) {
      console.error('Auth check error:', error)
      router.push('/auth/login')
    }
  }

  const loadProfile = async () => {
    setLoading(true)
    try {
      const [profileData, measurementsData] = await Promise.all([
        ProfileAPI.getProfile(),
        ProfileAPI.getMeasurements()
      ])
      
      setProfile(profileData)
      setMeasurements(measurementsData)
    } catch (error) {
      console.error('Error loading profile data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <h1 className="text-2xl font-bold text-gray-900">My Account</h1>
            <button
              onClick={handleSignOut}
              className="text-gray-600 hover:text-gray-900 text-sm"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Profile Overview */}
        <ProfileOverview profile={profile} measurements={measurements} />
        
        {/* Main Content */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4">
            <ProfileTabs activeTab={activeTab} setActiveTab={setActiveTab} />
          </div>
          
          <div className="px-6 py-6">
            {activeTab === 'profile' && (
              <CustomerProfileForm 
                profile={profile} 
                onUpdate={loadProfile}
              />
            )}
            
            {activeTab === 'measurements' && (
              <SizeProfileForm 
                onUpdate={loadProfile}
                showTitle={false}
              />
            )}
            
            {activeTab === 'preferences' && (
              <Preferences 
                profile={profile} 
                onUpdate={loadProfile}
              />
            )}
            
            {activeTab === 'orders' && (
              <OrderHistory profile={profile} />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}