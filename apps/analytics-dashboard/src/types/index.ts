// Database Types
export interface Product {
  id: string
  name: string
  description?: string
  category: string
  base_price: number
  sku: string
  status: 'active' | 'draft' | 'archived'
  images?: string[]
  created_at: string
  updated_at: string
  total_inventory?: number
  variants?: ProductVariant[]
}

export interface ProductVariant {
  id: string
  product_id: string
  size: string
  color: string
  price: number
  inventory_quantity: number
  sku: string
  created_at: string
  updated_at: string
}

export interface Order {
  id: string
  order_number?: string
  customer_id?: string
  customer_name?: string
  customer_email?: string
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
  total_amount: number
  subtotal: number
  tax_amount?: number
  shipping_amount?: number
  payment_method?: string
  payment_status?: string
  shipping_method?: string
  tracking_number?: string
  notes?: string
  created_at: string
  updated_at: string
  items?: OrderItem[]
  shipping_address?: Address
  billing_address?: Address
  items_count?: number
}

export interface OrderItem {
  id: string
  order_id: string
  product_id: string
  variant_id?: string
  product_name: string
  variant_info?: string
  quantity: number
  unit_price: number
  total_price: number
  created_at: string
}

export interface Customer {
  id: string
  name?: string
  email?: string
  phone?: string
  created_at: string
  updated_at: string
  total_spent?: number
  orders_count?: number
  last_order_date?: string
  address?: string
  city?: string
  state?: string
  zip_code?: string
}

export interface Address {
  id?: string
  type: 'shipping' | 'billing'
  first_name: string
  last_name: string
  company?: string
  address_line_1: string
  address_line_2?: string
  city: string
  state: string
  zip_code: string
  country: string
  phone?: string
}

// API Response Types
export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  hasMore: boolean
}

export interface ProductsResponse extends PaginatedResponse<Product> {
  products: Product[]
}

export interface OrdersResponse extends PaginatedResponse<Order> {
  orders: Order[]
  statusCounts?: Record<string, number>
}

export interface CustomersResponse extends PaginatedResponse<Customer> {
  customers: Customer[]
}

// Dashboard Types
export interface DashboardStats {
  revenue: number
  revenueChange: number
  orders: number
  ordersChange: number
  customers: number
  customersChange: number
  products: number
  productsChange: number
  alerts?: Alert[]
  recentActivity?: Activity[]
}

export interface Alert {
  id: string
  title: string
  description: string
  type: 'info' | 'warning' | 'error' | 'success'
  created_at: string
}

export interface Activity {
  id: string
  description: string
  timestamp: string
  type: string
}

// Reports Types
export interface ReportsData {
  summary?: {
    totalRevenue: number
    revenueChange: number
    totalOrders: number
    ordersChange: number
    newCustomers: number
    customersChange: number
    avgOrderValue: number
    aovChange: number
  }
  salesData?: {
    chartData: any[]
    topProducts: TopProduct[]
  }
  productsData?: {
    topPerformers: Product[]
    lowStock: Product[]
    categoryBreakdown: CategoryData[]
  }
  customersData?: {
    segmentation: CustomerSegment[]
    acquisition: AcquisitionData[]
  }
  inventoryData?: {
    stockLevels: StockLevel[]
    movements: InventoryMovement[]
  }
}

export interface TopProduct {
  id: string
  name: string
  category: string
  quantity: number
  revenue: string
}

export interface CategoryData {
  category: string
  count: number
  revenue: number
  percentage: number
}

export interface CustomerSegment {
  segment: string
  count: number
  percentage: number
  avgOrderValue: number
}

export interface AcquisitionData {
  channel: string
  customers: number
  percentage: number
}

export interface StockLevel {
  product_id: string
  product_name: string
  current_stock: number
  reorder_level: number
  status: 'in_stock' | 'low_stock' | 'out_of_stock'
}

export interface InventoryMovement {
  id: string
  product_id: string
  product_name: string
  type: 'sale' | 'restock' | 'adjustment'
  quantity: number
  timestamp: string
}

// Analytics Types
export interface AnalyticsData {
  kpis?: {
    revenue: number
    revenueChange: number
    revenueTarget: number
    orders: number
    ordersChange: number
    ordersTarget: number
    customers: number
    customersChange: number
    customersTarget: number
    conversionRate: number
    conversionChange: number
    conversionTarget: number
  }
  topProducts?: TopAnalyticsProduct[]
  customerInsights?: {
    newCustomers: number
    newCustomersChange: number
    returningCustomers: number
    returningCustomersChange: number
    avgOrderValue: number
    aovChange: number
    clv: number
    clvChange: number
  }
  trafficSources?: TrafficSource[]
  performance?: {
    pageLoadTime: number
    bounceRate: number
    sessionDuration: string
    pagesPerSession: number
  }
}

export interface TopAnalyticsProduct {
  id: string
  name: string
  category: string
  revenue: number
  sales: number
  growth: number
}

export interface TrafficSource {
  name: string
  visitors: number
  percentage: number
  color: string
}

// Form Types
export interface ProductFormData {
  name: string
  category: string
  description: string
  base_price: string
  sku: string
  status: 'active' | 'draft' | 'archived'
  images: string[]
  variants: ProductVariantFormData[]
}

export interface ProductVariantFormData {
  size: string
  color: string
  price: string
  inventory_quantity: string
}

// Filter Types
export interface ProductFilters {
  search?: string
  category?: string
  status?: string
  sortBy?: string
  page?: number
  limit?: number
}

export interface OrderFilters {
  search?: string
  status?: string
  dateRange?: string
  sortBy?: string
  page?: number
  limit?: number
}

export interface CustomerFilters {
  search?: string
  sortBy?: string
  page?: number
  limit?: number
}

// Settings Types
export interface UserSettings {
  profile: {
    name: string
    email: string
    currentPassword: string
    newPassword: string
    confirmPassword: string
  }
  notifications: {
    emailNotifications: boolean
    pushNotifications: boolean
    orderUpdates: boolean
    inventoryAlerts: boolean
    weeklyReports: boolean
  }
  display: {
    theme: 'light' | 'dark' | 'auto'
    language: string
    timezone: string
    dateFormat: string
  }
  privacy: {
    dataCollection: boolean
    analytics: boolean
    marketing: boolean
  }
}

// Auth Types
export interface AuthUser {
  id: string
  email: string
  name?: string
  created_at: string
  updated_at: string
}

// API Error Types
export interface ApiError {
  message: string
  code?: string
  details?: any
}

// Utility Types
export type SortDirection = 'asc' | 'desc'
export type ViewMode = 'grid' | 'list'
export type TimeRange = '7d' | '30d' | '90d' | '365d' | 'ytd' | 'custom'
export type MetricType = 'revenue' | 'customers' | 'products' | 'traffic'