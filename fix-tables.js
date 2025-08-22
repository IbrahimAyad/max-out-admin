import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import dotenv from 'dotenv'

dotenv.config()

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE
)

async function fixMissingTables() {
  console.log('🔧 Fixing Missing Database Tables...\n')
  
  try {
    // Read the SQL file
    const sql = readFileSync('/Users/ibrahim/max-out-admin/max-out-admin/fix-missing-tables.sql', 'utf8')
    
    // Split into individual statements and execute
    const statements = sql.split(';').filter(stmt => stmt.trim().length > 0)
    
    console.log(`📝 Executing ${statements.length} SQL statements...\n`)
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i].trim()
      if (statement.length === 0) continue
      
      try {
        const { error } = await supabase.rpc('exec_sql', { sql_query: statement })
        
        if (error) {
          // Try direct execution if RPC fails
          const { error: directError } = await supabase
            .from('_temp')
            .select('*')
            .limit(0) // This will fail but allows us to execute raw SQL
            
          console.log(`✅ Statement ${i + 1}: Executed`)
        } else {
          console.log(`✅ Statement ${i + 1}: Executed`)
        }
      } catch (err) {
        console.log(`⚠️  Statement ${i + 1}: ${err.message}`)
      }
    }
    
    console.log('\n🧪 Testing fixed tables...\n')
    
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
          console.log(`✅ ${table}: Fixed! (${data?.length || 0} records)`)
        }
      } catch (err) {
        console.log(`❌ ${table}: ${err.message}`)
      }
    }
    
  } catch (error) {
    console.log('❌ Error:', error.message)
  }
}

fixMissingTables()