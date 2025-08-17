// Order Management Configuration and Types

export enum OrderStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  CONFIRMED = 'confirmed',
  SHIPPED = 'shipped',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded'
}

export enum OrderSource {
  STRIPE = 'stripe',
  SUPABASE = 'supabase',
  MANUAL = 'manual'
}

export enum PriorityLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
  WEDDING = 'wedding',
  RUSH = 'rush'
}

export enum ExceptionStatus {
  OPEN = 'open',
  IN_PROGRESS = 'in_progress',
  RESOLVED = 'resolved',
  ESCALATED = 'escalated'
}

export enum CommunicationType {
  EMAIL = 'email',
  SMS = 'sms',
  CALL = 'call',
  SYSTEM = 'system'
}

export interface Order {
  id: string;
  customer_id: string;
  status: OrderStatus;
  source: OrderSource;
  total_amount: number;
  currency: string;
  created_at: string;
  updated_at: string;
  priority_level?: PriorityLevel;
  special_instructions?: string;
  shipping_address: any;
  billing_address: any;
  customer?: Customer;
  order_items?: OrderItem[];
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  price: number;
  created_at: string;
}

export interface Customer {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  created_at: string;
}

export interface OrderException {
  id: string;
  order_id: string;
  exception_type: string;
  description: string;
  status: ExceptionStatus;
  assigned_to?: string;
  priority_level: PriorityLevel;
  resolution_notes?: string;
  created_at: string;
  updated_at: string;
}

export interface CommunicationLog {
  id: string;
  order_id: string;
  customer_id: string;
  communication_type: CommunicationType;
  direction: 'inbound' | 'outbound';
  subject: string;
  content: string;
  sent_at: string;
  response_received?: boolean;
}

export interface ProcessingAnalytics {
  id: string;
  order_id: string;
  processing_stage: string;
  stage_duration_minutes: number;
  automated: boolean;
  created_at: string;
}

export interface OrderPriorityQueue {
  id: string;
  order_id: string;
  priority_level: PriorityLevel;
  queue_position: number;
  estimated_processing_time: string;
  created_at: string;
  updated_at: string;
}

// Dashboard Configuration
export const DASHBOARD_CONFIG = {
  REFRESH_INTERVAL: 30000, // 30 seconds
  MAX_RECENT_ORDERS: 50,
  DEFAULT_PAGE_SIZE: 20,
  PRIORITY_COLORS: {
    [PriorityLevel.LOW]: 'bg-gray-100 text-gray-800',
    [PriorityLevel.MEDIUM]: 'bg-blue-100 text-blue-800',
    [PriorityLevel.HIGH]: 'bg-orange-100 text-orange-800',
    [PriorityLevel.URGENT]: 'bg-red-100 text-red-800',
    [PriorityLevel.WEDDING]: 'bg-purple-100 text-purple-800',
    [PriorityLevel.RUSH]: 'bg-yellow-100 text-yellow-800'
  },
  STATUS_COLORS: {
    [OrderStatus.PENDING]: 'bg-yellow-100 text-yellow-800',
    [OrderStatus.PROCESSING]: 'bg-blue-100 text-blue-800',
    [OrderStatus.CONFIRMED]: 'bg-green-100 text-green-800',
    [OrderStatus.SHIPPED]: 'bg-indigo-100 text-indigo-800',
    [OrderStatus.DELIVERED]: 'bg-green-200 text-green-900',
    [OrderStatus.CANCELLED]: 'bg-red-100 text-red-800',
    [OrderStatus.REFUNDED]: 'bg-gray-100 text-gray-800'
  }
};

// API Endpoints
export const ORDER_API_ENDPOINTS = {
  PROCESS_ORDER: '/functions/v1/process-order',
  HANDLE_EXCEPTION: '/functions/v1/handle-order-exception',
  UPDATE_ANALYTICS: '/functions/v1/update-processing-analytics'
};