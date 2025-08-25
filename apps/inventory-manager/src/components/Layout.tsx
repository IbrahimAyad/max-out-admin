import { ReactNode, useState } from 'react'
import { 
  BarChart3, 
  ShoppingCart, 
  Package, 
  Users, 
  FileText, 
  TrendingUp, 
  Settings, 
  Bell,
  LogOut,
  Menu,
  Shield
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'

interface LayoutProps {
  children: ReactNode
}

interface NavigationItem {
  name: string
  href: string
  icon: any
  current: boolean
}

const navigation: NavigationItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: BarChart3, current: false },
  { name: 'Orders', href: '/orders', icon: ShoppingCart, current: false },
  { name: 'Products', href: '/products', icon: Package, current: true },
  { name: 'Customers', href: '/customers', icon: Users, current: false },
  { name: 'Reports', href: '/reports', icon: FileText, current: false },
  { name: 'Analytics', href: '/analytics', icon: TrendingUp, current: false },
  { name: 'Settings', href: '/settings', icon: Settings, current: false },
]

export function Layout({ children }: LayoutProps) {
  const { user, signOut, loading } = useAuth()
  const [isSigningOut, setIsSigningOut] = useState(false)

  const handleSignOut = async () => {
    try {
      setIsSigningOut(true)
      await signOut()
    } catch (error) {
      console.error('Sign out error:', error)
    } finally {
      setIsSigningOut(false)
    }
  }
  return (
    <div className="h-screen flex overflow-hidden bg-gray-100">
      {/* Sidebar */}
      <aside className="flex-shrink-0" role="complementary" aria-label="Sidebar navigation">
        <div className="flex flex-col w-64">
          {/* Sidebar header */}
          <header className="flex items-center h-16 flex-shrink-0 px-4 bg-white border-r border-gray-200">
            <Package className="h-8 w-8 text-blue-600" aria-hidden="true" />
            <h1 className="ml-2 text-xl font-bold text-gray-900">KCT Menswear</h1>
            <span className="sr-only">Admin Dashboard</span>
          </header>
          
          {/* Navigation */}
          <div className="flex-1 flex flex-col overflow-y-auto bg-white border-r border-gray-200">
            <nav className="flex-1 px-2 py-4 space-y-1" role="navigation" aria-label="Main navigation">
              {navigation.map((item) => {
                const Icon = item.icon
                return (
                  <a
                    key={item.name}
                    href={item.href}
                    className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors ${
                      item.current
                        ? 'bg-gray-900 text-white'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                    aria-current={item.current ? 'page' : undefined}
                  >
                    <Icon
                      className={`mr-3 flex-shrink-0 h-6 w-6 ${
                        item.current ? 'text-gray-300' : 'text-gray-400 group-hover:text-gray-500'
                      }`}
                      aria-hidden="true"
                    />
                    {item.name}
                  </a>
                )
              })}
            </nav>
          </div>
        </div>
      </aside>

      {/* Main content area */}
      <div className="flex flex-col w-0 flex-1 overflow-hidden">
        {/* Top header */}
        <header className="relative z-10 flex-shrink-0 flex h-16 bg-white border-b border-gray-200" role="banner">
          <button
            type="button"
            className="px-4 border-r border-gray-200 text-gray-400 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500 lg:hidden"
            aria-label="Open sidebar"
          >
            <Menu className="h-6 w-6" aria-hidden="true" />
          </button>
          
          <div className="flex-1 px-4 flex justify-between items-center">
            <div className="flex-1" />
            
            {/* User menu */}
            <div className="flex items-center space-x-4" role="region" aria-label="User menu">
              <button 
                className="text-gray-400 hover:text-gray-500"
                aria-label="View notifications"
              >
                <Bell className="h-6 w-6" aria-hidden="true" />
              </button>
              
              <div className="flex items-center space-x-3">
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">
                    {user?.email || 'Admin User'}
                  </p>
                  <div className="flex items-center space-x-1">
                    <Shield className="h-3 w-3 text-green-500" aria-hidden="true" />
                    <p className="text-xs text-gray-500">Administrator</p>
                  </div>
                </div>
                <button 
                  onClick={handleSignOut}
                  disabled={isSigningOut}
                  className="text-gray-400 hover:text-gray-500 disabled:opacity-50 transition-colors"
                  aria-label="Sign out"
                  title="Sign out"
                >
                  {isSigningOut ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-400"></div>
                  ) : (
                    <LogOut className="h-5 w-5" aria-hidden="true" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main 
          id="main-content" 
          className="flex-1 relative overflow-y-auto focus:outline-none" 
          role="main"
          aria-label="Main content"
        >
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}