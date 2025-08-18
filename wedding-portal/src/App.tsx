import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from '@/contexts/AuthContext'
import { WeddingAccessPage } from '@/pages/WeddingAccessPage'
import { WeddingDashboard } from '@/pages/WeddingDashboard'
import { PartyMemberManagement } from '@/pages/PartyMemberManagement'
import { TimelinePage } from '@/pages/TimelinePage'
import { CommunicationPage } from '@/pages/CommunicationPage'
import { OutfitCoordination } from '@/pages/OutfitCoordination'
import { AdvancedOutfitCoordination } from '@/pages/AdvancedOutfitCoordination'
import { SmartMeasurementSystem } from '@/pages/SmartMeasurementSystem'
import { WeddingSettings } from '@/pages/WeddingSettings'
import { Layout } from '@/components/Layout'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import './App.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 10, // 10 minutes
    },
  },
})

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <div className="min-h-screen bg-gray-50">
            <Toaster position="top-right" />
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<WeddingAccessPage />} />
              <Route path="/access" element={<WeddingAccessPage />} />
              <Route path="/wedding-invitation/:inviteCode" element={<WeddingAccessPage />} />
              
              {/* Protected Wedding Portal Routes */}
              <Route path="/wedding" element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }>
                <Route index element={<WeddingDashboard />} />
                <Route path="dashboard" element={<WeddingDashboard />} />
                <Route path="party" element={<PartyMemberManagement />} />
                <Route path="timeline" element={<TimelinePage />} />
                <Route path="communication" element={<CommunicationPage />} />
                <Route path="outfits" element={<OutfitCoordination />} />
                <Route path="ai-coordination" element={<AdvancedOutfitCoordination />} />
                <Route path="smart-measurements" element={<SmartMeasurementSystem />} />
                <Route path="settings" element={<WeddingSettings />} />
              </Route>
              
              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  )
}

export default App
