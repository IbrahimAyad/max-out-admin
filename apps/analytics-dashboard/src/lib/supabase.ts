import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl) {
  throw new Error('Missing VITE_SUPABASE_URL environment variable')
}

if (!supabaseAnonKey) {
  throw new Error('Missing VITE_SUPABASE_ANON_KEY environment variable')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})

// Helper functions for data operations
export const getImageUrl = (imagePath: string | null): string | null => {
  if (!imagePath) return null
  
  // If it's already a full URL, return as is
  if (imagePath.startsWith('http')) {
    return imagePath
  }
  
  // If it's a Supabase storage path, construct the URL
  const { data } = supabase.storage.from('product-images').getPublicUrl(imagePath)
  return data.publicUrl
}

export const getPrimaryImageFromProduct = (product: any): string | null => {
  if (!product.images || !Array.isArray(product.images) || product.images.length === 0) {
    return null
  }
  
  return getImageUrl(product.images[0])
}

// CDN Base URL for optimized image loading
export const CDN_BASE_URL = `${supabaseUrl}/storage/v1/object/public/`