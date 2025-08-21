import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE, PATCH',
  'Access-Control-Max-Age': '86400',
  'Access-Control-Allow-Credentials': 'false'
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { query } = await req.json()
    
    // Get Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    console.log('Testing chatbot product search with query:', query)

    // Parse query for search terms
    const searchTerms = query.toLowerCase().split(' ').filter((term: string) => term.length > 2)
    console.log('Search terms:', searchTerms)

    // Build tag search conditions
    let tagFilters = []
    let textFilters = []
    
    // Common tag mappings
    const tagMapping: Record<string, string[]> = {
      'blue': ['blue', 'navy'],
      'navy': ['navy', 'blue'],
      'black': ['black'],
      'grey': ['grey', 'gray'],
      'gray': ['grey', 'gray'],
      'brown': ['brown'],
      'green': ['green'],
      'formal': ['formal', 'business', 'formal-wear'],
      'business': ['business', 'formal', 'formal-wear'],
      'casual': ['casual'],
      'suit': ['suit', 'formal-wear'],
      'shirt': ['shirt', 'dress-shirt'],
      'accessory': ['accessory'],
      'accessories': ['accessory'],
      'spring': ['spring'],
      'summer': ['summer'],
      'autumn': ['autumn'],
      'fall': ['autumn'],
      'winter': ['winter'],
      'wedding': ['wedding', 'formal'],
      'office': ['business', 'formal'],
      'work': ['business', 'formal']
    }

    // Collect all relevant tags
    const relevantTags = new Set<string>()
    for (const term of searchTerms) {
      if (tagMapping[term]) {
        tagMapping[term].forEach(tag => relevantTags.add(tag))
      }
      textFilters.push(`(name ILIKE '%${term}%' OR description ILIKE '%${term}%' OR category ILIKE '%${term}%')`)
    }

    // Build the search query
    let searchQuery = supabase
      .from('inventory_products')
      .select('id, name, category, subcategory, description, base_price, tags')
      .eq('is_active', true)

    // Apply tag filters using the contains operator
    if (relevantTags.size > 0) {
      const tagArray = Array.from(relevantTags)
      console.log('Searching for products with tags:', tagArray)
      
      // Use overlaps (&&) operator to find products that have any of the relevant tags
      searchQuery = searchQuery.overlaps('tags', tagArray)
    }

    // If no tag matches, fall back to text search
    else if (textFilters.length > 0) {
      const textCondition = textFilters.join(' OR ')
      searchQuery = searchQuery.or(textCondition)
    }

    const { data: products, error } = await searchQuery.limit(10)

    if (error) {
      throw error
    }

    console.log(`Found ${products?.length || 0} products matching the query`)

    // Score and rank results
    const scoredProducts = (products || []).map((product: any) => {
      let score = 0
      const productTags = product.tags || []
      const fullText = `${product.name} ${product.description} ${product.category}`.toLowerCase()

      // Score based on tag matches
      for (const term of searchTerms) {
        if (tagMapping[term]) {
          const matchingTags = tagMapping[term].filter(tag => productTags.includes(tag))
          score += matchingTags.length * 3 // Tag matches get high score
        }
      }

      // Score based on text matches
      for (const term of searchTerms) {
        if (fullText.includes(term)) {
          score += 1
        }
      }

      return { ...product, relevanceScore: score }
    }).sort((a: any, b: any) => b.relevanceScore - a.relevanceScore)

    return new Response(JSON.stringify({
      success: true,
      query,
      searchTerms,
      tagFiltersUsed: Array.from(relevantTags).length,
      textFiltersUsed: textFilters.length,
      totalResults: scoredProducts.length,
      products: scoredProducts
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Error in test-chatbot-search:', error)
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})