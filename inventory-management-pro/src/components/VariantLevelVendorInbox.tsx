import React, { useState, useMemo, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import {
  Search,
  Filter,
  X,
  Package,
  Download,
  ChevronLeft,
  ChevronRight,
  Check,
  SkipForward,
  Archive,
  RefreshCw,
  Eye,
  ShoppingCart,
  Layers,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ExternalLink,
  Database,
  Clock,
  CheckSquare,
  XCircle,
  TrendingUp,
  Shirt,
  Palette,
  Ruler,
  Tag
} from 'lucide-react'
import { vendorQueries } from '../lib/queries'
import { formatPrice, formatDate } from '../lib/supabase'

interface VariantLevelVendorInboxProps {
  onClose: () => void
}

interface VendorInboxVariant {
  shopify_variant_id: number
  shopify_product_id: number
  sku: string
  title: string
  color_name: string
  size: string
  color_code: string
  base_product_code: string
  product_title: string
  category: string | null
  price: number | null
  inventory_quantity: number | null
  status: string
  created_at: string
  image_src: string | null
  decision: string
  decided_at: string | null
}

interface ImportPreviewData {
  variantId: number
  productId: number
  title: string
  color: string
  size: string
  sku: string
  inventory: number
  price: number | null
  category: string | null
}

interface InventorySyncStatus {
  isRunning: boolean
  lastSync: string | null
  nextScheduledSync: string | null
  progress?: {
    current: number
    total: number
    currentProduct?: string
  }
  summary?: {
    successful: number
    failed: number
    totalUpdated: number
  }
}

const VariantLevelVendorInbox: React.FC<VariantLevelVendorInboxProps> = ({ onClose }) => {
  const [selectedVariants, setSelectedVariants] = useState<number[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [filters, setFilters] = useState({
    status: '',
    decision: '',
    colorFilter: '',
    sizeFilter: ''
  })
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50 // Show more items since variants are smaller units
  })
  const [showFilters, setShowFilters] = useState(false)
  const [showImportPreview, setShowImportPreview] = useState(false)
  const [showInventoryModal, setShowInventoryModal] = useState(false)
  const [inventoryRefreshType, setInventoryRefreshType] = useState<'all' | 'selected'>('all')
  const [importProgress, setImportProgress] = useState<{
    isImporting: boolean
    current: number
    total: number
    currentProduct: string
  }>({ isImporting: false, current: 0, total: 0, currentProduct: '' })
  const [inventoryProgress, setInventoryProgress] = useState<{
    isRefreshing: boolean
    current: number
    total: number
    currentProduct: string
  }>({ isRefreshing: false, current: 0, total: 0, currentProduct: '' })

  const queryClient = useQueryClient()

  // Fetch vendor inbox variants
  const {
    data: inboxData,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['vendor-inbox-variants', pagination, searchTerm, filters],
    queryFn: () => vendorQueries.getVendorInboxVariants({
      ...pagination,
      search: searchTerm,
      status: filters.status,
      decision: filters.decision
    })
  })

  // Fetch inventory sync status
  const {
    data: syncStatus,
    isLoading: syncStatusLoading
  } = useQuery({
    queryKey: ['inventory-sync-status'],
    queryFn: () => vendorQueries.getInventorySyncStatus(),
    refetchInterval: 30000,
    retry: false
  })

  // Import variants mutation with progress tracking
  const importMutation = useMutation({
    mutationFn: async ({ variantIds }: { variantIds: number[] }) => {
      setImportProgress({ isImporting: true, current: 0, total: variantIds.length, currentProduct: '' })
      
      try {
        const result = await vendorQueries.importVendorVariants(variantIds)
        
        // Simulate progress updates for better UX
        for (let i = 0; i < variantIds.length; i++) {
          setImportProgress(prev => ({ 
            ...prev, 
            current: i + 1,
            currentProduct: `Variant ${variantIds[i]}`
          }))
          if (i < variantIds.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 200))
          }
        }
        
        return result
      } finally {
        setImportProgress({ isImporting: false, current: 0, total: 0, currentProduct: '' })
      }
    },
    onSuccess: (data) => {
      const { imported, skipped, errors, summary } = data.data || {}
      
      setSelectedVariants([])
      refetch()
      queryClient.invalidateQueries({ queryKey: ['vendor-inbox-count'] })
      
      // Show detailed success notifications
      if (summary?.successfully_imported > 0) {
        const importedNames = imported?.slice(0, 3).map((p: any) => p.title).join(', ') || ''
        const additionalCount = summary.successfully_imported - 3
        
        let successMessage = `Successfully imported ${summary.successfully_imported} product${summary.successfully_imported > 1 ? 's' : ''}!`
        
        if (summary.successfully_imported <= 3 && importedNames) {
          successMessage = `Successfully imported: ${importedNames}`
        } else if (importedNames) {
          successMessage = `Successfully imported: ${importedNames}${additionalCount > 0 ? ` and ${additionalCount} more` : ''}`
        }
        
        // Add summary details
        const details = []
        if (summary.total_variants_created) details.push(`${summary.total_variants_created} variants`)
        if (summary.total_images_processed) details.push(`${summary.total_images_processed} images`)
        
        if (details.length > 0) {
          successMessage += ` (${details.join(', ')})`
        }
        
        toast.success(successMessage, { 
          duration: 6000,
          position: 'top-center',
          style: {
            background: '#10B981',
            color: 'white',
            fontWeight: '500'
          }
        })
      }
      
      // Show errors if any
      if (summary?.failed > 0) {
        toast.error(
          `Failed to import ${summary.failed} variant${summary.failed > 1 ? 's' : ''}. Please check the logs and try again.`,
          { 
            duration: 7000,
            position: 'top-center'
          }
        )
      }
    },
    onError: (error) => {
      console.error('Import failed:', error)
      toast.error('Import failed. Please try again.')
    }
  })

  // Inventory refresh mutation
  const inventoryRefreshMutation = useMutation({
    mutationFn: async ({ refreshType, productIds }: { refreshType: 'all' | 'selected', productIds?: number[] }) => {
      const totalItems = refreshType === 'selected' ? (productIds?.length || 0) : (inboxData?.total || 0)
      setInventoryProgress({ isRefreshing: true, current: 0, total: totalItems, currentProduct: '' })
      
      try {
        const result = await vendorQueries.refreshInventory({
          refreshType,
          productIds: refreshType === 'selected' ? productIds : undefined
        })
        
        // Simulate progress updates for better UX
        for (let i = 0; i < totalItems; i++) {
          setInventoryProgress(prev => ({ 
            ...prev, 
            current: i + 1,
            currentProduct: refreshType === 'selected' && productIds ? `Product ${productIds[i] || ''}` : `Item ${i + 1}`
          }))
          if (i < totalItems - 1) {
            await new Promise(resolve => setTimeout(resolve, 150))
          }
        }
        
        return result
      } finally {
        setInventoryProgress({ isRefreshing: false, current: 0, total: 0, currentProduct: '' })
      }
    },
    onSuccess: (data) => {
      setShowInventoryModal(false)
      refetch()
      queryClient.invalidateQueries({ queryKey: ['inventory-sync-status'] })
      
      const summary = data?.data?.summary || { successful: 0, failed: 0, totalUpdated: 0, inventoryItemsUpdated: 0 }
      
      if (summary.inventoryItemsUpdated > 0) {
        let message = `Successfully refreshed inventory for ${summary.successful} product${summary.successful > 1 ? 's' : ''}!`
        message += ` Updated ${summary.inventoryItemsUpdated} inventory level${summary.inventoryItemsUpdated > 1 ? 's' : ''} from vendor.`
        
        toast.success(message, { 
          duration: 5000,
          position: 'top-center',
          style: {
            background: '#10B981',
            color: 'white',
            fontWeight: '500'
          }
        })
      } else if (summary.successful > 0) {
        toast.success(`Inventory refresh completed - all ${summary.successful} product${summary.successful > 1 ? 's were' : ' was'} already up to date!`, { 
          duration: 3000,
          position: 'top-center'
        })
      } else {
        toast.success('Inventory refresh completed!', { duration: 3000 })
      }
      
      if (summary.failed > 0) {
        toast.error(
          `Failed to refresh inventory for ${summary.failed} product${summary.failed > 1 ? 's' : ''}. Please check the logs for details.`,
          { 
            duration: 5000,
            position: 'top-center'
          }
        )
      }
    },
    onError: (error) => {
      console.error('Inventory refresh failed:', error)
      toast.error('Inventory refresh failed. Please try again.')
      setShowInventoryModal(false)
    }
  })

  // Update decision mutation
  const decisionMutation = useMutation({
    mutationFn: ({ variantIds, decision }: { variantIds: number[], decision: 'staged' | 'skipped' }) =>
      vendorQueries.updateVariantImportDecision(variantIds, decision),
    onSuccess: (_, { decision }) => {
      setSelectedVariants([])
      refetch()
      queryClient.invalidateQueries({ queryKey: ['vendor-inbox-count'] })
      
      const action = decision === 'staged' ? 'staged' : 'skipped'
      toast.success(`Variants ${action} successfully!`)
    },
    onError: () => {
      toast.error('Failed to update variant status. Please try again.')
    }
  })

  const handleSelectVariant = (variantId: number, selected: boolean) => {
    setSelectedVariants(prev => 
      selected 
        ? [...prev, variantId]
        : prev.filter(id => id !== variantId)
    )
  }

  const handleSelectAll = (selected: boolean) => {
    const availableItems = inboxData?.items.filter(item => item.decision !== 'imported') || []
    setSelectedVariants(
      selected ? availableItems.map(item => item.shopify_variant_id) : []
    )
  }

  const getImportPreviewData = (): ImportPreviewData[] => {
    if (!inboxData?.items) return []
    
    return selectedVariants
      .map(variantId => {
        const item = inboxData.items.find(item => item.shopify_variant_id === variantId)
        if (!item) return null
        
        return {
          variantId,
          productId: item.shopify_product_id,
          title: item.title,
          color: item.color_name,
          size: item.size,
          sku: item.sku,
          inventory: item.inventory_quantity || 0,
          price: item.price,
          category: item.category
        }
      })
      .filter(Boolean) as ImportPreviewData[]
  }

  const handleImportClick = () => {
    if (selectedVariants.length === 0) return
    setShowImportPreview(true)
  }

  const handleConfirmImport = () => {
    setShowImportPreview(false)
    importMutation.mutate({ variantIds: selectedVariants })
  }

  const handleDecision = (decision: 'staged' | 'skipped') => {
    if (selectedVariants.length === 0) return
    decisionMutation.mutate({ variantIds: selectedVariants, decision })
  }

  const handleInventoryRefresh = (refreshType: 'all' | 'selected') => {
    if (refreshType === 'selected' && selectedVariants.length === 0) {
      toast.error('Please select variants to refresh their inventory.')
      return
    }
    setInventoryRefreshType(refreshType)
    setShowInventoryModal(true)
  }

  const handleConfirmInventoryRefresh = () => {
    // Get unique product IDs from selected variants
    const selectedProductIds = [...new Set(
      selectedVariants.map(variantId => {
        const variant = inboxData?.items.find(item => item.shopify_variant_id === variantId)
        return variant?.shopify_product_id
      }).filter(Boolean)
    )] as number[]
    
    inventoryRefreshMutation.mutate({
      refreshType: inventoryRefreshType,
      productIds: inventoryRefreshType === 'selected' ? selectedProductIds : undefined
    })
  }

  const handleSearch = (value: string) => {
    setSearchTerm(value)
    setPagination(prev => ({ ...prev, page: 1 }))
  }

  const handleFilterChange = (newFilters: typeof filters) => {
    setFilters(newFilters)
    setPagination(prev => ({ ...prev, page: 1 }))
  }

  const handlePageChange = (page: number) => {
    setPagination(prev => ({ ...prev, page }))
  }

  // Get unique colors and sizes for filtering
  const filterOptions = useMemo(() => {
    if (!inboxData?.items) return { colors: [], sizes: [] }
    
    const colors = [...new Set(inboxData.items.map(item => item.color_name))].filter(Boolean).sort()
    const sizes = [...new Set(inboxData.items.map(item => item.size))].filter(Boolean).sort((a, b) => {
      const numA = parseInt(a)
      const numB = parseInt(b)
      return numA - numB
    })
    
    return { colors, sizes }
  }, [inboxData?.items])

  // Apply additional filters
  const filteredItems = useMemo(() => {
    if (!inboxData?.items) return []
    
    return inboxData.items.filter(item => {
      if (filters.colorFilter && item.color_name !== filters.colorFilter) return false
      if (filters.sizeFilter && item.size !== filters.sizeFilter) return false
      return true
    })
  }, [inboxData?.items, filters.colorFilter, filters.sizeFilter])

  const getDecisionBadge = (decision: string) => {
    switch (decision) {
      case 'staged':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">Staged</span>
      case 'skipped':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">Skipped</span>
      case 'imported':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"><CheckCircle2 className="h-3 w-3 mr-1" />Imported</span>
      default:
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">Ready</span>
    }
  }

  const getStatusBadge = (status: string) => {
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
        status === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-800'
      }`}>
        {status}
      </span>
    )
  }

  const getStockStatusColor = (inventory: number | null) => {
    if (!inventory || inventory === 0) return 'text-red-600 bg-red-50'
    if (inventory < 10) return 'text-yellow-600 bg-yellow-50'
    return 'text-green-600 bg-green-50'
  }

  const totalEstimatedData = useMemo(() => {
    const previewData = getImportPreviewData()
    return {
      variants: previewData.length,
      products: new Set(previewData.map(item => item.productId)).size,
      totalInventory: previewData.reduce((sum, item) => sum + item.inventory, 0)
    }
  }, [selectedVariants, inboxData])

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-4 mx-auto p-5 border w-11/12 max-w-7xl shadow-lg rounded-md bg-white mb-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 pb-4 mb-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <Shirt className="h-6 w-6 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Enhanced Vendor Inbox</h2>
              <p className="text-sm text-gray-500">Import individual size variants from vendor catalog</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-md bg-white text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Search and Actions */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0 mb-6">
          <div className="flex-1 max-w-lg">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by color, size, SKU, or product name..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
              />
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`inline-flex items-center px-4 py-2.5 border shadow-sm text-sm font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors ${
                showFilters
                  ? 'border-indigo-600 text-indigo-600 bg-indigo-50'
                  : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
              }`}
            >
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </button>
            <button
              onClick={() => refetch()}
              className="inline-flex items-center px-4 py-2.5 border border-gray-300 shadow-sm text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </button>
            <div className="relative">
              <button
                onClick={() => handleInventoryRefresh('all')}
                disabled={inventoryRefreshMutation.isPending || inventoryProgress.isRefreshing}
                className="inline-flex items-center px-4 py-2.5 border border-emerald-300 shadow-sm text-sm font-medium rounded-lg text-emerald-700 bg-emerald-50 hover:bg-emerald-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-colors disabled:opacity-50"
              >
                <Database className="h-4 w-4 mr-2" />
                {inventoryProgress.isRefreshing ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <TrendingUp className="h-4 w-4 mr-2" />
                )}
                Refresh Inventory
              </button>
            </div>
          </div>
        </div>

        {/* Enhanced Filters Panel */}
        {showFilters && (
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={filters.status}
                  onChange={(e) => handleFilterChange({ ...filters, status: e.target.value })}
                  className="block w-full border border-gray-300 rounded-md px-3 py-2 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">All Statuses</option>
                  <option value="active">Active</option>
                  <option value="draft">Draft</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Decision</label>
                <select
                  value={filters.decision}
                  onChange={(e) => handleFilterChange({ ...filters, decision: e.target.value })}
                  className="block w-full border border-gray-300 rounded-md px-3 py-2 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">All Decisions</option>
                  <option value="none">New</option>
                  <option value="staged">Staged</option>
                  <option value="skipped">Skipped</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
                <select
                  value={filters.colorFilter}
                  onChange={(e) => handleFilterChange({ ...filters, colorFilter: e.target.value })}
                  className="block w-full border border-gray-300 rounded-md px-3 py-2 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">All Colors</option>
                  {filterOptions.colors.map(color => (
                    <option key={color} value={color}>{color}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Size</label>
                <select
                  value={filters.sizeFilter}
                  onChange={(e) => handleFilterChange({ ...filters, sizeFilter: e.target.value })}
                  className="block w-full border border-gray-300 rounded-md px-3 py-2 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">All Sizes</option>
                  {filterOptions.sizes.map(size => (
                    <option key={size} value={size}>Size {size}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Bulk Actions */}
        {selectedVariants.length > 0 && (
          <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <span className="text-sm font-medium text-indigo-900">
                  {selectedVariants.length} variant{selectedVariants.length > 1 ? 's' : ''} selected
                </span>
                <span className="ml-2 text-xs text-indigo-700">
                  ({totalEstimatedData.products} product{totalEstimatedData.products > 1 ? 's' : ''})
                </span>
              </div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => handleDecision('staged')}
                  disabled={decisionMutation.isPending}
                  className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-yellow-700 bg-yellow-100 hover:bg-yellow-200 disabled:opacity-50"
                >
                  <Archive className="h-3 w-3 mr-1" />
                  Stage
                </button>
                <button
                  onClick={() => handleDecision('skipped')}
                  disabled={decisionMutation.isPending}
                  className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-gray-700 bg-gray-100 hover:bg-gray-200 disabled:opacity-50"
                >
                  <SkipForward className="h-3 w-3 mr-1" />
                  Skip
                </button>
                <button
                  onClick={handleImportClick}
                  disabled={importMutation.isPending}
                  className="inline-flex items-center px-4 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
                >
                  <Download className="h-3 w-3 mr-1" />
                  {importMutation.isPending ? 'Importing...' : 'Import'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Variant Table */}
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          {isLoading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
              <p className="mt-2 text-sm text-gray-500">Loading vendor variants...</p>
            </div>
          ) : error ? (
            <div className="p-8 text-center">
              <p className="text-sm text-red-600">Error loading vendor variants. Please try again.</p>
            </div>
          ) : !filteredItems.length ? (
            <div className="p-8 text-center">
              <Shirt className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-sm text-gray-500">No vendor variants found.</p>
            </div>
          ) : (
            <>
              <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    checked={selectedVariants.length === filteredItems.filter(item => item.decision !== 'imported').length && filteredItems.length > 0}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                  />
                  <span className="ml-3 text-sm font-medium text-gray-900">Select All ({filteredItems.length} variants)</span>
                </div>
              </div>
              <ul className="divide-y divide-gray-200">
                {filteredItems.map((item) => (
                  <li key={item.shopify_variant_id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        checked={selectedVariants.includes(item.shopify_variant_id)}
                        onChange={(e) => handleSelectVariant(item.shopify_variant_id, e.target.checked)}
                        disabled={item.decision === 'imported'}
                      />
                      <div className="ml-4 flex-shrink-0">
                        {item.image_src ? (
                          <img className="h-16 w-16 rounded-lg object-cover" src={item.image_src} alt={item.title} />
                        ) : (
                          <div className="h-16 w-16 rounded-lg bg-gray-100 flex items-center justify-center">
                            <Shirt className="h-8 w-8 text-gray-400" />
                          </div>
                        )}
                      </div>
                      <div className="ml-4 flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{item.title}</p>
                            <div className="flex items-center space-x-4 mt-1">
                              <div className="flex items-center">
                                <Palette className="h-3 w-3 text-gray-400 mr-1" />
                                <span className="text-xs text-gray-600">{item.color_name}</span>
                              </div>
                              <div className="flex items-center">
                                <Ruler className="h-3 w-3 text-gray-400 mr-1" />
                                <span className="text-xs text-gray-600">Size {item.size}</span>
                              </div>
                              <div className="flex items-center">
                                <Tag className="h-3 w-3 text-gray-400 mr-1" />
                                <span className="text-xs text-gray-600">{item.sku}</span>
                              </div>
                              {item.category && (
                                <span className="text-xs text-gray-500">{item.category}</span>
                              )}
                            </div>
                            <div className="flex items-center space-x-2 mt-2">
                              {getStatusBadge(item.status)}
                              {getDecisionBadge(item.decision)}
                            </div>
                          </div>
                          <div className="flex items-center space-x-6 text-sm text-gray-500">
                            <div className="text-right">
                              <p className="font-medium text-gray-900">{item.price ? formatPrice(item.price) : 'N/A'}</p>
                              <p className="text-xs">Price</p>
                            </div>
                            <div className="text-right">
                              <p className={`font-medium px-2 py-1 rounded-md text-xs ${getStockStatusColor(item.inventory_quantity)}`}>
                                {item.inventory_quantity ?? 'N/A'}
                              </p>
                              <p className="text-xs mt-1">Stock</p>
                            </div>
                            <div className="text-right">
                              <p className="font-medium text-gray-900">{formatDate(item.created_at)}</p>
                              <p className="text-xs">Created</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>

        {/* Pagination */}
        {inboxData && inboxData.totalPages > 1 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6 mt-4">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page === inboxData.totalPages}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing <span className="font-medium">{(pagination.page - 1) * pagination.limit + 1}</span> to{' '}
                  <span className="font-medium">
                    {Math.min(pagination.page * pagination.limit, inboxData.total)}
                  </span>{' '}
                  of <span className="font-medium">{inboxData.total}</span> variants
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                  <button
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  {[...Array(Math.min(inboxData.totalPages, 5))].map((_, i) => {
                    const page = i + 1
                    const isActive = page === pagination.page
                    return (
                      <button
                        key={page}
                        onClick={() => handlePageChange(page)}
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                          isActive
                            ? 'z-10 bg-indigo-50 border-indigo-500 text-indigo-600'
                            : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        {page}
                      </button>
                    )
                  })}
                  <button
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={pagination.page === inboxData.totalPages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}

        {/* Import Preview Modal */}
        {showImportPreview && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-2xl shadow-lg rounded-md bg-white">
              <div className="flex items-center justify-between border-b border-gray-200 pb-4 mb-4">
                <h3 className="text-lg font-medium text-gray-900">Import Preview</h3>
                <button
                  onClick={() => setShowImportPreview(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              <div className="mb-4">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <p className="text-2xl font-bold text-blue-600">{totalEstimatedData.variants}</p>
                    <p className="text-xs text-blue-800">Variants</p>
                  </div>
                  <div className="bg-green-50 p-3 rounded-lg">
                    <p className="text-2xl font-bold text-green-600">{totalEstimatedData.products}</p>
                    <p className="text-xs text-green-800">Products</p>
                  </div>
                  <div className="bg-purple-50 p-3 rounded-lg">
                    <p className="text-2xl font-bold text-purple-600">{totalEstimatedData.totalInventory}</p>
                    <p className="text-xs text-purple-800">Total Inventory</p>
                  </div>
                </div>
              </div>
              
              <div className="max-h-96 overflow-y-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Variant</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Color</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Size</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Inventory</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {getImportPreviewData().map((item) => (
                      <tr key={item.variantId}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {item.sku}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {item.color}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {item.size}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <span className={`px-2 py-1 rounded-md text-xs font-medium ${getStockStatusColor(item.inventory)}`}>
                            {item.inventory}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowImportPreview(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmImport}
                  className="px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
                >
                  Confirm Import
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Inventory Refresh Modal */}
        {showInventoryModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="flex items-center justify-between border-b border-gray-200 pb-4 mb-4">
                <h3 className="text-lg font-medium text-gray-900">Refresh Inventory</h3>
                <button
                  onClick={() => setShowInventoryModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">
                  {inventoryRefreshType === 'all' 
                    ? 'This will refresh inventory for all products in the vendor catalog.' 
                    : `This will refresh inventory for ${totalEstimatedData.products} selected product${totalEstimatedData.products > 1 ? 's' : ''}.`
                  }
                </p>
                <p className="text-xs text-gray-500">
                  This may take a few minutes to complete.
                </p>
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowInventoryModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmInventoryRefresh}
                  disabled={inventoryRefreshMutation.isPending}
                  className="px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50"
                >
                  {inventoryRefreshMutation.isPending ? 'Refreshing...' : 'Confirm'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Progress Modal */}
        {(importProgress.isImporting || inventoryProgress.isRefreshing) && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-1/2 transform -translate-y-1/2 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="text-center">
                <Loader2 className="h-12 w-12 text-indigo-600 mx-auto mb-4 animate-spin" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {importProgress.isImporting ? 'Importing Variants...' : 'Refreshing Inventory...'}
                </h3>
                <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                  <div 
                    className="bg-indigo-600 h-2 rounded-full transition-all duration-300" 
                    style={{ 
                      width: `${(
                        (importProgress.isImporting ? importProgress.current : inventoryProgress.current) / 
                        (importProgress.isImporting ? importProgress.total : inventoryProgress.total)
                      ) * 100}%` 
                    }}
                  ></div>
                </div>
                <p className="text-sm text-gray-600">
                  {importProgress.isImporting ? importProgress.current : inventoryProgress.current} of{' '}
                  {importProgress.isImporting ? importProgress.total : inventoryProgress.total}
                </p>
                {(importProgress.currentProduct || inventoryProgress.currentProduct) && (
                  <p className="text-xs text-gray-500 mt-1">
                    Processing: {importProgress.currentProduct || inventoryProgress.currentProduct}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default VariantLevelVendorInbox