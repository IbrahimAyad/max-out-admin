import { useState, useEffect } from 'react'
import { inventoryService, type EnhancedProductVariant, type Product } from '@/lib/supabase'

export function useInventory() {
  const [variants, setVariants] = useState<EnhancedProductVariant[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadVariants = async (filters = {}) => {
    try {
      setLoading(true)
      console.log('Loading variants with filters:', filters)
      const data = await inventoryService.getEnhancedVariants(filters)
      console.log('Loaded variants:', data)
      setVariants(data)
    } catch (err) {
      console.error('Failed to load variants:', err)
      setError(err instanceof Error ? err.message : 'Failed to load variants')
    } finally {
      setLoading(false)
    }
  }

  const loadProducts = async () => {
    try {
      console.log('Loading products')
      const data = await inventoryService.getProductsWithVariants()
      console.log('Loaded products:', data)
      setProducts(data)
    } catch (err) {
      console.error('Failed to load products:', err)
      setError(err instanceof Error ? err.message : 'Failed to load products')
    }
  }

  const updateVariant = async (variantId: string, updates: any) => {
    try {
      await inventoryService.updateVariantInventory(variantId, updates)
      // Refresh the variant in the list
      await loadVariants()
      return { success: true }
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Failed to update variant'
      setError(error)
      return { success: false, error }
    }
  }

  const bulkUpdate = async (updates: Array<{ id: string; [key: string]: any }>) => {
    try {
      const results = await inventoryService.bulkUpdateVariants(updates)
      await loadVariants()
      return results
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Failed to bulk update'
      setError(error)
      return []
    }
  }

  useEffect(() => {
    loadVariants()
    loadProducts()
  }, [])

  return {
    variants,
    products,
    loading,
    error,
    loadVariants,
    loadProducts,
    updateVariant,
    bulkUpdate,
    clearError: () => setError(null)
  }
}

export function useLowStockAlerts() {
  const [alerts, setAlerts] = useState([])
  const [loading, setLoading] = useState(true)

  const loadAlerts = async (status: 'active' | 'acknowledged' | 'resolved' = 'active') => {
    try {
      setLoading(true)
      const data = await inventoryService.getLowStockAlerts(status)
      setAlerts(data)
    } catch (err) {
      console.error('Failed to load alerts:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAlerts()
  }, [])

  return {
    alerts,
    loading,
    loadAlerts
  }
}