import { createClient } from '@supabase/supabase-js'

// Use environment variables with service role key for full access
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://gvcswimqaxvylgxbklbz.supabase.co'
const supabaseKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE || import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd2Y3N3aW1xYXh2eWxneGJrbGJ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM3NjA1MzAsImV4cCI6MjA2OTMzNjUzMH0.UZdiGcJXUV5VYetjWXV26inmbj2yXdiT03Z6t_5Lg24'

export const supabase = createClient(supabaseUrl, supabaseKey)

// Log Supabase client initialization
console.log('Supabase client initialized with URL:', supabaseUrl)
console.log('Using Supabase key type:', import.meta.env.VITE_SUPABASE_SERVICE_ROLE ? 'Service Role' : 'Anonymous Key')

// Enhanced Product Variant types
export interface EnhancedProductVariant {
  id: string
  product_id: string
  variant_type: 'suit_2piece' | 'suit_3piece' | 'shirt_slim' | 'shirt_classic' | 'color_only'
  color: string
  size?: string
  sku: string
  price_cents: number
  compare_at_price_cents?: number
  inventory_quantity: number
  available_quantity: number
  reserved_quantity: number
  committed_quantity: number
  low_stock_threshold: number
  stock_status: 'in_stock' | 'low_stock' | 'out_of_stock' | 'discontinued'
  allow_backorders: boolean
  stripe_price_id?: string
  stripe_active: boolean
  weight_grams: number
  barcode?: string
  supplier_sku?: string
  notes?: string
  created_at: string
  updated_at: string
  last_inventory_update: string
  product?: {
    id: string
    name: string
    category: string
    sku: string
  }
}

export interface Product {
  id: string
  name: string
  description: string
  category: string
  sku: string
  base_price: number
  status: string
  track_inventory: boolean
  primary_image?: string
  variant_count: number
  in_stock: boolean
}

export interface LowStockAlert {
  id: string
  variant_id: string
  alert_threshold: number
  current_quantity: number
  alert_status: 'active' | 'acknowledged' | 'resolved'
  acknowledged_by?: string
  acknowledged_at?: string
  created_at: string
  updated_at: string
}

// Add the Vendor Inbox Variant interface
export interface VendorInboxVariant {
  shopify_variant_id: string
  shopify_product_id: string
  sku: string
  title: string
  color_name: string
  size: string
  color_code: string
  base_product_code: string
  product_title: string
  category: string
  price: number
  inventory_quantity: number
  status: string
  created_at: string
  image_src?: string
  decision: 'none' | 'import' | 'skip' | 'staged'
  decided_at?: string
}

export interface SizingCategory {
  id: string
  name: string
  description: string
  sizes: string[]
}

