import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE
)

async function createMissingTables() {
  console.log('🔧 Creating Missing Tables Directly...\n')
  
  // Test 1: Try to create enhanced_product_variants with proper permissions
  console.log('1️⃣ Creating enhanced_product_variants...')
  try {
    // First, let's check if we can create tables directly via admin
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS enhanced_product_variants (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          product_id UUID,
          variant_id UUID,
          sku VARCHAR(100) UNIQUE,
          size VARCHAR(50),
          color VARCHAR(50),
          price DECIMAL(10,2),
          inventory_quantity INTEGER DEFAULT 0,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      
      ALTER TABLE enhanced_product_variants ENABLE ROW LEVEL SECURITY;
      
      CREATE POLICY "Allow all for authenticated users" ON enhanced_product_variants
          FOR ALL USING (true);
    `
    
    // We'll need to use Supabase's SQL editor directly or insert records to test
    const { data, error } = await supabase
      .from('enhanced_product_variants')
      .insert([
        {
          sku: 'TEST-SKU-001',
          size: '42R',
          color: 'Black',
          price: 299.99,
          inventory_quantity: 5
        }
      ])
      .select()
    
    if (error) {
      console.log(`❌ enhanced_product_variants: ${error.message}`)
    } else {
      console.log(`✅ enhanced_product_variants: Working! Created test record`)
    }
  } catch (err) {
    console.log(`❌ enhanced_product_variants: ${err.message}`)
  }

  // Test 2: Create wedding_parties via insertion
  console.log('\n2️⃣ Testing wedding_parties...')
  try {
    const { data, error } = await supabase
      .from('wedding_parties')
      .insert([
        {
          member_type: 'groom',
          first_name: 'Test',
          last_name: 'Groom',
          email: 'test@example.com',
          status: 'confirmed'
        }
      ])
      .select()
    
    if (error) {
      console.log(`❌ wedding_parties: ${error.message}`)
    } else {
      console.log(`✅ wedding_parties: Working! Created test record`)
    }
  } catch (err) {
    console.log(`❌ wedding_parties: ${err.message}`)
  }

  // Test 3: Create groomsmen 
  console.log('\n3️⃣ Testing groomsmen...')
  try {
    const { data, error } = await supabase
      .from('groomsmen')
      .insert([
        {
          invitation_code: 'TEST123',
          first_name: 'Test',
          last_name: 'Groomsman',
          email: 'groomsman@example.com',
          role: 'groomsman',
          status: 'invited'
        }
      ])
      .select()
    
    if (error) {
      console.log(`❌ groomsmen: ${error.message}`)
    } else {
      console.log(`✅ groomsmen: Working! Created test record`)
    }
  } catch (err) {
    console.log(`❌ groomsmen: ${err.message}`)
  }

  // Test 4: Create measurements
  console.log('\n4️⃣ Testing measurements...')
  try {
    const { data, error } = await supabase
      .from('measurements')
      .insert([
        {
          chest: 42.0,
          waist: 36.0,
          height: 72.0,
          measurement_type: 'custom',
          is_final: false
        }
      ])
      .select()
    
    if (error) {
      console.log(`❌ measurements: ${error.message}`)
    } else {
      console.log(`✅ measurements: Working! Created test record`)
    }
  } catch (err) {
    console.log(`❌ measurements: ${err.message}`)
  }
  
  console.log('\n📋 Summary:')
  console.log('If tables show as "relation does not exist", you need to create them via Supabase SQL Editor')
  console.log('If you see permission errors, the tables exist but need RLS policy fixes')
}

createMissingTables()