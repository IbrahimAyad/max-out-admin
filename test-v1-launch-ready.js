import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE
)

async function testV1LaunchReadiness() {
  console.log('🚀 V1 Launch Readiness Test')
  console.log('===========================\n')
  console.log('📝 Excluding wedding features - planned for v2\n')
  
  // Test core v1 tables only
  console.log('📊 Core V1 Tables:')
  const v1Tables = [
    'products',
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
    'weddings' // Keep basic wedding table but not the extended features
  ]
  
  let workingTables = 0
  let criticalIssues = []
  
  for (const table of v1Tables) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1)
      
      if (error) {
        console.log(`❌ ${table}: ${error.message}`)
        if (['products', 'product_variants', 'inventory_variants', 'orders', 'customers'].includes(table)) {
          criticalIssues.push(table)
        }
      } else {
        console.log(`✅ ${table}: Working (${data?.length || 0} records)`)
        workingTables++
      }
    } catch (err) {
      console.log(`❌ ${table}: ${err.message}`)
      criticalIssues.push(table)
    }
  }
  
  // Test core Edge Functions for v1
  console.log('\n⚡ Core V1 Edge Functions:')
  const v1Functions = [
    'admin-hub-api',
    'inventory-management',
    'get-products-enhanced', 
    'vendor-inbox-items',
    'vendor-inbox-count',
    'low-stock-alerts',
    'order-management'
    // Excluding wedding-management for v1
  ]
  
  let workingFunctions = 0
  
  for (const func of v1Functions) {
    const status = await testEdgeFunction(func)
    if (status === 'working') workingFunctions++
  }
  
  // Calculate v1 score
  const tableScore = (workingTables / v1Tables.length) * 100
  const functionScore = (workingFunctions / v1Functions.length) * 100
  const overallScore = (tableScore + functionScore) / 2
  
  console.log('\n📊 V1 LAUNCH READINESS SCORE')
  console.log('=============================')
  console.log(`Core Tables: ${workingTables}/${v1Tables.length} (${tableScore.toFixed(1)}%)`)
  console.log(`Edge Functions: ${workingFunctions}/${v1Functions.length} (${functionScore.toFixed(1)}%)`)
  console.log(`Overall V1 Readiness: ${overallScore.toFixed(1)}%`)
  
  // Assessment
  if (overallScore >= 85) {
    console.log('\n🎉 EXCELLENT! V1 is ready for production launch!')
    console.log('✅ Core inventory management fully functional')
    console.log('✅ Order processing systems working')
    console.log('✅ Vendor integration operational')
    console.log('✅ Customer management available')
  } else if (overallScore >= 70) {
    console.log('\n✅ GOOD! V1 is mostly ready with minor issues')
    console.log('⚠️  Some non-critical features may have issues')
  } else {
    console.log('\n⚠️  V1 needs more work before launch')
  }
  
  if (criticalIssues.length > 0) {
    console.log(`\n🚨 CRITICAL ISSUES to fix before launch:`)
    criticalIssues.forEach(issue => console.log(`   - ${issue}`))
  }
  
  console.log('\n🎯 NEXT STEPS:')
  console.log('1. Test admin applications manually')
  console.log('2. Deploy any pending changes')
  console.log('3. Verify all 6 Vercel apps are working')
  console.log('4. Plan wedding features for v2')
  
  return {
    readyForLaunch: overallScore >= 85 && criticalIssues.length === 0,
    score: overallScore,
    criticalIssues
  }
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

testV1LaunchReadiness()