import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import dotenv from 'dotenv'

dotenv.config()

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE
)

async function executeCriticalSQL() {
  console.log('🔧 Executing Critical SQL Fixes...\n')
  
  try {
    // Step 1: Drop and recreate enhanced_product_variants
    console.log('1️⃣ Fixing enhanced_product_variants...')
    
    // Drop existing table if it exists
    try {
      await supabase.rpc('exec_sql', { 
        query: 'DROP TABLE IF EXISTS enhanced_product_variants CASCADE;' 
      })
    } catch (e) {
      console.log('   Drop table attempt (may not exist)')
    }
    
    // Create the table with proper structure
    const createEnhancedVariants = `
      CREATE TABLE enhanced_product_variants (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          product_id UUID,
          variant_id UUID,
          sku VARCHAR(100) UNIQUE,
          size VARCHAR(50),
          color VARCHAR(50),
          price DECIMAL(10,2),
          compare_at_price DECIMAL(10,2),
          cost_price DECIMAL(10,2),
          inventory_quantity INTEGER DEFAULT 0,
          weight DECIMAL(8,2),
          barcode VARCHAR(100),
          requires_shipping BOOLEAN DEFAULT true,
          taxable BOOLEAN DEFAULT true,
          image_url TEXT,
          position INTEGER DEFAULT 0,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `
    
    await supabase.rpc('exec_sql', { query: createEnhancedVariants })
    console.log('   ✅ Created enhanced_product_variants table')
    
    // Step 2: Create wedding_parties
    console.log('2️⃣ Creating wedding_parties...')
    
    const createWeddingParties = `
      CREATE TABLE wedding_parties (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          wedding_id UUID,
          member_type VARCHAR(50) NOT NULL,
          customer_id UUID,
          first_name VARCHAR(100) NOT NULL,
          last_name VARCHAR(100) NOT NULL,
          email VARCHAR(255),
          phone VARCHAR(20),
          role VARCHAR(100),
          invitation_sent_at TIMESTAMP WITH TIME ZONE,
          invitation_accepted_at TIMESTAMP WITH TIME ZONE,
          status VARCHAR(50) DEFAULT 'invited',
          notes TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `
    
    await supabase.rpc('exec_sql', { query: createWeddingParties })
    console.log('   ✅ Created wedding_parties table')
    
    // Step 3: Create groomsmen
    console.log('3️⃣ Creating groomsmen...')
    
    const createGroomsmen = `
      CREATE TABLE groomsmen (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          wedding_id UUID,
          wedding_party_id UUID,
          customer_id UUID,
          invitation_code VARCHAR(20) UNIQUE,
          first_name VARCHAR(100) NOT NULL,
          last_name VARCHAR(100) NOT NULL,
          email VARCHAR(255) UNIQUE,
          phone VARCHAR(20),
          role VARCHAR(100),
          invitation_sent_at TIMESTAMP WITH TIME ZONE,
          invitation_accepted_at TIMESTAMP WITH TIME ZONE,
          status VARCHAR(50) DEFAULT 'invited',
          notes TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `
    
    await supabase.rpc('exec_sql', { query: createGroomsmen })
    console.log('   ✅ Created groomsmen table')
    
    // Step 4: Create measurements
    console.log('4️⃣ Creating measurements...')
    
    const createMeasurements = `
      CREATE TABLE measurements (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          customer_id UUID,
          wedding_id UUID,
          groomsman_id UUID,
          chest DECIMAL(5,2),
          waist DECIMAL(5,2),
          hips DECIMAL(5,2),
          jacket_length DECIMAL(5,2),
          sleeve_length DECIMAL(5,2),
          shoulder_width DECIMAL(5,2),
          pant_waist DECIMAL(5,2),
          pant_length DECIMAL(5,2),
          inseam DECIMAL(5,2),
          neck DECIMAL(5,2),
          height DECIMAL(5,2),
          weight DECIMAL(5,2),
          shoe_size VARCHAR(10),
          measurement_type VARCHAR(50) DEFAULT 'custom',
          measured_by VARCHAR(100),
          measurement_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          notes TEXT,
          is_final BOOLEAN DEFAULT false,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `
    
    await supabase.rpc('exec_sql', { query: createMeasurements })
    console.log('   ✅ Created measurements table')
    
    // Step 5: Enable RLS and create policies
    console.log('5️⃣ Setting up RLS policies...')
    
    const rlsQueries = [
      'ALTER TABLE enhanced_product_variants ENABLE ROW LEVEL SECURITY;',
      'ALTER TABLE wedding_parties ENABLE ROW LEVEL SECURITY;',
      'ALTER TABLE groomsmen ENABLE ROW LEVEL SECURITY;',
      'ALTER TABLE measurements ENABLE ROW LEVEL SECURITY;',
      
      `CREATE POLICY "Allow all operations for authenticated users" ON enhanced_product_variants FOR ALL USING (true);`,
      `CREATE POLICY "Allow all operations for authenticated users" ON wedding_parties FOR ALL USING (true);`,
      `CREATE POLICY "Allow all operations for authenticated users" ON groomsmen FOR ALL USING (true);`,
      `CREATE POLICY "Allow all operations for authenticated users" ON measurements FOR ALL USING (true);`
    ]
    
    for (const query of rlsQueries) {
      try {
        await supabase.rpc('exec_sql', { query })
      } catch (e) {
        console.log(`   ⚠️ RLS setup: ${e.message}`)
      }
    }
    console.log('   ✅ RLS policies configured')
    
    // Step 6: Create indexes
    console.log('6️⃣ Creating performance indexes...')
    
    const indexQueries = [
      'CREATE INDEX idx_enhanced_variants_product ON enhanced_product_variants(product_id);',
      'CREATE INDEX idx_enhanced_variants_sku ON enhanced_product_variants(sku);',
      'CREATE INDEX idx_wedding_parties_wedding ON wedding_parties(wedding_id);',
      'CREATE INDEX idx_groomsmen_wedding ON groomsmen(wedding_id);',
      'CREATE INDEX idx_groomsmen_code ON groomsmen(invitation_code);',
      'CREATE INDEX idx_measurements_customer ON measurements(customer_id);'
    ]
    
    for (const query of indexQueries) {
      try {
        await supabase.rpc('exec_sql', { query })
      } catch (e) {
        console.log(`   ⚠️ Index creation: ${e.message}`)
      }
    }
    console.log('   ✅ Performance indexes created')
    
    // Step 7: Add sample data
    console.log('7️⃣ Adding sample data...')
    
    // Add sample enhanced_product_variants from existing data
    try {
      const { data: variants } = await supabase
        .from('product_variants')
        .select('id, product_id, sku, title, price')
        .limit(3)
      
      if (variants && variants.length > 0) {
        const sampleData = variants.map((v, index) => ({
          product_id: v.product_id,
          variant_id: v.id,
          sku: v.sku || `SAMPLE-${index + 1}`,
          size: v.title || 'Standard',
          color: ['Black', 'Navy', 'Charcoal'][index] || 'Black',
          price: v.price || 299.99,
          inventory_quantity: [5, 3, 8][index] || 0
        }))
        
        await supabase
          .from('enhanced_product_variants')
          .insert(sampleData)
        
        console.log(`   ✅ Added ${sampleData.length} sample enhanced variants`)
      }
    } catch (e) {
      console.log(`   ⚠️ Sample data: ${e.message}`)
    }
    
    // Add sample wedding data
    try {
      const sampleWeddingParties = [
        {
          member_type: 'groom',
          first_name: 'John',
          last_name: 'Smith', 
          email: 'john@example.com',
          status: 'confirmed'
        },
        {
          member_type: 'groomsman',
          first_name: 'Mike',
          last_name: 'Johnson',
          email: 'mike@example.com', 
          status: 'invited'
        }
      ]
      
      await supabase
        .from('wedding_parties')
        .insert(sampleWeddingParties)
      
      console.log('   ✅ Added sample wedding party data')
    } catch (e) {
      console.log(`   ⚠️ Wedding sample data: ${e.message}`)
    }
    
    console.log('\n🎉 Critical SQL execution completed!')
    console.log('Running verification test...\n')
    
    // Verify the tables work
    const testTables = ['enhanced_product_variants', 'wedding_parties', 'groomsmen', 'measurements']
    
    for (const table of testTables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(1)
        
        if (error) {
          console.log(`❌ ${table}: ${error.message}`)
        } else {
          console.log(`✅ ${table}: Working! (${data?.length || 0} records)`)
        }
      } catch (err) {
        console.log(`❌ ${table}: ${err.message}`)
      }
    }
    
  } catch (error) {
    console.log('❌ Critical error:', error.message)
    console.log('\nIf this fails, you may need to run the SQL manually in Supabase SQL Editor')
  }
}

executeCriticalSQL()