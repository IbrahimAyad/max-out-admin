import React from 'react'

export function DebugEnvVars() {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY
  
  return (
    <div className="fixed bottom-4 right-4 bg-black text-white p-4 rounded-lg max-w-md">
      <h3 className="font-bold mb-2">Debug: Environment Variables</h3>
      <div className="text-xs space-y-1">
        <div>
          <strong>URL:</strong> {supabaseUrl || '❌ NOT SET'}
        </div>
        <div>
          <strong>Key:</strong> {supabaseKey ? `✅ Set (${supabaseKey.substring(0, 20)}...)` : '❌ NOT SET'}
        </div>
        <div>
          <strong>Expected URL:</strong> https://gvcswimqaxvylgxbklbz.supabase.co
        </div>
        <div>
          <strong>Key Match:</strong> {
            supabaseKey === 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd2Y3N3aW1xYXh2eWxneGJrbGJ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM3NjA1MzAsImV4cCI6MjA2OTMzNjUzMH0.UZdiGcJXUV5VYetjWXV26inmbj2yXdiT03Z6t_5Lg24' 
              ? '✅ CORRECT' : '❌ INCORRECT'
          }
        </div>
      </div>
    </div>
  )
}