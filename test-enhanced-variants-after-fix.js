import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE
)

// Also test with anon key
const supabaseAnon = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
)

async function testEnhancedVariantsAfterFix() {
  console.log('🧪 Testing Enhanced Product Variants After Permission Fix')
  console.log('=======================================================\n')

  console.log('📊 Testing with SERVICE ROLE key...\n')
  
  // Test 1: Basic access
  try {
    const { data, error } = await supabase
      .from('enhanced_product_variants')
      .select('*')
      .limit(5)
    
    if (error) {
      console.log('❌ Service Role Access Failed:', error.message)
      return false
    } else {
      console.log(`✅ Service Role Access: SUCCESS! Found ${data?.length || 0} records`)
      if (data && data.length > 0) {
        console.log('   Sample record:', {
          id: data[0].id,
          sku: data[0].sku,
          price: data[0].price,
          inventory_quantity: data[0].inventory_quantity
        })
      }
    }
  } catch (err) {
    console.log('❌ Service Role Error:', err.message)
    return false
  }

  // Test 2: Check data sources (KCT vs Shopify)
  console.log('\n🔍 Analyzing data sources...')
  try {
    const { data, error } = await supabase
      .from('enhanced_product_variants')
      .select('sku, product_id')
    
    if (error) {
      console.log('❌ Data analysis failed:', error.message)
    } else {
      const kctProducts = data?.filter(item => item.sku?.includes('KCT')) || []
      const shopifyProducts = data?.filter(item => item.sku && !item.sku.includes('KCT')) || []
      
      console.log(`✅ Data Analysis:`)
      console.log(`   - Total variants: ${data?.length || 0}`)
      console.log(`   - KCT products: ${kctProducts.length}`)
      console.log(`   - Vendor/Shopify products: ${shopifyProducts.length}`)
    }
  } catch (err) {
    console.log('❌ Data analysis error:', err.message)
  }

  // Test 3: Insert/Update capability
  console.log('\n📝 Testing CRUD operations...')
  try {
    // Try inserting a test record
    const testVariant = {
      sku: 'TEST-ENHANCED-' + Date.now(),
      size: 'Test Size',
      color: 'Test Color',
      price: 99.99,
      inventory_quantity: 10
    }
    
    const { data: insertData, error: insertError } = await supabase
      .from('enhanced_product_variants')
      .insert(testVariant)
      .select()
    
    if (insertError) {
      console.log('❌ Insert test failed:', insertError.message)
    } else {
      console.log('✅ Insert test: SUCCESS!')
      
      // Clean up - delete the test record
      if (insertData && insertData[0]) {
        await supabase
          .from('enhanced_product_variants')
          .delete()
          .eq('id', insertData[0].id)
        console.log('   (Test record cleaned up)')
      }
    }
  } catch (err) {
    console.log('❌ CRUD test error:', err.message)
  }

  // Test 4: Test with ANON key (what the frontend uses)
  console.log('\n🔑 Testing with ANON key (frontend access)...')
  try {
    const { data, error } = await supabaseAnon
      .from('enhanced_product_variants')
      .select('*')
      .limit(3)
    
    if (error) {
      console.log('❌ Anon Key Access Failed:', error.message)
      console.log('   This could be why your frontend is getting 401 errors')
    } else {
      console.log(`✅ Anon Key Access: SUCCESS! Found ${data?.length || 0} records`)
    }
  } catch (err) {
    console.log('❌ Anon Key Error:', err.message)
  }

  // Test 5: Edge Function simulation
  console.log('\n🌐 Testing Edge Function access pattern...')
  try {
    // Simulate what Edge Functions do
    const url = `${process.env.SUPABASE_URL}/rest/v1/enhanced_product_variants?select=*&limit=3`
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'apikey': process.env.SUPABASE_SERVICE_ROLE,
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE}`,
        'Content-Type': 'application/json'
      }
    })
    
    if (!response.ok) {
      console.log(`❌ Edge Function simulation failed: HTTP ${response.status}`)
      const errorText = await response.text()
      console.log('   Error:', errorText.substring(0, 200))
    } else {
      const data = await response.json()
      console.log(`✅ Edge Function simulation: SUCCESS! HTTP ${response.status}`)
      console.log(`   Retrieved ${data?.length || 0} records via REST API`)
    }
  } catch (err) {
    console.log('❌ Edge Function simulation error:', err.message)
  }

  console.log('\n📋 SUMMARY')
  console.log('===========')
  console.log('If all tests above show ✅ SUCCESS, your enhanced_product_variants table should work!')
  console.log('If you see ❌ errors, you may need to run the SIMPLE-FIX-ENHANCED-VARIANTS-PERMISSIONS.sql in Supabase SQL Editor')
  console.log('\n💡 Next Steps:')
  console.log('1. If tests pass: Check your frontend app deployments')
  console.log('2. If tests fail: Run the SQL fix in Supabase Dashboard')
  console.log('3. Test your Enhanced Inventory app after the fix')
}

testEnhancedVariantsAfterFix().catch(console.error)