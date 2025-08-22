import supabase from './supabaseClient.js'

async function checkSchema() {
  console.log('🔍 Checking database schema...\n')
  
  const tables = [
    'enhanced_product_variants',
    'vendor_products',
    'vendor_variants'
  ]
  
  for (const tableName of tables) {
    try {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(1)
      
      if (error) {
        console.log(`❌ ${tableName}: ${error.message}`)
      } else if (data && data.length > 0) {
        console.log(`✅ ${tableName} columns:`)
        console.log(Object.keys(data[0]).join(', '))
        console.log(`📝 Sample record:`)
        console.log(JSON.stringify(data[0], null, 2))
        console.log('\n' + '─'.repeat(50) + '\n')
      } else {
        console.log(`⚠️ ${tableName}: No records found`)
      }
    } catch (err) {
      console.log(`❌ ${tableName}: ${err.message}`)
    }
  }
}

checkSchema()