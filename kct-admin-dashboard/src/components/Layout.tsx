import React, { useState } from 'react'
import { Outlet, Link, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Users,
  BarChart3,
  TrendingUp,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronDown,
  Zap
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import NotificationBell from './NotificationBell'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Orders', href: '/orders', icon: ShoppingCart },
  { name: 'Order Management', href: '/order-management', icon: Zap },
  { name: 'Products', href: '/products', icon: Package },
  { name: 'Customers', href: '/customers', icon: Users },
  { name: 'Reports', href: '/reports', icon: BarChart3 },
  { name: 'Analytics', href: '/analytics', icon: TrendingUp },
  { name: 'Settings', href: '/settings', icon: Settings },
]

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const { user, signOut } = useAuth()
  const location = useLocation()

  const handleSignOut = async () => {
    try {
      await signOut()
      toast.success('Signed out successfully')
    } catch (error) {
      toast.error('Error signing out')
    }
  }

  return (
    <div className="h-screen flex overflow-hidden bg-neutral-50">
      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 lg:hidden"
          >
            <div className="absolute inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
            <motion.div
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 20, stiffness: 300 }}
              className="relative flex-1 flex flex-col max-w-xs w-full bg-white shadow-xl"
            >
              <div className="absolute top-0 right-0 -mr-12 pt-2">
                <button
                  type="button"
                  className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                  onClick={() => setSidebarOpen(false)}
                >
                  <X className="h-6 w-6 text-white" />
                </button>
              </div>
              <MobileSidebar navigation={navigation} currentPath={location.pathname} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Desktop sidebar */}
      <div className="hidden lg:flex lg:flex-shrink-0">
        <div className="flex flex-col w-80">
          <DesktopSidebar navigation={navigation} currentPath={location.pathname} />
        </div>
      </div>

      {/* Main content area */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {/* Mobile header */}
        <div className="lg:hidden">
          <div className="flex items-center justify-between bg-white px-4 py-3 border-b border-neutral-200">
            <button
              type="button"
              className="-ml-0.5 -mt-0.5 h-12 w-12 inline-flex items-center justify-center rounded-md text-neutral-500 hover:text-neutral-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-black"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-6 w-6" />
            </button>
            <div className="text-lg font-semibold text-black">KCT Menswear</div>
            <div className="flex items-center space-x-2">
              <NotificationBell />
              <div className="relative">
                <button
                  type="button"
                  className="flex items-center text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black"
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                >
                  <div className="h-8 w-8 rounded-full bg-neutral-200 flex items-center justify-center">
                    <span className="text-sm font-medium text-neutral-700">
                      {user?.email?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <ChevronDown className="ml-1 h-4 w-4 text-neutral-500" />
                </button>
                
                <AnimatePresence>
                  {userMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50"
                    >
                      <div className="py-1">
                        <button
                          onClick={handleSignOut}
                          className="group flex items-center px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-100 w-full text-left"
                        >
                          <LogOut className="mr-3 h-4 w-4 text-neutral-400 group-hover:text-neutral-500" />
                          Sign out
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1 relative overflow-y-auto focus:outline-none">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <Outlet />
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

// Desktop Sidebar Component
function DesktopSidebar({ navigation, currentPath }: { navigation: any[], currentPath: string }) {
  const { user, signOut } = useAuth()

  const handleSignOut = async () => {
    try {
      await signOut()
      toast.success('Signed out successfully')
    } catch (error) {
      toast.error('Error signing out')
    }
  }

  return (
    <div className="flex flex-col h-full bg-white border-r border-neutral-200">
      {/* Logo */}
      <div className="flex items-center h-16 flex-shrink-0 px-6 border-b border-neutral-200">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center">
            <div className="h-8 w-8 bg-black rounded-md flex items-center justify-center">
              <span className="text-white font-bold text-sm">KCT</span>
            </div>
            <span className="ml-3 text-xl font-semibold text-black">Menswear</span>
          </div>
          <NotificationBell />
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-2">
        {navigation.map((item) => {
          const isActive = currentPath === item.href
          return (
            <Link
              key={item.name}
              to={item.href}
              className={`group flex items-center px-3 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${
                isActive
                  ? 'bg-black text-white shadow-sm'
                  : 'text-neutral-700 hover:bg-neutral-100 hover:text-black'
              }`}
            >
              <item.icon
                className={`mr-3 h-5 w-5 transition-colors ${
                  isActive ? 'text-white' : 'text-neutral-400 group-hover:text-neutral-500'
                }`}
              />
              {item.name}
            </Link>
          )
        })}
      </nav>

      {/* User menu */}
      <div className="flex-shrink-0 px-4 py-4 border-t border-neutral-200">
        <div className="flex items-center">
          <div className="h-10 w-10 rounded-full bg-neutral-200 flex items-center justify-center">
            <span className="text-sm font-medium text-neutral-700">
              {user?.email?.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="ml-3 flex-1 min-w-0">
            <p className="text-sm font-medium text-neutral-900 truncate">
              {user?.email}
            </p>
            <p className="text-xs text-neutral-500">Administrator</p>
          </div>
          <button
            onClick={handleSignOut}
            className="ml-3 inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-neutral-700 bg-neutral-100 hover:bg-neutral-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black transition-colors"
          >
            <LogOut className="h-3 w-3 mr-1" />
            Sign out
          </button>
        </div>
      </div>
    </div>
  )
}

// Mobile Sidebar Component
function MobileSidebar({ navigation, currentPath }: { navigation: any[], currentPath: string }) {
  const { user } = useAuth()

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center h-16 flex-shrink-0 px-4 border-b border-neutral-200">
        <div className="flex items-center">
          <div className="h-8 w-8 bg-black rounded-md flex items-center justify-center">
            <span className="text-white font-bold text-sm">KCT</span>
          </div>
          <span className="ml-3 text-xl font-semibold text-black">Menswear</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-2">
        {navigation.map((item) => {
          const isActive = currentPath === item.href
          return (
            <Link
              key={item.name}
              to={item.href}
              className={`group flex items-center px-3 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${
                isActive
                  ? 'bg-black text-white shadow-sm'
                  : 'text-neutral-700 hover:bg-neutral-100 hover:text-black'
              }`}
            >
              <item.icon
                className={`mr-3 h-5 w-5 transition-colors ${
                  isActive ? 'text-white' : 'text-neutral-400 group-hover:text-neutral-500'
                }`}
              />
              {item.name}
            </Link>
          )
        })}
      </nav>

      {/* User info */}
      <div className="flex-shrink-0 px-4 py-4 border-t border-neutral-200">
        <div className="flex items-center">
          <div className="h-8 w-8 rounded-full bg-neutral-200 flex items-center justify-center">
            <span className="text-sm font-medium text-neutral-700">
              {user?.email?.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-neutral-900 truncate">
              {user?.email}
            </p>
            <p className="text-xs text-neutral-500">Administrator</p>
          </div>
        </div>
      </div>
    </div>
  )
}