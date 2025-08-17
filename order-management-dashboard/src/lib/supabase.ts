import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. Please check your .env.local file.'
  )
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    detectSessionInUrl: true,
    autoRefreshToken: true,
  }
})

// Helper function to get current user
export async function getCurrentUser() {
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error) {
    console.error('Error getting user:', error)
    return null
  }
  return user
}

// Order status mappings
export const ORDER_STATUS_LABELS = {
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

export const ORDER_PRIORITY_LABELS = {
  low: 'Low',
  normal: 'Normal',
  high: 'High',
  urgent: 'Urgent',
  rush: 'Rush',
  wedding_party: 'Wedding Party',
  prom_group: 'Prom Group',
  vip_customer: 'VIP Customer'
}

export const ORDER_STATUS_COLORS = {
  pending_payment: 'bg-yellow-100 text-yellow-800',
  payment_confirmed: 'bg-blue-100 text-blue-800',
  processing: 'bg-purple-100 text-purple-800',
  in_production: 'bg-orange-100 text-orange-800',
  quality_check: 'bg-indigo-100 text-indigo-800',
  packaging: 'bg-cyan-100 text-cyan-800',
  shipped: 'bg-blue-100 text-blue-800',
  out_for_delivery: 'bg-blue-100 text-blue-800',
  delivered: 'bg-green-100 text-green-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
  refunded: 'bg-red-100 text-red-800',
  on_hold: 'bg-gray-100 text-gray-800',
  exception: 'bg-red-100 text-red-800'
}

export const ORDER_PRIORITY_COLORS = {
  low: 'bg-gray-100 text-gray-800',
  normal: 'bg-blue-100 text-blue-800',
  high: 'bg-yellow-100 text-yellow-800',
  urgent: 'bg-orange-100 text-orange-800',
  rush: 'bg-red-100 text-red-800',
  wedding_party: 'bg-pink-100 text-pink-800',
  prom_group: 'bg-purple-100 text-purple-800',
  vip_customer: 'bg-gold-100 text-gold-800'
}