export interface Order {
  id: string
  order_number: string
  customer_email: string
  customer_name: string
  customer_phone?: string
  status: OrderStatus
  order_priority: OrderPriority
  subtotal: number
  tax_amount?: number
  shipping_amount?: number
  discount_amount?: number
  total_amount: number
  currency: string
  stripe_payment_intent_id?: string
  payment_method?: string
  payment_status?: string
  shipping_address_line_1?: string
  shipping_address_line_2?: string
  shipping_first_name?: string
  shipping_last_name?: string
  shipping_city?: string
  shipping_state?: string
  shipping_postal_code?: string
  shipping_country?: string
  billing_address_line_1?: string
  billing_address_line_2?: string
  billing_city?: string
  billing_state?: string
  billing_postal_code?: string
  billing_country?: string
  estimated_delivery_date?: string
  actual_delivery_date?: string
  tracking_number?: string
  shipping_carrier?: string
  // New EasyPost shipping fields
  shipping_rate_id?: string
  shipping_label_url?: string
  tracking_status?: string
  carrier?: string
  service_type?: string
  shipping_cost?: number
  easypost_shipment_id?: string
  shipping_address?: any
  from_address?: any
  is_rush_order: boolean
  is_group_order: boolean
  special_instructions?: string
  internal_notes?: string
  created_at: string
  updated_at: string
  processed_at?: string
  shipped_at?: string
  delivered_at?: string
}

export interface OrderItem {
  id: string
  order_id: string
  product_source: ProductSource
  stripe_product_id?: string
  stripe_price_id?: string
  catalog_product_id?: string
  product_name: string
  product_sku?: string
  product_description?: string
  size?: string
  color?: string
  material?: string
  custom_measurements?: any
  quantity: number
  unit_price: number
  total_price: number
  is_bundle_item: boolean
  bundle_parent_id?: string
  bundle_type?: string
  item_status: OrderStatus
  production_notes?: string
  quality_check_notes?: string
  created_at: string
  updated_at: string
}

export type OrderStatus = 
  | 'pending_payment'
  | 'payment_confirmed'
  | 'processing'
  | 'in_production'
  | 'quality_check'
  | 'packaging'
  | 'shipped'
  | 'out_for_delivery'
  | 'delivered'
  | 'completed'
  | 'cancelled'
  | 'refunded'
  | 'on_hold'
  | 'exception'

export type OrderPriority = 
  | 'low'
  | 'normal'
  | 'high'
  | 'urgent'
  | 'rush'
  | 'wedding_party'
  | 'prom_group'
  | 'vip_customer'

export type ProductSource = 
  | 'core_stripe'
  | 'catalog_supabase'

export interface OrderFilters {
  status: string
  priority: string
  dateRange: string
  searchTerm: string
}

export interface DashboardStatsType {
  totalOrders: number
  pendingOrders: number
  processingOrders: number
  shippedOrders: number
  completedOrders: number
  totalRevenue: number
  averageOrderValue: number
  rushOrders: number
}

// Shipping related interfaces
export interface ShippingRate {
  id: string
  carrier: string
  service: string
  rate: string
  delivery_days?: number
  delivery_date?: string
}

export interface ShippingEvent {
  id: string
  status: string
  message: string
  location?: string
  datetime: string
  source: 'easypost' | 'database'
}

export interface TrackingInfo {
  trackingNumber: string
  status: string
  estimatedDeliveryDate?: string
  carrier?: string
  events: ShippingEvent[]
  lastUpdated: string
}

export interface ShippingLabel {
  shipmentId: string
  labelUrl: string
  trackingNumber: string
  carrier: string
  service: string
  cost: string
}