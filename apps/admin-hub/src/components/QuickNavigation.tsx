import { ExternalLink, BarChart3, Package, Heart, Layers } from 'lucide-react'

interface QuickNavigationProps {
  className?: string
}

export function QuickNavigation({ className = '' }: QuickNavigationProps) {
  const dashboards = [
    {
      title: 'Analytics Dashboard',
      description: 'Business intelligence and reporting',
      url: 'https://kei4wjdty1ey.space.minimax.io',
      icon: BarChart3,
      color: 'from-blue-500 to-blue-600'
    },
    {
      title: 'Order Management', 
      description: 'Order processing and fulfillment',
      url: 'https://max-out-orders.vercel.app',
      icon: Package,
      color: 'from-green-500 to-green-600'
    },
    {
      title: 'Wedding Portal',
      description: 'Wedding party coordination and management',
      url: 'https://max-out-wedding-portal.vercel.app',
      icon: Heart,
      color: 'from-rose-500 to-rose-600'
    },
    {
      title: 'Enhanced Inventory Manager',
      description: 'Advanced inventory with size matrix and analytics',
      url: 'https://max-out-inventory-manager.vercel.app',
      icon: Layers,
      color: 'from-purple-500 to-purple-600'
    }
  ]

  const quickActions = [
    {
      title: 'User Profiles',
      url: 'https://max-out-user-profile.vercel.app',
      color: 'bg-gray-800 hover:bg-gray-700'
    },
    {
      title: 'Groomsmen Portal',
      url: 'https://max-out-groomsmen.vercel.app',
      color: 'bg-gray-800 hover:bg-gray-700'
    },
    {
      title: 'Enhanced Inventory',
      url: 'https://max-out-inventory-manager.vercel.app',
      color: 'bg-gray-800 hover:bg-gray-700'
    },
    {
      title: 'Order Management',
      url: 'https://max-out-orders.vercel.app',
      color: 'bg-gray-800 hover:bg-gray-700'
    }
  ]

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Main Dashboards */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Main Dashboards</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {dashboards.map((dashboard) => {
            const IconComponent = dashboard.icon
            
            return (
              <a
                key={dashboard.title}
                href={dashboard.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative overflow-hidden rounded-lg bg-white shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${dashboard.color} opacity-10 group-hover:opacity-20 transition-opacity`} />
                <div className="relative p-6">
                  <div className="flex items-center justify-between mb-3">
                    <IconComponent className="w-8 h-8 text-gray-700" />
                    <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
                  </div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">
                    {dashboard.title}
                  </h4>
                  <p className="text-sm text-gray-600">
                    {dashboard.description}
                  </p>
                </div>
              </a>
            )
          })}
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {quickActions.map((action) => {
            return (
              <a
                key={action.title}
                href={action.url}
                target="_blank"
                rel="noopener noreferrer"
                className={`${action.color} text-white px-4 py-3 rounded-lg text-sm font-medium text-center transition-colors duration-200 flex items-center justify-center space-x-2`}
              >
                <span>{action.title}</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )
          })}
        </div>
      </div>
    </div>
  )
}
