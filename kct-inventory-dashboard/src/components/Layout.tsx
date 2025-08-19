import { ReactNode } from 'react'
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
  Menu
} from 'lucide-react'

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
  return (
    <div className="h-screen flex overflow-hidden bg-gray-100">
      {/* Sidebar */}
      <div className="flex-shrink-0">
        <div className="flex flex-col w-64">
          {/* Sidebar header */}
          <div className="flex items-center h-16 flex-shrink-0 px-4 bg-white border-r border-gray-200">
            <Package className="h-8 w-8 text-blue-600" />
            <span className="ml-2 text-xl font-bold text-gray-900">KCT Menswear</span>
          </div>
          
          {/* Navigation */}
          <div className="flex-1 flex flex-col overflow-y-auto bg-white border-r border-gray-200">
            <nav className="flex-1 px-2 py-4 space-y-1">
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
                  >
                    <Icon
                      className={`mr-3 flex-shrink-0 h-6 w-6 ${
                        item.current ? 'text-gray-300' : 'text-gray-400 group-hover:text-gray-500'
                      }`}
                    />
                    {item.name}
                  </a>
                )
              })}
            </nav>
          </div>
        </div>
      </div>

      {/* Main content area */}
      <div className="flex flex-col w-0 flex-1 overflow-hidden">
        {/* Top header */}
        <div className="relative z-10 flex-shrink-0 flex h-16 bg-white border-b border-gray-200">
          <button
            type="button"
            className="px-4 border-r border-gray-200 text-gray-400 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500 lg:hidden"
          >
            <Menu className="h-6 w-6" />
          </button>
          
          <div className="flex-1 px-4 flex justify-between items-center">
            <div className="flex-1" />
            
            {/* User menu */}
            <div className="flex items-center space-x-4">
              <button className="text-gray-400 hover:text-gray-500">
                <Bell className="h-6 w-6" />
              </button>
              
              <div className="flex items-center space-x-3">
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">kct.admin@business.com</p>
                  <p className="text-xs text-gray-500">Administrator</p>
                </div>
                <button className="text-gray-400 hover:text-gray-500">
                  <LogOut className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1 relative overflow-y-auto focus:outline-none">
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