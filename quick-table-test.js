import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE
)

async function quickTableTest() {
  console.log('🧪 Quick Table Access Test\n')
  
  const testTables = [
    'enhanced_product_variants',
    'wedding_parties', 
    'groomsmen',
    'measurements'
  ]
  
  for (const table of testTables) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1)
      
      if (error) {
        console.log(`❌ ${table}: ${error.message}`)
      } else {
        console.log(`✅ ${table}: Access granted! (${data?.length || 0} records)`)
        if (data && data.length > 0) {
          const columns = Object.keys(data[0]).slice(0, 5)
          console.log(`   Columns: ${columns.join(', ')}...`)
        }
      }
    } catch (err) {
      console.log(`❌ ${table}: ${err.message}`)
    }
  }
}

quickTableTest()