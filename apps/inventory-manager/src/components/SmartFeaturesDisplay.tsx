import { useEffect, useState } from 'react'
import { Sparkles, TrendingUp, ArrowRight, Star, Shuffle } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAnalytics } from '@/hooks/useAnalytics'

interface SmartCollection {
  id: string
  name: string
  description?: string
  collection_type: string
  visibility: 'public' | 'private' | 'featured'
  rules: any
  display_order: number
  auto_update: boolean
  is_active: boolean
  product_count?: number
  created_at: string
  updated_at: string
}

interface ProductRecommendation {
  id: string
  user_id?: string
  session_id: string
  recommendation_type: 'similar' | 'complement' | 'upsell' | 'cross_sell'
  source_product_id: string
  recommended_product_id: string
  recommendation_score: number
  recommendation_reason?: string
  context_data?: any
  was_clicked: boolean
  was_purchased: boolean
  position_in_list: number
  created_at: string
  product?: {
    name: string
    base_price: number
    image_url?: string
    category: string
  }
}

interface SmartFeaturesDisplayProps {
  currentProductId?: string
  currentCategory?: string
  className?: string
}

export function SmartFeaturesDisplay({ 
  currentProductId, 
  currentCategory, 
  className = '' 
}: SmartFeaturesDisplayProps) {
  const [featuredCollections, setFeaturedCollections] = useState<SmartCollection[]>([])
  const [recommendations, setRecommendations] = useState<ProductRecommendation[]>([])
  const [loading, setLoading] = useState(true)
  const { trackEvent } = useAnalytics()

  useEffect(() => {
    loadSmartFeatures()
  }, [currentProductId, currentCategory])

  const loadSmartFeatures = async () => {
    try {
      setLoading(true)

      // Load featured collections
      const { data: collections, error: collectionsError } = await supabase
        .from('smart_collections')
        .select('*')
        .eq('visibility', 'featured')
        .eq('is_active', true)
        .limit(3)

      if (collectionsError) {
        console.error('Error loading collections:', collectionsError)
      } else {
        // Get product counts for collections
        const collectionsWithCounts = await Promise.all(
          (collections || []).map(async (collection) => {
            const { count } = await supabase
              .from('collection_products')
              .select('*', { count: 'exact' })
              .eq('collection_id', collection.id)

            return { ...collection, product_count: count || 0 }
          })
        )
        setFeaturedCollections(collectionsWithCounts)
      }

      // Load product recommendations if we have a current product
      if (currentProductId) {
        const { data: recs, error: recsError } = await supabase
          .from('product_recommendations')
          .select(`
            *,
            recommended_product:inventory_products!product_recommendations_recommended_product_id_fkey(
              id,
              name,
              base_price,
              image_url,
              category
            )
          `)
          .eq('source_product_id', currentProductId)
          .gte('recommendation_score', 0.6)
          .order('recommendation_score', { ascending: false })
          .limit(4)

        if (recsError) {
          console.error('Error loading recommendations:', recsError)
        } else {
          const processedRecs = (recs || []).map(rec => ({
            ...rec,
            product: rec.recommended_product
          }))
          setRecommendations(processedRecs)
        }
      }
    } catch (error) {
      console.error('Error loading smart features:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCollectionClick = async (collection: SmartCollection) => {
    await trackEvent('navigation_click', {
      navigation_target: 'smart_collection',
      collection_id: collection.id,
      collection_name: collection.name
    })
  }

  const handleRecommendationClick = async (recommendation: ProductRecommendation) => {
    await trackEvent('product_click', {
      product_id: recommendation.recommended_product_id,
      product_name: recommendation.product?.name,
      recommendation_type: recommendation.recommendation_type,
      confidence_score: recommendation.recommendation_score,
      source_product_id: currentProductId
    })
  }

  if (loading) {
    return (
      <div className={`${className}`}>
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`space-y-8 ${className}`}>
      {/* Featured Collections */}
      {featuredCollections.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center">
              <Sparkles className="h-6 w-6 mr-2 text-purple-600" />
              Smart Collections
            </h2>
            <button className="text-purple-600 hover:text-purple-800 text-sm font-medium flex items-center">
              View All
              <ArrowRight className="h-4 w-4 ml-1" />
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {featuredCollections.map((collection) => (
              <div 
                key={collection.id}
                onClick={() => handleCollectionClick(collection)}
                className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg p-6 border border-purple-100 hover:border-purple-200 transition-all duration-200 cursor-pointer group"
              >
                <div className="flex items-center justify-between mb-3">
                  <Sparkles className="h-8 w-8 text-purple-600 group-hover:scale-110 transition-transform" />
                  <span className="text-sm font-medium text-purple-700 bg-purple-100 px-2 py-1 rounded-full">
                    {collection.product_count} items
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-purple-900">
                  {collection.name}
                </h3>
                {collection.description && (
                  <p className="text-sm text-gray-600 mb-4">{collection.description}</p>
                )}
                <div className="flex items-center text-purple-600 text-sm font-medium group-hover:text-purple-800">
                  Explore Collection
                  <ArrowRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Product Recommendations */}
      {recommendations.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center">
              <TrendingUp className="h-6 w-6 mr-2 text-green-600" />
              Recommended for You
            </h2>
            <button className="text-green-600 hover:text-green-800 text-sm font-medium flex items-center">
              <Shuffle className="h-4 w-4 mr-1" />
              More Suggestions
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {recommendations.map((recommendation) => (
              <div 
                key={recommendation.id}
                onClick={() => handleRecommendationClick(recommendation)}
                className="bg-white rounded-lg border border-gray-200 hover:border-green-300 hover:shadow-lg transition-all duration-200 cursor-pointer group overflow-hidden"
              >
                {recommendation.product?.image_url && (
                  <div className="aspect-square bg-gray-100 overflow-hidden">
                    <img 
                      src={recommendation.product.image_url} 
                      alt={recommendation.product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                    />
                  </div>
                )}
                
                <div className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                      recommendation.recommendation_type === 'similar' 
                        ? 'bg-blue-100 text-blue-700'
                        : recommendation.recommendation_type === 'complement'
                          ? 'bg-green-100 text-green-700'
                          : recommendation.recommendation_type === 'upsell'
                            ? 'bg-purple-100 text-purple-700'
                            : 'bg-orange-100 text-orange-700'
                    }`}>
                      {recommendation.recommendation_type === 'similar' && 'Similar'}
                      {recommendation.recommendation_type === 'complement' && 'Goes Well'}
                      {recommendation.recommendation_type === 'upsell' && 'Upgrade'}
                      {recommendation.recommendation_type === 'cross_sell' && 'Also Like'}
                    </span>
                    <div className="flex items-center">
                      <Star className="h-3 w-3 text-yellow-400 fill-current" />
                      <span className="text-xs text-gray-600 ml-1">
                        {(recommendation.recommendation_score * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>
                  
                  <h3 className="font-medium text-gray-900 mb-1 line-clamp-2 group-hover:text-green-900">
                    {recommendation.product?.name}
                  </h3>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold text-gray-900">
                      ${recommendation.product?.base_price}
                    </span>
                    <span className="text-xs text-gray-500">
                      {recommendation.product?.category}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Empty State */}
      {!loading && featuredCollections.length === 0 && recommendations.length === 0 && (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <Sparkles className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Smart Features Loading</h3>
          <p className="mt-1 text-sm text-gray-500">
            Our AI is analyzing your preferences to provide personalized recommendations.
          </p>
        </div>
      )}
    </div>
  )
}