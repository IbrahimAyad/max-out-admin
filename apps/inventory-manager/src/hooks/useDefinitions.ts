import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

// Define the types for size and color definitions
interface SizeDefinition {
  id: string
  category: string
  size_code: string
  size_label: string
  sort_order: number
  created_at: string
}

interface ColorDefinition {
  id: string
  color_name: string
  color_code: string
  hex_value?: string
  created_at: string
}

// Hook for size and color definitions
export function useDefinitions() {
  const [sizes, setSizes] = useState<Record<string, SizeDefinition[]>>({})
  const [colors, setColors] = useState<ColorDefinition[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchDefinitions = async () => {
      try {
        setLoading(true)
        const [sizesResponse, colorsResponse] = await Promise.all([
          supabase
            .from('size_definitions')
            .select('*')
            .order('category', { ascending: true })
            .order('sort_order', { ascending: true }),
          supabase
            .from('color_definitions')
            .select('*')
            .order('color_name', { ascending: true })
        ])

        if (sizesResponse.error) throw sizesResponse.error
        if (colorsResponse.error) throw colorsResponse.error

        // Group sizes by category
        const sizesByCategory = sizesResponse.data.reduce((acc, size) => {
          if (!acc[size.category]) acc[size.category] = []
          acc[size.category].push(size)
          return acc
        }, {} as Record<string, SizeDefinition[]>)

        setSizes(sizesByCategory)
        setColors(colorsResponse.data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch definitions')
      } finally {
        setLoading(false)
      }
    }

    fetchDefinitions()
  }, [])

  return { sizes, colors, loading, error }
}