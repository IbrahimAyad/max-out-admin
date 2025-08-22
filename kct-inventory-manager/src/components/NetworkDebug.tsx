import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export function NetworkDebug() {
  const [testResults, setTestResults] = useState({})
  const [testing, setTesting] = useState(false)

  const runTests = async () => {
    setTesting(true)
    const results = {}

    // Test 1: Direct products API call
    try {
      console.log('🔍 Testing products API call...')
      const response = await fetch('https://gvcswimqaxvylgxbklbz.supabase.co/rest/v1/products?select=id,name&limit=1', {
        headers: {
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY || 'NO_KEY',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY || 'NO_KEY'}`
        }
      })
      
      results.directAPI = {
        status: response.status,
        ok: response.ok,
        data: response.ok ? await response.json() : await response.text()
      }
    } catch (error) {
      results.directAPI = { error: error.message }
    }

    // Test 2: Supabase client call
    try {
      console.log('🔍 Testing Supabase client call...')
      const { data, error } = await supabase
        .from('products')
        .select('id, name')
        .limit(1)
      
      results.supabaseClient = { data, error: error?.message }
    } catch (error) {
      results.supabaseClient = { error: error.message }
    }

    // Test 3: Enhanced variants
    try {
      console.log('🔍 Testing enhanced_product_variants...')
      const { data, error } = await supabase
        .from('enhanced_product_variants')
        .select('id, sku')
        .limit(1)
      
      results.variants = { data, error: error?.message }
    } catch (error) {
      results.variants = { error: error.message }
    }

    setTestResults(results)
    setTesting(false)
  }

  useEffect(() => {
    runTests()
  }, [])

  return (
    <div className="fixed top-4 left-4 bg-blue-900 text-white p-4 rounded-lg max-w-md max-h-96 overflow-y-auto">
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-bold">Network Debug</h3>
        <button 
          onClick={runTests}
          disabled={testing}
          className="bg-blue-700 px-2 py-1 rounded text-xs"
        >
          {testing ? 'Testing...' : 'Retest'}
        </button>
      </div>
      
      <div className="text-xs space-y-2">
        <div>
          <strong>Direct API:</strong><br/>
          {testResults.directAPI ? (
            <pre className="bg-blue-800 p-1 rounded mt-1">
              {JSON.stringify(testResults.directAPI, null, 1)}
            </pre>
          ) : 'Loading...'}
        </div>
        
        <div>
          <strong>Supabase Client:</strong><br/>
          {testResults.supabaseClient ? (
            <pre className="bg-blue-800 p-1 rounded mt-1">
              {JSON.stringify(testResults.supabaseClient, null, 1)}
            </pre>
          ) : 'Loading...'}
        </div>
        
        <div>
          <strong>Variants:</strong><br/>
          {testResults.variants ? (
            <pre className="bg-blue-800 p-1 rounded mt-1">
              {JSON.stringify(testResults.variants, null, 1)}
            </pre>
          ) : 'Loading...'}
        </div>
      </div>
    </div>
  )
}