import { supabase, Product, ProductVariant, ProductWithVariants } from './supabase'

// Vendor Inbox interfaces
interface VendorInboxItem {
  shopify_product_id: number
  title: string
  category: string | null
  price: number | null
  inventory: number | null
  variants: number
  status: string
  created_at: string
  image_src: string | null
  decision: string
}

interface VendorInboxCount {
  inbox_count: number
}

// Product queries
export const productQueries = {
  // Get all products with pagination and filtering
  getProducts: async ({
    page = 1,
    limit = 20,
    search = '',
    category = '',
    status = '',
    stockStatus = '',
    sortBy = 'created_at',
    sortOrder = 'desc'
  }: {
    page?: number
    limit?: number
    search?: string
    category?: string
    status?: string
    stockStatus?: string
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
  } = {}) => {
    let query = supabase
      .from('products')
      .select('*', { count: 'exact' })

    // Search filter
    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%,sku.ilike.%${search}%,tags.cs.{"${search}"}`)
    }

    // Category filter
    if (category) {
      query = query.eq('category', category)
    }

    // Status filter
    if (status) {
      query = query.eq('status', status)
    }

    // Stock status filter (simplified for now)
    if (stockStatus === 'in_stock') {
      query = query.eq('in_stock', true)
    } else if (stockStatus === 'out_of_stock') {
      query = query.eq('in_stock', false)
    }

    // Sorting
    query = query.order(sortBy, { ascending: sortOrder === 'asc' })

    // Pagination
    const from = (page - 1) * limit
    const to = from + limit - 1
    query = query.range(from, to)

    const { data, error, count } = await query

    if (error) throw error

    return {
      products: data as Product[],
      total: count || 0,
      totalPages: Math.ceil((count || 0) / limit),
      currentPage: page
    }
  },

  // Get single product with variants
  getProduct: async (id: string) => {
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .maybeSingle()

    if (productError) throw productError
    if (!product) throw new Error('Product not found')

    const { data: variants, error: variantsError } = await supabase
      .from('enhanced_product_variants')
      .select('*')
      .eq('product_id', id)
      .order('created_at', { ascending: false })

    if (variantsError) throw variantsError

    return {
      ...product,
      variants: variants as ProductVariant[]
    } as ProductWithVariants
  },

  // Create new product
  createProduct: async (productData: Partial<Product>) => {
    const { data, error } = await supabase
      .from('products')
      .insert(productData)
      .select()
      .single()

    if (error) throw error
    return data as Product
  },

  // Update product
  updateProduct: async (id: string, updates: Partial<Product>) => {
    const { data, error } = await supabase
      .from('products')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data as Product
  },

  // Delete product
  deleteProduct: async (id: string) => {
    // First delete all variants
    const { error: variantsError } = await supabase
      .from('enhanced_product_variants')
      .delete()
      .eq('product_id', id)

    if (variantsError) throw variantsError

    // Then delete the product
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id)

    if (error) throw error
  },

  // Get product categories
  getCategories: async () => {
    const { data, error } = await supabase
      .from('products')
      .select('category, subcategory')
      .not('category', 'is', null)
      .order('category')

    if (error) throw error

    const categories = new Set<string>()
    const subcategories = new Map<string, Set<string>>()

    data.forEach(item => {
      if (item.category) {
        categories.add(item.category)
        if (item.subcategory) {
          if (!subcategories.has(item.category)) {
            subcategories.set(item.category, new Set())
          }
          subcategories.get(item.category)?.add(item.subcategory)
        }
      }
    })

    return {
      categories: Array.from(categories),
      subcategories: Object.fromEntries(
        Array.from(subcategories.entries()).map(([key, value]) => [key, Array.from(value)])
      )
    }
  }
}

// Variant queries
export const variantQueries = {
  // Get variants for a product
  getVariants: async (productId: string) => {
    const { data, error } = await supabase
      .from('enhanced_product_variants')
      .select('*')
      .eq('product_id', productId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data as ProductVariant[]
  },

  // Create variant
  createVariant: async (variantData: Partial<ProductVariant>) => {
    const { data, error } = await supabase
      .from('enhanced_product_variants')
      .insert(variantData)
      .select()
      .single()

    if (error) throw error
    return data as ProductVariant
  },

  // Update variant
  updateVariant: async (id: string, updates: Partial<ProductVariant>) => {
    const { data, error } = await supabase
      .from('enhanced_product_variants')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data as ProductVariant
  },

  // Delete variant
  deleteVariant: async (id: string) => {
    const { error } = await supabase
      .from('enhanced_product_variants')
      .delete()
      .eq('id', id)

    if (error) throw error
  },

  // Bulk update variants
  bulkUpdateVariants: async (updates: Array<{ id: string; updates: Partial<ProductVariant> }>) => {
    const promises = updates.map(({ id, updates: variantUpdates }) =>
      variantQueries.updateVariant(id, variantUpdates)
    )
    return Promise.all(promises)
  },

  // Get low stock variants
  getLowStockVariants: async (threshold = 5) => {
    const { data, error } = await supabase
      .from('enhanced_product_variants')
      .select(`
        *,
        products!inner(*)
      `)
      .lte('available_quantity', threshold)
      .order('available_quantity', { ascending: true })

    if (error) throw error
    return data
  }
}

// Analytics queries
export const analyticsQueries = {
  // Get dashboard stats
  getDashboardStats: async () => {
    // Get product counts by status
    const { data: productStats, error: productError } = await supabase
      .from('products')
      .select('status')
      .not('status', 'is', null)

    if (productError) throw productError

    // Get variant inventory stats
    const { data: variantStats, error: variantError } = await supabase
      .from('enhanced_product_variants')
      .select('inventory_quantity, available_quantity, stock_status')

    if (variantError) throw variantError

    // Get low stock count
    const { count: lowStockCount, error: lowStockError } = await supabase
      .from('enhanced_product_variants')
      .select('*', { count: 'exact', head: true })
      .lte('available_quantity', 5)

    if (lowStockError) throw lowStockError

    // Calculate stats
    const totalProducts = productStats.length
    const activeProducts = productStats.filter(p => p.status === 'active').length
    const totalVariants = variantStats.length
    const totalInventory = variantStats.reduce((sum, v) => sum + (v.inventory_quantity || 0), 0)
    const availableInventory = variantStats.reduce((sum, v) => sum + (v.available_quantity || 0), 0)

    return {
      totalProducts,
      activeProducts,
      totalVariants,
      totalInventory,
      availableInventory,
      lowStockVariants: lowStockCount || 0,
      productsByStatus: {
        active: productStats.filter(p => p.status === 'active').length,
        draft: productStats.filter(p => p.status === 'draft').length,
        archived: productStats.filter(p => p.status === 'archived').length
      }
    }
  },

  // Get inventory trends
  getInventoryTrends: async (days = 30) => {
    const { data, error } = await supabase
      .from('enhanced_product_variants')
      .select('last_inventory_update, available_quantity, stock_status')
      .gte('last_inventory_update', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString())
      .order('last_inventory_update', { ascending: true })

    if (error) throw error
    return data
  }
}

// Vendor Inbox queries
export const vendorQueries = {
  // Get vendor inbox count
  getVendorInboxCount: async () => {
    const { data, error } = await supabase
      .from('v_vendor_inbox_count')
      .select('inbox_count')
      .single()

    if (error) throw error
    return data as VendorInboxCount
  },

  // Get vendor inbox items
  getVendorInboxItems: async ({
    page = 1,
    limit = 20,
    search = '',
    status = '',
    decision = ''
  }: {
    page?: number
    limit?: number
    search?: string
    status?: string
    decision?: string
  } = {}) => {
    let query = supabase
      .from('v_vendor_inbox')
      .select('*', { count: 'exact' })

    // Search filter
    if (search) {
      query = query.or(`title.ilike.%${search}%,category.ilike.%${search}%`)
    }

    // Status filter
    if (status) {
      query = query.eq('status', status)
    }

    // Decision filter
    if (decision) {
      query = query.eq('decision', decision)
    }

    // Default sorting by creation date
    query = query.order('created_at', { ascending: false })

    // Pagination
    const from = (page - 1) * limit
    const to = from + limit - 1
    query = query.range(from, to)

    const { data, error, count } = await query

    if (error) throw error

    return {
      items: data as VendorInboxItem[],
      total: count || 0,
      totalPages: Math.ceil((count || 0) / limit),
      currentPage: page
    }
  },

  // Update vendor import decision
  updateImportDecision: async (productIds: number[], decision: 'staged' | 'skipped' | 'imported') => {
    const updates = productIds.map(id => ({
      shopify_product_id: id,
      decision,
      decided_at: new Date().toISOString()
    }))

    const { data, error } = await supabase
      .from('vendor_import_decisions')
      .upsert(updates)
      .select()

    if (error) throw error
    return data
  },

  // Import vendor products
  importVendorProducts: async (productIds: number[], overrides: Record<number, any> = {}) => {
    const { data, error } = await supabase.functions.invoke('vendor-shopify-import', {
      body: {
        productIds,
        overrides
      }
    })

    if (error) throw error
    return data
  }
}