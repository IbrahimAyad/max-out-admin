import { useState } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Bell, Menu, X, ArrowLeft, Settings, User, LogOut } from 'lucide-react'
import { DashboardOverview } from './components/DashboardOverview'
import { NotificationCenter } from './components/NotificationCenter'
import { QuickNavigation } from './components/QuickNavigation'
import { RecentActivity } from './components/RecentActivity'
import { WeddingManagement } from './components/WeddingManagement'
import { AdminLogin } from './components/AdminLogin'
import { UserMigrationTools } from './components/UserMigrationTools'
import InventoryManagement from './components/InventoryManagement'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { useAdminQueries } from './hooks/useAdminQueries'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 10, // 10 minutes
    },
  },
})

function AdminHeader({ onNotificationToggle, unreadCount, currentView, onBackClick, onSettingsClick }: { 
  onNotificationToggle: () => void
  unreadCount: number
  currentView: 'dashboard' | 'wedding' | 'settings' | 'inventory'
  onBackClick?: () => void
  onSettingsClick?: () => void
}) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const { user, signOut } = useAuth()

  return (
    <header className="bg-black text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Title */}
          <div className="flex items-center space-x-4">
            {(currentView === 'wedding' || currentView === 'settings') && (
              <button 
                onClick={onBackClick}
                className="p-2 text-gray-300 hover:text-white transition-colors rounded-lg hover:bg-gray-800"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-white text-black rounded-lg flex items-center justify-center font-bold text-sm">
                KCT
              </div>
              <div>
                <h1 className="text-xl font-bold">KCT Menswear</h1>
                <p className="text-sm text-gray-300">
                  {currentView === 'wedding' ? 'Wedding Management' : 
                   currentView === 'settings' ? 'Admin Settings' :
                   currentView === 'inventory' ? 'Inventory Management' : 'Admin Hub'}
                </p>
              </div>
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4">
            {/* User Info */}
            <div className="flex items-center space-x-3 text-gray-300">
              <User className="w-5 h-5" />
              <span className="text-sm">{user?.email}</span>
            </div>
            
            {/* Settings Button */}
            <button
              onClick={onSettingsClick}
              className="p-2 text-gray-300 hover:text-white transition-colors rounded-lg hover:bg-gray-800"
              title="Settings"
            >
              <Settings className="w-5 h-5" />
            </button>
            
            {/* Notifications */}
            <button
              onClick={onNotificationToggle}
              className="relative p-2 text-gray-300 hover:text-white transition-colors"
            >
              <Bell className="w-6 h-6" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>
            
            {/* Logout Button */}
            <button
              onClick={() => signOut()}
              className="p-2 text-gray-300 hover:text-white transition-colors rounded-lg hover:bg-gray-800"
              title="Sign Out"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-gray-300 hover:text-white"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-gray-700 py-4 space-y-2">
            <button
              onClick={onNotificationToggle}
              className="flex items-center space-x-2 w-full px-4 py-2 text-gray-300 hover:text-white transition-colors"
            >
              <Bell className="w-5 h-5" />
              <span>Notifications</span>
              {unreadCount > 0 && (
                <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1">
                  {unreadCount}
                </span>
              )}
            </button>
            <button
              onClick={onSettingsClick}
              className="flex items-center space-x-2 w-full px-4 py-2 text-gray-300 hover:text-white transition-colors"
            >
              <Settings className="w-5 h-5" />
              <span>Settings</span>
            </button>
            <button
              onClick={() => signOut()}
              className="flex items-center space-x-2 w-full px-4 py-2 text-gray-300 hover:text-white transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span>Sign Out</span>
            </button>
          </div>
        )}
      </div>
    </header>
  )
}

function AdminDashboard() {
  const [isNotificationCenterOpen, setIsNotificationCenterOpen] = useState(false)
  const [currentView, setCurrentView] = useState<'dashboard' | 'wedding' | 'settings' | 'inventory'>('inventory')
  const { unreadNotifications } = useAdminQueries()

  const unreadCount = unreadNotifications.data?.data.length || 0

  const handleWeddingClick = () => {
    setCurrentView('wedding')
  }

  const handleInventoryClick = () => {
    setCurrentView('inventory')
  }

  const handleBackToDashboard = () => {
    setCurrentView('dashboard')
  }

  const handleSettingsClick = () => {
    setCurrentView('settings')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminHeader 
        onNotificationToggle={() => setIsNotificationCenterOpen(!isNotificationCenterOpen)}
        unreadCount={unreadCount}
        currentView={currentView}
        onBackClick={handleBackToDashboard}
        onSettingsClick={handleSettingsClick}
      />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentView === 'dashboard' ? (
          <div className="space-y-8">
            {/* Welcome Section */}
            <div className="text-center">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                Welcome to KCT Admin Hub
              </h2>
              <p className="text-lg text-gray-600">
                Comprehensive wedding and business management platform
              </p>
            </div>

            {/* Dashboard Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Left Column */}
              <div className="space-y-8">
                <DashboardOverview />
                <QuickNavigation 
                  onWeddingClick={handleWeddingClick}
                  onInventoryClick={handleInventoryClick}
                />
              </div>
              
              {/* Right Column */}
              <div className="space-y-8">
                <RecentActivity />
              </div>
            </div>
          </div>
        ) : currentView === 'settings' ? (
          <div className="space-y-8">
            {/* Settings Header */}
            <div className="text-center">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                Admin Settings
              </h2>
              <p className="text-lg text-gray-600">
                System administration and migration tools
              </p>
            </div>

            {/* Settings Content */}
            <div className="max-w-4xl mx-auto">
              <UserMigrationTools />
            </div>
          </div>
        ) : currentView === 'inventory' ? (
          <InventoryManagement />
        ) : (
          <WeddingManagement />
        )}
      </main>

      {/* Notification Center */}
      <NotificationCenter 
        isOpen={isNotificationCenterOpen}
        onClose={() => setIsNotificationCenterOpen(false)}
      />
    </div>
  )
}

function AuthenticatedApp() {
  return (
    <QueryClientProvider client={queryClient}>
      <AdminDashboard />
    </QueryClientProvider>
  )
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}

function AppContent() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-white rounded-xl flex items-center justify-center mb-4 shadow-2xl mx-auto">
            <div className="text-2xl font-bold text-black">KCT</div>
          </div>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4" />
          <p className="text-white">Loading Admin Portal...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return <AdminLogin />
  }

  return <AuthenticatedApp />
}

export default App