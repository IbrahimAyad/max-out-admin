// Updated order configuration for the enhanced workflow system

export enum OrderStatus {
  PENDING_PAYMENT = 'pending_payment',
  PAYMENT_CONFIRMED = 'payment_confirmed',
  PROCESSING = 'processing',
  IN_PRODUCTION = 'in_production',
  QUALITY_CHECK = 'quality_check',
  PACKAGING = 'packaging',
  SHIPPED = 'shipped',
  OUT_FOR_DELIVERY = 'out_for_delivery',
  DELIVERED = 'delivered',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded',
  ON_HOLD = 'on_hold',
  EXCEPTION = 'exception'
}

export enum OrderPriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  URGENT = 'urgent',
  RUSH = 'rush',
  WEDDING_PARTY = 'wedding_party',
  PROM_GROUP = 'prom_group',
  VIP_CUSTOMER = 'vip_customer'
}

export enum ProductSource {
  CORE_STRIPE = 'core_stripe',
  CATALOG_SUPABASE = 'catalog_supabase'
}

export enum CommunicationType {
  ORDER_CONFIRMATION = 'order_confirmation',
  PAYMENT_CONFIRMATION = 'payment_confirmation',
  PROCESSING_UPDATE = 'processing_update',
  SHIPPING_NOTIFICATION = 'shipping_notification',
  DELIVERY_CONFIRMATION = 'delivery_confirmation',
  DELAY_NOTIFICATION = 'delay_notification',
  EXCEPTION_ALERT = 'exception_alert',
  REVIEW_REQUEST = 'review_request',
  SATISFACTION_SURVEY = 'satisfaction_survey',
  CUSTOM_MESSAGE = 'custom_message'
}

export enum CommunicationChannel {
  EMAIL = 'email',
  SMS = 'sms',
  PUSH_NOTIFICATION = 'push_notification',
  IN_APP = 'in_app',
  PHONE_CALL = 'phone_call'
}

// Enhanced Order interface matching the new database schema
export interface Order {
  id: string;
  order_number: string;
  customer_id?: string;
  customer_email: string;
  customer_name: string;
  customer_phone?: string;
  order_status: OrderStatus;
  order_priority: OrderPriority;
  subtotal_amount: number;
  tax_amount: number;
  shipping_amount: number;
  discount_amount: number;
  total_amount: number;
  currency: string;
  stripe_payment_intent_id?: string;
  payment_method?: string;
  payment_status?: string;
  shipping_address_line1?: string;
  shipping_address_line2?: string;
  shipping_city?: string;
  shipping_state?: string;
  shipping_postal_code?: string;
  shipping_country?: string;
  billing_address_line1?: string;
  billing_address_line2?: string;
  billing_city?: string;
  billing_state?: string;
  billing_postal_code?: string;
  billing_country?: string;
  estimated_delivery_date?: string;
  actual_delivery_date?: string;
  tracking_number?: string;
  shipping_carrier?: string;
  is_rush_order: boolean;
  is_group_order: boolean;
  group_order_id?: string;
  special_instructions?: string;
  processing_notes?: string;
  assigned_processor_id?: string;
  estimated_processing_time?: number;
  actual_processing_time?: number;
  created_at: string;
  updated_at: string;
  processed_at?: string;
  shipped_at?: string;
  delivered_at?: string;
  order_items?: OrderItem[];
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_source: ProductSource;
  stripe_product_id?: string;
  stripe_price_id?: string;
  catalog_product_id?: string;
  product_name: string;
  product_sku?: string;
  product_description?: string;
  size?: string;
  color?: string;
  material?: string;
  custom_measurements?: Record<string, any>;
  quantity: number;
  unit_price: number;
  total_price: number;
  is_bundle_item: boolean;
  bundle_parent_id?: string;
  bundle_type?: string;
  item_status: OrderStatus;
  production_notes?: string;
  quality_check_notes?: string;
  created_at: string;
  updated_at: string;
}

export interface OrderStatusHistory {
  id: string;
  order_id: string;
  previous_status?: OrderStatus;
  new_status: OrderStatus;
  status_reason?: string;
  status_notes?: string;
  changed_by_user_id?: string;
  changed_by_system: boolean;
  processing_duration?: number;
  is_exception: boolean;
  exception_type?: string;
  exception_details?: string;
  resolution_notes?: string;
  automated_action_triggered: boolean;
  automation_type?: string;
  created_at: string;
}

export interface CommunicationLog {
  id: string;
  order_id: string;
  customer_id?: string;
  communication_type: CommunicationType;
  communication_channel: CommunicationChannel;
  subject?: string;
  message_content: string;
  personalized_content?: Record<string, any>;
  recipient_email?: string;
  recipient_phone?: string;
  sent_at?: string;
  delivered_at?: string;
  opened_at?: string;
  clicked_at?: string;
  delivery_status: string;
  customer_response?: string;
  response_received_at?: string;
  is_automated: boolean;
  automation_trigger?: string;
  scheduled_for?: string;
  external_message_id?: string;
  kct_knowledge_api_request_id?: string;
  created_at: string;
  updated_at: string;
}

