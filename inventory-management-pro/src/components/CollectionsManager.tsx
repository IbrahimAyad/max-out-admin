import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import {
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Package,
  Tag,
  TrendingUp,
  Eye,
  MoreHorizontal
} from 'lucide-react'
import { toast } from 'react-hot-toast'
import collections, { SmartCollection } from '../lib/collections'
import analytics from '../lib/analytics'

const CollectionsManager: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedCollection, setSelectedCollection] = useState<SmartCollection | null>(null)
  const queryClient = useQueryClient()

  const { data: collectionsData, isLoading } = useQuery({
    queryKey: ['collections'],
    queryFn: () => collections.getCollections()
  })

  const deleteCollectionMutation = useMutation({
    mutationFn: (id: string) => collections.deleteCollection(id),
    onSuccess: () => {
      toast.success('Collection deleted successfully')
      queryClient.invalidateQueries({ queryKey: ['collections'] })
    },
    onError: (error: any) => {
      toast.error(`Failed to delete collection: ${error.message}`)
    }
  })

  const toggleCollectionMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      collections.updateCollection(id, { is_active: !isActive }),
    onSuccess: () => {
      toast.success('Collection updated successfully')
      queryClient.invalidateQueries({ queryKey: ['collections'] })
    },
    onError: (error: any) => {
      toast.error(`Failed to update collection: ${error.message}`)
    }
  })

  const handleDeleteCollection = (collection: SmartCollection) => {
    if (window.confirm(`Are you sure you want to delete "${collection.name}"? This action cannot be undone.`)) {
      deleteCollectionMutation.mutate(collection.id)
    }
  }

  const handleToggleActive = (collection: SmartCollection) => {
    toggleCollectionMutation.mutate({ id: collection.id, isActive: collection.is_active })
  }

  const handleViewCollection = (collection: SmartCollection) => {
    analytics.trackCollectionView(collection.id, collection.name)
  }

  const filteredCollections = collectionsData?.filter(collection =>
    collection.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    collection.description.toLowerCase().includes(searchTerm.toLowerCase())
  ) || []

  const getCollectionTypeIcon = (type: string) => {
    switch (type) {
      case 'ai_powered':
        return <TrendingUp className="h-5 w-5 text-purple-500" />
      case 'dynamic':
        return <Tag className="h-5 w-5 text-blue-500" />
      case 'manual':
        return <Package className="h-5 w-5 text-green-500" />
      default:
        return <Package className="h-5 w-5 text-gray-500" />
    }
  }

  const getCollectionTypeColor = (type: string) => {
    switch (type) {
      case 'ai_powered':
        return 'bg-purple-100 text-purple-800'
      case 'dynamic':
        return 'bg-blue-100 text-blue-800'
      case 'manual':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-48 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Tag className="h-8 w-8 text-indigo-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Smart Collections</h1>
                <p className="text-sm text-gray-500">Manage your product collections and categories</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Collection
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
              <div className="flex-1 max-w-lg">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search collections..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <span className="text-sm text-gray-500">
                  {filteredCollections.length} collection(s)
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Collections Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCollections.map((collection) => (
            <div
              key={collection.id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    {getCollectionTypeIcon(collection.collection_type)}
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">{collection.name}</h3>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        getCollectionTypeColor(collection.collection_type)
                      }`}>
                        {collection.collection_type.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => handleToggleActive(collection)}
                      className={`w-8 h-4 rounded-full transition-colors ${
                        collection.is_active ? 'bg-green-500' : 'bg-gray-300'
                      }`}
                    >
                      <div className={`w-3 h-3 rounded-full bg-white transition-transform ${
                        collection.is_active ? 'translate-x-4' : 'translate-x-0.5'
                      }`} />
                    </button>
                  </div>
                </div>

                <p className="text-sm text-gray-600 mb-4">{collection.description}</p>

                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-gray-900">{collection.product_count}</p>
                      <p className="text-xs text-gray-500">Products</p>
                    </div>
                  </div>
                  <div className="text-xs text-gray-500">
                    Created {new Date(collection.created_at).toLocaleDateString()}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                  <Link
                    to={`/collections/${collection.id}`}
                    onClick={() => handleViewCollection(collection)}
                    className="inline-flex items-center text-sm text-indigo-600 hover:text-indigo-900"
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    View Products
                  </Link>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setSelectedCollection(collection)}
                      className="text-gray-400 hover:text-gray-600 p-1 rounded hover:bg-gray-50"
                      title="Edit collection"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteCollection(collection)}
                      className="text-gray-400 hover:text-red-600 p-1 rounded hover:bg-gray-50"
                      title="Delete collection"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredCollections.length === 0 && (
          <div className="text-center py-12">
            <Tag className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No collections found</h3>
            <p className="text-gray-500 mb-6">
              {searchTerm ? 'Try adjusting your search terms.' : 'Get started by creating your first collection.'}
            </p>
            {!searchTerm && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Collection
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default CollectionsManager
