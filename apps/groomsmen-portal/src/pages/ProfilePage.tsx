import { useState, useEffect } from 'react'
import { ArrowLeft, User, Phone, Mail, MapPin, Save } from 'lucide-react'
import { MobileLayout } from '@/components/MobileLayout'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { useAuth } from '@/lib/AuthContext'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

export function ProfilePage() {
  const [profile, setProfile] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'US'
    },
    emergencyContact: {
      name: '',
      phone: '',
      relationship: ''
    },
    specialRequests: '',
    dietaryRestrictions: '',
    accessibilityNeeds: ''
  })
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const { user } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = async () => {
    try {
      // In a real app, we would fetch the profile from the database
      // For now, we'll use basic user info from auth
      if (user) {
        setProfile(prev => ({
          ...prev,
          email: user.email || ''
        }))
      }
    } catch (error: any) {
      console.error('Load profile error:', error)
      toast.error('Failed to load profile')
    } finally {
      setLoading(false)
    }
  }

  const saveProfile = async () => {
    setSaving(true)
    try {
      // In a real app, we would save to the database
      await new Promise(resolve => setTimeout(resolve, 1000)) // Simulate API call
      toast.success('Profile updated successfully!')
    } catch (error: any) {
      console.error('Save profile error:', error)
      toast.error('Failed to save profile')
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
            <h1 className="text-xl font-bold text-gray-900">Profile</h1>
            <p className="text-sm text-gray-600">Manage your information</p>
          </div>
        </div>

        {/* Basic Information */}
        <div className="bg-white rounded-2xl shadow-lg p-6 space-y-4">
          <div className="flex items-center space-x-2 mb-4">
            <User className="h-5 w-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">Basic Information</h3>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                First Name
              </label>
              <input
                type="text"
                value={profile.firstName}
                onChange={(e) => setProfile(prev => ({ ...prev, firstName: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Last Name
              </label>
              <input
                type="text"
                value={profile.lastName}
                onChange={(e) => setProfile(prev => ({ ...prev, lastName: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              value={profile.email}
              disabled
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
            />
            <p className="text-xs text-gray-500 mt-1">Email cannot be changed here</p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone Number
            </label>
            <input
              type="tel"
              value={profile.phone}
              onChange={(e) => setProfile(prev => ({ ...prev, phone: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Address */}
        <div className="bg-white rounded-2xl shadow-lg p-6 space-y-4">
          <div className="flex items-center space-x-2 mb-4">
            <MapPin className="h-5 w-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">Address</h3>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Street Address
            </label>
            <input
              type="text"
              value={profile.address.street}
              onChange={(e) => setProfile(prev => ({ 
                ...prev, 
                address: { ...prev.address, street: e.target.value }
              }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                City
              </label>
              <input
                type="text"
                value={profile.address.city}
                onChange={(e) => setProfile(prev => ({ 
                  ...prev, 
                  address: { ...prev.address, city: e.target.value }
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                State
              </label>
              <input
                type="text"
                value={profile.address.state}
                onChange={(e) => setProfile(prev => ({ 
                  ...prev, 
                  address: { ...prev.address, state: e.target.value }
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ZIP Code
            </label>
            <input
              type="text"
              value={profile.address.zipCode}
              onChange={(e) => setProfile(prev => ({ 
                ...prev, 
                address: { ...prev.address, zipCode: e.target.value }
              }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Emergency Contact */}
        <div className="bg-white rounded-2xl shadow-lg p-6 space-y-4">
          <div className="flex items-center space-x-2 mb-4">
            <Phone className="h-5 w-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">Emergency Contact</h3>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name
            </label>
            <input
              type="text"
              value={profile.emergencyContact.name}
              onChange={(e) => setProfile(prev => ({ 
                ...prev, 
                emergencyContact: { ...prev.emergencyContact, name: e.target.value }
              }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone
              </label>
              <input
                type="tel"
                value={profile.emergencyContact.phone}
                onChange={(e) => setProfile(prev => ({ 
                  ...prev, 
                  emergencyContact: { ...prev.emergencyContact, phone: e.target.value }
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Relationship
              </label>
              <input
                type="text"
                value={profile.emergencyContact.relationship}
                onChange={(e) => setProfile(prev => ({ 
                  ...prev, 
                  emergencyContact: { ...prev.emergencyContact, relationship: e.target.value }
                }))}
                placeholder="Parent, Spouse, etc."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Additional Information */}
        <div className="bg-white rounded-2xl shadow-lg p-6 space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Additional Information</h3>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Dietary Restrictions
            </label>
            <textarea
              value={profile.dietaryRestrictions}
              onChange={(e) => setProfile(prev => ({ ...prev, dietaryRestrictions: e.target.value }))}
              placeholder="Any dietary restrictions or allergies..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Accessibility Needs
            </label>
            <textarea
              value={profile.accessibilityNeeds}
              onChange={(e) => setProfile(prev => ({ ...prev, accessibilityNeeds: e.target.value }))}
              placeholder="Any accessibility accommodations needed..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Special Requests
            </label>
            <textarea
              value={profile.specialRequests}
              onChange={(e) => setProfile(prev => ({ ...prev, specialRequests: e.target.value }))}
              placeholder="Any special requests or notes..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Save Button */}
        <button
          onClick={saveProfile}
          disabled={saving}
          className="w-full bg-blue-600 text-white py-4 px-6 rounded-2xl font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
        >
          {saving ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              <span>Saving...</span>
            </>
          ) : (
            <>
              <Save size={20} />
              <span>Save Profile</span>
            </>
          )}
        </button>
      </div>
    </MobileLayout>
  )
}