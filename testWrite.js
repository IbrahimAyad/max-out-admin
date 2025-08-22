import supabase from './supabaseClient.js'

async function testWriteOperation() {
  console.log('🧪 Testing write operation with service role...\n')
  
  try {
    // Test with product_images table since it's accessible
    const { data: before, error: beforeError } = await supabase
      .from('product_images')
      .select('*')
      .limit(1)
      .single()
    
    if (beforeError) {
      console.log('❌ Read test failed:', beforeError.message)
      return
    }
    
    console.log('📖 Before update:', JSON.stringify(before, null, 2))
    
    // Try to update a field 
    const { data: updated, error: updateError } = await supabase
      .from('product_images')
      .update({ alt_text: 'Updated via service role - ' + new Date().toISOString() })
      .eq('id', before.id)
      .select()
      .single()
    
    if (updateError) {
      console.log('❌ Update failed:', updateError.message)
    } else {
      console.log('✅ Update successful!')
      console.log('📝 After update:', JSON.stringify(updated, null, 2))
    }
    
    // Test creating a new record
    console.log('\n➕ Testing insert operation...')
    const { data: newRecord, error: insertError } = await supabase
      .from('product_images')
      .insert({
        product_id: before.product_id,
        image_url: 'https://example.com/test-image.jpg',
        alt_text: 'Test image created via service role',
        display_order: 999
      })
      .select()
      .single()
    
    if (insertError) {
      console.log('❌ Insert failed:', insertError.message)
    } else {
      console.log('✅ Insert successful!')
      console.log('📝 New record:', JSON.stringify(newRecord, null, 2))
      
      // Clean up - delete the test record
      const { error: deleteError } = await supabase
        .from('product_images')
        .delete()
        .eq('id', newRecord.id)
      
      if (deleteError) {
        console.log('⚠️ Cleanup failed:', deleteError.message)
      } else {
        console.log('🧹 Test record cleaned up')
      }
    }
    
  } catch (error) {
    console.log('❌ Test failed:', error.message)
  }
}

testWriteOperation()