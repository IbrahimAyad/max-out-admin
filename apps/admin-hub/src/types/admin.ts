export interface DashboardOverview {
  todayRevenue: number
  todayOrdersCount: number
  pendingOrdersCount: number
  unreadNotificationsCount: number
  urgentNotificationsCount: number
  lowStockAlertsCount: number
  lastUpdated: string
}

export interface QuickStats {
  weeklyRevenue: number
  weeklyOrdersCount: number
  totalCustomers: number
  processingQueueLength: number
}

export interface AdminNotification {
  id: string
  type: string
  title: string
  message: string
  priority: 'urgent' | 'high' | 'normal' | 'low'
  data: any
  is_read: boolean
  read_at: string | null
  sound_played: boolean
  created_at: string
  updated_at: string
}

export interface Order {
  id: string
  order_number: string
  customer_name: string | null
  customer_email: string | null
  total_amount: string
  status: string
  created_at: string
}

export interface RecentActivity {
  recentOrders: Order[]
  recentNotifications: AdminNotification[]
}