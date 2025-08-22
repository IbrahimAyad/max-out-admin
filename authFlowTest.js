import { createClient } from '@supabase/supabase-js'

async function comprehensiveAuthTest() {
  console.log('🔍 Comprehensive Authentication Flow Test\n')

  const url = 'https://gvcswimqaxvylgxbklbz.supabase.co'
  const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd2Y3N3aW1xYXh2eWxneGJrbGJ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM3NjA1MzAsImV4cCI6MjA2OTMzNjUzMH0.UZdiGcJXUV5VYetjWXV26inmbj2yXdiT03Z6t_5Lg24'

  try {
    // Create client like the frontend does
    const client = createClient(url, anonKey)
    
    console.log('1. 🔄 Testing unauthenticated access (like when page first loads):')
    
    // Test products
    const { data: unauthProducts, error: unauthProdError } = await client
      .from('products')
      .select('id, name')
      .limit(1)
    
    console.log('   Products (unauth):', unauthProdError ? `❌ ${unauthProdError.message}` : `✅ ${unauthProducts.length} records`)
    
    // Test variants  
    const { data: unauthVariants, error: unauthVarError } = await client
      .from('enhanced_product_variants')
      .select('id, sku')
      .limit(1)
    
    console.log('   Variants (unauth):', unauthVarError ? `❌ ${unauthVarError.message}` : `✅ ${unauthVariants.length} records`)
    
    console.log('\n2. 🔐 Testing authentication flow:')
    
    // Check current session
    const { data: initialSession } = await client.auth.getSession()
    console.log('   Initial session:', initialSession.session ? 'Authenticated' : 'Not authenticated')
    
    // Try to sign in with admin credentials (will likely fail but shows the process)
    console.log('   Attempting sign in...')
    const { data: authData, error: authError } = await client.auth.signInWithPassword({
      email: 'admin@kctmenswear.com',
      password: 'testpassword123'
    })
    
    if (authError) {
      console.log('   ⚠️ Auth failed (expected):', authError.message)
      console.log('   💡 This shows the frontend needs valid credentials')
    } else {
      console.log('   ✅ Auth successful!', authData.user?.email)
      
      // Test authenticated access
      console.log('\n3. 🔓 Testing authenticated access:')
      
      const { data: authProducts, error: authProdError } = await client
        .from('products')
        .select('id, name')
        .limit(1)
      
      console.log('   Products (auth):', authProdError ? `❌ ${authProdError.message}` : `✅ ${authProducts.length} records`)
      
      const { data: authVariants, error: authVarError } = await client
        .from('enhanced_product_variants')
        .select('id, sku')
        .limit(1)
      
      console.log('   Variants (auth):', authVarError ? `❌ ${authVarError.message}` : `✅ ${authVariants.length} records`)
    }
    
    console.log('\n4. 🎯 Analysis:')
    
    if (!unauthProdError && !unauthVarError) {
      console.log('   ✅ Tables are accessible without authentication')
      console.log('   🤔 This means the 401 error is NOT caused by RLS policies')
      console.log('   🔍 The issue might be:')
      console.log('      - Frontend environment variables not loading')
      console.log('      - Incorrect Supabase URL or anon key in frontend')
      console.log('      - Browser network issues')
      console.log('      - Frontend making requests to wrong endpoint')
    } else {
      console.log('   ❌ Tables require authentication')
      console.log('   🔧 RLS policies need to be configured properly')
    }
    
    console.log('\n5. 🛠️ Next Steps:')
    console.log('   1. Check the Enhanced Inventory Manager environment variables')
    console.log('   2. Verify the frontend is using the correct Supabase URL')
    console.log('   3. Check browser network tab for the actual request URLs')
    console.log('   4. Compare working vs non-working configurations')
    
  } catch (error) {
    console.log('❌ Test failed:', error.message)
  }
}

comprehensiveAuthTest()