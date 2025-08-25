import { useState, useEffect } from 'react'
import { supabase, type InventoryProduct, type InventoryVariant, type SizeDefinition, type ColorDefinition, type EnhancedProduct, type EnhancedVariant } from '@/lib/supabase'

// Hook for managing inventory products
export function useInventoryProducts() {
  const [products, setProducts] = useState<EnhancedProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchProducts = async () => {
    try {
      setLoading(true)
      console.log('Fetching products from Supabase...')
      
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .order('category', { ascending: true })
        .order('name', { ascending: true })

      if (error) throw error
      
      console.log('Products fetched:', data)

      // Enhance products with variant data
      const enhancedProducts = await Promise.all(
        data.map(async (product) => {
          console.log(`Fetching variants for product ${product.id}...`)
          const { data: variants, error: variantsError } = await supabase
            .from('enhanced_product_variants')
            .select('*')
            .eq('product_id', product.id)
            .eq('is_active', true)

          if (variantsError) {
            console.error(`Error fetching variants for product ${product.id}:`, variantsError)
            throw variantsError
          }

          console.log(`Variants for product ${product.id}:`, variants)
          
          const totalStock = variants?.reduce((sum, v) => sum + (v.stock_quantity || 0), 0) || 0
          const lowStockVariants = variants?.filter(v => v.stock_quantity <= v.low_stock_threshold).length || 0

          return {
            ...product,
            variants,
            total_stock: totalStock,
            low_stock_variants: lowStockVariants
          }
        })
      )

      console.log('Enhanced products:', enhancedProducts)
      setProducts(enhancedProducts)
    } catch (err) {
      console.error('Error fetching products:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch products')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProducts()
  }, [])

  return { products, loading, error, refetch: fetchProducts }
}

// Hook for managing inventory variants
export function useInventoryVariants(productId?: number) {
  const [variants, setVariants] = useState<EnhancedVariant[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchVariants = async () => {
    try {
      setLoading(true)
      console.log('Fetching variants from Supabase...', { productId })
      
      let query = supabase
        .from('enhanced_product_variants')
        .select('*')
        .eq('is_active', true)

      if (productId) {
        query = query.eq('product_id', productId)
      }

      const { data, error } = await query.order('sku', { ascending: true })

      if (error) throw error
      
      console.log('Variants fetched:', data)

      // Enhance variants with related data
      const enhancedVariants = await Promise.all(
        data.map(async (variant) => {
          console.log(`Enhancing variant ${variant.id}...`)
          const [productData, sizeData, colorData] = await Promise.all([
            variant.product_id ? supabase
              .from('products')
              .select('*')
              .eq('id', variant.product_id)
              .maybeSingle() : null,
            variant.size_id ? supabase
              .from('size_definitions')
              .select('*')
              .eq('id', variant.size_id)
              .maybeSingle() : null,
            variant.color_id ? supabase
              .from('color_definitions')
              .select('*')
              .eq('id', variant.color_id)
              .maybeSingle() : null
          ])

          console.log(`Related data for variant ${variant.id}:`, { productData, sizeData, colorData })
          
          const stockStatus = 
            variant.stock_quantity === 0 ? 'out_of_stock' :
            variant.stock_quantity <= variant.low_stock_threshold ? 'low_stock' : 'in_stock'

          return {
            ...variant,
            product: productData?.data,
            size: sizeData?.data,
            color: colorData?.data,
            stock_status: stockStatus
          }
        })
      )

      console.log('Enhanced variants:', enhancedVariants)
      setVariants(enhancedVariants)
    } catch (err) {
      console.error('Error fetching variants:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch variants')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchVariants()
  }, [productId])

  return { variants, loading, error, refetch: fetchVariants }
}

// Hook for size and color definitions
export function useDefinitions() {
  const [sizes, setSizes] = useState<Record<string, SizeDefinition[]>>({})
  const [colors, setColors] = useState<ColorDefinition[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchDefinitions = async () => {
      try {
        setLoading(true)
        console.log('Fetching size and color definitions from Supabase...')
        
        const [sizesResponse, colorsResponse] = await Promise.all([
          supabase
            .from('size_definitions')
            .select('*')
            .order('category', { ascending: true })
            .order('sort_order', { ascending: true }),
          supabase
            .from('color_definitions')
            .select('*')
            .order('color_name', { ascending: true })
        ])

        if (sizesResponse.error) throw sizesResponse.error
        if (colorsResponse.error) throw colorsResponse.error

        console.log('Size definitions fetched:', sizesResponse.data)
        console.log('Color definitions fetched:', colorsResponse.data)

        // Group sizes by category
        const sizesByCategory = sizesResponse.data.reduce((acc, size) => {
          if (!acc[size.category]) acc[size.category] = []
          acc[size.category].push(size)
          return acc
        }, {} as Record<string, SizeDefinition[]>)

        console.log('Sizes grouped by category:', sizesByCategory)
        
        setSizes(sizesByCategory)
        setColors(colorsResponse.data)
      } catch (err) {
        console.error('Error fetching definitions:', err)
        setError(err instanceof Error ? err.message : 'Failed to fetch definitions')
      } finally {
        setLoading(false)
      }
    }

    fetchDefinitions()
  }, [])

  return { sizes, colors, loading, error }
}

// Hook for updating stock quantities
export function useStockUpdate() {
  const [updating, setUpdating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const updateStock = async (variantId: number, newQuantity: number, notes?: string) => {
    try {
      setUpdating(true)
      setError(null)

      // Get current quantity for inventory movement
      const { data: currentVariant, error: fetchError } = await supabase
        .from('enhanced_product_variants')
        .select('stock_quantity')
        .eq('id', variantId)
        .maybeSingle()

      if (fetchError) throw fetchError
      if (!currentVariant) throw new Error('Variant not found')

      const currentQuantity = currentVariant.stock_quantity
      const quantityDiff = newQuantity - currentQuantity

      // Update the stock quantity
      const { error: updateError } = await supabase
        .from('enhanced_product_variants')
        .update({
          stock_quantity: newQuantity,
          updated_at: new Date().toISOString()
        })
        .eq('id', variantId)

      if (updateError) throw updateError

      // Record inventory movement
      const movementType = quantityDiff > 0 ? 'in' : (quantityDiff < 0 ? 'out' : 'adjustment')
      await supabase
        .from('inventory_movements')
        .insert({
          variant_id: variantId,
          movement_type: movementType,
          quantity: Math.abs(quantityDiff),
          previous_quantity: currentQuantity,
          new_quantity: newQuantity,
          notes: notes || 'Manual update',
          created_by: 'admin',
          created_at: new Date().toISOString()
        })

      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update stock')
      return false
    } finally {
      setUpdating(false)
    }
  }

  const bulkUpdateStock = async (updates: Array<{ variantId: number; newQuantity: number; notes?: string }>) => {
    try {
      setUpdating(true)
      setError(null)

      for (const update of updates) {
        const success = await updateStock(update.variantId, update.newQuantity, update.notes)
        if (!success) break
      }

      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to bulk update stock')
      return false
    } finally {
      setUpdating(false)
    }
  }

  return { updateStock, bulkUpdateStock, updating, error }
}