export interface OrderPriorityQueue {
  id: string;
  order_id: string;
  queue_position: number;
  priority_score: number;
  queue_type: string;
  customer_tier?: string;
  order_value_tier?: string;
  delivery_urgency?: number;
  special_event_type?: string;
  assigned_to_user_id?: string;
  assigned_at?: string;
  estimated_completion?: string;
  queue_status: string;
  entered_queue_at: string;
  started_processing_at?: string;
  completed_at?: string;
  auto_assigned: boolean;
  requires_manual_review: boolean;
  escalation_required: boolean;
  created_at: string;
  updated_at: string;
}

export interface OrderException {
  id: string;
  order_id: string;
  exception_type: string;
  exception_severity: string;
  exception_description: string;
  affects_delivery_date: boolean;
  estimated_delay_days?: number;
  customer_impact_level: string;
  resolution_status: string;
  resolution_notes?: string;
  resolved_by_user_id?: string;
  resolved_at?: string;
  escalated_to_user_id?: string;
  escalation_reason?: string;
  escalated_at?: string;
  customer_notified: boolean;
  customer_notification_sent_at?: string;
  customer_acceptance_required: boolean;
  customer_accepted_at?: string;
  root_cause_analysis?: string;
  prevention_measures?: string;
  similar_exceptions_count: number;
  created_at: string;
  updated_at: string;
}

export interface ProcessingAnalytics {
  id: string;
  order_id: string;
  payment_to_processing_minutes?: number;
  processing_to_production_minutes?: number;
  production_to_quality_minutes?: number;
  quality_to_shipping_minutes?: number;
  shipping_to_delivery_minutes?: number;
  total_fulfillment_minutes?: number;
  processing_efficiency_score?: number;
  bottleneck_stage?: string;
  exceeded_sla: boolean;
  sla_target_minutes?: number;
  vs_average_performance?: number;
  processor_performance_rank?: number;
  similar_orders_avg_time?: number;
  quality_issues_count: number;
  customer_satisfaction_score?: number;
  reprocessing_required: boolean;
  created_at: string;
  updated_at: string;
}

// Dashboard configuration
export const DASHBOARD_CONFIG = {
  MAX_RECENT_ORDERS: 100,
  REFRESH_INTERVAL: 30000, // 30 seconds
  HIGH_PRIORITY_THRESHOLD: 3,
  SLA_TARGETS: {
    STANDARD: 72, // hours
    RUSH: 24,
    WEDDING: 168, // 1 week
    VIP: 48
  },
  AUTOMATION_RULES: {
    AUTO_ASSIGN_THRESHOLD: 2, // hours
    ESCALATION_THRESHOLD: 4, // hours
    CUSTOMER_UPDATE_FREQUENCY: 24 // hours
  }
};

// Order status colors for UI
export const STATUS_COLORS = {
  [OrderStatus.PENDING_PAYMENT]: 'bg-yellow-100 text-yellow-800',
  [OrderStatus.PAYMENT_CONFIRMED]: 'bg-blue-100 text-blue-800',
  [OrderStatus.PROCESSING]: 'bg-blue-100 text-blue-800',
  [OrderStatus.IN_PRODUCTION]: 'bg-purple-100 text-purple-800',
  [OrderStatus.QUALITY_CHECK]: 'bg-orange-100 text-orange-800',
  [OrderStatus.PACKAGING]: 'bg-indigo-100 text-indigo-800',
  [OrderStatus.SHIPPED]: 'bg-green-100 text-green-800',
  [OrderStatus.OUT_FOR_DELIVERY]: 'bg-green-100 text-green-800',
  [OrderStatus.DELIVERED]: 'bg-green-100 text-green-800',
  [OrderStatus.COMPLETED]: 'bg-gray-100 text-gray-800',
  [OrderStatus.CANCELLED]: 'bg-red-100 text-red-800',
  [OrderStatus.REFUNDED]: 'bg-red-100 text-red-800',
  [OrderStatus.ON_HOLD]: 'bg-yellow-100 text-yellow-800',
  [OrderStatus.EXCEPTION]: 'bg-red-100 text-red-800'
};

// Priority colors for UI
export const PRIORITY_COLORS = {
  [OrderPriority.LOW]: 'bg-gray-100 text-gray-800',
  [OrderPriority.NORMAL]: 'bg-blue-100 text-blue-800',
  [OrderPriority.HIGH]: 'bg-orange-100 text-orange-800',
  [OrderPriority.URGENT]: 'bg-red-100 text-red-800',
  [OrderPriority.RUSH]: 'bg-red-100 text-red-800',
  [OrderPriority.WEDDING_PARTY]: 'bg-purple-100 text-purple-800',
  [OrderPriority.PROM_GROUP]: 'bg-pink-100 text-pink-800',
  [OrderPriority.VIP_CUSTOMER]: 'bg-yellow-100 text-yellow-800'
};

// Core products configuration
export const CORE_PRODUCTS_CONFIG = {
  WEIGHT: 0.7, // 70% importance in dual architecture
  CATEGORIES: [
    'Suits',
    'Tuxedos',
    'Dress Shirts',
    'Blazers',
    'Trousers',
    'Accessories'
  ],
  BUNDLE_TYPES: [
    'complete_suit',
    'wedding_package',
    'business_package',
    'formal_package'
  ]
};

// Catalog products configuration
export const CATALOG_PRODUCTS_CONFIG = {
  WEIGHT: 0.3, // 30% importance in dual architecture
  CATEGORIES: [
    'Casual Wear',
    'Sportswear',
    'Seasonal Items',
    'Footwear',
    'Casual Accessories'
  ]
};