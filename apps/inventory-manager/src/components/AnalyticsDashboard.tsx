import { useState, useEffect } from 'react'
import { BarChart3, TrendingUp, Users, ShoppingCart, Eye, MousePointer, Calendar, ArrowUp, ArrowDown } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface AnalyticsData {
  totalPageViews: number
  totalSessions: number
  totalEvents: number
  conversionRate: number
  topPages: { page: string; views: number }[]
  topProducts: { product_id: string; views: number }[]
  dailyViews: { date: string; views: number }[]
}

export function AnalyticsDashboard() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dateRange, setDateRange] = useState<'7days' | '30days' | '90days'>('30days')

  useEffect(() => {
    loadAnalytics()
  }, [dateRange])

  const loadAnalytics = async () => {
    try {
      setLoading(true)
      setError(null)

      const daysBack = dateRange === '7days' ? 7 : dateRange === '30days' ? 30 : 90
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - daysBack)
      const startDateStr = startDate.toISOString()

      // Get page views
      const { data: pageViews, error: pageViewsError } = await supabase
        .from('analytics_page_views')
        .select('*')
        .gte('created_at', startDateStr)

      if (pageViewsError) throw pageViewsError

      // Get sessions
      const { data: sessions, error: sessionsError } = await supabase
        .from('analytics_sessions')
        .select('*')
        .gte('created_at', startDateStr)

      if (sessionsError) throw sessionsError

      // Get events
      const { data: events, error: eventsError } = await supabase
        .from('analytics_events')
        .select('*')
        .gte('created_at', startDateStr)

      if (eventsError) throw eventsError

      // Process analytics data
      const totalPageViews = pageViews?.length || 0
      const totalSessions = sessions?.length || 0
      const totalEvents = events?.length || 0
      const conversionRate = totalSessions > 0 ? ((events?.filter(e => e.event_type === 'conversion').length || 0) as number) / (totalSessions as number) * 100 : 0

      // Top pages
      const pageViewCounts = pageViews?.reduce((acc, pv) => {
        acc[pv.page_path] = (acc[pv.page_path] || 0) + 1
        return acc
      }, {} as Record<string, number>) || {}
      
      const topPages = Object.entries(pageViewCounts)
        .sort(([,a], [,b]) => (b as number) - (a as number))
        .slice(0, 5)
        .map(([page, views]) => ({ page, views: views as number }))

      // Top products
      const productViews = events?.filter(e => e.event_type === 'product_view').reduce((acc, event) => {
        const productId = event.properties?.product_id
        if (productId) {
          acc[productId] = (acc[productId] || 0) + 1
        }
        return acc
      }, {} as Record<string, number>) || {}
      
      const topProducts = Object.entries(productViews)
        .sort(([,a], [,b]) => (b as number) - (a as number))
        .slice(0, 5)
        .map(([product_id, views]) => ({ product_id, views: views as number }))

      // Daily views for chart
      const dailyViewCounts = pageViews?.reduce((acc, pv) => {
        const date = new Date(pv.created_at).toISOString().split('T')[0]
        acc[date] = (acc[date] || 0) + 1
        return acc
      }, {} as Record<string, number>) || {}
      
      const dailyViews = Object.entries(dailyViewCounts)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, views]) => ({ date, views: views as number }))

      setAnalytics({
        totalPageViews,
        totalSessions,
        totalEvents,
        conversionRate,
        topPages,
        topProducts,
        dailyViews
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load analytics')
    } finally {
      setLoading(false)
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
          <BarChart3 className="h-5 w-5 text-red-400 mr-2" />
          <p className="text-red-800">Error loading analytics: {error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h2>
          <p className="text-gray-600">Track user behavior and platform performance</p>
        </div>
        <div className="flex items-center space-x-2">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value as '7days' | '30days' | '90days')}
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="7days">Last 7 days</option>
            <option value="30days">Last 30 days</option>
            <option value="90days">Last 90 days</option>
          </select>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Eye className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Page Views</p>
              <p className="text-2xl font-bold text-gray-900">{analytics?.totalPageViews.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Users className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Sessions</p>
              <p className="text-2xl font-bold text-gray-900">{analytics?.totalSessions.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <MousePointer className="h-8 w-8 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Events</p>
              <p className="text-2xl font-bold text-gray-900">{analytics?.totalEvents.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <TrendingUp className="h-8 w-8 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Conversion Rate</p>
              <p className="text-2xl font-bold text-gray-900">{analytics?.conversionRate.toFixed(2)}%</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Views Chart */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <BarChart3 className="h-5 w-5 mr-2 text-blue-600" />
            Daily Page Views
          </h3>
          
          <div className="space-y-3">
            {analytics?.dailyViews.map((day, index) => {
              const maxViews = Math.max(...analytics.dailyViews.map(d => d.views))
              const percentage = maxViews > 0 ? (day.views / maxViews) * 100 : 0
              
              return (
                <div key={index} className="flex items-center space-x-3">
                  <div className="w-20 text-sm text-gray-600">
                    {new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </div>
                  <div className="flex-1">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                  <div className="w-12 text-sm font-medium text-gray-900">
                    {day.views}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Top Pages */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Eye className="h-5 w-5 mr-2 text-green-600" />
            Top Pages
          </h3>
          
          <div className="space-y-3">
            {analytics?.topPages.map((page, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center text-xs font-medium text-gray-600">
                    {index + 1}
                  </span>
                  <span className="text-sm text-gray-900 font-mono truncate">{page.page || '/'}</span>
                </div>
                <span className="text-sm font-medium text-gray-600">{page.views} views</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Products */}
      {analytics?.topProducts.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <ShoppingCart className="h-5 w-5 mr-2 text-purple-600" />
            Most Viewed Products
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {analytics.topProducts.map((product, index) => (
              <div key={index} className="bg-gray-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-purple-600">{product.views}</div>
                <div className="text-sm text-gray-600">views</div>
                <div className="text-xs text-gray-500 mt-1 font-mono">{product.product_id}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}