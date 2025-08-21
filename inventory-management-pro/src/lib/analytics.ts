import { supabase } from './supabase'

export interface AnalyticsEvent {
  event_type: string
  page_path?: string
  product_id?: string
  collection_id?: string
  session_id: string
  user_id?: string
  properties?: Record<string, any>
}

export interface PageView {
  page_path: string
  page_title: string
  session_id: string
  user_id?: string
  referrer?: string
  user_agent?: string
}

class AnalyticsService {
  private sessionId: string
  
  constructor() {
    this.sessionId = this.getOrCreateSessionId()
  }

  private getOrCreateSessionId(): string {
    let sessionId = localStorage.getItem('analytics_session_id')
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      localStorage.setItem('analytics_session_id', sessionId)
    }
    return sessionId
  }

  async trackPageView(pageView: Omit<PageView, 'session_id'>) {
    try {
      await supabase
        .from('analytics_page_views')
        .insert({
          ...pageView,
          session_id: this.sessionId,
          timestamp: new Date().toISOString()
        })
    } catch (error) {
      console.warn('Failed to track page view:', error)
    }
  }

  async trackEvent(event: Omit<AnalyticsEvent, 'session_id'>) {
    try {
      await supabase
        .from('analytics_events')
        .insert({
          ...event,
          session_id: this.sessionId,
          timestamp: new Date().toISOString()
        })
    } catch (error) {
      console.warn('Failed to track event:', error)
    }
  }

  async trackProductView(productId: string, productName?: string) {
    await this.trackEvent({
      event_type: 'product_view',
      product_id: productId,
      properties: {
        product_name: productName,
        timestamp: new Date().toISOString()
      }
    })
  }

  async trackProductEdit(productId: string, productName?: string) {
    await this.trackEvent({
      event_type: 'product_edit',
      product_id: productId,
      properties: {
        product_name: productName,
        action: 'edit_started',
        timestamp: new Date().toISOString()
      }
    })
  }

  async trackProductUpdate(productId: string, changes: Record<string, any>) {
    await this.trackEvent({
      event_type: 'product_update',
      product_id: productId,
      properties: {
        changes,
        timestamp: new Date().toISOString()
      }
    })
  }

  async trackCollectionView(collectionId: string, collectionName?: string) {
    await this.trackEvent({
      event_type: 'collection_view',
      collection_id: collectionId,
      properties: {
        collection_name: collectionName,
        timestamp: new Date().toISOString()
      }
    })
  }

  async getDashboardStats() {
    const today = new Date().toISOString().split('T')[0]
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

    try {
      // Get page views for today and last 7 days
      const { data: pageViews } = await supabase
        .from('analytics_page_views')
        .select('*')
        .gte('timestamp', weekAgo)

      // Get product performance
      const { data: productPerformance } = await supabase
        .from('analytics_product_performance')
        .select('*')
        .gte('last_updated', weekAgo)

      // Get recent events
      const { data: recentEvents } = await supabase
        .from('analytics_events')
        .select('*')
        .gte('timestamp', weekAgo)
        .order('timestamp', { ascending: false })
        .limit(100)

      const todayViews = pageViews?.filter(pv => pv.timestamp?.startsWith(today)).length || 0
      const weekViews = pageViews?.length || 0
      const productViews = recentEvents?.filter(e => e.event_type === 'product_view').length || 0
      const productEdits = recentEvents?.filter(e => e.event_type === 'product_edit').length || 0

      return {
        pageViews: {
          today: todayViews,
          week: weekViews,
          change: todayViews > 0 ? ((todayViews / (weekViews - todayViews)) * 100) : 0
        },
        productViews: {
          week: productViews,
          change: 12.5 // Mock change percentage
        },
        productEdits: {
          week: productEdits,
          change: 8.3 // Mock change percentage
        },
        topProducts: productPerformance?.slice(0, 5) || [],
        recentActivity: recentEvents?.slice(0, 10) || []
      }
    } catch (error) {
      console.error('Failed to get dashboard stats:', error)
      return {
        pageViews: { today: 0, week: 0, change: 0 },
        productViews: { week: 0, change: 0 },
        productEdits: { week: 0, change: 0 },
        topProducts: [],
        recentActivity: []
      }
    }
  }
}

export const analytics = new AnalyticsService()
export default analytics
