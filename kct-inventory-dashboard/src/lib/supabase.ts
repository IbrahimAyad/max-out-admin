import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://gvcswimqaxvylgxbklbz.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd2Y3N3aW1xYXh2eWxneGJrbGJ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM3NjA1MzAsImV4cCI6MjA2OTMzNjUzMH0.UZdiGcJXUV5VYetjWXV26inmbj2yXdiT03Z6t_5Lg24'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types for TypeScript
export interface InventoryProduct {
  id: number
  name: string
  category: string
  subcategory?: string
  sku_prefix: string
  base_price: number
  description?: string
  image_url?: string
  is_active: boolean
  requires_size: boolean
  requires_color: boolean
  sizing_category?: string
  stripe_product_id?: string
  created_at: string
  updated_at: string
}

export interface InventoryVariant {
  id: number
  product_id: number
  size_id?: number
  color_id?: number
  piece_type?: string
  sku: string
  price: number
  stock_quantity: number
  low_stock_threshold: number
  is_active: boolean
  stripe_price_id?: string
  created_at: string
  updated_at: string
}

export interface SizeDefinition {
  id: number
  category: string
  size_code: string
  size_label: string
  sort_order: number
  created_at: string
}

export interface ColorDefinition {
  id: number
  color_name: string
  color_code: string
  hex_value?: string
  created_at: string
}

export interface InventoryMovement {
  id: number
  variant_id: number
  movement_type: 'in' | 'out' | 'adjustment'
  quantity: number
  previous_quantity: number
  new_quantity: number
  notes?: string
  created_by?: string
  created_at: string
}

// Enhanced product view with related data
export interface EnhancedProduct extends InventoryProduct {
  variants?: InventoryVariant[]
  total_stock?: number
  low_stock_variants?: number
  available_colors?: ColorDefinition[]
  available_sizes?: SizeDefinition[]
}

// Enhanced variant view with related data
export interface EnhancedVariant extends InventoryVariant {
  product?: InventoryProduct
  size?: SizeDefinition
  color?: ColorDefinition
  recent_movements?: InventoryMovement[]
  stock_status?: 'in_stock' | 'low_stock' | 'out_of_stock'
}