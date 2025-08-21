import { supabase } from './supabase'
import { Product } from './supabase'

export interface SmartCollection {
  id: string
  name: string
  description: string
  collection_type: 'dynamic' | 'manual' | 'ai_powered'
  is_active: boolean
  product_count: number
  rules?: any
  created_at: string
  updated_at?: string
}

export interface CollectionProduct {
  id: string
  collection_id: string
  product_id: string
  display_order: number
  added_at: string
  product?: Product
}

class CollectionsService {
  async getCollections(): Promise<SmartCollection[]> {
    const { data, error } = await supabase
      .from('smart_collections')
      .select('*')
      .order('name')
    
    if (error) throw error
    return data || []
  }

  async getCollection(id: string): Promise<SmartCollection | null> {
    const { data, error } = await supabase
      .from('smart_collections')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) throw error
    return data
  }

  async getCollectionProducts(collectionId: string): Promise<CollectionProduct[]> {
    const { data, error } = await supabase
      .from('collection_products')
      .select(`
        *,
        product:products(*)
      `)
      .eq('collection_id', collectionId)
      .order('display_order')
    
    if (error) throw error
    return data || []
  }

  async addProductToCollection(collectionId: string, productId: string): Promise<void> {
    // Get current max display_order
    const { data: existing } = await supabase
      .from('collection_products')
      .select('display_order')
      .eq('collection_id', collectionId)
      .order('display_order', { ascending: false })
      .limit(1)

    const nextOrder = (existing?.[0]?.display_order || 0) + 1

    const { error } = await supabase
      .from('collection_products')
      .insert({
        collection_id: collectionId,
        product_id: productId,
        display_order: nextOrder,
        added_at: new Date().toISOString()
      })

    if (error) throw error

    // Update collection product count
    await this.updateCollectionProductCount(collectionId)
  }

  async removeProductFromCollection(collectionId: string, productId: string): Promise<void> {
    const { error } = await supabase
      .from('collection_products')
      .delete()
      .eq('collection_id', collectionId)
      .eq('product_id', productId)

    if (error) throw error

    // Update collection product count
    await this.updateCollectionProductCount(collectionId)
  }

  async updateCollectionProductCount(collectionId: string): Promise<void> {
    const { count } = await supabase
      .from('collection_products')
      .select('*', { count: 'exact', head: true })
      .eq('collection_id', collectionId)

    await supabase
      .from('smart_collections')
      .update({ product_count: count || 0 })
      .eq('id', collectionId)
  }

  async createCollection(collection: Omit<SmartCollection, 'id' | 'created_at' | 'product_count'>): Promise<SmartCollection> {
    const { data, error } = await supabase
      .from('smart_collections')
      .insert({
        ...collection,
        product_count: 0,
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) throw error
    return data
  }

  async updateCollection(id: string, updates: Partial<SmartCollection>): Promise<SmartCollection> {
    const { data, error } = await supabase
      .from('smart_collections')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  }

  async deleteCollection(id: string): Promise<void> {
    // First delete all collection products
    await supabase
      .from('collection_products')
      .delete()
      .eq('collection_id', id)

    // Then delete the collection
    const { error } = await supabase
      .from('smart_collections')
      .delete()
      .eq('id', id)

    if (error) throw error
  }

  async getPopularCollections(limit: number = 5): Promise<SmartCollection[]> {
    const { data, error } = await supabase
      .from('smart_collections')
      .select('*')
      .eq('is_active', true)
      .order('product_count', { ascending: false })
      .limit(limit)

    if (error) throw error
    return data || []
  }
}

export const collections = new CollectionsService()
export default collections
