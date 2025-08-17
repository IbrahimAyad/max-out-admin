import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { OrdersTable } from './OrdersTable'
import { OrderDetails } from './OrderDetails'
import { DashboardStats } from './DashboardStats'
import { OrderFilters } from './OrderFilters'
import { LoadingSpinner } from './LoadingSpinner'
import toast from 'react-hot-toast'
import type { Order, OrderFilters as OrderFiltersType } from '../types/order'

interface OrderManagementDashboardProps {
  user: any
}

export function OrderManagementDashboard({ user }: OrderManagementDashboardProps) {
  const [orders, setOrders] = useState<Order[]>([])
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [filters, setFilters] = useState<OrderFiltersType>({
    status: '',
    priority: '',
    dateRange: '',
    searchTerm: ''
  })

  // Fetch orders
  const fetchOrders = async () => {
    try {
      setLoading(true)
      
      let query = supabase
        .from('orders')
        .select(`
          id,
          order_number,
          customer_email,
          customer_name,
          customer_phone,
          status,
          order_priority,
          subtotal,
          tax_amount,
          shipping_amount,
          discount_amount,
          total_amount,
          currency,
          stripe_payment_intent_id,
          payment_method,
          payment_status,
          shipping_first_name,
          shipping_last_name,
          shipping_address_line_1,
          shipping_address_line_2,
          shipping_city,
          shipping_state,
          shipping_postal_code,
          shipping_country,
          estimated_delivery_date,
          actual_delivery_date,
          tracking_number,
          shipping_carrier,
          shipping_rate_id,
          shipping_label_url,
          tracking_status,
          carrier,
          service_type,
          shipping_cost,
          easypost_shipment_id,
          shipping_address,
          from_address,
          is_rush_order,
          is_group_order,
          special_instructions,
          internal_notes,
          created_at,
          updated_at,
          processed_at,
          shipped_at,
          delivered_at
        `)
        .order('created_at', { ascending: false })
      
      // Apply filters
      if (filters.status) {
        query = query.eq('status', filters.status)
      }
      
      if (filters.priority) {
        query = query.eq('order_priority', filters.priority)
      }
      
      if (filters.searchTerm) {
        query = query.or(`order_number.ilike.%${filters.searchTerm}%,customer_email.ilike.%${filters.searchTerm}%,customer_name.ilike.%${filters.searchTerm}%`)
      }
      
      if (filters.dateRange) {
        const now = new Date()
        let startDate = new Date()
        
        switch (filters.dateRange) {
          case 'today':
            startDate.setHours(0, 0, 0, 0)
            break
          case 'week':
            startDate.setDate(now.getDate() - 7)
            break
          case 'month':
            startDate.setMonth(now.getMonth() - 1)
            break
        }
        
        query = query.gte('created_at', startDate.toISOString())
      }
      
      const { data, error } = await query
      
      if (error) {
        console.error('Error fetching orders:', error)
        toast.error('Failed to fetch orders')
        return
      }
      
      setOrders(data || [])
    } catch (error) {
      console.error('Error:', error)
      toast.error('An error occurred while fetching orders')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  // Initial load
  useEffect(() => {
    fetchOrders()
  }, [filters])

  // Refresh orders
  const handleRefresh = () => {
    setRefreshing(true)
    fetchOrders()
  }

  // Update order with shipping information from shipping manager
  const handleOrderUpdate = (orderId: string, updates: Partial<Order>) => {
    setOrders(prevOrders => 
      prevOrders.map(order => 
        order.id === orderId ? { ...order, ...updates } : order
      )
    )
    
    // Update selected order if it's the one being updated
    if (selectedOrder?.id === orderId) {
      setSelectedOrder(prev => prev ? { ...prev, ...updates } : null)
    }
  }

  // Update order status
  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId)
      
      if (error) {
        console.error('Error updating order status:', error)
        toast.error('Failed to update order status')
        return
      }
      
      toast.success('Order status updated successfully')
      handleRefresh()
      
      // Update selected order if it's the one being updated
      if (selectedOrder?.id === orderId) {
        setSelectedOrder(prev => prev ? { ...prev, status: newStatus as any } : null)
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('An error occurred while updating order status')
    }
  }

  // Sign out
  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      toast.success('Signed out successfully')
    } catch (error: any) {
      toast.error(error.message || 'Error signing out')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner className="w-12 h-12 mx-auto mb-4" />
          <p className="text-gray-600">Loading orders...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Order Management</h1>
              <p className="text-sm text-gray-600">KCT Menswear Admin Dashboard</p>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                {refreshing ? (
                  <LoadingSpinner className="w-4 h-4 mr-2" />
                ) : (
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                )}
                Refresh
              </button>
              <span className="text-sm text-gray-600">Welcome, {user.email}</span>
              <button
                onClick={handleSignOut}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {selectedOrder ? (
          <OrderDetails
            order={selectedOrder}
            onBack={() => setSelectedOrder(null)}
            onStatusUpdate={updateOrderStatus}
            onOrderUpdate={handleOrderUpdate}
          />
        ) : (
          <>
            {/* Dashboard Stats */}
            <DashboardStats orders={orders} />
            
            {/* Filters */}
            <div className="mb-6">
              <OrderFilters
                filters={filters}
                onFiltersChange={setFilters}
                orderCount={orders.length}
              />
            </div>
            
            {/* Orders Table */}
            <OrdersTable
              orders={orders}
              onOrderSelect={setSelectedOrder}
              onStatusUpdate={updateOrderStatus}
            />
          </>
        )}
      </div>
    </div>
  )
}