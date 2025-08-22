import supabase from './supabaseClient.js'
import fs from 'fs'

async function executeRLSPolicies() {
  console.log('🔧 Executing RLS policies to fix authentication...\n')

  try {
    // Read the SQL file
    const sqlContent = fs.readFileSync('fix-rls-policies.sql', 'utf8')
    
    // Split into individual statements
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt && !stmt.startsWith('--'))
    
    console.log(`📋 Found ${statements.length} SQL statements to execute\n`)
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i]
      if (!statement) continue
      
      const shortStmt = statement.replace(/\s+/g, ' ').substring(0, 50) + '...'
      console.log(`${i + 1}. Executing: ${shortStmt}`)
      
      try {
        // For DDL statements, we need to use the REST API directly
        const response = await fetch('https://gvcswimqaxvylgxbklbz.supabase.co/rest/v1/rpc/exec_sql', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE}`,
            'apikey': process.env.SUPABASE_SERVICE_ROLE
          },
          body: JSON.stringify({ 
            sql: statement + ';'
          })
        })
        
        if (response.ok) {
          console.log('   ✅ Success')
        } else {
          const error = await response.text()
          console.log(`   ⚠️ Warning: ${error}`)
        }
      } catch (error) {
        console.log(`   ❌ Error: ${error.message}`)
      }
    }
    
    console.log('\n🎉 RLS policy execution completed!')
    console.log('\n🧪 Testing the fix...')
    
    // Test if the policies work
    await testAuthenticatedAccess()
    
  } catch (error) {
    console.log('❌ Failed to execute policies:', error.message)
  }
}

async function testAuthenticatedAccess() {
  try {
    // Test with anon client first
    const { createClient } = await import('@supabase/supabase-js')
    const testClient = createClient(
      'https://gvcswimqaxvylgxbklbz.supabase.co',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd2Y3N3aW1xYXh2eWxneGJrbGJ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM3NjA1MzAsImV4cCI6MjA2OTMzNjUzMH0.UZdiGcJXUV5VYetjWXV26inmbj2yXdiT03Z6t_5Lg24'
    )
    
    console.log('📊 Testing table access after RLS policy update:')
    
    // Test products
    const { data: products, error: prodError } = await testClient
      .from('products')
      .select('id, name')
      .limit(1)
    
    console.log('   Products:', prodError ? `❌ ${prodError.message}` : `✅ ${products.length} records`)
    
    // Test enhanced_product_variants
    const { data: variants, error: varError } = await testClient
      .from('enhanced_product_variants')
      .select('id, sku')
      .limit(1)
    
    console.log('   Variants:', varError ? `❌ ${varError.message}` : `✅ ${variants.length} records`)
    
    if (!prodError && !varError) {
      console.log('\n🎉 SUCCESS! The frontend should now work!')
      console.log('   Try refreshing the Enhanced Inventory Manager')
    } else {
      console.log('\n⚠️ Some tables still have issues - may need manual policy creation')
    }
    
  } catch (error) {
    console.log('Test failed:', error.message)
  }
}

executeRLSPolicies()