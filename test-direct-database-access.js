import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

// Test with anon key (what frontend apps use)
const anonClient = createClient(
  process.env.SUPABASE_URL,
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd2Y3N3aW1xYXh2eWxneGJrbGJ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM3NjA1MzAsImV4cCI6MjA2OTMzNjUzMH0.UZdiGcJXUV5VYetjWXV26inmbj2yXdiT03Z6t_5Lg24'
)

async function testDirectDatabaseAccess() {
  console.log('🔍 Testing Direct Database Access for Admin Apps')
  console.log('=================================================\n')
  console.log('📝 Testing with anon key (frontend perspective)\n')
  
  // Test essential admin operations
  const tests = [
    {
      name: 'Product Management',
      test: async () => {
        const { data, error } = await anonClient
          .from('products')
          .select('id, name, category, sku')
          .limit(5)
        return { data, error }
      }
    },
    {
      name: 'Inventory Variants',
      test: async () => {
        const { data, error } = await anonClient
          .from('inventory_variants')
          .select('id, sku, size_id, color_id, stock_quantity')
          .limit(5)
        return { data, error }
      }
    },
    {
      name: 'Product Variants',
      test: async () => {
        const { data, error } = await anonClient
          .from('product_variants')
          .select('id, sku, title, price')
          .limit(5)
        return { data, error }
      }
    },
    {
      name: 'Vendor Products',
      test: async () => {
        const { data, error } = await anonClient
          .from('vendor_products')
          .select('shopify_product_id, title, vendor')
          .limit(3)
        return { data, error }
      }
    },
    {
      name: 'Orders',
      test: async () => {
        const { data, error } = await anonClient
          .from('orders')
          .select('id, order_number, status, subtotal')
          .limit(3)
        return { data, error }
      }
    },
    {
      name: 'Customer Data',
      test: async () => {
        const { data, error } = await anonClient
          .from('customers')
          .select('id, email, first_name, last_name')
          .limit(3)
        return { data, error }
      }
    }
  ]
  
  let workingOperations = 0
  
  for (const { name, test } of tests) {
    try {
      const { data, error } = await test()
      
      if (error) {
        console.log(`❌ ${name}: ${error.message}`)
      } else {
        console.log(`✅ ${name}: Success (${data?.length || 0} records)`)
        workingOperations++
        if (data && data.length > 0) {
          const sample = data[0]
          const keys = Object.keys(sample).slice(0, 3)
          console.log(`   Sample data: ${keys.join(', ')}...`)
        }
      }
    } catch (err) {
      console.log(`❌ ${name}: ${err.message}`)
    }
  }
  
  console.log(`\n📊 Direct Database Access: ${workingOperations}/${tests.length} operations working`)
  
  // Test if we can do basic CRUD operations
  console.log('\n🔧 Testing Basic CRUD Operations:')
  
  try {
    // Test insert (this will likely fail without auth, but let's see)
    console.log('Testing insert operation...')
    const { data: insertData, error: insertError } = await anonClient
      .from('products')
      .insert([{
        name: 'Test Product V1',
        category: 'Test',
        sku: 'TEST-V1-001',
        base_price: 99.99
      }])
      .select()
    
    if (insertError) {
      console.log(`⚠️  Insert: ${insertError.message}`)
      if (insertError.message.includes('denied') || insertError.message.includes('auth')) {
        console.log('   💡 This is expected - inserts require authentication')
      }
    } else {
      console.log(`✅ Insert: Success`)
    }
  } catch (e) {
    console.log(`⚠️  Insert: ${e.message}`)
  }
  
  // Assessment
  console.log('\n🎯 ASSESSMENT:')
  
  if (workingOperations >= 5) {
    console.log('✅ EXCELLENT! Admin apps can work directly with database')
    console.log('   - No need to wait for Edge Function fixes')
    console.log('   - Frontend apps can use direct Supabase queries')
    console.log('   - Ready for V1 launch with authentication')
  } else if (workingOperations >= 3) {
    console.log('⚠️  PARTIAL: Some features available, may need authentication')
  } else {
    console.log('❌ BLOCKED: Database access issues need resolution')
  }
  
  console.log('\n🚀 V1 LAUNCH STRATEGY:')
  console.log('1. ✅ Use direct database queries in admin apps')
  console.log('2. ✅ Add authentication to admin interfaces') 
  console.log('3. ⚠️  Fix Edge Functions later (v1.1 update)')
  console.log('4. 🔄 Test all 6 admin applications individually')
  
  return workingOperations >= 5
}

testDirectDatabaseAccess()