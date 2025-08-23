import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'

// Dashboard Stats Hook
export function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      try {
        // Get current period data
        const now = new Date()
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000)

        // Get current period orders
        const { data: currentOrders, error: currentOrdersError } = await supabase
          .from('orders')
          .select('total_amount, customer_id, created_at')
          .gte('created_at', thirtyDaysAgo.toISOString())
          .eq('status', 'completed')

        if (currentOrdersError) throw currentOrdersError

        // Get previous period orders for comparison
        const { data: previousOrders, error: previousOrdersError } = await supabase
          .from('orders')
          .select('total_amount, customer_id')
          .gte('created_at', sixtyDaysAgo.toISOString())
          .lt('created_at', thirtyDaysAgo.toISOString())
          .eq('status', 'completed')

        if (previousOrdersError) throw previousOrdersError

        // Calculate current metrics
        const revenue = currentOrders?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0
        const orders = currentOrders?.length || 0
        const customers = new Set(currentOrders?.map(order => order.customer_id)).size

        // Calculate previous metrics
        const prevRevenue = previousOrders?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0
        const prevOrders = previousOrders?.length || 0
        const prevCustomers = new Set(previousOrders?.map(order => order.customer_id)).size

        // Calculate percentage changes
        const revenueChange = prevRevenue > 0 ? ((revenue - prevRevenue) / prevRevenue) * 100 : 0
        const ordersChange = prevOrders > 0 ? ((orders - prevOrders) / prevOrders) * 100 : 0
        const customersChange = prevCustomers > 0 ? ((customers - prevCustomers) / prevCustomers) * 100 : 0

        // Get total products count
        const { count: totalProducts, error: productsError } = await supabase
          .from('enhanced_product_variants')
          .select('*', { count: 'exact', head: true })

        if (productsError) throw productsError

        // Get products from previous period for comparison
        const { count: prevProducts } = await supabase
          .from('enhanced_product_variants')
          .select('*', { count: 'exact', head: true })
          .lt('created_at', thirtyDaysAgo.toISOString())

        const products = totalProducts || 0
        const productsChange = prevProducts ? ((products - prevProducts) / prevProducts) * 100 : 0

        // Mock alerts and recent activity
        const alerts = [
          {
            id: '1',
            title: 'Low Inventory Alert',
            description: '5 products are running low on stock',
            type: 'warning' as const,
            created_at: new Date().toISOString()
          },
          {
            id: '2',
            title: 'High Order Volume',
            description: 'Orders increased by 25% this week',
            type: 'info' as const,
            created_at: new Date().toISOString()
          }
        ]

        const recentActivity = [
          {
            id: '1',
            description: 'New order #12345 received',
            timestamp: '2 minutes ago',
            type: 'order'
          },
          {
            id: '2',
            description: 'Product "Classic Navy Suit" updated',
            timestamp: '15 minutes ago',
            type: 'product'
          },
          {
            id: '3',
            description: 'Customer John Doe registered',
            timestamp: '1 hour ago',
            type: 'customer'
          }
        ]

        return {
          revenue,
          revenueChange,
          orders,
          ordersChange,
          customers,
          customersChange,
          products,
          productsChange,
          alerts,
          recentActivity
        }
      } catch (error) {
        console.error('Error fetching dashboard stats:', error)
        throw error
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false
  })
}

