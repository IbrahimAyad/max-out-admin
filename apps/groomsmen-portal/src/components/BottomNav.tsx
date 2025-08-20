import { NavLink, useLocation } from 'react-router-dom'
import { useAuth } from '@/lib/AuthContext'
import { 
  Home, 
  Ruler, 
  Shirt, 
  Calendar, 
  MessageCircle, 
  User, 
  LogOut 
} from 'lucide-react'
import toast from 'react-hot-toast'

interface BottomNavProps {
  className?: string
}

export function BottomNav({ className = '' }: BottomNavProps) {
  const { signOut } = useAuth()
  const location = useLocation()

  const handleSignOut = async () => {
    try {
      await signOut()
      toast.success('Signed out successfully')
    } catch (error) {
      toast.error('Error signing out')
    }
  }

  const navItems = [
    { to: '/dashboard', icon: Home, label: 'Dashboard' },
    { to: '/measurements', icon: Ruler, label: 'Measurements' },
    { to: '/outfit', icon: Shirt, label: 'Outfit' },
    { to: '/timeline', icon: Calendar, label: 'Timeline' },
    { to: '/communications', icon: MessageCircle, label: 'Messages' },
    { to: '/profile', icon: User, label: 'Profile' },
  ]

  return (
    <>
      {/* Bottom Navigation */}
      <nav className={`fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 ${className}`}>
        <div className="grid grid-cols-6 h-16">
          {navItems.map(({ to, icon: Icon, label }) => {
            const isActive = location.pathname === to
            return (
              <NavLink
                key={to}
                to={to}
                className={`flex flex-col items-center justify-center space-y-1 transition-colors ${
                  isActive 
                    ? 'text-blue-600 bg-blue-50' 
                    : 'text-gray-600 hover:text-blue-600'
                }`}
              >
                <Icon size={20} />
                <span className="text-xs font-medium">{label}</span>
              </NavLink>
            )
          })}
        </div>
      </nav>
      
      {/* Sign Out Button - Top Right */}
      <button
        onClick={handleSignOut}
        className="fixed top-4 right-4 z-50 bg-white rounded-full p-2 shadow-md border border-gray-200 text-gray-600 hover:text-red-600 transition-colors"
      >
        <LogOut size={20} />
      </button>
      
      {/* Bottom spacing to prevent content overlap */}
      <div className="h-16" />
    </>
  )
}