// Database functions
export const inventoryService = {
  // Get all enhanced variants with optional filtering
  async getEnhancedVariants(filters: {
    product_id?: string
    category?: string
    stock_status?: string
    variant_type?: string
  } = {}) {
    console.log('Fetching enhanced variants with filters:', filters)
    
    // Check current session
    const { data: { session } } = await supabase.auth.getSession()
    console.log('Current session:', session ? 'Authenticated' : 'Not authenticated')
    
    let query = supabase
      .from('enhanced_product_variants')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (filters.product_id) {
      query = query.eq('product_id', filters.product_id)
    }
    if (filters.stock_status) {
      query = query.eq('stock_status', filters.stock_status)
    }
    if (filters.variant_type) {
      query = query.eq('variant_type', filters.variant_type)
    }
    
    console.log('Executing query:', query)
    const { data, error, count } = await query
    
    console.log('Query result - Data:', data, 'Error:', error, 'Count:', count)
    
    // Log the actual SQL query being executed
    console.log('Query debug info:', {
      query: query['query'],
      params: query['params']
    })
    
    if (error) {
      console.error('Error fetching enhanced variants:', error)
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      })
      throw error
    }
    
    // Get product details for each variant
    if (data && data.length > 0) {
      const productIds = [...new Set(data.map(v => v.product_id))]
      console.log('Fetching product details for product IDs:', productIds)
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select('id, name, category, sku')
        .in('id', productIds)
      
      if (productsError) {
        console.error('Error fetching product details:', productsError)
      } else {
        console.log('Product details:', products)
        const productMap = Object.fromEntries(products.map(p => [p.id, p]))
        data.forEach(variant => {
          variant.product = productMap[variant.product_id] || null
        })
      }
    }
    
    console.log('Returning variants:', data)
    return data as EnhancedProductVariant[]
  },

  // Get products with their variant counts
  async getProductsWithVariants() {
    console.log('Fetching products with variants')
    
    // Check current session
    const { data: { session } } = await supabase.auth.getSession()
    console.log('Current session:', session ? 'Authenticated' : 'Not authenticated')
    
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('track_inventory', true)
      .order('category', { ascending: true })
    
    console.log('Products query result - Data:', data, 'Error:', error)
    
    // Log error details if there is an error
    if (error) {
      console.error('Error fetching products:', error)
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      })
      throw error
    }
    
    console.log('Number of products fetched:', data?.length || 0)
    return data as Product[]
  },

  // Update variant inventory
  async updateVariantInventory(variantId: string, updates: {
    inventory_quantity?: number
    available_quantity?: number
    low_stock_threshold?: number
    notes?: string
  }) {
    const { data, error } = await supabase
      .from('enhanced_product_variants')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
        last_inventory_update: new Date().toISOString()
      })
      .eq('id', variantId)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  // Bulk update multiple variants
  async bulkUpdateVariants(updates: Array<{
    id: string
    inventory_quantity?: number
    available_quantity?: number
    low_stock_threshold?: number
  }>) {
    const results = []
    
    for (const update of updates) {
      const { id, ...fields } = update
      try {
        const result = await this.updateVariantInventory(id, fields)
        results.push({ id, success: true, data: result })
      } catch (error) {
        results.push({ id, success: false, error: error.message })
      }
    }
    
    return results
  },

  // Get vendor inbox variants
  async getVendorInboxVariants(page: number = 1, limit: number = 50, filters: {
    search?: string
    category?: string
    decision?: string
  } = {}) {
    let query = supabase
      .from('v_vendor_inbox_variants')
      .select('*')
      .order('created_at', { ascending: false })
    
    // Apply search filter
    if (filters.search) {
      query = query.or(`title.ilike.%${filters.search}%,sku.ilike.%${filters.search}%`)
    }
    
    // Apply category filter
    if (filters.category) {
      query = query.eq('category', filters.category)
    }
    
    // Apply decision filter
    if (filters.decision) {
      query = query.eq('decision', filters.decision)
    }
    
    // Apply pagination
    const from = (page - 1) * limit
    const to = from + limit - 1
    query = query.range(from, to)
    
    const { data, error, count } = await query
    
    if (error) throw error
    
    return {
      variants: data as VendorInboxVariant[],
      total: count || 0
    }
  },

  // Update vendor import decision
  async updateVendorImportDecision(shopifyProductId: string, decision: 'import' | 'skip' | 'staged') {
    const { data, error } = await supabase
      .from('vendor_import_decisions')
      .upsert({
        shopify_product_id: shopifyProductId,
        decision,
        decided_at: new Date().toISOString()
      }, {
        onConflict: 'shopify_product_id'
      })
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  // Bulk update vendor import decisions
  async bulkUpdateVendorImportDecisions(decisions: Array<{
    shopify_product_id: string
    decision: 'import' | 'skip' | 'staged'
  }>) {
    const { data, error } = await supabase
      .from('vendor_import_decisions')
      .upsert(decisions, {
        onConflict: 'shopify_product_id'
      })
    
    if (error) throw error
    return data
  },

  // Get low stock alerts
  async getLowStockAlerts(status: 'active' | 'acknowledged' | 'resolved' = 'active') {
    const { data: alerts, error } = await supabase
      .from('low_stock_alerts')
      .select('*')
      .eq('alert_status', status)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    
    if (alerts && alerts.length > 0) {
      // Get variant and product details
      const variantIds = alerts.map(a => a.variant_id)
      const { data: variants } = await supabase
        .from('enhanced_product_variants')
        .select('*')
        .in('id', variantIds)
      
      if (variants) {
        const variantMap = Object.fromEntries(variants.map(v => [v.id, v]))
        
        // Get product details
        const productIds = [...new Set(variants.map(v => v.product_id))]
        const { data: products } = await supabase
          .from('products')
          .select('id, name, category')
          .in('id', productIds)
        
        if (products) {
          const productMap = Object.fromEntries(products.map(p => [p.id, p]))
          
          alerts.forEach(alert => {
            const variant = variantMap[alert.variant_id]
            if (variant) {
              alert.variant = variant
              alert.product = productMap[variant.product_id] || null
            }
          })
        }
      }
    }
    
    return alerts as LowStockAlert[]
  },

  // Get sizing categories
  async getSizingCategories() {
    const { data, error } = await supabase
      .from('sizing_categories')
      .select('*')
      .order('name')
    
    if (error) throw error
    return data as SizingCategory[]
  },

  // Create new variant
  async createVariant(variant: Omit<EnhancedProductVariant, 'id' | 'created_at' | 'updated_at' | 'last_inventory_update'>) {
    const { data, error } = await supabase
      .from('enhanced_product_variants')
      .insert([variant])
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  // Create new product
  async createProduct(product: Omit<Product, 'id' | 'created_at' | 'updated_at' | 'variant_count' | 'in_stock'>) {
    const { data, error } = await supabase
      .from('products')
      .insert([product])
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  // Delete variant
  async deleteVariant(variantId: string) {
    const { error } = await supabase
      .from('enhanced_product_variants')
      .delete()
      .eq('id', variantId)
    
    if (error) throw error
    return true
  }
}