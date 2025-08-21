import { useEffect } from 'react'
import { EnhancedProductsPage } from './EnhancedProductsPage'
import { Layout } from './Layout'
import { useAnalytics } from '../hooks/useAnalytics'

export function AppContent() {
  const { trackPageView } = useAnalytics()

  useEffect(() => {
    // Track initial app load
    trackPageView('/', 'KCT Inventory Dashboard')
  }, [])

  return (
    <Layout>
      <EnhancedProductsPage />
    </Layout>
  )
}