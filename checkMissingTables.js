import supabase from './supabaseClient.js'

async function checkMissingTables() {
  console.log('🔍 Checking tables required by Edge Functions...\n')
  
  const requiredTables = [
    'orders',
    'admin_notifications', 
    'customers',
    'order_processing_queue'
  ]
  
  for (const tableName of requiredTables) {
    try {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(1)
      
      if (error) {
        console.log(`❌ ${tableName}: ${error.message}`)
      } else {
        console.log(`✅ ${tableName}: Table exists (${data ? data.length : 0} sample records)`)
        if (data && data.length > 0) {
          console.log(`   Sample columns: ${Object.keys(data[0]).slice(0, 5).join(', ')}...`)
        }
      }
    } catch (err) {
      console.log(`❌ ${tableName}: ${err.message}`)
    }
  }
  
  console.log('\n📋 Analysis:')
  console.log('   If tables are missing, we need to create them or')
  console.log('   modify the Edge Functions to use existing tables.')
}

checkMissingTables()