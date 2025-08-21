import { useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'

// Analytics event types
export type AnalyticsEventType = 
  | 'page_view'
  | 'product_view'
  | 'product_click'
  | 'search'
  | 'filter_applied'
  | 'add_to_cart'
  | 'variant_selected'
  | 'image_viewed'
  | 'navigation_click'
  | 'conversion'

interface AnalyticsEventProperties {
  product_id?: string
  product_name?: string
  category?: string
  search_query?: string
  filter_type?: string
  filter_value?: string
  variant_sku?: string
  image_url?: string
  navigation_target?: string
  page_section?: string
  [key: string]: any
}

interface AnalyticsHook {
  trackPageView: (page: string, title?: string) => Promise<void>
  trackEvent: (eventType: AnalyticsEventType, properties?: AnalyticsEventProperties) => Promise<void>
  startSession: () => Promise<void>
}

// Generate unique session ID
const generateSessionId = () => {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

// Get or create session ID
const getSessionId = () => {
  let sessionId = sessionStorage.getItem('analytics_session_id')
  if (!sessionId) {
    sessionId = generateSessionId()
    sessionStorage.setItem('analytics_session_id', sessionId)
  }
  return sessionId
}

export function useAnalytics(): AnalyticsHook {
  const { user } = useAuth()

  // Start analytics session when hook is first used
  useEffect(() => {
    startSession()
  }, [])

  const startSession = useCallback(async () => {
    try {
      const sessionId = getSessionId()
      const timestamp = new Date().toISOString()
      
      // Check if session already exists to avoid duplicates
      const { data: existingSession } = await supabase
        .from('analytics_sessions')
        .select('id')
        .eq('session_id', sessionId)
        .maybeSingle()

      if (!existingSession) {
        await supabase
          .from('analytics_sessions')
          .insert({
            session_id: sessionId,
            user_id: user?.id || null,
            started_at: timestamp,
            user_agent: navigator.userAgent,
            referrer: document.referrer || null,
            utm_source: new URLSearchParams(window.location.search).get('utm_source'),
            utm_medium: new URLSearchParams(window.location.search).get('utm_medium'),
            utm_campaign: new URLSearchParams(window.location.search).get('utm_campaign'),
            created_at: timestamp
          })
      }
    } catch (error) {
      console.error('Failed to start analytics session:', error)
    }
  }, [user])

  const trackPageView = useCallback(async (page: string, title?: string) => {
    try {
      const sessionId = getSessionId()
      const timestamp = new Date().toISOString()
      
      // Track page view
      await supabase
        .from('analytics_page_views')
        .insert({
          session_id: sessionId,
          user_id: user?.id || null,
          page_path: page,
          page_title: title || document.title,
          referrer: document.referrer || null,
          duration_seconds: 0,
          exit_page: false,
          bounce: false,
          created_at: timestamp
        })
    } catch (error) {
      console.error('Failed to track page view:', error)
    }
  }, [user])

  const trackEvent = useCallback(async (
    eventType: AnalyticsEventType, 
    properties: AnalyticsEventProperties = {}
  ) => {
    try {
      const sessionId = getSessionId()
      const timestamp = new Date().toISOString()
      
      await supabase
        .from('analytics_events')
        .insert({
          session_id: sessionId,
          customer_id: user?.id || null,
          event_type: eventType,
          event_data: properties,
          page_url: window.location.pathname,
          user_agent: navigator.userAgent,
          ip_address: null,
          created_at: timestamp
        })
    } catch (error) {
      console.error('Failed to track event:', error)
    }
  }, [user])

  return {
    trackPageView,
    trackEvent,
    startSession
  }
}

// Utility function for tracking product interactions
export const trackProductInteraction = async (
  eventType: AnalyticsEventType,
  productId: string,
  productName?: string,
  category?: string,
  additionalProperties?: AnalyticsEventProperties
) => {
  const sessionId = getSessionId()
  const timestamp = new Date().toISOString()
  
  try {
    await supabase
      .from('analytics_events')
      .insert({
        session_id: sessionId,
        customer_id: null, // Will be set by RLS if user is logged in
        event_type: eventType,
        event_data: {
          product_id: productId,
          product_name: productName,
          category: category,
          ...additionalProperties
        },
        page_url: window.location.pathname,
        user_agent: navigator.userAgent,
        ip_address: null,
        created_at: timestamp
      })
  } catch (error) {
    console.error('Failed to track product interaction:', error)
  }
}

// Utility function for tracking search behavior
export const trackSearch = async (
  query: string,
  results_count?: number,
  filter_applied?: string
) => {
  const sessionId = getSessionId()
  const timestamp = new Date().toISOString()
  
  try {
    await supabase
      .from('analytics_events')
      .insert({
        session_id: sessionId,
        customer_id: null,
        event_type: 'search',
        event_data: {
          search_query: query,
          results_count: results_count,
          filter_applied: filter_applied
        },
        page_url: window.location.pathname,
        user_agent: navigator.userAgent,
        ip_address: null,
        created_at: timestamp
      })
  } catch (error) {
    console.error('Failed to track search:', error)
  }
}