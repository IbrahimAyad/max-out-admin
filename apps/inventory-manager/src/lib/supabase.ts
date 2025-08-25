import { createClient } from '@supabase/supabase-js'

// Use environment variables with service role key for full access
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://gvcswimqaxvylgxbklbz.supabase.co'
const supabaseKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE || import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd2Y3N3aW1xYXh2eWxneGJrbGJ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM3NjA1MzAsImV4cCI6MjA2OTMzNjUzMH0.UZdiGcJXUV5VYetjWXV26inmbj2yXdiT03Z6t_5Lg24'

export const supabase = createClient(supabaseUrl, supabaseKey)

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

// Vendor inbox variant type
export interface VendorInboxVariant {
  id: string
  shopify_product_id: string
  title: string
  product_type: string
  vendor: string
  tags: string
  base_product_code: string
  color_code: string
  color_family: string
  size: string
  sku: string
  price_cents: number
  compare_at_price_cents: number
  inventory_quantity: number
  image_url: string
  import_decision: 'none' | 'import' | 'skip' | 'staged'
  created_at: string
  updated_at: string
}

// Product type for AddVariantModal
export type Product = InventoryProduct

// Enhanced product variant type
export type EnhancedProductVariant = EnhancedVariant

// Inventory service mock implementation
export const inventoryService = {
  createVariant: async (data: any) => {
    // Mock implementation
    console.log('Creating variant:', data)
    return { success: true }
  },
  
  getVendorInboxVariants: async (page: number, limit: number, filters: any) => {
    // Mock implementation
    return { variants: [], total: 0 }
  },
  
  updateVendorImportDecision: async (shopifyProductId: string, decision: string) => {
    // Mock implementation
    console.log('Updating vendor import decision:', shopifyProductId, decision)
  },
  
  bulkUpdateVendorImportDecisions: async (decisions: Array<{ shopify_product_id: string; decision: string }>) => {
    // Mock implementation
    console.log('Bulk updating vendor import decisions:', decisions)
  }
}