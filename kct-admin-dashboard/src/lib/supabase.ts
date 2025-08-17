import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. Please check your .env.local file.'
  )
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    detectSessionInUrl: true,
    autoRefreshToken: true,
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