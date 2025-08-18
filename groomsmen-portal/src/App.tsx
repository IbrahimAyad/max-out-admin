import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from '@/lib/AuthContext'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { InvitationPage } from '@/pages/InvitationPage'
import { LoginPage } from '@/pages/LoginPage'
import { DashboardPage } from '@/pages/DashboardPage'
import { MeasurementsPage } from '@/pages/MeasurementsPage'
import { OutfitPage } from '@/pages/OutfitPage'
import { TimelinePage } from '@/pages/TimelinePage'
import { CommunicationsPage } from '@/pages/CommunicationsPage'
import { ProfilePage } from '@/pages/ProfilePage'

function AppContent() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <Routes>
        {/* Public routes */}
        <Route path="/invitation" element={<InvitationPage />} />
        <Route path="/login" element={<LoginPage />} />
        
        {/* Protected routes */}
        <Route path="/dashboard" element={
          user ? <DashboardPage /> : <Navigate to="/login" replace />
        } />
        <Route path="/measurements" element={
          user ? <MeasurementsPage /> : <Navigate to="/login" replace />
        } />
        <Route path="/outfit" element={
          user ? <OutfitPage /> : <Navigate to="/login" replace />
        } />
        <Route path="/timeline" element={
          user ? <TimelinePage /> : <Navigate to="/login" replace />
        } />
        <Route path="/communications" element={
          user ? <CommunicationsPage /> : <Navigate to="/login" replace />
        } />
        <Route path="/profile" element={
          user ? <ProfilePage /> : <Navigate to="/login" replace />
        } />
        
        {/* Default redirect */}
        <Route path="/" element={
          user ? <Navigate to="/dashboard" replace /> : <Navigate to="/invitation" replace />
        } />
        <Route path="*" element={
          user ? <Navigate to="/dashboard" replace /> : <Navigate to="/invitation" replace />
        } />
      </Routes>
      <Toaster 
        position="top-center"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
        }}
      />
    </div>
  )
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  )
}

export default App