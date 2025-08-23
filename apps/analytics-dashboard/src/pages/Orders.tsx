import React, { useState } from 'react'
import { useOrders, useUpdateOrderStatus } from '../hooks/useData'
import { Link } from 'react-router-dom'
import { 
  Search, 
  Filter, 
  Download, 
  Eye, 
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  Calendar,
  DollarSign,
  User,
  Package
} from 'lucide-react'

export default function Orders() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const limit = 20

  const { data, isLoading, error } = useOrders(page, limit, status, search)
  const updateOrderStatus = useUpdateOrderStatus()

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'processing':
        return 'bg-blue-100 text-blue-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      case 'shipped':
        return 'bg-purple-100 text-purple-800'
      default:
        return 'bg-neutral-100 text-neutral-800'
    }
  }

  const statuses = [
    'pending',
    'processing',
    'shipped',
    'completed',
    'cancelled'
  ]

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    try {
      await updateOrderStatus.mutateAsync({ orderId, status: newStatus })
    } catch (error) {
      // Error handling is done in the hook
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-neutral-900">Orders</h2>
            <p className="text-sm text-neutral-500">Manage and track customer orders</p>
          </div>
        </div>
        
        {/* Loading skeleton */}
        <div className="bg-white rounded-lg border border-neutral-200 overflow-hidden">
          <div className="animate-pulse">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="border-b border-neutral-200 p-4">
                <div className="flex items-center space-x-4">
                  <div className="h-4 bg-neutral-200 rounded w-20"></div>
                  <div className="h-4 bg-neutral-200 rounded w-40"></div>
                  <div className="h-4 bg-neutral-200 rounded w-24"></div>
                  <div className="h-4 bg-neutral-200 rounded w-16"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">Failed to load orders. Please try again.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-neutral-900">Orders</h2>
          <p className="text-sm text-neutral-500">
            Manage and track customer orders
          </p>
        </div>
        <button className="inline-flex items-center px-4 py-2 border border-neutral-300 rounded-md shadow-sm text-sm font-medium text-neutral-700 bg-white hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black">
          <Download className="h-4 w-4 mr-2" />
          Export Orders
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white rounded-lg border border-neutral-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Package className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-neutral-500">Total Orders</p>
              <p className="text-2xl font-bold text-neutral-900">
                {data?.total.toLocaleString() || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-neutral-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-neutral-500">Total Revenue</p>
              <p className="text-2xl font-bold text-neutral-900">
                {formatCurrency(
                  data?.orders.reduce((sum: number, order: any) => sum + (order.total_amount || 0), 0) || 0
                )}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-neutral-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Calendar className="h-8 w-8 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-neutral-500">Pending Orders</p>
              <p className="text-2xl font-bold text-neutral-900">
                {data?.orders.filter((order: any) => order.status === 'pending').length || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-neutral-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <User className="h-8 w-8 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-neutral-500">Unique Customers</p>
              <p className="text-2xl font-bold text-neutral-900">
                {new Set(data?.orders.map((order: any) => order.customer_email)).size || 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-neutral-200 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-400" />
              <input
                type="text"
                placeholder="Search orders by number or customer email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
              />
            </div>
          </div>
          
          {/* Status Filter */}
          <div className="sm:w-48">
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
            >
              <option value="">All Statuses</option>
              {statuses.map((stat) => (
                <option key={stat} value={stat}>
                  {stat.charAt(0).toUpperCase() + stat.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-lg border border-neutral-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-neutral-200">
            <thead className="bg-neutral-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Order
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Total
                </th>
                <th className="relative px-6 py-3">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-neutral-200">
              {data?.orders.map((order: any) => (
                <tr key={order.id} className="hover:bg-neutral-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-neutral-900">
                        #{order.order_number}
                      </div>
                      <div className="text-sm text-neutral-500">
                        ID: {order.id.slice(0, 8)}...
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-neutral-900">
                      {order.customer_email}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900">
                    {formatDate(order.created_at)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <select
                      value={order.status}
                      onChange={(e) => handleStatusChange(order.id, e.target.value)}
                      disabled={updateOrderStatus.isPending}
                      className={`text-xs font-medium rounded-full px-2 py-1 border-0 focus:ring-2 focus:ring-black ${
                        getStatusColor(order.status)
                      }`}
                    >
                      {statuses.map((stat) => (
                        <option key={stat} value={stat}>
                          {stat.charAt(0).toUpperCase() + stat.slice(1)}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-neutral-900">
                    {formatCurrency(order.total_amount)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      <Link
                        to={`/orders/${order.id}`}
                        className="inline-flex items-center p-1.5 border border-neutral-300 rounded-md text-neutral-400 hover:text-neutral-500 hover:bg-neutral-50"
                      >
                        <Eye className="h-4 w-4" />
                      </Link>
                      <button className="inline-flex items-center p-1.5 border border-neutral-300 rounded-md text-neutral-400 hover:text-neutral-500 hover:bg-neutral-50">
                        <MoreVertical className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {data?.total && data.total > limit && (
        <div className="flex items-center justify-between bg-white px-4 py-3 border border-neutral-200 rounded-lg">
          <div className="flex justify-between flex-1 sm:hidden">
            <button
              onClick={() => setPage(page - 1)}
              disabled={page === 1}
              className="relative inline-flex items-center px-4 py-2 border border-neutral-300 text-sm font-medium rounded-md text-neutral-700 bg-white hover:bg-neutral-50 disabled:opacity-50"
            >
              Previous
            </button>
            <button
              onClick={() => setPage(page + 1)}
              disabled={!data.hasMore}
              className="ml-3 relative inline-flex items-center px-4 py-2 border border-neutral-300 text-sm font-medium rounded-md text-neutral-700 bg-white hover:bg-neutral-50 disabled:opacity-50"
            >
              Next
            </button>
          </div>
          <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-neutral-700">
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
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-neutral-300 bg-white text-sm font-medium text-neutral-500 hover:bg-neutral-50 disabled:opacity-50"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  onClick={() => setPage(page + 1)}
                  disabled={!data.hasMore}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-neutral-300 bg-white text-sm font-medium text-neutral-500 hover:bg-neutral-50 disabled:opacity-50"
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