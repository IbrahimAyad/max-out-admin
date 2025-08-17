import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from './contexts/AuthContext'
import { Toaster } from 'react-hot-toast'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Orders from './pages/Orders'
import OrderDetails from './pages/OrderDetails'
import Products from './pages/Products'
import ProductDetails from './pages/ProductDetails'
import Customers from './pages/Customers'
import CustomerProfile from './pages/CustomerProfile'
import Reports from './pages/Reports'
import Settings from './pages/Settings'
import { AnalyticsPage } from './pages/AnalyticsPage'
import ProtectedRoute from './components/ProtectedRoute'

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      refetchOnWindowFocus: false,
    },
  },
})

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <div className="min-h-screen bg-neutral-50">
            <Routes>
              {/* Public routes */}
              <Route path="/login" element={<Login />} />
              
              {/* Protected routes */}
              <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
                <Route index element={<Navigate to="/dashboard" replace />} />
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="orders" element={<Orders />} />
                <Route path="orders/:orderId" element={<OrderDetails />} />
                <Route path="products" element={<Products />} />
                <Route path="products/:productId" element={<ProductDetails />} />
                <Route path="customers" element={<Customers />} />
                <Route path="customers/:customerId" element={<CustomerProfile />} />
                <Route path="reports" element={<Reports />} />
                <Route path="analytics" element={<AnalyticsPage />} />
                <Route path="settings" element={<Settings />} />
              </Route>
              
              {/* Catch all */}
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
            
            {/* Global toast notifications */}
            <Toaster
              position="top-right"
              toastOptions={{
                className: 'text-sm',
                duration: 4000,
                style: {
                  background: '#FFFFFF',
                  color: '#1A1A1A',
                  border: '1px solid #E1E1E1',
                  borderRadius: '8px',
                  padding: '12px 16px',
                },
                success: {
                  iconTheme: {
                    primary: '#00C851',
                    secondary: '#FFFFFF',
                  },
                },
                error: {
                  iconTheme: {
                    primary: '#FF4444',
                    secondary: '#FFFFFF',
                  },
                },
              }}
            />
          </div>
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  )
}

export default App
