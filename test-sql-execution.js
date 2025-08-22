import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE
)

async function createTablesDirectly() {
  console.log('🔧 Attempting Direct Table Creation...\n')
  
  // Let's try to understand what RPC functions are available
  console.log('🔍 Checking available RPC functions...')
  
  try {
    // Try to call a simple function to test RPC availability
    const { data, error } = await supabase.rpc('version')
    if (error) {
      console.log('❌ RPC not available:', error.message)
    } else {
      console.log('✅ RPC is working')
    }
  } catch (e) {
    console.log('❌ RPC error:', e.message)
  }
  
  // Let's try using raw SQL through the REST API
  console.log('\n🧪 Testing raw SQL execution...')
  
  try {
    const response = await fetch(`${process.env.SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'apikey': process.env.SUPABASE_SERVICE_ROLE,
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        query: 'SELECT 1 as test;'
      })
    })
    
    console.log('Raw SQL response status:', response.status)
    const result = await response.text()
    console.log('Raw SQL response:', result.substring(0, 200))
    
  } catch (e) {
    console.log('❌ Raw SQL error:', e.message)
  }
  
  // Alternative: Try using Supabase's SQL execution through admin API
  console.log('\n🔄 Testing alternative SQL execution...')
  
  try {
    // Create a simple test table first
    const testSQL = `
      CREATE TABLE IF NOT EXISTS test_table_creation (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        test_column TEXT
      );
    `
    
    const response = await fetch(`${process.env.SUPABASE_URL}/rest/v1/rpc/exec`, {
      method: 'POST',
      headers: {
        'apikey': process.env.SUPABASE_SERVICE_ROLE,
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        sql: testSQL
      })
    })
    
    console.log('Alternative SQL status:', response.status)
    const altResult = await response.text()
    console.log('Alternative SQL response:', altResult.substring(0, 200))
    
  } catch (e) {
    console.log('❌ Alternative SQL error:', e.message)
  }
  
  console.log('\n📋 Analysis:')
  console.log('The Supabase client cannot execute DDL (CREATE TABLE) statements')
  console.log('You will need to run the SQL manually in the Supabase Dashboard')
  console.log('Go to: Supabase Dashboard → SQL Editor → Paste CRITICAL-RUN-IN-SUPABASE.sql')
}

createTablesDirectly()