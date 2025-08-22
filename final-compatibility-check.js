import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE
)

async function finalCompatibilityCheck() {
  console.log('🎯 FINAL COMPATIBILITY CHECK')
  console.log('============================\n')
  
  console.log('🗄️  Database Tables Status:\n')
  
  const allTables = [
    'products', 'enhanced_product_variants', 'product_variants', 'inventory_variants',
    'product_images', 'vendor_products', 'vendor_variants', 'vendor_inventory_levels',
    'vendor_import_decisions', 'product_overrides', 'orders', 'order_items', 'customers',
    'weddings', 'wedding_parties', 'groomsmen', 'measurements'
  ]
  
  let workingTables = 0
  let missingTables = 0
  
  for (const table of allTables) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1)
      
      if (error) {
        console.log(`❌ ${table}: ${error.message}`)
        missingTables++
      } else {
        console.log(`✅ ${table}: OK (${data?.length || 0} records)`)
        workingTables++
      }
    } catch (err) {
      console.log(`❌ ${table}: ${err.message}`)
      missingTables++
    }
  }
  
  console.log('\n⚡ Critical Edge Functions Status:\n')
  
  const keyFunctions = [
    'admin-hub-api',
    'inventory-management', 
    'get-products-enhanced',
    'vendor-inbox-items',
    'low-stock-alerts',
    'order-management',
    'wedding-management'
  ]
  
  let workingFunctions = 0
  let brokenFunctions = 0
  
  for (const func of keyFunctions) {
    const status = await testEdgeFunction(func)
    if (status === 'working') workingFunctions++
    else brokenFunctions++
  }
  
  console.log('\n📊 FINAL COMPATIBILITY SCORE')
  console.log('=============================')
  console.log(`Database Tables: ${workingTables}/${allTables.length} working`)
  console.log(`Edge Functions: ${workingFunctions}/${keyFunctions.length} working`)
  
  const totalScore = ((workingTables + workingFunctions) / (allTables.length + keyFunctions.length)) * 100
  console.log(`Overall Compatibility: ${totalScore.toFixed(1)}%`)
  
  if (totalScore >= 90) {
    console.log('\n🎉 EXCELLENT! Your admin system is ready for production!')
  } else if (totalScore >= 75) {
    console.log('\n✅ GOOD! Minor issues remain but core functionality should work')
  } else if (totalScore >= 50) {
    console.log('\n⚠️  FAIR! Significant issues need to be addressed')
  } else {
    console.log('\n❌ POOR! Major compatibility problems detected')
  }
  
  console.log('\n🚀 Next Steps:')
  if (missingTables > 0) {
    console.log(`1. Run CRITICAL-RUN-IN-SUPABASE.sql in Supabase SQL Editor`)
  }
  if (brokenFunctions > 0) {
    console.log(`2. Check Edge Function logs in Supabase Dashboard`)
  }
  console.log(`3. Test each admin app individually`)
  console.log(`4. Deploy and verify in production`)
}

async function testEdgeFunction(functionName) {
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
      return 'working'
    } else {
      console.log(`❌ ${functionName}: Error (HTTP ${response.status})`)
      return 'broken'
    }

  } catch (error) {
    console.log(`❌ ${functionName}: ${error.message}`)
    return 'broken'
  }
}

finalCompatibilityCheck().catch(console.error)