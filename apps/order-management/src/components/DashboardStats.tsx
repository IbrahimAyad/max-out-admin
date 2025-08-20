import React from 'react'
import type { Order, DashboardStatsType } from '../types/order'

interface DashboardStatsProps {
  orders: Order[]
}

export function DashboardStats({ orders }: DashboardStatsProps) {
  const stats: DashboardStatsType = React.useMemo(() => {
    const totalOrders = orders.length
    const pendingOrders = orders.filter(o => o.status === 'pending_payment' || o.status === 'payment_confirmed').length
    const processingOrders = orders.filter(o => ['processing', 'in_production', 'quality_check', 'packaging'].includes(o.status)).length
    const shippedOrders = orders.filter(o => ['shipped', 'out_for_delivery'].includes(o.status)).length
    const completedOrders = orders.filter(o => ['delivered', 'completed'].includes(o.status)).length
    const totalRevenue = orders.reduce((sum, order) => sum + order.total_amount, 0)
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0
    const rushOrders = orders.filter(o => o.is_rush_order || ['urgent', 'rush', 'wedding_party', 'prom_group'].includes(o.order_priority)).length

    return {
      totalOrders,
      pendingOrders,
      processingOrders,
      shippedOrders,
      completedOrders,
      totalRevenue,
      averageOrderValue,
      rushOrders
    }
  }, [orders])

  const statCards = [
    {
      title: 'Total Orders',
      value: stats.totalOrders.toLocaleString(),
      icon: '📋',
      color: 'bg-blue-500'
    },
    {
      title: 'Pending',
      value: stats.pendingOrders.toLocaleString(),
      icon: '⏳',
      color: 'bg-yellow-500'
    },
    {
      title: 'Processing',
      value: stats.processingOrders.toLocaleString(),
      icon: '⚙️',
      color: 'bg-orange-500'
    },
    {
      title: 'Shipped',
      value: stats.shippedOrders.toLocaleString(),
      icon: '🚚',
      color: 'bg-purple-500'
    },
    {
      title: 'Completed',
      value: stats.completedOrders.toLocaleString(),
      icon: '✅',
      color: 'bg-green-500'
    },
    {
      title: 'Total Revenue',
      value: `$${stats.totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      icon: '💰',
      color: 'bg-emerald-500'
    },
    {
      title: 'Avg Order Value',
      value: `$${stats.averageOrderValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      icon: '📊',
      color: 'bg-indigo-500'
    },
    {
      title: 'Rush Orders',
      value: stats.rushOrders.toLocaleString(),
      icon: '🔥',
      color: 'bg-red-500'
    }
  ]

  return (
    <div className="mb-8">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Dashboard Overview</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, index) => (
          <div key={index} className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className={`flex-shrink-0 ${stat.color} rounded-md p-3`}>
                <span className="text-white text-xl">{stat.icon}</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">{stat.title}</p>
                <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}