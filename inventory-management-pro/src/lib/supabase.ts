import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types
export interface Product {
  id: string
  name: string
  description: string
  category: string
  subcategory?: string
  sku: string
  handle?: string
  base_price: number
  vendor?: string
  product_type?: string
  status?: string
  visibility?: boolean
  featured?: boolean
  requires_shipping?: boolean
  taxable?: boolean
  track_inventory?: boolean
  weight?: number
  meta_title?: string
  meta_description?: string
  seo_title?: string
  seo_description?: string
  tags?: string[]
  additional_info?: any
  view_count?: number
  price_range?: any
  total_inventory?: number
  primary_image?: string
  variant_count?: number
  in_stock?: boolean
  image_gallery?: string[]
  stripe_product_id?: string
  stripe_sync_status?: string
  stripe_sync_error?: string
  stripe_synced_at?: string
  details?: any
  vendor_id?: string
  vendor_price?: number
  stripe_active?: boolean
  slug?: string
  search_keywords?: string
  gallery_count?: number
  stripe_status?: string
  updated_date?: string
  total_images?: number
  gallery_urls?: string[]
  image_status?: string
  created_at?: string
  updated_at?: string
}

export interface ProductVariant {
  id: string
  product_id: string
  variant_type: string
  color: string
  size?: string
  sku: string
  price_cents: number
  compare_at_price_cents?: number
  inventory_quantity?: number
  available_quantity?: number
  reserved_quantity?: number
  committed_quantity?: number
  low_stock_threshold?: number
  stock_status?: string
  allow_backorders?: boolean
  stripe_price_id?: string
  stripe_active?: boolean
  weight_grams?: number
  barcode?: string
  supplier_sku?: string
  notes?: string
  created_at?: string
  updated_at?: string
  last_inventory_update?: string
}

export interface ProductWithVariants extends Product {
  variants?: ProductVariant[]
}

// Stock status types
export const STOCK_STATUS = {
  IN_STOCK: 'in_stock',
  LOW_STOCK: 'low_stock',
  OUT_OF_STOCK: 'out_of_stock',
  BACKORDER: 'backorder'
} as const

// Product status types
export const PRODUCT_STATUS = {
  ACTIVE: 'active',
  DRAFT: 'draft',
  ARCHIVED: 'archived'
} as const

// Utility functions for formatting
export const formatPrice = (cents: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(cents / 100)
}

export const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

export const getStockStatusColor = (status: string): string => {
  switch (status) {
    case STOCK_STATUS.IN_STOCK:
      return 'text-green-600 bg-green-50'
    case STOCK_STATUS.LOW_STOCK:
      return 'text-yellow-600 bg-yellow-50'
    case STOCK_STATUS.OUT_OF_STOCK:
      return 'text-red-600 bg-red-50'
    case STOCK_STATUS.BACKORDER:
      return 'text-blue-600 bg-blue-50'
    default:
      return 'text-gray-600 bg-gray-50'
  }
}

export const getProductStatusColor = (status: string): string => {
  switch (status) {
    case PRODUCT_STATUS.ACTIVE:
      return 'text-green-600 bg-green-50'
    case PRODUCT_STATUS.DRAFT:
      return 'text-yellow-600 bg-yellow-50'
    case PRODUCT_STATUS.ARCHIVED:
      return 'text-gray-600 bg-gray-50'
    default:
      return 'text-gray-600 bg-gray-50'
  }
}