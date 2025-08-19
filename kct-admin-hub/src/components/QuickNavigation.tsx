import { ExternalLink, BarChart3, Package, Heart, Layers } from 'lucide-react'

interface QuickNavigationProps {
  className?: string
  onWeddingClick?: () => void
  onInventoryClick?: () => void
}

export function QuickNavigation({ className = '', onWeddingClick, onInventoryClick }: QuickNavigationProps) {
  const dashboards = [
    {
      title: 'Analytics Dashboard',
      description: 'Business intelligence and reporting',
      url: 'https://kei4wjdty1ey.space.minimax.io',
      icon: BarChart3,
      color: 'from-blue-500 to-blue-600'
    },
    {
      title: 'Order Processing Dashboard', 
      description: 'Operational workflows and fulfillment',
      url: 'https://i55ibre0zen6.space.minimax.io',
      icon: Package,
      color: 'from-green-500 to-green-600'
    },
    {
      title: 'Wedding Management',
      description: 'Wedding party coordination and formalwear',
      onClick: onWeddingClick,
      icon: Heart,
      color: 'from-rose-500 to-rose-600',
      isInternal: true
    },
    {
      title: 'Inventory Management',
      description: 'Size-aware inventory tracking system',
      onClick: onInventoryClick,
      icon: Layers,
      color: 'from-purple-500 to-purple-600',
      isInternal: true
    }
  ]

  const quickActions = [
    {
      title: 'View All Orders',
      url: 'https://i55ibre0zen6.space.minimax.io/orders',
      color: 'bg-gray-800 hover:bg-gray-700'
    },
    {
      title: 'Inventory Management',
      url: 'https://i55ibre0zen6.space.minimax.io/inventory',
      color: 'bg-gray-800 hover:bg-gray-700',
      onClick: onInventoryClick,
      isInternal: true
    },
    {
      title: 'Customer Analytics',
      url: 'https://kei4wjdty1ey.space.minimax.io/customers',
      color: 'bg-gray-800 hover:bg-gray-700'
    },
    {
      title: 'Revenue Reports',
      url: 'https://kei4wjdty1ey.space.minimax.io/revenue',
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
            
            if (dashboard.isInternal) {
              return (
                <button
                  key={dashboard.title}
                  onClick={dashboard.onClick}
                  className="group relative overflow-hidden rounded-lg bg-white shadow-lg hover:shadow-xl transition-all duration-300 text-left w-full"
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${dashboard.color} opacity-10 group-hover:opacity-20 transition-opacity`} />
                  <div className="relative p-6">
                    <div className="flex items-center justify-between mb-3">
                      <IconComponent className="w-8 h-8 text-gray-700" />
                      <div className="w-4 h-4" /> {/* Spacer instead of external link icon */}
                    </div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-2">
                      {dashboard.title}
                    </h4>
                    <p className="text-sm text-gray-600">
                      {dashboard.description}
                    </p>
                  </div>
                </button>
              )
            }
            
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
            if (action.isInternal) {
              return (
                <button
                  key={action.title}
                  onClick={action.onClick}
                  className={`${action.color} text-white px-4 py-3 rounded-lg text-sm font-medium text-center transition-colors duration-200 flex items-center justify-center space-x-2`}
                >
                  <span>{action.title}</span>
                </button>
              )
            }
            
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
