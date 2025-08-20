import { useState } from 'react'
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { 
  Heart, 
  Menu, 
  X, 
  Home, 
  Users, 
  Calendar, 
  MessageCircle, 
  Shirt,
  Settings,
  LogOut,
  Bell
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'

export function Layout() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const { user, signOut } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  const navigation = [
    { name: 'Dashboard', href: '/wedding', icon: Home },
    { name: 'Wedding Party', href: '/wedding/party', icon: Users },
    { name: 'Timeline', href: '/wedding/timeline', icon: Calendar },
    { name: 'Communication', href: '/wedding/communication', icon: MessageCircle },
    { name: 'Outfit Coordination', href: '/wedding/outfits', icon: Shirt },
    { name: 'Settings', href: '/wedding/settings', icon: Settings },
  ]

  const handleSignOut = async () => {
    await signOut()
    navigate('/access')
  }

  const isActive = (href: string) => {
    if (href === '/wedding') {
      return location.pathname === '/wedding' || location.pathname === '/wedding/dashboard'
    }
    return location.pathname === href
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Desktop Sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex min-h-0 flex-1 flex-col bg-white shadow-lg">
          <div className="flex flex-1 flex-col overflow-y-auto pt-5 pb-4">
            {/* Logo */}
            <div className="flex flex-shrink-0 items-center px-4">
              <div className="flex items-center space-x-3">
                <div className="bg-rose-600 text-white w-10 h-10 rounded-lg flex items-center justify-center">
                  <Heart className="w-6 h-6" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">KCT Wedding</h1>
                  <p className="text-sm text-gray-600">Wedding Portal</p>
                </div>
              </div>
            </div>
            
            {/* Navigation */}
            <nav className="mt-8 flex-1 space-y-1 px-2">
              {navigation.map((item) => {
                const IconComponent = item.icon
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors ${
                      isActive(item.href)
                        ? 'bg-rose-100 text-rose-900'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <IconComponent
                      className={`mr-3 h-5 w-5 flex-shrink-0 ${
                        isActive(item.href)
                          ? 'text-rose-500'
                          : 'text-gray-400 group-hover:text-gray-500'
                      }`}
                    />
                    {item.name}
                  </Link>
                )
              })}
            </nav>
          </div>
          
          {/* User Section */}
          <div className="flex flex-shrink-0 border-t border-gray-200 p-4">
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center space-x-3">
                <div className="bg-gray-200 text-gray-600 w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium">
                  {user?.email?.[0].toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {user?.email}
                  </p>
                  <p className="text-xs text-gray-500">Couple</p>
                </div>
              </div>
              <button
                onClick={handleSignOut}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                title="Sign Out"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div className="lg:hidden">
        <div className="flex items-center justify-between bg-white px-4 py-3 shadow-sm">
          <div className="flex items-center space-x-3">
            <div className="bg-rose-600 text-white w-8 h-8 rounded-lg flex items-center justify-center">
              <Heart className="w-5 h-5" />
            </div>
            <h1 className="text-lg font-bold text-gray-900">KCT Wedding</h1>
          </div>
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="text-gray-600 hover:text-gray-900"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile menu overlay */}
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-40 lg:hidden">
            <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setIsMobileMenuOpen(false)} />
            <div className="fixed inset-y-0 left-0 flex w-full max-w-xs flex-col bg-white shadow-xl">
              <div className="flex h-16 items-center justify-between px-4">
                <div className="flex items-center space-x-3">
                  <div className="bg-rose-600 text-white w-8 h-8 rounded-lg flex items-center justify-center">
                    <Heart className="w-5 h-5" />
                  </div>
                  <h1 className="text-lg font-bold text-gray-900">KCT Wedding</h1>
                </div>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="text-gray-600 hover:text-gray-900"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <nav className="flex-1 space-y-1 px-2 py-4">
                {navigation.map((item) => {
                  const IconComponent = item.icon
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`group flex items-center px-2 py-2 text-base font-medium rounded-md transition-colors ${
                        isActive(item.href)
                          ? 'bg-rose-100 text-rose-900'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                    >
                      <IconComponent
                        className={`mr-4 h-6 w-6 flex-shrink-0 ${
                          isActive(item.href)
                            ? 'text-rose-500'
                            : 'text-gray-400 group-hover:text-gray-500'
                        }`}
                      />
                      {item.name}
                    </Link>
                  )
                })}
              </nav>
              <div className="border-t border-gray-200 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="bg-gray-200 text-gray-600 w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium">
                      {user?.email?.[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{user?.email}</p>
                      <p className="text-xs text-gray-500">Couple</p>
                    </div>
                  </div>
                  <button
                    onClick={handleSignOut}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <LogOut className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        <main className="py-6">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
