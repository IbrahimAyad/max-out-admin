import { supabase } from './supabase'
import { Product } from './supabase'

export interface ProductRecommendation {
  id: string
  session_id: string
  user_id?: string
  recommendation_type: 'upsell' | 'cross_sell' | 'complementary' | 'trending' | 'similar'
  source_product_id: string
  recommended_product_id: string
  recommendation_score: number
  recommendation_reason: string
  context_data?: any
  was_clicked: boolean
  was_purchased: boolean
  position_in_list: number
  created_at: string
  clicked_at?: string
  purchased_at?: string
  recommended_product?: Product
}

class RecommendationsService {
  async getProductRecommendations(productId: string, limit: number = 6): Promise<ProductRecommendation[]> {
    const { data, error } = await supabase
      .from('product_recommendations')
      .select(`
        *,
        recommended_product:products!recommended_product_id(*)
      `)
      .eq('source_product_id', productId)
      .order('recommendation_score', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Failed to get recommendations:', error)
      return []
    }

    return data || []
  }

  async getTrendingProducts(limit: number = 12): Promise<Product[]> {
    // Get trending products based on recent analytics events
    const { data: trendingEvents, error: eventsError } = await supabase
      .from('analytics_events')
      .select('product_id')
      .eq('event_type', 'product_view')
      .gte('timestamp', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
      .not('product_id', 'is', null)

    if (eventsError) {
      console.error('Failed to get trending events:', eventsError)
      return []
    }

    // Count product views
    const productViewCounts = (trendingEvents || []).reduce((acc, event) => {
      if (event.product_id) {
        acc[event.product_id] = (acc[event.product_id] || 0) + 1
      }
      return acc
    }, {} as Record<string, number>)

    // Get top products by view count
    const topProductIds = Object.entries(productViewCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, limit)
      .map(([productId]) => productId)

    if (topProductIds.length === 0) {
      // Fallback to recent products if no trending data
      const { data: recentProducts, error: recentError } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit)

      if (recentError) {
        console.error('Failed to get recent products:', recentError)
        return []
      }

      return recentProducts || []
    }

    // Fetch the actual product data
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('*')
      .in('id', topProductIds)

    if (productsError) {
      console.error('Failed to get trending products:', productsError)
      return []
    }

    // Sort products by their trending score
    const sortedProducts = (products || []).sort((a, b) => {
      const scoreA = productViewCounts[a.id] || 0
      const scoreB = productViewCounts[b.id] || 0
      return scoreB - scoreA
    })

    return sortedProducts
  }

  async trackRecommendationClick(recommendationId: string): Promise<void> {
    const { error } = await supabase
      .from('product_recommendations')
      .update({
        was_clicked: true,
        clicked_at: new Date().toISOString()
      })
      .eq('id', recommendationId)

    if (error) {
      console.error('Failed to track recommendation click:', error)
    }
  }

  async trackRecommendationPurchase(recommendationId: string): Promise<void> {
    const { error } = await supabase
      .from('product_recommendations')
      .update({
        was_purchased: true,
        purchased_at: new Date().toISOString()
      })
      .eq('id', recommendationId)

    if (error) {
      console.error('Failed to track recommendation purchase:', error)
    }
  }

  async generateRecommendationsForProduct(productId: string): Promise<void> {
    // This would typically call an AI service to generate recommendations
    // For now, we'll create some basic rule-based recommendations
    
    const { data: product } = await supabase
      .from('products')
      .select('*')
      .eq('id', productId)
      .single()

    if (!product) return

    // Find complementary products (accessories for suits, shirts for blazers, etc.)
    let complementaryCategories: string[] = []
    
    if (['Suits', 'Tuxedos', 'Double-Breasted Suits'].includes(product.category)) {
      complementaryCategories = ['Accessories', 'Dress Shirts', 'Mens Shirts']
    } else if (product.category === 'Blazers') {
      complementaryCategories = ['Dress Shirts', 'Mens Shirts', 'Accessories']
    } else if (['Dress Shirts', 'Mens Shirts'].includes(product.category)) {
      complementaryCategories = ['Suits', 'Blazers', 'Accessories']
    }

    if (complementaryCategories.length > 0) {
      const { data: complementaryProducts } = await supabase
        .from('products')
        .select('id')
        .in('category', complementaryCategories)
        .neq('id', productId)
        .limit(10)

      // Create recommendations
      const recommendations = (complementaryProducts || []).map((cp, index) => ({
        session_id: 'system-generated',
        source_product_id: productId,
        recommended_product_id: cp.id,
        recommendation_type: 'complementary' as const,
        recommendation_score: 0.8 - (index * 0.05),
        recommendation_reason: `Perfect complement to ${product.name}`,
        was_clicked: false,
        was_purchased: false,
        position_in_list: index + 1,
        created_at: new Date().toISOString()
      }))

      if (recommendations.length > 0) {
        await supabase
          .from('product_recommendations')
          .upsert(recommendations, {
            onConflict: 'source_product_id,recommended_product_id'
          })
      }
    }
  }
}

export const recommendations = new RecommendationsService()
export default recommendations
