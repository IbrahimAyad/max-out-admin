import React, { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { 
  User, 
  Settings as SettingsIcon, 
  Bell, 
  Shield, 
  Palette, 
  Globe, 
  Save,
  Key,
  Mail,
  Phone,
  Building,
  Database,
  Upload,
  Download,
  Users,
  RefreshCw
} from 'lucide-react'
import toast from 'react-hot-toast'

export default function Settings() {
  const { user, migration } = useAuth()
  const [activeTab, setActiveTab] = useState('general')
  const [migrationLoading, setMigrationLoading] = useState(false)
  const [migrationReport, setMigrationReport] = useState(null)
  const [settings, setSettings] = useState({
    businessName: 'KCT Menswear',
    businessEmail: 'admin@kctmenswear.com',
    businessPhone: '+1 (555) 123-4567',
    businessAddress: '123 Fashion Ave, New York, NY 10001',
    currency: 'USD',
    language: 'en',
    timezone: 'America/New_York',
    emailNotifications: true,
    pushNotifications: true,
    orderNotifications: true,
    lowStockAlerts: true,
    theme: 'light',
  })

  const tabs = [
    { id: 'general', name: 'General', icon: SettingsIcon },
    { id: 'business', name: 'Business', icon: Building },
    { id: 'notifications', name: 'Notifications', icon: Bell },
    { id: 'security', name: 'Security', icon: Shield },
    { id: 'appearance', name: 'Appearance', icon: Palette },
    { id: 'migration', name: 'User Migration', icon: Database },
  ]

  const handleSave = () => {
    // In a real app, this would save to the database
    toast.success('Settings saved successfully')
  }

  const handleInputChange = (key: string, value: string | boolean) => {
    setSettings(prev => ({ ...prev, [key]: value }))
  }

  const generateMigrationReport = async () => {
    setMigrationLoading(true)
    try {
      const report = await migration.generateReport()
      setMigrationReport(report)
      toast.success('Migration report generated successfully')
    } catch (error: any) {
      toast.error(`Failed to generate report: ${error.message}`)
    } finally {
      setMigrationLoading(false)
    }
  }

  const runBulkMigration = async () => {
    if (!confirm('This will migrate all wedding portal users to the unified system. This action cannot be undone. Continue?')) {
      return
    }
    
    setMigrationLoading(true)
    try {
      const result = await migration.bulkMigration()
      toast.success(`Migration completed: ${result.migrated_count} users migrated`)
      // Refresh the report after migration
      await generateMigrationReport()
    } catch (error: any) {
      toast.error(`Migration failed: ${error.message}`)
    } finally {
      setMigrationLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-neutral-900">Settings</h2>
          <p className="text-sm text-neutral-500">
            Configure your application preferences
          </p>
        </div>
        <button
          onClick={handleSave}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-black hover:bg-neutral-800"
        >
          <Save className="h-4 w-4 mr-2" />
          Save Changes
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <nav className="space-y-1">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                    activeTab === tab.id
                      ? 'bg-black text-white'
                      : 'text-neutral-700 hover:bg-neutral-100'
                  }`}
                >
                  <Icon className="h-4 w-4 mr-3" />
                  {tab.name}
                </button>
              )
            })}
          </nav>
        </div>

        {/* Content */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-lg border border-neutral-200 p-6">
            {activeTab === 'general' && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-neutral-900">General Settings</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Default Currency
                    </label>
                    <select
                      value={settings.currency}
                      onChange={(e) => handleInputChange('currency', e.target.value)}
                      className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
                    >
                      <option value="USD">USD - US Dollar</option>
                      <option value="EUR">EUR - Euro</option>
                      <option value="GBP">GBP - British Pound</option>
                      <option value="CAD">CAD - Canadian Dollar</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Language
                    </label>
                    <select
                      value={settings.language}
                      onChange={(e) => handleInputChange('language', e.target.value)}
                      className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
                    >
                      <option value="en">English</option>
                      <option value="es">Spanish</option>
                      <option value="fr">French</option>
                      <option value="de">German</option>
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Timezone
                    </label>
                    <select
                      value={settings.timezone}
                      onChange={(e) => handleInputChange('timezone', e.target.value)}
                      className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
                    >
                      <option value="America/New_York">Eastern Time (EST/EDT)</option>
                      <option value="America/Chicago">Central Time (CST/CDT)</option>
                      <option value="America/Denver">Mountain Time (MST/MDT)</option>
                      <option value="America/Los_Angeles">Pacific Time (PST/PDT)</option>
                      <option value="Europe/London">London (GMT/BST)</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'business' && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-neutral-900">Business Information</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Business Name
                    </label>
                    <input
                      type="text"
                      value={settings.businessName}
                      onChange={(e) => handleInputChange('businessName', e.target.value)}
                      className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      <Mail className="h-4 w-4 inline mr-1" />
                      Business Email
                    </label>
                    <input
                      type="email"
                      value={settings.businessEmail}
                      onChange={(e) => handleInputChange('businessEmail', e.target.value)}
                      className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      <Phone className="h-4 w-4 inline mr-1" />
                      Business Phone
                    </label>
                    <input
                      type="tel"
                      value={settings.businessPhone}
                      onChange={(e) => handleInputChange('businessPhone', e.target.value)}
                      className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Business Address
                    </label>
                    <textarea
                      value={settings.businessAddress}
                      onChange={(e) => handleInputChange('businessAddress', e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-neutral-900">Notification Preferences</h3>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-neutral-900">Email Notifications</p>
                      <p className="text-sm text-neutral-500">Receive notifications via email</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.emailNotifications}
                        onChange={(e) => handleInputChange('emailNotifications', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-black/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-black"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-neutral-900">Push Notifications</p>
                      <p className="text-sm text-neutral-500">Receive push notifications in browser</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.pushNotifications}
                        onChange={(e) => handleInputChange('pushNotifications', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-black/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-black"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-neutral-900">Order Notifications</p>
                      <p className="text-sm text-neutral-500">Get notified about new orders</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.orderNotifications}
                        onChange={(e) => handleInputChange('orderNotifications', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-black/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-black"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-neutral-900">Low Stock Alerts</p>
                      <p className="text-sm text-neutral-500">Get alerts when inventory is low</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.lowStockAlerts}
                        onChange={(e) => handleInputChange('lowStockAlerts', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-black/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-black"></div>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'security' && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-neutral-900">Security Settings</h3>
                
                <div className="space-y-6">
                  <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-4">
                    <div className="flex items-center space-x-3">
                      <User className="h-8 w-8 text-neutral-400" />
                      <div>
                        <p className="text-sm font-medium text-neutral-900">Current User</p>
                        <p className="text-sm text-neutral-500">{user?.email}</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-neutral-900 mb-3">Change Password</h4>
                    <div className="space-y-3">
                      <input
                        type="password"
                        placeholder="Current password"
                        className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
                      />
                      <input
                        type="password"
                        placeholder="New password"
                        className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
                      />
                      <input
                        type="password"
                        placeholder="Confirm new password"
                        className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
                      />
                      <button className="inline-flex items-center px-4 py-2 border border-neutral-300 rounded-md shadow-sm text-sm font-medium text-neutral-700 bg-white hover:bg-neutral-50">
                        <Key className="h-4 w-4 mr-2" />
                        Update Password
                      </button>
                    </div>
                  </div>

                  <div className="border-t border-neutral-200 pt-6">
                    <h4 className="text-sm font-medium text-neutral-900 mb-3">Session Management</h4>
                    <p className="text-sm text-neutral-500 mb-3">
                      You are currently signed in on this device. You can sign out of all other sessions.
                    </p>
                    <button className="inline-flex items-center px-4 py-2 border border-red-300 rounded-md shadow-sm text-sm font-medium text-red-700 bg-white hover:bg-red-50">
                      <Shield className="h-4 w-4 mr-2" />
                      Sign Out All Other Sessions
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'appearance' && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-neutral-900">Appearance Settings</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-3">
                      Theme Preference
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      <label className="relative cursor-pointer">
                        <input
                          type="radio"
                          name="theme"
                          value="light"
                          checked={settings.theme === 'light'}
                          onChange={(e) => handleInputChange('theme', e.target.value)}
                          className="sr-only"
                        />
                        <div className={`p-4 border-2 rounded-lg text-center ${
                          settings.theme === 'light' ? 'border-black bg-neutral-50' : 'border-neutral-200'
                        }`}>
                          <div className="h-8 w-full bg-white border border-neutral-200 rounded mb-2"></div>
                          <p className="text-sm font-medium">Light</p>
                        </div>
                      </label>
                      
                      <label className="relative cursor-pointer">
                        <input
                          type="radio"
                          name="theme"
                          value="dark"
                          checked={settings.theme === 'dark'}
                          onChange={(e) => handleInputChange('theme', e.target.value)}
                          className="sr-only"
                        />
                        <div className={`p-4 border-2 rounded-lg text-center ${
                          settings.theme === 'dark' ? 'border-black bg-neutral-50' : 'border-neutral-200'
                        }`}>
                          <div className="h-8 w-full bg-neutral-900 rounded mb-2"></div>
                          <p className="text-sm font-medium">Dark</p>
                        </div>
                      </label>
                      
                      <label className="relative cursor-pointer">
                        <input
                          type="radio"
                          name="theme"
                          value="auto"
                          checked={settings.theme === 'auto'}
                          onChange={(e) => handleInputChange('theme', e.target.value)}
                          className="sr-only"
                        />
                        <div className={`p-4 border-2 rounded-lg text-center ${
                          settings.theme === 'auto' ? 'border-black bg-neutral-50' : 'border-neutral-200'
                        }`}>
                          <div className="h-8 w-full bg-gradient-to-r from-white to-neutral-900 rounded mb-2"></div>
                          <p className="text-sm font-medium">Auto</p>
                        </div>
                      </label>
                    </div>
                  </div>

                  <div className="border-t border-neutral-200 pt-6">
                    <p className="text-sm text-neutral-500">
                      The luxury black and gold theme is optimized for the KCT Menswear brand experience.
                      Theme changes will be applied across the entire admin dashboard.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'migration' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-neutral-900">User Migration System</h3>
                  <div className="flex items-center space-x-2">
                    <Database className="h-5 w-5 text-neutral-400" />
                    <span className="text-sm text-neutral-500">V1 Unified Authentication</span>
                  </div>
                </div>
                
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2">
                    <Database className="h-5 w-5 text-blue-600" />
                    <h4 className="text-sm font-medium text-blue-900">Migration Overview</h4>
                  </div>
                  <p className="text-sm text-blue-800 mt-2">
                    Migrate users from legacy wedding portals to the unified authentication system. 
                    This ensures seamless cross-portal access and data synchronization.
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="border border-neutral-200 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-neutral-900 mb-3">Migration Report</h4>
                    <p className="text-sm text-neutral-500 mb-4">
                      Generate a detailed report of users that need migration from wedding portals.
                    </p>
                    <button
                      onClick={generateMigrationReport}
                      disabled={migrationLoading}
                      className="inline-flex items-center px-4 py-2 border border-neutral-300 rounded-md shadow-sm text-sm font-medium text-neutral-700 bg-white hover:bg-neutral-50 disabled:opacity-50"
                    >
                      {migrationLoading ? (
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Download className="h-4 w-4 mr-2" />
                      )}
                      Generate Report
                    </button>
                    
                    {migrationReport && (
                      <div className="mt-4 bg-neutral-50 rounded-lg p-4">
                        <h5 className="text-sm font-medium text-neutral-900 mb-2">Report Summary</h5>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-neutral-500">Users requiring migration:</span>
                            <span className="ml-2 font-medium">{migrationReport.total_users || 0}</span>
                          </div>
                          <div>
                            <span className="text-neutral-500">Wedding portals found:</span>
                            <span className="ml-2 font-medium">{migrationReport.portal_count || 0}</span>
                          </div>
                          <div>
                            <span className="text-neutral-500">Couples accounts:</span>
                            <span className="ml-2 font-medium">{migrationReport.couples_count || 0}</span>
                          </div>
                          <div>
                            <span className="text-neutral-500">Groomsmen accounts:</span>
                            <span className="ml-2 font-medium">{migrationReport.groomsmen_count || 0}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="border border-neutral-200 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-neutral-900 mb-3">Bulk Migration</h4>
                    <p className="text-sm text-neutral-500 mb-4">
                      Migrate all wedding portal users to the unified authentication system. 
                      This operation cannot be undone.
                    </p>
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={runBulkMigration}
                        disabled={migrationLoading || !migrationReport}
                        className="inline-flex items-center px-4 py-2 border border-orange-300 rounded-md shadow-sm text-sm font-medium text-orange-700 bg-white hover:bg-orange-50 disabled:opacity-50"
                      >
                        {migrationLoading ? (
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Upload className="h-4 w-4 mr-2" />
                        )}
                        Run Migration
                      </button>
                      {!migrationReport && (
                        <span className="text-xs text-neutral-500">
                          Generate a report first to enable migration
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="border border-neutral-200 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-neutral-900 mb-3">User Management</h4>
                    <p className="text-sm text-neutral-500 mb-4">
                      Access unified user management tools and wedding party coordination.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <button className="inline-flex items-center px-4 py-2 border border-neutral-300 rounded-md shadow-sm text-sm font-medium text-neutral-700 bg-white hover:bg-neutral-50">
                        <Users className="h-4 w-4 mr-2" />
                        Manage Wedding Parties
                      </button>
                      <button className="inline-flex items-center px-4 py-2 border border-neutral-300 rounded-md shadow-sm text-sm font-medium text-neutral-700 bg-white hover:bg-neutral-50">
                        <Mail className="h-4 w-4 mr-2" />
                        Generate Invitation Codes
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}