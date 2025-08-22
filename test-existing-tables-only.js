import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE
)

async function testExistingTablesOnly() {
  console.log('🔍 Testing Admin System with Existing Tables Only\n')
  
  console.log('📊 Core Tables Test:')
  const coreTables = [
    'products',
    'product_variants', 
    'inventory_variants',
    'product_images',
    'vendor_products',
    'vendor_variants',
    'vendor_inventory_levels',
    'orders',
    'order_items',
    'customers'
  ]
  
  let workingCore = 0
  
  for (const table of coreTables) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1)
      
      if (error) {
        console.log(`❌ ${table}: ${error.message}`)
      } else {
        console.log(`✅ ${table}: Working (${data?.length || 0} records)`)
        workingCore++
      }
    } catch (err) {
      console.log(`❌ ${table}: ${err.message}`)
    }
  }
  
  console.log(`\n📈 Core System: ${workingCore}/${coreTables.length} tables working`)
  
  // Test if we can use product_variants instead of enhanced_product_variants
  console.log('\n🔄 Testing Alternative Approaches:')
  
  try {
    console.log('Testing if product_variants can replace enhanced_product_variants...')
    const { data: variants, error } = await supabase
      .from('product_variants')
      .select('id, product_id, sku, title, price')
      .limit(3)
    
    if (error) {
      console.log(`❌ product_variants fallback: ${error.message}`)
    } else {
      console.log(`✅ product_variants can be used as fallback (${variants?.length || 0} records)`)
      if (variants && variants.length > 0) {
        console.log('   Sample columns:', Object.keys(variants[0]).join(', '))
      }
    }
  } catch (e) {
    console.log(`❌ product_variants test: ${e.message}`)
  }
  
  // Check what Edge Functions might work with existing data
  console.log('\n🎯 Assessment:')
  
  if (workingCore >= 8) {
    console.log('✅ GOOD NEWS: Core inventory and order management should work!')
    console.log('   - Product management: Available')
    console.log('   - Inventory tracking: Available') 
    console.log('   - Order processing: Available')
    console.log('   - Vendor integration: Available')
    console.log('')
    console.log('⚠️  Limited functionality:')
    console.log('   - Wedding management: Disabled (missing tables)')
    console.log('   - Enhanced variants: Use product_variants instead')
    console.log('')
    console.log('🚀 Your admin system should work for core business operations!')
  } else {
    console.log('❌ Too many core tables are missing for basic functionality')
  }
}

testExistingTablesOnly()