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
  TrendingUp
} from 'lucide-react'
import { vendorQueries } from '../lib/queries'
import { formatPrice, formatDate } from '../lib/supabase'

interface VendorInboxProps {
  onClose: () => void
}

interface ImportPreviewData {
  productId: number
  title: string
  variants: number
  images: number
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

const EnhancedVendorInbox: React.FC<VendorInboxProps> = ({ onClose }) => {
  const [selectedProducts, setSelectedProducts] = useState<number[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [filters, setFilters] = useState({
    status: '',
    decision: ''
  })
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20
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

  // Fetch vendor inbox items
  const {
    data: inboxData,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['vendor-inbox', pagination, searchTerm, filters],
    queryFn: () => vendorQueries.getVendorInboxItems({
      ...pagination,
      search: searchTerm,
      ...filters
    })
  })

  // Fetch inventory sync status
  const {
    data: syncStatus,
    isLoading: syncStatusLoading
  } = useQuery({
    queryKey: ['inventory-sync-status'],
    queryFn: () => vendorQueries.getInventorySyncStatus(),
    refetchInterval: 30000, // Refetch every 30 seconds
    retry: false
  })

  // Import products mutation with progress tracking
  const importMutation = useMutation({
    mutationFn: async ({ productIds }: { productIds: number[] }) => {
      setImportProgress({ isImporting: true, current: 0, total: productIds.length, currentProduct: '' })
      
      try {
        const result = await vendorQueries.importVendorProducts(productIds)
        
        // Simulate progress updates for better UX
        for (let i = 0; i < productIds.length; i++) {
          setImportProgress(prev => ({ 
            ...prev, 
            current: i + 1,
            currentProduct: `Product ${productIds[i]}`
          }))
          // Small delay to show progress
          if (i < productIds.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 200))
          }
        }
        
        return result
      } finally {
        setImportProgress({ isImporting: false, current: 0, total: 0, currentProduct: '' })
      }
    },
    onSuccess: (data) => {
      const { imported, skipped, errors, summary } = data.data
      
      setSelectedProducts([])
      refetch()
      queryClient.invalidateQueries({ queryKey: ['vendor-inbox-count'] })
      
      // Show detailed success notifications
      if (summary.successfully_imported > 0) {
        const importedNames = imported.slice(0, 3).map(p => p.title).join(', ')
        const additionalCount = summary.successfully_imported - 3
        
        let successMessage = `Successfully imported ${summary.successfully_imported} product${summary.successfully_imported > 1 ? 's' : ''}!`
        
        if (summary.successfully_imported <= 3) {
          successMessage = `Successfully imported: ${importedNames}`
        } else {
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
      
      // Show skipped duplicates notification
      if (summary.skipped_duplicates > 0) {
        const skippedNames = skipped.slice(0, 2).map(p => `ID: ${p.shopify_product_id}`).join(', ')
        const additionalSkipped = summary.skipped_duplicates - 2
        
        let skippedMessage = `Skipped ${summary.skipped_duplicates} duplicate product${summary.skipped_duplicates > 1 ? 's' : ''}: ${skippedNames}`
        if (additionalSkipped > 0) {
          skippedMessage += ` and ${additionalSkipped} more`
        }
        skippedMessage += ' (already imported)'
        
        toast.success(skippedMessage, { 
          duration: 5000,
          style: {
            background: '#F59E0B',
            color: 'white'
          }
        })
      }
      
      // Show image processing warnings if any
      if (summary.total_images_failed > 0) {
        toast(
          `${summary.total_images_failed} image${summary.total_images_failed > 1 ? 's' : ''} failed to download. Products imported without these images.`,
          {
            duration: 5000,
            icon: '⚠️',
            style: {
              background: '#F97316',
              color: 'white'
            }
          }
        )
      }
      
      // Show errors if any
      if (summary.failed > 0) {
        toast.error(
          `Failed to import ${summary.failed} product${summary.failed > 1 ? 's' : ''}. Please check the logs and try again.`,
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
          // Small delay to show progress
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
      
      // Show detailed success notification
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
    mutationFn: ({ productIds, decision }: { productIds: number[], decision: 'staged' | 'skipped' }) =>
      vendorQueries.updateImportDecision(productIds, decision),
    onSuccess: (_, { decision }) => {
      setSelectedProducts([])
      refetch()
      queryClient.invalidateQueries({ queryKey: ['vendor-inbox-count'] })
      
      const action = decision === 'staged' ? 'staged' : 'skipped'
      toast.success(`Products ${action} successfully!`)
    },
    onError: () => {
      toast.error('Failed to update product status. Please try again.')
    }
  })

  const handleSelectProduct = (productId: number, selected: boolean) => {
    setSelectedProducts(prev => 
      selected 
        ? [...prev, productId]
        : prev.filter(id => id !== productId)
    )
  }

  const handleSelectAll = (selected: boolean) => {
    const availableItems = inboxData?.items.filter(item => item.decision !== 'imported') || []
    setSelectedProducts(
      selected ? availableItems.map(item => item.shopify_product_id) : []
    )
  }

  const getImportPreviewData = (): ImportPreviewData[] => {
    if (!inboxData?.items) return []
    
    return selectedProducts
      .map(id => {
        const item = inboxData.items.find(item => item.shopify_product_id === id)
        if (!item) return null
        
        return {
          productId: id,
          title: item.title,
          variants: item.variants,
          images: item.image_src ? 1 : 0, // Simplified for now
          price: item.price,
          category: item.category
        }
      })
      .filter(Boolean) as ImportPreviewData[]
  }

  const handleImportClick = () => {
    if (selectedProducts.length === 0) return
    setShowImportPreview(true)
  }

  const handleConfirmImport = () => {
    setShowImportPreview(false)
    importMutation.mutate({ productIds: selectedProducts })
  }

  const handleDecision = (decision: 'staged' | 'skipped') => {
    if (selectedProducts.length === 0) return
    decisionMutation.mutate({ productIds: selectedProducts, decision })
  }

  const handleInventoryRefresh = (refreshType: 'all' | 'selected') => {
    if (refreshType === 'selected' && selectedProducts.length === 0) {
      toast.error('Please select products to refresh their inventory.')
      return
    }
    setInventoryRefreshType(refreshType)
    setShowInventoryModal(true)
  }

  const handleConfirmInventoryRefresh = () => {
    inventoryRefreshMutation.mutate({
      refreshType: inventoryRefreshType,
      productIds: inventoryRefreshType === 'selected' ? selectedProducts : undefined
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

  // Keyboard shortcuts
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === ' ' && e.target === document.body) {
        e.preventDefault()
        if (selectedProducts.length > 0) {
          handleSelectAll(false)
        }
      }
      if (e.key === 'Enter' && selectedProducts.length > 0) {
        e.preventDefault()
        handleImportClick()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [selectedProducts])

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

  const totalEstimatedData = useMemo(() => {
    const previewData = getImportPreviewData()
    return {
      products: previewData.length,
      variants: previewData.reduce((sum, item) => sum + item.variants, 0),
      images: previewData.reduce((sum, item) => sum + item.images, 0)
    }
  }, [selectedProducts, inboxData])

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-4 mx-auto p-5 border w-11/12 max-w-7xl shadow-lg rounded-md bg-white mb-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 pb-4 mb-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <Package className="h-6 w-6 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Vendor Inbox</h2>
              <p className="text-sm text-gray-500">Import products from Shopify vendor catalog</p>
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
                placeholder="Search vendor products..."
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
              {syncStatus?.data && !syncStatusLoading && (
                <div className="absolute top-full left-0 mt-1 min-w-max">
                  <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-xs">
                    <div className="flex items-center space-x-2 mb-1">
                      <Clock className="h-3 w-3 text-gray-400" />
                      <span className="text-gray-600">Last sync:</span>
                      <span className="font-medium">
                        {syncStatus.data.lastSync ? formatDate(syncStatus.data.lastSync) : 'Never'}
                      </span>
                    </div>
                    {syncStatus.data.nextScheduledSync && (
                      <div className="flex items-center space-x-2">
                        <Clock className="h-3 w-3 text-blue-400" />
                        <span className="text-gray-600">Next sync:</span>
                        <span className="font-medium text-blue-600">
                          {formatDate(syncStatus.data.nextScheduledSync)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            {selectedProducts.length > 0 && (
              <div className="inline-flex items-center px-3 py-2 rounded-lg text-sm font-medium bg-indigo-100 text-indigo-800">
                <CheckCircle2 className="h-4 w-4 mr-1" />
                {selectedProducts.length} selected
              </div>
            )}
          </div>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="bg-gray-50 rounded-lg p-4 mb-6 border border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select
                  value={filters.status}
                  onChange={(e) => handleFilterChange({ ...filters, status: e.target.value })}
                  className="block w-full border border-gray-300 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                >
                  <option value="">All Statuses</option>
                  <option value="active">Active</option>
                  <option value="draft">Draft</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Import Status</label>
                <select
                  value={filters.decision}
                  onChange={(e) => handleFilterChange({ ...filters, decision: e.target.value })}
                  className="block w-full border border-gray-300 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                >
                  <option value="">All Import States</option>
                  <option value="none">Ready to Import</option>
                  <option value="staged">Staged</option>
                  <option value="skipped">Skipped</option>
                  <option value="imported">Already Imported</option>
                </select>
              </div>
              <div className="flex items-end">
                <button
                  onClick={() => handleFilterChange({ status: '', decision: '' })}
                  className="w-full px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Import Progress */}
        {importProgress.isImporting && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center">
                <Loader2 className="h-5 w-5 text-blue-600 animate-spin mr-2" />
                <span className="text-sm font-medium text-blue-900">
                  Importing products... ({importProgress.current}/{importProgress.total})
                </span>
              </div>
              <span className="text-xs text-blue-700">
                {Math.round((importProgress.current / importProgress.total) * 100)}%
              </span>
            </div>
            <div className="w-full bg-blue-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(importProgress.current / importProgress.total) * 100}%` }}
              />
            </div>
            {importProgress.currentProduct && (
              <p className="text-xs text-blue-600 mt-1">Processing: {importProgress.currentProduct}</p>
            )}
          </div>
        )}

        {/* Inventory Refresh Progress */}
        {inventoryProgress.isRefreshing && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center">
                <Loader2 className="h-5 w-5 text-emerald-600 animate-spin mr-2" />
                <span className="text-sm font-medium text-emerald-900">
                  Refreshing inventory... ({inventoryProgress.current}/{inventoryProgress.total})
                </span>
              </div>
              <span className="text-xs text-emerald-700">
                {Math.round((inventoryProgress.current / inventoryProgress.total) * 100)}%
              </span>
            </div>
            <div className="w-full bg-emerald-200 rounded-full h-2">
              <div
                className="bg-emerald-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(inventoryProgress.current / inventoryProgress.total) * 100}%` }}
              />
            </div>
            {inventoryProgress.currentProduct && (
              <p className="text-xs text-emerald-600 mt-1">Processing: {inventoryProgress.currentProduct}</p>
            )}
          </div>
        )}

        {/* Bulk Actions */}
        {selectedProducts.length > 0 && !importProgress.isImporting && !inventoryProgress.isRefreshing && (
          <div className="bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-200 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <CheckCircle2 className="h-5 w-5 text-indigo-600 mr-2" />
                <span className="text-sm font-medium text-indigo-900">
                  {selectedProducts.length} product{selectedProducts.length > 1 ? 's' : ''} selected
                </span>
                <span className="mx-2 text-indigo-300">•</span>
                <span className="text-xs text-indigo-700">
                  ~{totalEstimatedData.variants} variants, ~{totalEstimatedData.images} images
                </span>
              </div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => handleDecision('staged')}
                  disabled={decisionMutation.isPending}
                  className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-yellow-700 bg-yellow-100 hover:bg-yellow-200 disabled:opacity-50 transition-colors"
                >
                  <Archive className="h-3 w-3 mr-1" />
                  Stage for Later
                </button>
                <button
                  onClick={() => handleDecision('skipped')}
                  disabled={decisionMutation.isPending}
                  className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-gray-700 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 transition-colors"
                >
                  <SkipForward className="h-3 w-3 mr-1" />
                  Skip Products
                </button>
                <button
                  onClick={() => handleInventoryRefresh('selected')}
                  disabled={inventoryRefreshMutation.isPending}
                  className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-emerald-700 bg-emerald-100 hover:bg-emerald-200 disabled:opacity-50 transition-colors"
                >
                  <Database className="h-3 w-3 mr-1" />
                  Refresh Inventory
                </button>
                <button
                  onClick={handleImportClick}
                  disabled={importMutation.isPending}
                  className="inline-flex items-center px-4 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Import Selected
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Table */}
        <div className="bg-white shadow-sm border border-gray-200 rounded-lg overflow-hidden">
          {isLoading ? (
            <div className="p-12 text-center">
              <Loader2 className="h-8 w-8 text-indigo-600 animate-spin mx-auto mb-4" />
              <p className="text-sm text-gray-500">Loading vendor products...</p>
            </div>
          ) : error ? (
            <div className="p-12 text-center">
              <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-4" />
              <p className="text-sm text-red-600">Error loading vendor products. Please try again.</p>
            </div>
          ) : !inboxData?.items.length ? (
            <div className="p-12 text-center">
              <Package className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-sm text-gray-500">No vendor products found.</p>
              <p className="text-xs text-gray-400 mt-1">Try adjusting your search or filters</p>
            </div>
          ) : (
            <>
              <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    checked={inboxData.items.filter(item => item.decision !== 'imported').length > 0 && selectedProducts.length === inboxData.items.filter(item => item.decision !== 'imported').length}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                  />
                  <span className="ml-3 text-sm font-medium text-gray-900">Select All Available Products</span>
                  <span className="ml-2 text-xs text-gray-500">({inboxData.items.filter(item => item.decision !== 'imported').length} available of {inboxData.items.length} total)</span>
                </div>
              </div>
              <div className="divide-y divide-gray-200">
                {inboxData.items.map((item) => {
                  const isSelected = selectedProducts.includes(item.shopify_product_id)
                  return (
                    <div
                      key={item.shopify_product_id}
                      className={`px-6 py-4 transition-colors ${
                        isSelected ? 'bg-indigo-50 border-l-4 border-indigo-500' : 'hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                          checked={isSelected}
                          disabled={item.decision === 'imported'}
                          onChange={(e) => handleSelectProduct(item.shopify_product_id, e.target.checked)}
                        />
                        <div className="ml-4 flex-shrink-0">
                          {item.image_src ? (
                            <img
                              className="h-16 w-16 rounded-lg object-cover border border-gray-200"
                              src={item.image_src}
                              alt={item.title}
                            />
                          ) : (
                            <div className="h-16 w-16 rounded-lg bg-gray-100 flex items-center justify-center border border-gray-200">
                              <ImageIcon className="h-6 w-6 text-gray-400" />
                            </div>
                          )}
                        </div>
                        <div className="ml-4 flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <h3 className="text-sm font-semibold text-gray-900 truncate mb-1">
                                {item.title}
                              </h3>
                              <div className="flex items-center space-x-3 mb-2">
                                {item.category && (
                                  <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-800">
                                    <ShoppingCart className="h-3 w-3 mr-1" />
                                    {item.category}
                                  </span>
                                )}
                                {getStatusBadge(item.status)}
                                {getDecisionBadge(item.decision)}
                                {/* Duplicate detection indicator */}
                                {item.decision === 'imported' && (
                                  <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-red-100 text-red-800 border border-red-200">
                                    <XCircle className="h-3 w-3 mr-1" />
                                    Already Imported
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center space-x-4 text-xs text-gray-500">
                                <span className="flex items-center">
                                  <Layers className="h-3 w-3 mr-1" />
                                  {item.variants} variant{item.variants !== 1 ? 's' : ''}
                                </span>
                                <span>ID: {item.shopify_product_id}</span>
                                <span>{formatDate(item.created_at)}</span>
                              </div>
                            </div>
                            <div className="flex items-center space-x-6 text-sm text-gray-500 ml-4">
                              <div className="text-right">
                                <p className="font-semibold text-gray-900">
                                  {item.price ? formatPrice(item.price) : 'No Price'}
                                </p>
                                <p className="text-xs text-gray-500">Price</p>
                              </div>
                              <div className="text-right">
                                <p className="font-semibold text-gray-900">
                                  {item.inventory ?? 'N/A'}
                                </p>
                                <p className="text-xs text-gray-500">Stock</p>
                              </div>
                              <div className="text-right">
                                <p className="font-semibold text-gray-900">{item.variants}</p>
                                <p className="text-xs text-gray-500">Variants</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
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
                  of <span className="font-medium">{inboxData.total}</span> results
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
                  {[...Array(Math.min(inboxData.totalPages, 7))].map((_, i) => {
                    let page
                    if (inboxData.totalPages <= 7) {
                      page = i + 1
                    } else {
                      if (pagination.page <= 4) {
                        page = i + 1
                      } else if (pagination.page >= inboxData.totalPages - 3) {
                        page = inboxData.totalPages - 6 + i
                      } else {
                        page = pagination.page - 3 + i
                      }
                    }
                    
                    return (
                      <button
                        key={page}
                        onClick={() => handlePageChange(page)}
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                          page === pagination.page
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
      </div>

      {/* Import Preview Modal */}
      {showImportPreview && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center p-4 z-60">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-gray-200 flex-shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Eye className="h-5 w-5 text-indigo-600 mr-2" />
                  <h3 className="text-lg font-semibold text-gray-900">Import Preview</h3>
                </div>
                <button
                  onClick={() => setShowImportPreview(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
            
            <div className="flex-1 overflow-hidden flex flex-col">
              <div className="px-6 py-4 flex-shrink-0">
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="text-center p-3 bg-indigo-50 rounded-lg">
                    <p className="text-2xl font-bold text-indigo-600">{totalEstimatedData.products}</p>
                    <p className="text-sm text-gray-600">Products</p>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <p className="text-2xl font-bold text-green-600">{totalEstimatedData.variants}</p>
                    <p className="text-sm text-gray-600">Variants</p>
                  </div>
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <p className="text-2xl font-bold text-blue-600">{totalEstimatedData.images}</p>
                    <p className="text-sm text-gray-600">Images</p>
                  </div>
                </div>
              </div>
              
              <div className="flex-1 overflow-hidden px-6">
                <div className="h-full overflow-y-auto border border-gray-200 rounded-lg">
                  <div className="divide-y divide-gray-200">
                    {getImportPreviewData().map((item) => (
                      <div key={item.productId} className="px-4 py-3 hover:bg-gray-50">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900 truncate">{item.title}</p>
                            <p className="text-xs text-gray-500">
                              {item.category} • {item.variants} variants • {item.images} images
                            </p>
                          </div>
                          <div className="text-sm font-medium text-gray-900">
                            {item.price ? formatPrice(item.price) : 'No Price'}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Fixed Footer with Import Button - Always Visible */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex-shrink-0">
              <div className="flex flex-col space-y-3">
                <p className="text-sm text-gray-600">
                  This will import all selected products with their variants and images into your inventory.
                </p>
                <div className="flex justify-between items-center">
                  <div className="text-xs text-gray-500">
                    {totalEstimatedData.products} products • {totalEstimatedData.variants} variants • {totalEstimatedData.images} images
                  </div>
                  <div className="flex space-x-3">
                    <button
                      onClick={() => setShowImportPreview(false)}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleConfirmImport}
                      className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors shadow-sm"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Import {totalEstimatedData.products} Product{totalEstimatedData.products !== 1 ? 's' : ''}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Inventory Refresh Confirmation Modal */}
      {showInventoryModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center p-4 z-60">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Database className="h-5 w-5 text-emerald-600 mr-2" />
                  <h3 className="text-lg font-semibold text-gray-900">Refresh Inventory</h3>
                </div>
                <button
                  onClick={() => setShowInventoryModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
            
            <div className="px-6 py-4">
              <div className="mb-4">
                <div className="flex items-center p-4 bg-emerald-50 rounded-lg mb-4">
                  <TrendingUp className="h-8 w-8 text-emerald-600 mr-3" />
                  <div>
                    <h4 className="text-sm font-medium text-emerald-900">
                      {inventoryRefreshType === 'all' ? 'Refresh All Inventory' : 'Refresh Selected Products'}
                    </h4>
                    <p className="text-sm text-emerald-700">
                      {inventoryRefreshType === 'all' 
                        ? `This will refresh inventory levels for all ${inboxData?.total || 0} vendor products.`
                        : `This will refresh inventory levels for ${selectedProducts.length} selected products.`
                      }
                    </p>
                  </div>
                </div>
                
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <div className="flex items-start">
                    <AlertCircle className="h-5 w-5 text-yellow-600 mr-2 mt-0.5" />
                    <div>
                      <h5 className="text-sm font-medium text-yellow-800">Important Notes:</h5>
                      <ul className="text-sm text-yellow-700 mt-1 space-y-1">
                        <li>• This process may take several minutes to complete</li>
                        <li>• Inventory levels will be updated from the vendor's Shopify store</li>
                        <li>• You can continue using the application during the refresh</li>
                        {inventoryRefreshType === 'all' && (
                          <li>• Rate limiting may slow down the process for large catalogs</li>
                        )}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
              
              {syncStatus?.data?.lastSync && (
                <div className="text-xs text-gray-500 mb-4">
                  <Clock className="h-3 w-3 inline mr-1" />
                  Last inventory sync: {formatDate(syncStatus.data.lastSync)}
                </div>
              )}
            </div>
            
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
              <div className="text-sm text-gray-600">
                {inventoryRefreshType === 'all' ? 'All vendor products' : `${selectedProducts.length} selected products`} will be updated.
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowInventoryModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmInventoryRefresh}
                  disabled={inventoryRefreshMutation.isPending}
                  className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-emerald-600 border border-transparent rounded-md hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50"
                >
                  {inventoryRefreshMutation.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <CheckSquare className="h-4 w-4 mr-2" />
                  )}
                  Start Refresh
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Keyboard Shortcuts Help */}
      <div className="fixed bottom-4 right-4 text-xs text-gray-500 bg-white p-2 rounded-lg shadow border border-gray-200">
        <p>Shortcuts: Space to deselect • Enter to import selected</p>
      </div>
    </div>
  )
}

export default EnhancedVendorInbox