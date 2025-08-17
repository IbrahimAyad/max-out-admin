import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import toast from 'react-hot-toast'

// Dashboard Analytics
export function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0]
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

      // Get today's orders
      const { data: todayOrders, error: todayError } = await supabase
        .from('orders')
        .select('total_amount')
        .gte('created_at', today)
        .eq('status', 'completed')

      if (todayError) throw todayError

      // Get yesterday's orders for comparison
      const { data: yesterdayOrders, error: yesterdayError } = await supabase
        .from('orders')
        .select('total_amount')
        .gte('created_at', yesterday)
        .lt('created_at', today)
        .eq('status', 'completed')

      if (yesterdayError) throw yesterdayError

      // Get total orders count
      const { count: totalOrders, error: ordersError } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })

      if (ordersError) throw ordersError

      // Get total customers count
      const { count: totalCustomers, error: customersError } = await supabase
        .from('customers')
        .select('*', { count: 'exact', head: true })

      if (customersError) throw customersError

      // Get total products count
      const { count: totalProducts, error: productsError } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })

      if (productsError) throw productsError

      // Get recent orders
      const { data: recentOrders, error: recentError } = await supabase
        .from('orders')
        .select('id, order_number, customer_email, total_amount, status, created_at')
        .order('created_at', { ascending: false })
        .limit(5)

      if (recentError) throw recentError

      // Get low stock products
      const { data: lowStockProducts, error: stockError } = await supabase
        .from('product_variants')
        .select('id, sku, product_id, inventory_quantity, products(name)')
        .lt('inventory_quantity', 10)
        .order('inventory_quantity', { ascending: true })
        .limit(5)

      if (stockError) throw stockError

      // Calculate revenue
      const todayRevenue = todayOrders?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0
      const yesterdayRevenue = yesterdayOrders?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0
      const revenueChange = yesterdayRevenue > 0 ? ((todayRevenue - yesterdayRevenue) / yesterdayRevenue) * 100 : 0

      return {
        todayRevenue,
        revenueChange,
        totalOrders: totalOrders || 0,
        totalCustomers: totalCustomers || 0,
        totalProducts: totalProducts || 0,
        recentOrders: recentOrders || [],
        lowStockProducts: lowStockProducts || []
      }
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  })
}

// Products
export function useProducts(page = 1, limit = 20, search = '', category = '') {
  return useQuery({
    queryKey: ['products', page, limit, search, category],
    queryFn: async () => {
      let query = supabase
        .from('products')
        .select('*, product_variants(count)')
        .range((page - 1) * limit, page * limit - 1)
        .order('created_at', { ascending: false })

      if (search) {
        query = query.ilike('name', `%${search}%`)
      }

      if (category) {
        query = query.eq('category', category)
      }

      const { data, error, count } = await query

      if (error) throw error

      return {
        products: data || [],
        total: count || 0,
        hasMore: (count || 0) > page * limit
      }
    },
  })
}

export function useProduct(productId: string) {
  return useQuery({
    queryKey: ['product', productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*, product_variants(*)')
        .eq('id', productId)
        .maybeSingle()

      if (error) throw error
      return data
    },
    enabled: !!productId,
  })
}

// Orders
export function useOrders(page = 1, limit = 20, status = '', search = '') {
  return useQuery({
    queryKey: ['orders', page, limit, status, search],
    queryFn: async () => {
      let query = supabase
        .from('orders')
        .select('*')
        .range((page - 1) * limit, page * limit - 1)
        .order('created_at', { ascending: false })

      if (status) {
        query = query.eq('status', status)
      }

      if (search) {
        query = query.or(`order_number.ilike.%${search}%,customer_email.ilike.%${search}%`)
      }

      const { data, error, count } = await query

      if (error) throw error

      return {
        orders: data || [],
        total: count || 0,
        hasMore: (count || 0) > page * limit
      }
    },
  })
}

export function useOrder(orderId: string) {
  return useQuery({
    queryKey: ['order', orderId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .maybeSingle()

      if (error) throw error

      // Get order items
      const { data: orderItems, error: itemsError } = await supabase
        .from('order_items')
        .select('*')
        .eq('order_id', orderId)

      if (itemsError) throw itemsError

      return {
        ...data,
        items: orderItems || []
      }
    },
    enabled: !!orderId,
  })
}

// Customers
export function useCustomers(page = 1, limit = 20, search = '') {
  return useQuery({
    queryKey: ['customers', page, limit, search],
    queryFn: async () => {
      let query = supabase
        .from('customers')
        .select('*')
        .range((page - 1) * limit, page * limit - 1)
        .order('created_at', { ascending: false })

      if (search) {
        query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%`)
      }

      const { data, error, count } = await query

      if (error) throw error

      return {
        customers: data || [],
        total: count || 0,
        hasMore: (count || 0) > page * limit
      }
    },
  })
}

export function useCustomer(customerId: string) {
  return useQuery({
    queryKey: ['customer', customerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('id', customerId)
        .maybeSingle()

      if (error) throw error

      // Get customer orders
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .eq('customer_email', data?.email)
        .order('created_at', { ascending: false })

      if (ordersError) throw ordersError

      return {
        ...data,
        orders: orders || []
      }
    },
    enabled: !!customerId,
  })
}

// Mutations
export function useUpdateOrderStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ orderId, status }: { orderId: string; status: string }) => {
      const { data, error } = await supabase
        .from('orders')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', orderId)
        .select()
        .maybeSingle()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
      toast.success('Order status updated successfully')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update order status')
    },
  })
}