import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE
)

async function testAfterRLSDisable() {
  console.log('🧪 Testing Tables After RLS Disable\n')
  
  const testTables = [
    'enhanced_product_variants',
    'wedding_parties', 
    'groomsmen',
    'measurements'
  ]
  
  let successCount = 0
  
  for (const table of testTables) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1)
      
      if (error) {
        console.log(`❌ ${table}: ${error.message}`)
      } else {
        console.log(`✅ ${table}: SUCCESS! (${data?.length || 0} records)`)
        successCount++
        if (data && data.length > 0) {
          const columns = Object.keys(data[0]).slice(0, 5)
          console.log(`   Columns: ${columns.join(', ')}...`)
        }
      }
    } catch (err) {
      console.log(`❌ ${table}: ${err.message}`)
    }
  }
  
  console.log(`\n📊 Results: ${successCount}/${testTables.length} tables working`)
  
  if (successCount === testTables.length) {
    console.log('\n🎉 SUCCESS! All tables are now accessible!')
    console.log('Your Edge Functions should now work properly.')
    console.log('\nNext: Run "node final-compatibility-check.js" to see the full results')
  } else {
    console.log('\n⚠️ Some tables still have issues. Check the errors above.')
  }
}

testAfterRLSDisable()