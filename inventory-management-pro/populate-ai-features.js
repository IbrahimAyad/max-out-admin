// Script to populate AI features with sample data
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://gvcswimqaxvylgxbklbz.supabase.co'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY // You'll need to provide this

if (!supabaseServiceKey) {
  console.error('SUPABASE_SERVICE_KEY environment variable is required')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function populateSmartCollections() {
  console.log('Populating smart collections...')
  
  const collections = [
    {
      id: '11111111-1111-1111-1111-111111111111',
      name: 'Trending Formal Wear',
      description: 'AI-curated collection of trending formal accessories and suits',
      collection_type: 'ai_powered',
      is_active: true,
      product_count: 0,
      rules: {
        trending_threshold: 0.7,
        category_weights: {
          'Suits': 0.4,
          'Blazers': 0.3,
          'Accessories': 0.3
        }
      }
    },
    {
      id: '22222222-2222-2222-2222-222222222222',
      name: 'Complete Outfit Builder',
      description: 'Dynamic collection that suggests complete outfit combinations',
      collection_type: 'dynamic',
      is_active: true,
      product_count: 0,
      rules: {
        match_criteria: ['color_harmony', 'occasion_match', 'size_availability']
      }
    },
    {
      id: '33333333-3333-3333-3333-333333333333',
      name: 'Premium Wedding Collection',
      description: 'Manually curated premium items for weddings and special occasions',
      collection_type: 'manual',
      is_active: true,
      product_count: 0,
      rules: {}
    },
    {
      id: '44444444-4444-4444-4444-444444444444',
      name: 'Smart Upsell Collection',
      description: 'AI-powered collection for cross-selling and upselling',
      collection_type: 'ai_powered',
      is_active: true,
      product_count: 0,
      rules: {
        upsell_margin: 0.25,
        complementary_categories: true
      }
    }
  ]

  const { data, error } = await supabase
    .from('smart_collections')
    .upsert(collections)
    .select()

  if (error) {
    console.error('Error creating collections:', error)
    return
  }

  console.log(`Created ${data.length} smart collections`)
}

async function populateRecommendations() {
  console.log('Populating product recommendations...')
  
  // Get some sample products
  const { data: products, error: productsError } = await supabase
    .from('inventory_products')
    .select('id, name, category')
    .limit(10)

  if (productsError) {
    console.error('Error fetching products:', productsError)
    return
  }

  if (!products || products.length < 2) {
    console.log('Not enough products to create recommendations')
    return
  }

  const recommendations = []
  
  // Create recommendations for each product
  products.forEach(sourceProduct => {
    const otherProducts = products.filter(p => p.id !== sourceProduct.id).slice(0, 3)
    
    otherProducts.forEach((targetProduct, index) => {
      let recommendationType = 'cross_sell'
      let reason = 'Frequently bought together by other customers'
      
      if (sourceProduct.category === targetProduct.category) {
        recommendationType = 'similar'
        reason = 'Similar style and quality in the same category'
      } else if (
        (sourceProduct.category === 'Suits' && targetProduct.category === 'Accessories') ||
        (sourceProduct.category === 'Blazers' && targetProduct.category === 'Dress Shirts') ||
        (sourceProduct.category === 'Accessories' && targetProduct.category === 'Suits')
      ) {
        recommendationType = 'complementary'
        if (sourceProduct.category === 'Suits' && targetProduct.category === 'Accessories') {
          reason = 'Perfect accessories to complete your formal look'
        } else if (sourceProduct.category === 'Blazers' && targetProduct.category === 'Dress Shirts') {
          reason = 'Ideal dress shirt to pair with this blazer'
        } else {
          reason = 'Elevate this suit with matching accessories'
        }
      }
      
      recommendations.push({
        session_id: `system_generated_${Date.now()}`,
        recommendation_type: recommendationType,
        source_product_id: sourceProduct.id,
        recommended_product_id: targetProduct.id,
        recommendation_score: Math.round((Math.random() * 0.4 + 0.6) * 100) / 100,
        recommendation_reason: reason,
        context_data: {
          algorithm: 'collaborative_filtering',
          confidence: Math.round((Math.random() * 0.3 + 0.7) * 100) / 100,
          source_category: sourceProduct.category,
          target_category: targetProduct.category,
          generated_at: new Date().toISOString()
        },
        was_clicked: false,
        was_purchased: false,
        position_in_list: index + 1
      })
    })
  })

  const { data, error } = await supabase
    .from('product_recommendations')
    .upsert(recommendations)
    .select()

  if (error) {
    console.error('Error creating recommendations:', error)
    return
  }

  console.log(`Created ${data.length} product recommendations`)
}

async function populateAnalytics() {
  console.log('Populating analytics data...')
  
  // Create sample page views
  const pageViews = []
  for (let i = 1; i <= 24; i++) {
    pageViews.push({
      page_path: '/dashboard',
      page_title: 'Dashboard - Inventory Management',
      session_id: `demo_session_${i}`,
      referrer: 'https://google.com',
      user_agent: 'Mozilla/5.0 (Demo User Agent)',
      timestamp: new Date(Date.now() - (i * 60 * 60 * 1000)).toISOString() // i hours ago
    })
  }

  const { error: pageViewsError } = await supabase
    .from('analytics_page_views')
    .upsert(pageViews)

  if (pageViewsError) {
    console.error('Error creating page views:', pageViewsError)
  } else {
    console.log(`Created ${pageViews.length} page views`)
  }

  // Create sample product events
  const { data: products } = await supabase
    .from('inventory_products')
    .select('id, name')
    .limit(5)

  if (products && products.length > 0) {
    const events = []
    products.forEach(product => {
      for (let i = 1; i <= 12; i++) {
        events.push({
          event_type: 'product_view',
          page_path: `/products/${product.id}`,
          product_id: product.id,
          session_id: `demo_session_${i}`,
          properties: {
            product_name: product.name,
            view_duration: Math.round(Math.random() * 120 + 30), // 30-150 seconds
            source: 'dashboard'
          },
          timestamp: new Date(Date.now() - (i * 60 * 60 * 1000)).toISOString()
        })
      }
    })

    const { error: eventsError } = await supabase
      .from('analytics_events')
      .upsert(events)

    if (eventsError) {
      console.error('Error creating events:', eventsError)
    } else {
      console.log(`Created ${events.length} analytics events`)
    }
  }
}

async function main() {
  console.log('Starting AI features population...')
  
  try {
    await populateSmartCollections()
    await populateRecommendations()
    await populateAnalytics()
    
    console.log('\n✅ AI features populated successfully!')
    console.log('\nYou can now:')
    console.log('- View Smart Collections in the Collections Manager')
    console.log('- See product recommendations on product detail pages')
    console.log('- Check analytics data in the Analytics Dashboard')
    
  } catch (error) {
    console.error('Error populating AI features:', error)
  }
}

if (require.main === module) {
  main()
}

module.exports = { populateSmartCollections, populateRecommendations, populateAnalytics }