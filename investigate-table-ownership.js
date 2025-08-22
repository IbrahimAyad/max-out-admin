import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE
)

async function investigateTableOwnership() {
  console.log('🔍 Investigating Table Ownership and Permissions\n')
  
  // Check what user/role we're running as
  console.log('🔑 Current Connection Info:')
  try {
    const { data, error } = await supabase.rpc('auth.role()')
    console.log('Current role:', data || 'Unknown')
  } catch (e) {
    console.log('Cannot determine current role')
  }
  
  // Test if we can create/drop tables (ultimate permission test)
  console.log('\n🧪 Testing Administrative Permissions:')
  
  try {
    // Try to create a test table
    const testTableSQL = `
      CREATE TABLE IF NOT EXISTS permission_test_table (
        id SERIAL PRIMARY KEY,
        test_data TEXT
      );
    `
    
    // Since we can't execute DDL directly, let's test with an insert that would work
    // if we have proper permissions
    const { data: testInsert, error: testError } = await supabase
      .from('products')
      .insert([{
        name: 'Permission Test Product',
        category: 'Test',
        sku: 'PERM-TEST-001',
        base_price: 1.00
      }])
      .select()
    
    if (testError) {
      console.log('❌ Write Permission Test:', testError.message)
      if (testError.message.includes('permission denied')) {
        console.log('   🚨 Service role lacks write permissions!')
      }
    } else {
      console.log('✅ Write Permission Test: SUCCESS')
      // Clean up test data
      if (testInsert && testInsert.length > 0) {
        await supabase
          .from('products')
          .delete()
          .eq('sku', 'PERM-TEST-001')
      }
    }
  } catch (e) {
    console.log('❌ Write test failed:', e.message)
  }
  
  // Check table information for the problematic tables
  console.log('\n🔍 Problematic Tables Analysis:')
  
  const problematicTables = [
    'enhanced_product_variants',
    'wedding_parties', 
    'groomsmen',
    'measurements'
  ]
  
  for (const tableName of problematicTables) {
    console.log(`\n--- ${tableName} ---`)
    
    // Try different permission levels
    const tests = [
      { name: 'SELECT', operation: () => supabase.from(tableName).select('*').limit(1) },
      { name: 'COUNT', operation: () => supabase.from(tableName).select('*', { count: 'exact', head: true }) },
      { name: 'INSERT', operation: () => supabase.from(tableName).insert([{ test: 'test' }]) }
    ]
    
    for (const test of tests) {
      try {
        const { data, error, count } = await test.operation()
        
        if (error) {
          console.log(`  ❌ ${test.name}: ${error.message}`)
          
          if (error.message.includes('permission denied')) {
            console.log(`     💡 RLS or ownership issue`)
          } else if (error.message.includes('does not exist')) {
            console.log(`     💡 Table doesn't exist`)
          } else if (error.message.includes('column')) {
            console.log(`     💡 Table exists, column issue`)
          }
        } else {
          console.log(`  ✅ ${test.name}: Success ${count !== undefined ? `(${count} records)` : ''}`)
        }
      } catch (e) {
        console.log(`  ❌ ${test.name}: ${e.message}`)
      }
    }
  }
  
  console.log('\n📋 DIAGNOSIS:')
  console.log('If you see "permission denied" errors:')
  console.log('1. Tables exist but have RLS blocking service role')
  console.log('2. Tables created with wrong ownership')
  console.log('3. Service role key is not actually bypassing RLS')
  console.log('')
  console.log('📝 SOLUTIONS:')
  console.log('A) Drop and recreate tables manually in Supabase SQL Editor')
  console.log('B) Grant explicit permissions to service role')
  console.log('C) Disable RLS entirely on these tables')
  console.log('D) Use alternative tables (product_variants instead of enhanced_product_variants)')
}

investigateTableOwnership()