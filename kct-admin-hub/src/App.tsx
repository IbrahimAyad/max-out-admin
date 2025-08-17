import { useState } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Bell, Menu, X } from 'lucide-react'
import { DashboardOverview } from './components/DashboardOverview'
import { NotificationCenter } from './components/NotificationCenter'
import { QuickNavigation } from './components/QuickNavigation'
import { RecentActivity } from './components/RecentActivity'
import { useAdminQueries } from './hooks/useAdminQueries'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 10, // 10 minutes
    },
  },
})

function AdminHeader({ onNotificationToggle, unreadCount }: { 
  onNotificationToggle: () => void
  unreadCount: number 
}) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  return (
    <header className="bg-black text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Title */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-white text-black rounded-lg flex items-center justify-center font-bold text-sm">
                KCT
              </div>
              <div>
                <h1 className="text-xl font-bold">KCT Menswear</h1>
                <p className="text-sm text-gray-300">Admin Hub</p>
              </div>
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4">
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
          <div className="md:hidden border-t border-gray-700 py-4">
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
          </div>
        )}
      </div>
    </header>
  )
}

function AdminDashboard() {
  const [isNotificationCenterOpen, setIsNotificationCenterOpen] = useState(false)
  const { unreadNotifications } = useAdminQueries()

  const unreadCount = unreadNotifications.data?.data.length || 0

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminHeader 
        onNotificationToggle={() => setIsNotificationCenterOpen(!isNotificationCenterOpen)}
        unreadCount={unreadCount}
      />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Welcome Section */}
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Welcome to KCT Admin Hub
            </h2>
            <p className="text-gray-600">
              Central command center for all administrative operations
            </p>
          </div>

          {/* Dashboard Overview */}
          <DashboardOverview />

          {/* Quick Navigation */}
          <QuickNavigation />

          {/* Recent Activity */}
          <RecentActivity />
        </div>
      </main>

      {/* Notification Center */}
      <NotificationCenter 
        isOpen={isNotificationCenterOpen}
        onClose={() => setIsNotificationCenterOpen(false)}
      />
    </div>
  )
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AdminDashboard />
    </QueryClientProvider>
  )
}

export default App