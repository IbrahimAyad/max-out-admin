import { useState, useEffect } from 'react'
import { Sparkles, Plus, Edit, Eye, EyeOff, CheckCircle, XCircle, Filter, Search } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface SmartCollection {
  id: number
  name: string
  description?: string
  criteria: any
  visibility: 'public' | 'private' | 'featured'
  is_active: boolean
  created_at: string
  updated_at: string
  product_count?: number
}

export function SmartCollectionsManager() {
  const [collections, setCollections] = useState<SmartCollection[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [visibilityFilter, setVisibilityFilter] = useState<'all' | 'public' | 'private' | 'featured'>('all')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingCollection, setEditingCollection] = useState<SmartCollection | null>(null)

  useEffect(() => {
    loadCollections()
  }, [])

  const loadCollections = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const { data, error } = await supabase
        .from('smart_collections')
        .select('*')
        .order('updated_at', { ascending: false })

      if (error) throw error

      // Get product counts for each collection
      const collectionsWithCounts = await Promise.all(
        (data || []).map(async (collection) => {
          const { count, error: countError } = await supabase
            .from('collection_products')
            .select('*', { count: 'exact' })
            .eq('collection_id', collection.id)

          if (countError) {
            console.error('Error getting product count:', countError)
          }

          return {
            ...collection,
            product_count: count || 0
          }
        })
      )

      setCollections(collectionsWithCounts)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load collections')
    } finally {
      setLoading(false)
    }
  }

  const toggleCollectionStatus = async (collection: SmartCollection) => {
    try {
      const { error } = await supabase
        .from('smart_collections')
        .update({ is_active: !collection.is_active })
        .eq('id', collection.id)

      if (error) throw error

      setCollections(prev => prev.map(c => 
        c.id === collection.id ? { ...c, is_active: !c.is_active } : c
      ))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update collection status')
    }
  }

  const updateVisibility = async (collection: SmartCollection, newVisibility: string) => {
    try {
      const { error } = await supabase
        .from('smart_collections')
        .update({ visibility: newVisibility })
        .eq('id', collection.id)

      if (error) throw error

      setCollections(prev => prev.map(c => 
        c.id === collection.id ? { ...c, visibility: newVisibility as any } : c
      ))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update collection visibility')
    }
  }

  const filteredCollections = collections.filter(collection => {
    const matchesSearch = searchTerm === '' || 
      collection.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      collection.description?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesVisibility = visibilityFilter === 'all' || collection.visibility === visibilityFilter
    
    return matchesSearch && matchesVisibility
  })

  const getVisibilityColor = (visibility: string) => {
    switch (visibility) {
      case 'public': return 'bg-green-100 text-green-800'
      case 'featured': return 'bg-blue-100 text-blue-800'
      case 'private': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <div className="flex items-center">
          <Sparkles className="h-5 w-5 text-red-400 mr-2" />
          <p className="text-red-800">Error loading collections: {error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center">
            <Sparkles className="h-6 w-6 mr-2 text-purple-600" />
            Smart Collections
          </h2>
          <p className="text-gray-600">AI-powered product collections based on intelligent criteria</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 flex items-center space-x-2"
        >
          <Plus className="h-4 w-4" />
          <span>Create Collection</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          <div className="relative flex-1 lg:max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search collections..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-md w-full focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Visibility:</span>
              <select
                value={visibilityFilter}
                onChange={(e) => setVisibilityFilter(e.target.value as any)}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="all">All</option>
                <option value="public">Public</option>
                <option value="featured">Featured</option>
                <option value="private">Private</option>
              </select>
            </div>
          </div>
        </div>

        <div className="mt-4 text-sm text-gray-600">
          Showing {filteredCollections.length} of {collections.length} collections
        </div>
      </div>

      {/* Collections Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCollections.map((collection) => (
          <div key={collection.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900">{collection.name}</h3>
                  {collection.description && (
                    <p className="text-sm text-gray-600 mt-1">{collection.description}</p>
                  )}
                </div>
                <div className="ml-4">
                  <button
                    onClick={() => toggleCollectionStatus(collection)}
                    className={`p-2 rounded-full transition-colors ${
                      collection.is_active 
                        ? 'text-green-600 hover:bg-green-100' 
                        : 'text-gray-400 hover:bg-gray-100'
                    }`}
                    title={collection.is_active ? 'Deactivate' : 'Activate'}
                  >
                    {collection.is_active ? <CheckCircle className="h-5 w-5" /> : <XCircle className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              {/* Visibility Badge */}
              <div className="flex items-center justify-between mb-4">
                <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getVisibilityColor(collection.visibility)}`}>
                  {collection.visibility.charAt(0).toUpperCase() + collection.visibility.slice(1)}
                </span>
                <span className="text-sm text-gray-600">{collection.product_count} products</span>
              </div>

              {/* Criteria Preview */}
              {collection.criteria && (
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Criteria:</h4>
                  <div className="bg-gray-50 rounded-lg p-3 text-xs">
                    <pre className="whitespace-pre-wrap text-gray-600">
                      {JSON.stringify(collection.criteria, null, 2).substring(0, 150)}...
                    </pre>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center space-x-2">
                <select
                  value={collection.visibility}
                  onChange={(e) => updateVisibility(collection, e.target.value)}
                  className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="private">Private</option>
                  <option value="public">Public</option>
                  <option value="featured">Featured</option>
                </select>
                <button
                  onClick={() => setEditingCollection(collection)}
                  className="px-3 py-2 bg-gray-50 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-100 flex items-center"
                >
                  <Edit className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>Created {new Date(collection.created_at).toLocaleDateString()}</span>
                <span>Updated {new Date(collection.updated_at).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredCollections.length === 0 && (
        <div className="text-center py-12">
          <Sparkles className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No collections found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchTerm || visibilityFilter !== 'all' 
              ? 'Try adjusting your search or filters.' 
              : 'Get started by creating your first smart collection.'}
          </p>
        </div>
      )}
    </div>
  )
}