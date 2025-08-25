import React, { useEffect } from 'react'
import { AuthProvider } from './contexts/AuthContext'
import { ProtectedRoute } from './components/ProtectedRoute'
import { AppContent } from './components/AppContent'
import './App.css'

function App() {
  useEffect(() => {
    // Set up structured data for the admin dashboard
    const structuredData = {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      "name": "KCT Inventory Management",
      "description": "Professional inventory management system for KCT Menswear",
      "url": "https://max-out-inventory-manager.vercel.app",
      "applicationCategory": "BusinessApplication",
      "operatingSystem": "Any",
      "permissions": "private",
      "offers": {
        "@type": "Offer",
        "price": "0",
        "priceCurrency": "USD"
      },
      "creator": {
        "@type": "Organization",
        "name": "KCT Menswear"
      }
    }

    // Add structured data to head
    const script = document.createElement('script')
    script.type = 'application/ld+json'
    script.textContent = JSON.stringify(structuredData)
    document.head.appendChild(script)

    // Set dynamic page title based on current view
    document.title = 'Inventory Management | KCT Admin Hub'

    // Add canonical URL
    const canonical = document.createElement('link')
    canonical.rel = 'canonical'
    canonical.href = 'https://max-out-inventory-manager.vercel.app'
    document.head.appendChild(canonical)

    return () => {
      // Cleanup
      document.head.removeChild(script)
      document.head.removeChild(canonical)
    }
  }, [])

  return (
    <AuthProvider>
      <ProtectedRoute>
        <AppContent />
        
        {/* Accessibility Skip Link */}
        <a 
          href="#main-content" 
          className="sr-only focus:not-sr-only focus:absolute focus:top-0 focus:left-0 z-50 bg-blue-600 text-white p-2 rounded"
        >
          Skip to main content
        </a>
      </ProtectedRoute>
    </AuthProvider>
  )
}

export default App