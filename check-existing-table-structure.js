import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE
)

async function checkExistingTableStructure() {
  console.log('🔍 Checking Existing Enhanced Product Variants Table Structure')
  console.log('============================================================\n')
  
  // Try to get table info through different methods
  console.log('1️⃣ Attempting to check table columns...')
  
  try {
    // Method 1: Try to query the table structure
    const { data, error } = await supabase
      .rpc('sql', { 
        query: `
          SELECT column_name, data_type, is_nullable, column_default
          FROM information_schema.columns 
          WHERE table_name = 'enhanced_product_variants' 
          AND table_schema = 'public'
          ORDER BY ordinal_position;
        `
      })
    
    if (error) {
      console.log('❌ Could not get column info via RPC:', error.message)
    } else {
      console.log('✅ Table structure:')
      data?.forEach(col => {
        console.log(`   ${col.column_name}: ${col.data_type} ${col.is_nullable === 'YES' ? '(nullable)' : '(not null)'}`)
      })
    }
  } catch (e) {
    console.log('❌ RPC method failed:', e.message)
  }
  
  // Method 2: Try to check via pg_catalog (if accessible)
  console.log('\n2️⃣ Checking table existence...')
  
  try {
    // Simple existence check
    const response = await fetch(`${process.env.SUPABASE_URL}/rest/v1/enhanced_product_variants?select=*&limit=0`, {
      headers: {
        'apikey': process.env.SUPABASE_SERVICE_ROLE,
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE}`
      }
    })
    
    console.log(`Table existence check: HTTP ${response.status}`)
    
    if (response.status === 200) {
      console.log('✅ Table exists and is accessible via REST API')
    } else if (response.status === 401) {
      console.log('⚠️  Table exists but has permission issues')
    } else if (response.status === 404) {
      console.log('❌ Table does not exist')
    } else {
      console.log(`⚠️  Unexpected status: ${response.status}`)
    }
    
  } catch (e) {
    console.log('❌ REST API check failed:', e.message)
  }
  
  // Method 3: Check what other similar tables we have access to
  console.log('\n3️⃣ Checking related working tables for reference...')
  
  const relatedTables = ['product_variants', 'vendor_variants', 'products']
  
  for (const table of relatedTables) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1)
      
      if (error) {
        console.log(`❌ ${table}: ${error.message}`)
      } else {
        console.log(`✅ ${table}: Accessible`)
        if (data && data.length > 0) {
          const columns = Object.keys(data[0])
          console.log(`   Columns (${columns.length}): ${columns.join(', ')}`)
        }
      }
    } catch (e) {
      console.log(`❌ ${table}: ${e.message}`)
    }
  }
  
  console.log('\n📋 RECOMMENDATION:')
  console.log('Run SIMPLE-FIX-ENHANCED-VARIANTS-PERMISSIONS.sql to fix permissions')
  console.log('This will preserve your existing table structure and data')
}

checkExistingTableStructure()