import { BottomNav } from '@/components/BottomNav'

interface MobileLayoutProps {
  children: React.ReactNode
  showNav?: boolean
  className?: string
}

export function MobileLayout({ children, showNav = true, className = '' }: MobileLayoutProps) {
  return (
    <div className={`min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 ${className}`}>
      {/* Main Content */}
      <main className={`${showNav ? 'pb-16' : ''}`}>
        {children}
      </main>
      
      {/* Bottom Navigation */}
      {showNav && <BottomNav />}
    </div>
  )
}