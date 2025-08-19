import React from 'react'
import { AuthProvider } from './contexts/AuthContext'
import { EnhancedInventoryManager } from './components/EnhancedInventoryManager'
import './App.css'

function App() {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <EnhancedInventoryManager />
        </div>
      </div>
    </AuthProvider>
  )
}

export default App