// Products Hook using enhanced_product_variants
export function useProducts(
  page = 1, 
  limit = 20, 
  search = '', 
  category = '', 
  status = '', 
  sortBy = 'created_at'
) {
  return useQuery({
    queryKey: ['products', page, limit, search, category, status, sortBy],
    queryFn: async () => {
      try {
        let query = supabase
          .from('enhanced_product_variants')
          .select(`
            id,
            name,
            category,
            sku,
            base_price,
            status,
            images,
            created_at,
            updated_at,
            size,
            color,
            inventory_quantity
          `, { count: 'exact' })

        // Apply search filter
        if (search) {
          query = query.or(`name.ilike.%${search}%,sku.ilike.%${search}%`)
        }

        // Apply category filter
        if (category) {
          query = query.eq('category', category)
        }

        // Apply status filter
        if (status) {
          query = query.eq('status', status)
        }

        // Apply sorting
        const sortDirection = sortBy.startsWith('-') ? 'desc' : 'asc'
        const sortField = sortBy.replace('-', '')
        query = query.order(sortField, { ascending: sortDirection === 'asc' })

        // Apply pagination
        const from = (page - 1) * limit
        const to = from + limit - 1
        query = query.range(from, to)

        const { data, error, count } = await query

        if (error) throw error

        // Group variants by product name and aggregate data
        const productMap = new Map()
        
        data?.forEach((variant) => {
          const productKey = variant.name
          const existing = productMap.get(productKey)
          
          if (existing) {
            // Aggregate inventory
            existing.total_inventory = (existing.total_inventory || 0) + (variant.inventory_quantity || 0)
            // Add variant to list
            existing.variants = existing.variants || []
            existing.variants.push(variant)
          } else {
            // Create new product entry
            productMap.set(productKey, {
              id: variant.id,
              name: variant.name,
              category: variant.category,
              sku: variant.sku,
              base_price: variant.base_price,
              status: variant.status,
              images: variant.images,
              created_at: variant.created_at,
              updated_at: variant.updated_at,
              total_inventory: variant.inventory_quantity || 0,
              variants: [variant]
            })
          }
        })

        const products = Array.from(productMap.values())

        return {
          products,
          total: count || 0,
          hasMore: (count || 0) > page * limit
        }
      } catch (error) {
        console.error('Error fetching products:', error)
        throw error
      }
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchOnWindowFocus: false
  })
}

// Orders Hook
export function useOrders(
  page = 1, 
  limit = 20, 
  search = '', 
  status = '', 
  dateRange = '', 
  sortBy = 'created_at'
) {
  return useQuery({
    queryKey: ['orders', page, limit, search, status, dateRange, sortBy],
    queryFn: async () => {
      try {
        let query = supabase
          .from('orders')
          .select(`
            id,
            order_number,
            total_amount,
            status,
            customer_name,
            customer_email,
            customer_id,
            payment_method,
            shipping_method,
            tracking_number,
            items_count,
            created_at,
            updated_at
          `, { count: 'exact' })

        // Apply search filter
        if (search) {
          query = query.or(`customer_name.ilike.%${search}%,customer_email.ilike.%${search}%,order_number.ilike.%${search}%,id.ilike.%${search}%`)
        }

        // Apply status filter
        if (status) {
          query = query.eq('status', status)
        }

        // Apply date range filter
        if (dateRange) {
          const now = new Date()
          let startDate: Date
          
          switch (dateRange) {
            case 'today':
              startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
              break
            case 'week':
              startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
              break
            case 'month':
              startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
              break
            case 'quarter':
              startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
              break
            case 'year':
              startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
              break
            default:
              startDate = new Date(0)
          }
          
          query = query.gte('created_at', startDate.toISOString())
        }

        // Apply sorting
        const sortDirection = sortBy.startsWith('-') ? 'desc' : 'asc'
        const sortField = sortBy.replace('-', '')
        query = query.order(sortField, { ascending: sortDirection === 'asc' })

        // Apply pagination
        const from = (page - 1) * limit
        const to = from + limit - 1
        query = query.range(from, to)

        const { data, error, count } = await query

        if (error) throw error

        // Get status counts for the stats
        const { data: allOrders } = await supabase
          .from('orders')
          .select('status')
        
        const statusCounts = (allOrders || []).reduce((acc: any, order) => {
          acc[order.status] = (acc[order.status] || 0) + 1
          return acc
        }, {})

        return {
          orders: data || [],
          total: count || 0,
          hasMore: (count || 0) > page * limit,
          statusCounts
        }
      } catch (error) {
        console.error('Error fetching orders:', error)
        throw error
      }
    },
    staleTime: 1 * 60 * 1000, // 1 minute
    refetchOnWindowFocus: false
  })
}

// Recent Orders Hook
export function useRecentOrders(limit = 5) {
  return useQuery({
    queryKey: ['recent-orders', limit],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('orders')
          .select(`
            id,
            total_amount,
            status,
            customer_name,
            customer_email,
            created_at
          `)
          .order('created_at', { ascending: false })
          .limit(limit)

        if (error) throw error

        return data || []
      } catch (error) {
        console.error('Error fetching recent orders:', error)
        throw error
      }
    },
    staleTime: 1 * 60 * 1000, // 1 minute
    refetchOnWindowFocus: false
  })
}

