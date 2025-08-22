import { createClient } from '@supabase/supabase-js'

async function checkTables() {
  console.log('🔍 Checking database schema and table existence...\n')

  // Test with anon client (what the frontend uses)
  const anonClient = createClient(
    'https://gvcswimqaxvylgxbklbz.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd2Y3N3aW1xYXh2eWxneGJrbGJ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM3NjA1MzAsImV4cCI6MjA2OTMzNjUzMH0.UZdiGcJXUV5VYetjWXV26inmbj2yXdiT03Z6t_5Lg24'
  )

  try {
    console.log('Testing tables with anon client (frontend perspective):\n')
    
    const tables = [
      'products', 
      'enhanced_product_variants', 
      'product_variants',
      'inventory_variants',
      'product_images',
      'vendor_products'
    ]
    
    for (const tableName of tables) {
      try {
        const { data, error } = await anonClient
          .from(tableName)
          .select('*')
          .limit(1)
        
        if (error) {
          console.log(`❌ ${tableName}: ${error.message}`)
        } else {
          console.log(`✅ ${tableName}: Found ${data ? data.length : 0} records`)
          if (data && data.length > 0) {
            console.log(`   Columns: ${Object.keys(data[0]).slice(0, 6).join(', ')}...`)
          }
        }
      } catch (err) {
        console.log(`❌ ${tableName}: ${err.message}`)
      }
    }

    // Now test what happens when we authenticate
    console.log('\n🔐 Testing authentication flow...\n')
    
    // Try to sign in with test credentials (this will fail but show us the process)
    const { error: authError } = await anonClient.auth.signInWithPassword({
      email: 'admin@kctmenswear.com',
      password: 'test123'
    })
    
    if (authError) {
      console.log('⚠️ Test auth failed (expected):', authError.message)
      console.log('   This means the frontend needs valid credentials')
    }
    
    // Check auth state
    const { data: session } = await anonClient.auth.getSession()
    console.log('📱 Current session:', session.session ? 'Authenticated' : 'Not authenticated')
    
  } catch (error) {
    console.log('❌ Test failed:', error.message)
  }
}

checkTables()