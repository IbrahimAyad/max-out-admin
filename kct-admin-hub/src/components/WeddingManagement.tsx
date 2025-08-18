import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { 
  Heart, 
  Users, 
  Calendar, 
  CheckCircle, 
  Clock, 
  AlertTriangle,
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Mail,
  TrendingUp
} from 'lucide-react'
import { weddingAPI } from '../lib/supabase'
import { WeddingDetails } from './WeddingDetails'
import { CreateWeddingModal } from './CreateWeddingModal'

interface Wedding {
  id: string
  wedding_code: string
  wedding_date: string
  venue_name: string
  venue_city: string
  venue_state: string
  guest_count: number
  formality_level: string
  status: string
  completion_percentage: number
  created_at: string
  primary_customer_id?: string
  partner_customer_id?: string
}

export function WeddingManagement() {
  const [selectedWeddingId, setSelectedWeddingId] = useState<string | null>(null)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const queryClient = useQueryClient()

  // Fetch weddings from the real API
  const { data: weddings, isLoading } = useQuery({
    queryKey: ['weddings', statusFilter, searchTerm],
    queryFn: async () => {
      const filters = {
        status: statusFilter === 'all' ? undefined : statusFilter,
        search: searchTerm || undefined,
        limit: 50
      }
      return await weddingAPI.getAllWeddings(filters)
    }
  })

  // Fetch wedding analytics for overview cards
  const { data: analytics } = useQuery({
    queryKey: ['wedding-analytics'],
    queryFn: () => weddingAPI.getWeddingAnalytics()
  })

  const weddingList = weddings?.data || []
  
  const filteredWeddings = weddingList.filter(wedding => {
    const matchesSearch = wedding.wedding_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         wedding.venue_name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || wedding.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      planning: { color: 'bg-blue-100 text-blue-800', label: 'Planning' },
      measurements: { color: 'bg-yellow-100 text-yellow-800', label: 'Measurements' },
      selection: { color: 'bg-purple-100 text-purple-800', label: 'Selection' },
      orders_placed: { color: 'bg-orange-100 text-orange-800', label: 'Orders Placed' },
      production: { color: 'bg-indigo-100 text-indigo-800', label: 'Production' },
      fulfillment: { color: 'bg-teal-100 text-teal-800', label: 'Fulfillment' },
      completed: { color: 'bg-green-100 text-green-800', label: 'Completed' },
      cancelled: { color: 'bg-red-100 text-red-800', label: 'Cancelled' }
    }
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.planning
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${config.color}`}>
        {config.label}
      </span>
    )
  }

  const getFormalityLevel = (level: string) => {
    const levels = {
      black_tie: 'Black Tie',
      formal: 'Formal',
      semi_formal: 'Semi Formal',
      cocktail: 'Cocktail',
      casual: 'Casual'
    }
    return levels[level as keyof typeof levels] || level
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getDaysUntilWedding = (weddingDate: string) => {
    const wedding = new Date(weddingDate)
    const today = new Date()
    const diffTime = wedding.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  if (selectedWeddingId) {
    return (
      <WeddingDetails 
        weddingId={selectedWeddingId}
        onBack={() => setSelectedWeddingId(null)}
      />
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Heart className="w-8 h-8 text-rose-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Wedding Management</h1>
            <p className="text-gray-600">Coordinate wedding party formalwear</p>
          </div>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="bg-black text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-gray-800 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>New Wedding</span>
        </button>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Weddings</p>
              <p className="text-2xl font-bold text-gray-900">{analytics?.data?.active_weddings || 0}</p>
            </div>
            <Calendar className="w-8 h-8 text-blue-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">This Month</p>
              <p className="text-2xl font-bold text-gray-900">{analytics?.data?.this_month || 0}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-green-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending Tasks</p>
              <p className="text-2xl font-bold text-gray-900">{analytics?.data?.pending_tasks || 0}</p>
            </div>
            <Clock className="w-8 h-8 text-orange-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Urgent Issues</p>
              <p className="text-2xl font-bold text-gray-900">{analytics?.data?.urgent_issues || 0}</p>
            </div>
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search by wedding code or venue..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
              />
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-black focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="planning">Planning</option>
              <option value="measurements">Measurements</option>
              <option value="selection">Selection</option>
              <option value="orders_placed">Orders Placed</option>
              <option value="production">Production</option>
              <option value="fulfillment">Fulfillment</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Wedding List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Wedding Coordination</h3>
        </div>
        
        {isLoading ? (
          <div className="p-6">
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center space-x-4 animate-pulse">
                  <div className="w-12 h-12 bg-gray-200 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-1/4" />
                    <div className="h-3 bg-gray-200 rounded w-1/2" />
                  </div>
                  <div className="w-20 h-6 bg-gray-200 rounded" />
                </div>
              ))}
            </div>
          </div>
        ) : filteredWeddings.length === 0 ? (
          <div className="p-6 text-center">
            <Heart className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No weddings found</h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || statusFilter !== 'all' 
                ? 'Try adjusting your search or filters'
                : 'Get started by creating your first wedding coordination'}
            </p>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors"
            >
              Create First Wedding
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredWeddings.map((wedding) => {
              const daysUntil = getDaysUntilWedding(wedding.wedding_date)
              return (
                <div
                  key={wedding.id}
                  className="p-6 hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => setSelectedWeddingId(wedding.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="bg-rose-100 text-rose-600 p-3 rounded-lg">
                        <Heart className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <h4 className="text-lg font-semibold text-gray-900">
                            {wedding.wedding_code}
                          </h4>
                          {getStatusBadge(wedding.status)}
                        </div>
                        <p className="text-gray-600">
                          {wedding.venue_name}, {wedding.venue_city}, {wedding.venue_state}
                        </p>
                        <p className="text-sm text-gray-500">
                          {formatDate(wedding.wedding_date)} • {getFormalityLevel(wedding.formality_level)} • {wedding.guest_count} guests
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">
                          {daysUntil > 0 ? `${daysUntil} days` : daysUntil === 0 ? 'Today' : 'Past'}
                        </p>
                        <p className="text-sm text-gray-500">
                          {wedding.completion_percentage}% complete
                        </p>
                      </div>
                      <div className="w-16">
                        <div className="bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-green-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${wedding.completion_percentage}%` }}
                          />
                        </div>
                      </div>
                      <MoreHorizontal className="w-5 h-5 text-gray-400" />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Create Wedding Modal */}
      <CreateWeddingModal 
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
    </div>
  )
}
