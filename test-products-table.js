import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabaseAnon = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
)

async function testProductsTable() {
  console.log('🧪 Testing Products Table with Anon Key (Frontend Pattern)')
  console.log('=======================================================\n')
  
  // Test products table
  try {
    const { data, error } = await supabaseAnon
      .from('products')
      .select('*')
      .limit(3)
    
    if (error) {
      console.log('❌ Products table error:', error.message)
    } else {
      console.log('✅ Products table works! Found', data?.length, 'products')
      if (data && data[0]) {
        console.log('   Sample product:', {
          id: data[0].id,
          name: data[0].name,
          category: data[0].category
        })
      }
    }
  } catch (err) {
    console.log('❌ Products table exception:', err.message)
  }

  // Test both together (like InventoryManagement component does)
  console.log('\n🔄 Testing both tables together (like InventoryManagement.tsx)...')
  try {
    const [productsRes, variantsRes] = await Promise.all([
      supabaseAnon.from('products').select('*').limit(2),
      supabaseAnon.from('enhanced_product_variants').select('*').limit(2)
    ])
    
    if (productsRes.error) {
      console.log('❌ Products query failed:', productsRes.error.message)
    } else {
      console.log('✅ Products query succeeded:', productsRes.data?.length, 'products')
    }
    
    if (variantsRes.error) {
      console.log('❌ Variants query failed:', variantsRes.error.message)
    } else {
      console.log('✅ Variants query succeeded:', variantsRes.data?.length, 'variants')
    }
    
    console.log('\n📊 DIAGNOSIS:')
    if (!productsRes.error && !variantsRes.error) {
      console.log('✅ Database queries work fine! The 401 errors are likely from:')
      console.log('   1. Incorrect Supabase client configuration in the deployed app')
      console.log('   2. Missing/wrong environment variables in Vercel deployment')
      console.log('   3. Old cached build that needs redeploy')
    } else {
      console.log('❌ Database permission issues found!')
    }
    
  } catch (err) {
    console.log('❌ Combined test exception:', err.message)
  }
}

testProductsTable().catch(console.error)