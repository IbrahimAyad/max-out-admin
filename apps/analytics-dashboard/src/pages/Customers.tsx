import React, { useState } from 'react'
import { useCustomers } from '../hooks/useData'
import { 
  Search, 
  Users, 
  Mail, 
  Phone, 
  MapPin,
  Calendar,
  ShoppingBag,
  Eye,
  Edit,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'

export default function Customers() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState('created_at')
  const limit = 20

  const { data, isLoading, error } = useCustomers(page, limit, search, sortBy)

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
  }

  const sortOptions = [
    { value: 'created_at', label: 'Recently Added' },
    { value: 'last_order_date', label: 'Recent Orders' },
    { value: 'total_spent', label: 'Total Spent' },
    { value: 'name', label: 'Name (A-Z)' }
  ]

  if (isLoading) {
    return (
      <div className="space-y-6 pb-safe">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Customers</h2>
            <p className="text-sm text-gray-500">Manage your customer relationships</p>
          </div>
        </div>
        
        {/* Loading skeleton */}
        <div className="space-y-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="animate-pulse">
                <div className="flex items-center space-x-4">
                  <div className="h-12 w-12 bg-gray-200 rounded-full"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/6"></div>
                  </div>
                  <div className="h-4 bg-gray-200 rounded w-1/8"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6 pb-safe">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">Failed to load customers. Please try again.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-safe">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Customers</h2>
          <p className="text-sm text-gray-500">
            Manage your customer relationships
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-500">
            {data?.total || 0} total customers
          </span>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search customers..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-black text-base"
                style={{ fontSize: '16px' }}
              />
            </div>
          </div>
          
          {/* Sort */}
          <div className="sm:w-48">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-black text-base"
              style={{ fontSize: '16px' }}
            >
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Customers List */}
      <div className="space-y-4">
        {data?.customers.map((customer: any) => (
          <CustomerCard key={customer.id} customer={customer} />
        ))}
        
        {(!data?.customers || data.customers.length === 0) && (
          <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-500 mb-1">No customers found</p>
            <p className="text-sm text-gray-400">
              {search ? 'Try adjusting your search' : 'Customers will appear here when they place orders'}
            </p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {data?.total && data.total > limit && (
        <div className="flex items-center justify-between bg-white px-4 py-3 border border-gray-200 rounded-lg">
          <div className="flex justify-between flex-1 sm:hidden">
            <button
              onClick={() => setPage(page - 1)}
              disabled={page === 1}
              className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 touch-manipulation"
            >
              Previous
            </button>
            <button
              onClick={() => setPage(page + 1)}
              disabled={!data.hasMore}
              className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 touch-manipulation"
            >
              Next
            </button>
          </div>
          <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Showing <span className="font-medium">{(page - 1) * limit + 1}</span> to{' '}
                <span className="font-medium">
                  {Math.min(page * limit, data.total)}
                </span>{' '}
                of <span className="font-medium">{data.total}</span> results
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                <button
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 touch-manipulation"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  onClick={() => setPage(page + 1)}
                  disabled={!data.hasMore}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 touch-manipulation"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Customer Card Component
function CustomerCard({ customer }: { customer: any }) {
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n.charAt(0))
      .slice(0, 2)
      .join('')
      .toUpperCase()
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-sm font-medium text-blue-600">
                {getInitials(customer.name || customer.email || 'Guest')}
              </span>
            </div>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-900">
              {customer.name || 'Guest Customer'}
            </h3>
            <div className="flex items-center space-x-3 mt-1">
              {customer.email && (
                <div className="flex items-center space-x-1">
                  <Mail className="h-3 w-3 text-gray-400" />
                  <span className="text-xs text-gray-500">{customer.email}</span>
                </div>
              )}
              {customer.phone && (
                <div className="flex items-center space-x-1">
                  <Phone className="h-3 w-3 text-gray-400" />
                  <span className="text-xs text-gray-500">{customer.phone}</span>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm font-semibold text-gray-900">
            {formatCurrency(customer.total_spent || 0)}
          </p>
          <p className="text-xs text-gray-500">
            Total spent
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-3">
        <div className="text-center">
          <div className="flex items-center justify-center space-x-1">
            <ShoppingBag className="h-3 w-3 text-gray-400" />
            <span className="text-sm font-medium text-gray-900">
              {customer.orders_count || 0}
            </span>
          </div>
          <p className="text-xs text-gray-500">Orders</p>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center space-x-1">
            <Calendar className="h-3 w-3 text-gray-400" />
            <span className="text-sm font-medium text-gray-900">
              {customer.last_order_date ? formatDate(customer.last_order_date) : 'Never'}
            </span>
          </div>
          <p className="text-xs text-gray-500">Last Order</p>
        </div>
        <div className="text-center sm:col-span-2">
          {customer.address && (
            <div className="flex items-center justify-center space-x-1">
              <MapPin className="h-3 w-3 text-gray-400" />
              <span className="text-xs text-gray-500 truncate">
                {customer.city}, {customer.state}
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
        <span className="text-xs text-gray-500">
          Customer since {formatDate(customer.created_at)}
        </span>
        <div className="flex items-center space-x-2">
          <button className="inline-flex items-center px-2 py-1 border border-gray-300 rounded text-xs text-gray-700 hover:bg-gray-50 touch-manipulation">
            <Eye className="h-3 w-3 mr-1" />
            View
          </button>
          <button className="inline-flex items-center px-2 py-1 border border-gray-300 rounded text-xs text-gray-700 hover:bg-gray-50 touch-manipulation">
            <Edit className="h-3 w-3 mr-1" />
            Edit
          </button>
        </div>
      </div>
    </div>
  )
}