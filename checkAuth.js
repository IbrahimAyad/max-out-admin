import supabase from './supabaseClient.js'

async function checkRLSAndAuth() {
  console.log('🔍 Checking RLS policies and authentication setup...\n')
  
  try {
    // Test products table with service role
    console.log('1. Testing products table with SERVICE ROLE:')
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, name, category')
      .limit(3)
    
    if (productsError) {
      console.log('❌ Products failed:', productsError.message)
    } else {
      console.log('✅ Products work:', products.length, 'records')
      console.log('   Sample:', products[0])
    }

    // Test enhanced_product_variants table
    console.log('\n2. Testing enhanced_product_variants with SERVICE ROLE:')
    const { data: variants, error: variantsError } = await supabase
      .from('enhanced_product_variants')
      .select('id, sku, inventory_quantity, stock_status')
      .limit(3)
    
    if (variantsError) {
      console.log('❌ Variants failed:', variantsError.message)
      console.log('   This explains the 401 error in the frontend!')
    } else {
      console.log('✅ Variants work:', variants.length, 'records')
      console.log('   Sample:', variants[0])
    }

    // Check if we can simulate anon key access
    console.log('\n3. Testing what would happen with anon key authentication...')
    
    // Create a test anon client to simulate frontend behavior
    const { createClient } = await import('@supabase/supabase-js')
    const anonClient = createClient(
      'https://gvcswimqaxvylgxbklbz.supabase.co',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd2Y3N3aW1xYXh2eWxneGJrbGJ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM3NjA1MzAsImV4cCI6MjA2OTMzNjUzMH0.UZdiGcJXUV5VYetjWXV26inmbj2yXdiT03Z6t_5Lg24'
    )
    
    // Test anon access to products
    const { data: anonProducts, error: anonProductsError } = await anonClient
      .from('products')
      .select('id, name')
      .limit(1)
    
    if (anonProductsError) {
      console.log('❌ Anon access to products failed:', anonProductsError.message)
    } else {
      console.log('✅ Anon access to products works')
    }

    // Test anon access to enhanced_product_variants
    const { data: anonVariants, error: anonVariantsError } = await anonClient
      .from('enhanced_product_variants')
      .select('id, sku')
      .limit(1)
    
    if (anonVariantsError) {
      console.log('❌ Anon access to variants failed:', anonVariantsError.message)
      console.log('   🎯 This is the root cause of the 401 errors!')
    } else {
      console.log('✅ Anon access to variants works')
    }

    // Test authenticated user simulation
    console.log('\n4. Testing what authenticated frontend should do...')
    console.log('   The frontend needs to authenticate first, then use the auth token')
    console.log('   Current frontend flow: Login → Get JWT → Use JWT for database calls')
    
  } catch (error) {
    console.log('❌ Test failed:', error.message)
  }
}

checkRLSAndAuth()