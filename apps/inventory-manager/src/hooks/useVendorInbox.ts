import { useState, useEffect, useCallback } from 'react'
import { inventoryService, type VendorInboxVariant } from '@/lib/supabase'

export function useVendorInbox() {
  const [variants, setVariants] = useState<VendorInboxVariant[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    decision: ''
  })

  const loadVariants = useCallback(async (newPage: number = page, newFilters = filters) => {
    try {
      setLoading(true)
      const data = await inventoryService.getVendorInboxVariants(newPage, 50, newFilters)
      setVariants(data.variants)
      setTotal(data.total)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load vendor variants')
    } finally {
      setLoading(false)
    }
  }, [page, filters])

  const updateFilters = useCallback((newFilters: Partial<typeof filters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }))
    setPage(1) // Reset to first page when filters change
  }, [])

  const updatePage = useCallback((newPage: number) => {
    setPage(newPage)
  }, [])

  const updateDecision = async (shopifyProductId: string, decision: 'import' | 'skip' | 'staged') => {
    try {
      await inventoryService.updateVendorImportDecision(shopifyProductId, decision)
      // Refresh the variants to show updated decisions
      await loadVariants()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update decision')
    }
  }

  const bulkUpdateDecisions = async (decisions: Array<{ shopify_product_id: string; decision: 'import' | 'skip' | 'staged' }>) => {
    try {
      await inventoryService.bulkUpdateVendorImportDecisions(decisions)
      // Refresh the variants to show updated decisions
      await loadVariants()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update decisions')
    }
  }

  useEffect(() => {
    loadVariants()
  }, [loadVariants])

  return {
    variants,
    loading,
    error,
    page,
    total,
    filters,
    loadVariants,
    updateFilters,
    updatePage,
    updateDecision,
    bulkUpdateDecisions,
    clearError: () => setError(null)
  }
}