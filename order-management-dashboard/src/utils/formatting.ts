import type { OrderStatus, OrderPriority } from '../types/order'

// Date formatting
export function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// Currency formatting
export function formatCurrency(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount)
}

// Status color mappings
export function getStatusColor(status: OrderStatus): string {
  const colors: Record<OrderStatus, string> = {
    pending_payment: 'bg-yellow-100 text-yellow-800',
    payment_confirmed: 'bg-blue-100 text-blue-800',
    processing: 'bg-indigo-100 text-indigo-800',
    in_production: 'bg-purple-100 text-purple-800',
    quality_check: 'bg-pink-100 text-pink-800',
    packaging: 'bg-orange-100 text-orange-800',
    shipped: 'bg-cyan-100 text-cyan-800',
    out_for_delivery: 'bg-teal-100 text-teal-800',
    delivered: 'bg-green-100 text-green-800',
    completed: 'bg-emerald-100 text-emerald-800',
    cancelled: 'bg-red-100 text-red-800',
    refunded: 'bg-gray-100 text-gray-800',
    on_hold: 'bg-amber-100 text-amber-800',
    exception: 'bg-red-100 text-red-800'
  }
  return colors[status] || 'bg-gray-100 text-gray-800'
}

// Priority color mappings
export function getPriorityColor(priority: OrderPriority): string {
  const colors: Record<OrderPriority, string> = {
    low: 'bg-gray-100 text-gray-800',
    normal: 'bg-blue-100 text-blue-800',
    high: 'bg-yellow-100 text-yellow-800',
    urgent: 'bg-orange-100 text-orange-800',
    rush: 'bg-red-100 text-red-800',
    wedding_party: 'bg-pink-100 text-pink-800',
    prom_group: 'bg-purple-100 text-purple-800',
    vip_customer: 'bg-gold-100 text-gold-800'
  }
  return colors[priority] || 'bg-gray-100 text-gray-800'
}

// Status label mappings
export function getStatusLabel(status: OrderStatus): string {
  const labels: Record<OrderStatus, string> = {
    pending_payment: 'Pending Payment',
    payment_confirmed: 'Payment Confirmed',
    processing: 'Processing',
    in_production: 'In Production',
    quality_check: 'Quality Check',
    packaging: 'Packaging',
    shipped: 'Shipped',
    out_for_delivery: 'Out for Delivery',
    delivered: 'Delivered',
    completed: 'Completed',
    cancelled: 'Cancelled',
    refunded: 'Refunded',
    on_hold: 'On Hold',
    exception: 'Exception'
  }
  return labels[status] || status
}

// Priority label mappings
export function getPriorityLabel(priority: OrderPriority): string {
  const labels: Record<OrderPriority, string> = {
    low: 'Low',
    normal: 'Normal',
    high: 'High',
    urgent: 'Urgent',
    rush: 'Rush',
    wedding_party: 'Wedding Party',
    prom_group: 'Prom Group',
    vip_customer: 'VIP Customer'
  }
  return labels[priority] || priority
}