// Customers Hook
export function useCustomers(page = 1, limit = 20, search = '', sortBy = 'created_at') {
  return useQuery({
    queryKey: ['customers', page, limit, search, sortBy],
    queryFn: async () => {
      try {
        let query = supabase
          .from('customers')
          .select(`
            id,
            name,
            email,
            phone,
            address,
            city,
            state,
            total_spent,
            orders_count,
            last_order_date,
            created_at,
            updated_at
          `)

        // Apply search filter
        if (search) {
          query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`)
        }

        // Apply sorting
        const ascending = sortBy === 'name'
        query = query.order(sortBy, { ascending })

        // Apply pagination
        const from = (page - 1) * limit
        const to = from + limit - 1
        query = query.range(from, to)

        const { data, error, count } = await query

        if (error) throw error

        return {
          customers: data || [],
          total: count || 0,
          hasMore: (count || 0) > page * limit
        }
      } catch (error) {
        console.error('Error fetching customers:', error)
        throw error
      }
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchOnWindowFocus: false
  })
}

// Reports Hook
export function useReports(dateRange = 'month', reportType = 'sales') {
  return useQuery({
    queryKey: ['reports', dateRange, reportType],
    queryFn: async () => {
      try {
        const now = new Date()
        let startDate: Date
        
        switch (dateRange) {
          case 'week':
            startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
            break
          case 'month':
            startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
            break
          case 'quarter':
            startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
            break
          case 'year':
            startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
            break
          default:
            startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        }

        // Get orders data for the period
        const { data: orders, error: ordersError } = await supabase
          .from('orders')
          .select('total_amount, created_at, customer_id, status')
          .gte('created_at', startDate.toISOString())

        if (ordersError) throw ordersError

        const completedOrders = orders?.filter(order => order.status === 'completed') || []
        const totalRevenue = completedOrders.reduce((sum, order) => sum + order.total_amount, 0)
        const totalOrders = completedOrders.length
        const uniqueCustomers = new Set(completedOrders.map(order => order.customer_id)).size
        const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0

        // Get previous period for comparison
        const periodLength = now.getTime() - startDate.getTime()
        const prevStartDate = new Date(startDate.getTime() - periodLength)
        const { data: prevOrders } = await supabase
          .from('orders')
          .select('total_amount, customer_id, status')
          .gte('created_at', prevStartDate.toISOString())
          .lt('created_at', startDate.toISOString())

        const prevCompletedOrders = prevOrders?.filter(order => order.status === 'completed') || []
        const prevRevenue = prevCompletedOrders.reduce((sum, order) => sum + order.total_amount, 0)
        const prevOrdersCount = prevCompletedOrders.length
        const prevCustomers = new Set(prevCompletedOrders.map(order => order.customer_id)).size
        const prevAov = prevOrdersCount > 0 ? prevRevenue / prevOrdersCount : 0

        const summary = {
          totalRevenue,
          revenueChange: prevRevenue > 0 ? ((totalRevenue - prevRevenue) / prevRevenue) * 100 : 0,
          totalOrders,
          ordersChange: prevOrdersCount > 0 ? ((totalOrders - prevOrdersCount) / prevOrdersCount) * 100 : 0,
          newCustomers: uniqueCustomers,
          customersChange: prevCustomers > 0 ? ((uniqueCustomers - prevCustomers) / prevCustomers) * 100 : 0,
          avgOrderValue,
          aovChange: prevAov > 0 ? ((avgOrderValue - prevAov) / prevAov) * 100 : 0
        }

        // Mock additional report data based on type
        let reportData = {}
        if (reportType === 'sales') {
          reportData = {
            salesData: {
              topProducts: [
                { name: 'Classic Navy Suit', category: 'Suits', quantity: 45, revenue: '$22,500' },
                { name: 'Black Tuxedo', category: 'Tuxedos', quantity: 32, revenue: '$19,200' },
                { name: 'Charcoal Blazer', category: 'Blazers', quantity: 28, revenue: '$11,200' }
              ]
            }
          }
        }

        return {
          summary,
          ...reportData
        }
      } catch (error) {
        console.error('Error fetching reports:', error)
        throw error
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false
  })
}

// Analytics Hook
export function useAnalytics(timeframe = '30d', metric = 'revenue') {
  return useQuery({
    queryKey: ['analytics', timeframe, metric],
    queryFn: async () => {
      try {
        const now = new Date()
        let startDate: Date
        
        switch (timeframe) {
          case '7d':
            startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
            break
          case '30d':
            startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
            break
          case '90d':
            startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
            break
          case '365d':
            startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
            break
          case 'ytd':
            startDate = new Date(now.getFullYear(), 0, 1)
            break
          default:
            startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        }

        // Get orders data
        const { data: orders, error: ordersError } = await supabase
          .from('orders')
          .select('total_amount, created_at, customer_id, status')
          .gte('created_at', startDate.toISOString())

        if (ordersError) throw ordersError

        const completedOrders = orders?.filter(order => order.status === 'completed') || []
        const revenue = completedOrders.reduce((sum, order) => sum + order.total_amount, 0)
        const ordersCount = completedOrders.length
        const uniqueCustomers = new Set(completedOrders.map(order => order.customer_id)).size

        // Get previous period for comparison
        const periodLength = now.getTime() - startDate.getTime()
        const prevStartDate = new Date(startDate.getTime() - periodLength)
        const { data: prevOrders } = await supabase
          .from('orders')
          .select('total_amount, customer_id, status')
          .gte('created_at', prevStartDate.toISOString())
          .lt('created_at', startDate.toISOString())

        const prevCompletedOrders = prevOrders?.filter(order => order.status === 'completed') || []
        const prevRevenue = prevCompletedOrders.reduce((sum, order) => sum + order.total_amount, 0)
        const prevOrdersCount = prevCompletedOrders.length
        const prevCustomers = new Set(prevCompletedOrders.map(order => order.customer_id)).size

        const kpis = {
          revenue,
          revenueChange: prevRevenue > 0 ? ((revenue - prevRevenue) / prevRevenue) * 100 : 0,
          revenueTarget: revenue * 1.2, // 20% growth target
          orders: ordersCount,
          ordersChange: prevOrdersCount > 0 ? ((ordersCount - prevOrdersCount) / prevOrdersCount) * 100 : 0,
          ordersTarget: ordersCount * 1.15, // 15% growth target
          customers: uniqueCustomers,
          customersChange: prevCustomers > 0 ? ((uniqueCustomers - prevCustomers) / prevCustomers) * 100 : 0,
          customersTarget: uniqueCustomers * 1.25, // 25% growth target
          conversionRate: 2.8, // Mock conversion rate
          conversionChange: 0.3,
          conversionTarget: 3.5
        }

        // Mock analytics data
        const topProducts = [
          { id: '1', name: 'Classic Navy Suit', category: 'Suits', revenue: 25000, sales: 50, growth: 15.2 },
          { id: '2', name: 'Black Tuxedo', category: 'Tuxedos', revenue: 20000, sales: 35, growth: 8.7 },
          { id: '3', name: 'Charcoal Blazer', category: 'Blazers', revenue: 15000, sales: 60, growth: 22.1 }
        ]

        const customerInsights = {
          newCustomers: Math.floor(uniqueCustomers * 0.3),
          newCustomersChange: 15.2,
          returningCustomers: Math.floor(uniqueCustomers * 0.7),
          returningCustomersChange: 8.7,
          avgOrderValue: ordersCount > 0 ? revenue / ordersCount : 0,
          aovChange: 12.5,
          clv: ordersCount > 0 ? (revenue / ordersCount) * 3.2 : 0,
          clvChange: 18.9
        }

        const trafficSources = [
          { name: 'Direct', visitors: 15420, percentage: 45.2, color: '#3B82F6' },
          { name: 'Search', visitors: 8932, percentage: 26.1, color: '#10B981' },
          { name: 'Social', visitors: 5647, percentage: 16.5, color: '#F59E0B' },
          { name: 'Email', visitors: 2845, percentage: 8.3, color: '#EF4444' },
          { name: 'Referral', visitors: 1342, percentage: 3.9, color: '#8B5CF6' }
        ]

        const performance = {
          pageLoadTime: 1247,
          bounceRate: 34.2,
          sessionDuration: '3m 42s',
          pagesPerSession: 2.7
        }

        return {
          kpis,
          topProducts,
          customerInsights,
          trafficSources,
          performance
        }
      } catch (error) {
        console.error('Error fetching analytics:', error)
        throw error
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false
  })
}