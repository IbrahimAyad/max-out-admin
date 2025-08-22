import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE
)

async function checkDatabaseSchema() {
  console.log('🔍 Checking Current Database Schema and Edge Function Compatibility')
  console.log('================================================================\n')

  // Test the key tables your admin apps need
  const criticalTables = [
    'products',
    'enhanced_product_variants', 
    'product_variants',
    'inventory_variants',
    'product_images',
    'vendor_products',
    'vendor_variants', 
    'vendor_inventory_levels',
    'vendor_import_decisions',
    'product_overrides',
    'orders',
    'order_items',
    'customers',
    'weddings',
    'wedding_parties',
    'groomsmen',
    'measurements'
  ]

  console.log('📊 Testing Database Tables:\n')
  
  const existingTables = []
  const missingTables = []

  for (const tableName of criticalTables) {
    try {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(1)

      if (error) {
        console.log(`❌ ${tableName}: ${error.message}`)
        missingTables.push(tableName)
      } else {
        console.log(`✅ ${tableName}: Available (${data?.length || 0} records)`)
        existingTables.push(tableName)
        if (data && data.length > 0) {
          const columns = Object.keys(data[0]).slice(0, 8)
          console.log(`   Columns: ${columns.join(', ')}${Object.keys(data[0]).length > 8 ? '...' : ''}`)
        }
      }
    } catch (err) {
      console.log(`❌ ${tableName}: ${err.message}`)
      missingTables.push(tableName)
    }
  }

  console.log('\n🧪 Testing Critical Edge Functions:\n')

  // Test the most important Edge Functions for your admin apps
  const keyFunctions = [
    'admin-hub-api',
    'inventory-management',
    'get-products-enhanced', 
    'vendor-inbox-items',
    'vendor-inbox-count',
    'low-stock-alerts',
    'order-management',
    'wedding-management',
    'analytics-dashboard'
  ]

  for (const functionName of keyFunctions) {
    await testFunction(functionName)
  }

  // Summary
  console.log('\n📋 COMPATIBILITY SUMMARY')
  console.log('========================\n')
  
  console.log(`✅ Working Tables (${existingTables.length}):`)
  existingTables.forEach(table => console.log(`   - ${table}`))
  
  if (missingTables.length > 0) {
    console.log(`\n❌ Missing Tables (${missingTables.length}):`)
    missingTables.forEach(table => console.log(`   - ${table}`))
  }

  console.log('\n🎯 RECOMMENDED ACTIONS:')
  console.log('======================')
  
  if (missingTables.length > 0) {
    console.log('1. ⚠️  Create missing database tables (run database-setup.sql)')
    console.log('2. 🔄 Deploy any Edge Functions that failed')
    console.log('3. ✅ Test admin applications end-to-end')
  } else {
    console.log('1. ✅ Database schema looks complete!')
    console.log('2. 🧪 Test admin applications thoroughly')
    console.log('3. 🚀 Your system should be ready for production')
  }
}

async function testFunction(functionName) {
  try {
    const url = `https://gvcswimqaxvylgxbklbz.supabase.co/functions/v1/${functionName}`
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE}`,
        'Content-Type': 'application/json'
      }
    })

    if (response.ok) {
      console.log(`✅ ${functionName}: Working (HTTP ${response.status})`)
    } else if (response.status === 401) {
      console.log(`⚠️  ${functionName}: Authentication issue (HTTP ${response.status})`)
    } else {
      console.log(`❌ ${functionName}: Error (HTTP ${response.status})`)
    }

  } catch (error) {
    console.log(`❌ ${functionName}: ${error.message}`)
  }
}

checkDatabaseSchema().catch(console.error)