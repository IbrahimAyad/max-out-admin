import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE
)

async function diagnosePermissionIssues() {
  console.log('🔍 Diagnosing Permission Issues\n')
  
  // Check if we're actually using the service role
  console.log('🔑 Authentication Status:')
  console.log('   URL:', process.env.SUPABASE_URL?.substring(0, 30) + '...')
  console.log('   Key:', process.env.SUPABASE_SERVICE_ROLE?.substring(0, 20) + '...')
  
  // Test with working tables first
  console.log('\n✅ Testing Working Tables:')
  try {
    const { data: productsData, error: productsError } = await supabase
      .from('products')
      .select('id, name')
      .limit(1)
    
    if (productsError) {
      console.log(`❌ products: ${productsError.message}`)
    } else {
      console.log(`✅ products: Working (${productsData?.length || 0} records)`)
    }
  } catch (e) {
    console.log(`❌ products error: ${e.message}`)
  }
  
  // Check if tables actually exist by trying different approaches
  console.log('\n🔬 Checking Table Existence:')
  
  const problematicTables = [
    'enhanced_product_variants',
    'wedding_parties',
    'groomsmen', 
    'measurements'
  ]
  
  for (const table of problematicTables) {
    console.log(`\n--- Testing ${table} ---`)
    
    // Method 1: Direct select
    try {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1)
      
      console.log(`   Direct select: ${error ? error.message : 'Success'}`)
    } catch (e) {
      console.log(`   Direct select error: ${e.message}`)
    }
    
    // Method 2: Count query
    try {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true })
      
      console.log(`   Count query: ${error ? error.message : `Success (${count} records)`}`)
    } catch (e) {
      console.log(`   Count query error: ${e.message}`)
    }
    
    // Method 3: Insert test (will show if table exists)
    try {
      const { data, error } = await supabase
        .from(table)
        .insert([{ test_field: 'test' }])
        .select()
      
      console.log(`   Insert test: ${error ? error.message : 'Success'}`)
    } catch (e) {
      console.log(`   Insert test error: ${e.message}`)
    }
  }
  
  console.log('\n📋 Analysis:')
  console.log('If "permission denied" persists, the issue is likely:')
  console.log('1. RLS policies are too restrictive')
  console.log('2. Service role key is not being used correctly')
  console.log('3. Tables were created with wrong ownership')
  console.log('\nTry running disable-rls-tables.sql to remove RLS entirely')
}

diagnosePermissionIssues()