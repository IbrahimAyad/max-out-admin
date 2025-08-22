import supabase from './supabaseClient.js'

async function createRLSPolicies() {
  console.log('🔧 Creating RLS policies for authenticated users...\n')

  try {
    // Method 1: Try using raw SQL
    console.log('1. Setting up RLS policies with service role...')
    
    // Enable RLS on enhanced_product_variants
    const { error: rlsError1 } = await supabase
      .from('enhanced_product_variants')
      .select('id')
      .limit(0) // This is just to test the connection
    
    console.log('Connection test result:', rlsError1 ? rlsError1.message : 'Connected')
    
    // Try direct SQL execution
    console.log('2. Attempting to create policies...')
    
    // Create a comprehensive policy setup
    const policies = [
      // Enhanced product variants policies
      `ALTER TABLE enhanced_product_variants ENABLE ROW LEVEL SECURITY;`,
      `DROP POLICY IF EXISTS "Allow authenticated users to read variants" ON enhanced_product_variants;`,
      `CREATE POLICY "Allow authenticated users to read variants" 
        ON enhanced_product_variants FOR SELECT 
        TO authenticated 
        USING (true);`,
      `DROP POLICY IF EXISTS "Allow authenticated users to update variants" ON enhanced_product_variants;`,
      `CREATE POLICY "Allow authenticated users to update variants" 
        ON enhanced_product_variants FOR UPDATE 
        TO authenticated 
        USING (true) WITH CHECK (true);`,
      
      // Products policies  
      `ALTER TABLE products ENABLE ROW LEVEL SECURITY;`,
      `DROP POLICY IF EXISTS "Allow authenticated users to read products" ON products;`,
      `CREATE POLICY "Allow authenticated users to read products" 
        ON products FOR SELECT 
        TO authenticated 
        USING (true);`,
      
      // Product images policies
      `ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;`,
      `DROP POLICY IF EXISTS "Allow authenticated users to read images" ON product_images;`,
      `CREATE POLICY "Allow authenticated users to read images" 
        ON product_images FOR SELECT 
        TO authenticated 
        USING (true);`,
      `DROP POLICY IF EXISTS "Allow authenticated users to update images" ON product_images;`,
      `CREATE POLICY "Allow authenticated users to update images" 
        ON product_images FOR UPDATE 
        TO authenticated 
        USING (true) WITH CHECK (true);`
    ]
    
    console.log('📋 SQL policies to execute:')
    policies.forEach((sql, i) => {
      console.log(`   ${i + 1}. ${sql.split(' ').slice(0, 5).join(' ')}...`)
    })
    
    console.log('\n⚠️ These policies need to be executed in Supabase SQL Editor')
    console.log('   Copy the policies above and run them in your Supabase dashboard')
    
    // Alternative: Try to test if we can use rpc
    console.log('\n3. Testing if we can use RPC for policy creation...')
    
    const { data: rpcTest, error: rpcError } = await supabase
      .rpc('version')
    
    if (rpcError) {
      console.log('❌ RPC not available:', rpcError.message)
    } else {
      console.log('✅ RPC available, version:', rpcTest)
    }
    
  } catch (error) {
    console.log('❌ Policy creation failed:', error.message)
  }
}

createRLSPolicies()