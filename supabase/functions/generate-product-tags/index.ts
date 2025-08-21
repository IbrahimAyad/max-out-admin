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
    // Get Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    console.log('Starting product tag generation...')

    // Fetch all products that need tags
    const { data: products, error: fetchError } = await supabase
      .from('inventory_products')
      .select('id, name, category, subcategory, description')
      .eq('is_active', true)
      .or('tags.is.null,tags.eq.{}')

    if (fetchError) {
      throw fetchError
    }

    console.log(`Found ${products?.length || 0} products to process`)

    // Tag generation logic
    const generateTags = (product: any): string[] => {
      const tags = new Set<string>()
      const name = product.name?.toLowerCase() || ''
      const category = product.category?.toLowerCase() || ''
      const subcategory = product.subcategory?.toLowerCase() || ''
      const description = product.description?.toLowerCase() || ''
      const fullText = `${name} ${category} ${subcategory} ${description}`.toLowerCase()

      // Color detection
      const colorMap: Record<string, string[]> = {
        'navy': ['navy', 'dark blue', 'navy blue'],
        'black': ['black'],
        'white': ['white'],
        'grey': ['grey', 'gray', 'charcoal'],
        'beige': ['beige', 'cream', 'sand', 'tan'],
        'brown': ['brown', 'chocolate', 'coffee'],
        'burgundy': ['burgundy', 'wine', 'maroon'],
        'green': ['green', 'emerald', 'hunter', 'forest'],
        'blue': ['blue', 'indigo', 'midnight'],
        'red': ['red', 'crimson'],
        'silver': ['silver', 'metallic'],
        'gold': ['gold', 'golden'],
        'purple': ['purple', 'violet']
      }

      for (const [color, variants] of Object.entries(colorMap)) {
        if (variants.some(variant => fullText.includes(variant))) {
          tags.add(color)
        }
      }

      // Style and occasion tags
      const styleMap: Record<string, string[]> = {
        'formal': ['formal', 'evening', 'black tie', 'tuxedo'],
        'business': ['business', 'professional', 'office', 'corporate'],
        'casual': ['casual', 'relaxed', 'everyday', 'weekend'],
        'wedding': ['wedding', 'bridal', 'groom', 'ceremony'],
        'statement': ['statement', 'bold', 'unique', 'striking'],
        'classic': ['classic', 'traditional', 'timeless'],
        'modern': ['modern', 'contemporary', 'updated', 'current'],
        'vintage': ['vintage', 'retro', 'classic']
      }

      for (const [style, variants] of Object.entries(styleMap)) {
        if (variants.some(variant => fullText.includes(variant))) {
          tags.add(style)
        }
      }

      // Season tags
      const seasonMap: Record<string, string[]> = {
        'spring': ['spring', 'light'],
        'summer': ['summer', 'warm weather', 'lightweight'],
        'autumn': ['autumn', 'fall'],
        'winter': ['winter', 'warm', 'heavy']
      }

      for (const [season, variants] of Object.entries(seasonMap)) {
        if (variants.some(variant => fullText.includes(variant))) {
          tags.add(season)
        }
      }

      // Fit and cut tags
      const fitMap: Record<string, string[]> = {
        'slim': ['slim', 'fitted', 'tailored'],
        'regular': ['regular', 'classic fit', 'standard'],
        'relaxed': ['relaxed', 'comfortable', 'loose']
      }

      for (const [fit, variants] of Object.entries(fitMap)) {
        if (variants.some(variant => fullText.includes(variant))) {
          tags.add(fit)
        }
      }

      // Category-specific tags
      if (category === 'suits') {
        tags.add('suit')
        tags.add('menswear')
        tags.add('formal-wear')
        
        if (subcategory?.includes('business')) tags.add('business')
        if (subcategory?.includes('formal')) tags.add('formal')
        if (subcategory?.includes('casual')) tags.add('casual')
        if (subcategory?.includes('statement')) tags.add('statement')
      }

      if (category === 'shirts') {
        tags.add('shirt')
        tags.add('menswear')
        
        if (subcategory?.includes('dress')) {
          tags.add('dress-shirt')
          tags.add('business')
        }
      }

      if (category === 'accessories') {
        tags.add('accessory')
        tags.add('menswear')
        
        if (subcategory?.includes('vest')) tags.add('vest')
        if (subcategory?.includes('bowtie')) {
          tags.add('bowtie')
          tags.add('formal')
        }
        if (subcategory?.includes('pocket')) {
          tags.add('pocket-square')
          tags.add('formal')
        }
        if (subcategory?.includes('cufflinks')) {
          tags.add('cufflinks')
          tags.add('formal')
        }
        if (subcategory?.includes('suspender')) {
          tags.add('suspenders')
          tags.add('formal')
        }
      }

      // Material tags (inferred from descriptions)
      const materialMap: Record<string, string[]> = {
        'wool': ['wool', 'woolen'],
        'cotton': ['cotton'],
        'silk': ['silk', 'silky'],
        'linen': ['linen'],
        'polyester': ['polyester', 'poly'],
        'leather': ['leather'],
        'metal': ['metal', 'metallic', 'steel', 'brass']
      }

      for (const [material, variants] of Object.entries(materialMap)) {
        if (variants.some(variant => fullText.includes(variant))) {
          tags.add(material)
        }
      }

      // Add general category tags
      tags.add('menswear')
      tags.add('clothing')

      return Array.from(tags).sort()
    }

    // Process products and generate tags
    let updatedCount = 0
    const results = []

    for (const product of products || []) {
      const tags = generateTags(product)
      
      // Update the product with generated tags
      const { error: updateError } = await supabase
        .from('inventory_products')
        .update({ tags })
        .eq('id', product.id)

      if (updateError) {
        console.error(`Error updating product ${product.id}:`, updateError)
        results.push({
          id: product.id,
          name: product.name,
          success: false,
          error: updateError.message
        })
      } else {
        updatedCount++
        results.push({
          id: product.id,
          name: product.name,
          success: true,
          tags
        })
        console.log(`Updated product ${product.id} (${product.name}) with ${tags.length} tags:`, tags.join(', '))
      }
    }

    console.log(`Tag generation complete. Updated ${updatedCount} out of ${products?.length || 0} products.`)

    return new Response(JSON.stringify({
      success: true,
      message: `Successfully generated tags for ${updatedCount} products`,
      totalProcessed: products?.length || 0,
      updatedCount,
      results
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Error in generate-product-tags:', error)
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
