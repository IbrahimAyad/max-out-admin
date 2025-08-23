import { createClient } from '@supabase/supabase-js'

// Use direct values for consistent deployment
const supabaseUrl = 'https://gvcswimqaxvylgxbklbz.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd2Y3N3aW1xYXh2eWxneGJrbGJ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM3NjA1MzAsImV4cCI6MjA2OTMzNjUzMH0.UZdiGcJXUV5VYetjWXV26inmbj2yXdiT03Z6t_5Lg24'

// Service role key for admin operations (bypasses RLS)
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd2Y3N3aW1xYXh2eWxneGJrbGJ6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Mzc2MDUzMCwiZXhwIjoyMDY5MzM2NTMwfQ.NbG4FqOV6YfLBJRpOHtmRWVdGDYrWDKY5VFBUUnNXjM'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    detectSessionInUrl: true,
    autoRefreshToken: true,
  }
})

// Admin client with service role for admin dashboard operations
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
    detectSessionInUrl: false,
    autoRefreshToken: false,
  }
})

// Helper function to get current user
export async function getCurrentUser() {
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error) {
    console.error('Error getting user:', error)
    return null
  }
  return user
}

// Helper constants
export const CDN_BASE_URL = 'https://cdn.kctmenswear.com/'

// Helper function to construct proper image URLs
export function getImageUrl(imagePath: string | null | undefined): string | null {
  if (!imagePath) return null
  
  // If imagePath is already a complete URL (starts with http/https), return as is
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath
  }
  
  // If imagePath already contains the CDN domain, it means it's malformed - extract the actual path
  if (imagePath.includes('cdn.kctmenswear.com')) {
    // Extract everything after the last occurrence of the domain
    const parts = imagePath.split('cdn.kctmenswear.com/')
    const actualPath = parts[parts.length - 1]
    return `${CDN_BASE_URL}${actualPath}`
  }
  
  // Remove leading slash to avoid double slashes
  const cleanPath = imagePath.startsWith('/') ? imagePath.slice(1) : imagePath
  
  // Construct full URL
  return `${CDN_BASE_URL}${cleanPath}`
}

// Helper function to extract primary image from enhanced products JSON structure
export function getPrimaryImageFromProduct(product: any): string | null {
  if (!product) return null
  
  // For enhanced products table with JSON images structure
  if (product.images && typeof product.images === 'object') {
    // Try hero image first
    if (product.images.hero?.url) {
      return product.images.hero.url
    }
    
    // Fallback to first gallery image
    if (product.images.gallery && Array.isArray(product.images.gallery) && product.images.gallery.length > 0) {
      return product.images.gallery[0]?.url || null
    }
  }
  
  // Fallback for basic products table (backward compatibility)
  if (product.primary_image) {
    return getImageUrl(product.primary_image)
  }
  
  return null
}