import supabase from './supabaseClient.js'

// Database helper functions for common operations
export async function updateProductInventory(variantId, newQuantity) {
  try {
    const { data, error } = await supabase
      .from('enhanced_product_variants')
      .update({ 
        inventory_quantity: newQuantity,
        available_quantity: newQuantity,
        last_inventory_update: new Date().toISOString()
      })
      .eq('id', variantId)
      .select()
    
    if (error) throw error
    return { success: true, data }
  } catch (error) {
    console.error('Error updating inventory:', error)
    return { success: false, error: error.message }
  }
}

export async function addNewProduct(productData) {
  try {
    const { data, error } = await supabase
      .from('products')
      .insert([productData])
      .select()
    
    if (error) throw error
    return { success: true, data }
  } catch (error) {
    console.error('Error adding product:', error)
    return { success: false, error: error.message }
  }
}

export async function updateVendorProduct(vendorProductId, updates) {
  try {
    const { data, error } = await supabase
      .from('vendor_products')
      .update(updates)
      .eq('id', vendorProductId)
      .select()
    
    if (error) throw error
    return { success: true, data }
  } catch (error) {
    console.error('Error updating vendor product:', error)
    return { success: false, error: error.message }
  }
}

export async function bulkUpdateInventory(updates) {
  try {
    const results = []
    
    for (const update of updates) {
      const { data, error } = await supabase
        .from('enhanced_product_variants')
        .update({ 
          inventory_quantity: update.quantity,
          available_quantity: update.quantity,
          last_inventory_update: new Date().toISOString()
        })
        .eq('id', update.variantId)
        .select()
      
      if (error) {
        results.push({ success: false, variantId: update.variantId, error: error.message })
      } else {
        results.push({ success: true, variantId: update.variantId, data })
      }
    }
    
    return { success: true, results }
  } catch (error) {
    console.error('Error with bulk update:', error)
    return { success: false, error: error.message }
  }
}

export async function getTableInfo(tableName) {
  try {
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .limit(5)
    
    if (error) throw error
    return { success: true, data, count: data.length }
  } catch (error) {
    console.error(`Error fetching ${tableName}:`, error)
    return { success: false, error: error.message }
  }
}