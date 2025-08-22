import supabase from './supabaseClient.js'
import { getTableInfo, updateProductInventory } from './databaseHelpers.js'

async function testConnection() {
  try {
    console.log('🔍 Testing Supabase connection...')
    
    // Test connection with a simple read
    const { data: products, error: productError } = await supabase
      .from('products')
      .select('id, name, sku')
      .limit(3)
    
    if (productError) {
      console.error('❌ Connection failed:', productError)
      return
    }
    
    console.log('✅ Connection successful!')
    console.log('📦 Sample products:', products)
    
    // Test different tables
    console.log('\n📊 Testing table access...')
    
    const tables = [
      'enhanced_product_variants',
      'product_images', 
      'vendor_products',
      'vendor_variants'
    ]
    
    for (const tableName of tables) {
      const result = await getTableInfo(tableName)
      if (result.success) {
        console.log(`✅ ${tableName}: ${result.count} records found`)
      } else {
        console.log(`❌ ${tableName}: ${result.error}`)
      }
    }
    
    // Show what we can do with service role key vs anon key
    console.log('\n🔑 Current key type: ', process.env.SUPABASE_SERVICE_ROLE.includes('anon') ? 'ANON (limited)' : 'SERVICE ROLE (full access)')
    
    if (!process.env.SUPABASE_SERVICE_ROLE.includes('anon')) {
      console.log('\n🚀 Testing write operations (Service Role only)...')
      
      // Example: Update inventory (this will only work with service role)
      const testUpdate = await updateProductInventory(
        '30de44ac-47a4-4bc5-8f8b-9ab5d693c383', // Use variant ID from schema check
        100
      )
      
      if (testUpdate.success) {
        console.log('✅ Inventory update successful:', testUpdate.data)
      } else {
        console.log('❌ Inventory update failed:', testUpdate.error)
      }
    } else {
      console.log('⚠️  Cannot test write operations with anon key. Please provide service role key.')
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error)
  }
}

// Run the test
console.log('🎯 Supabase Database Tooling Test')
console.log('================================')
testConnection()