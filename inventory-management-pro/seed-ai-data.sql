-- Seed data for Smart Collections
INSERT INTO smart_collections (id, name, description, collection_type, is_active, product_count, rules, created_at) VALUES
('11111111-1111-1111-1111-111111111111', 'Trending Formal Wear', 'AI-curated collection of trending formal accessories and suits', 'ai_powered', true, 0, '{"trending_threshold": 0.7, "category_weights": {"Suits": 0.4, "Blazers": 0.3, "Accessories": 0.3}}', NOW()),
('22222222-2222-2222-2222-222222222222', 'Complete Outfit Builder', 'Dynamic collection that suggests complete outfit combinations', 'dynamic', true, 0, '{"match_criteria": ["color_harmony", "occasion_match", "size_availability"]}', NOW()),
('33333333-3333-3333-3333-333333333333', 'Premium Wedding Collection', 'Manually curated premium items for weddings and special occasions', 'manual', true, 0, '{}', NOW()),
('44444444-4444-4444-4444-444444444444', 'Smart Upsell Collection', 'AI-powered collection for cross-selling and upselling', 'ai_powered', true, 0, '{"upsell_margin": 0.25, "complementary_categories": true}', NOW())
ON CONFLICT (id) DO UPDATE SET
name = EXCLUDED.name,
description = EXCLUDED.description,
collection_type = EXCLUDED.collection_type,
is_active = EXCLUDED.is_active,
rules = EXCLUDED.rules;

-- Seed sample product recommendations
-- Note: This assumes we have some products in the inventory_products table
-- The recommendations will use actual product IDs from your inventory

WITH sample_products AS (
  SELECT id, name, category FROM inventory_products LIMIT 10
),
product_pairs AS (
  SELECT 
    p1.id as source_id,
    p1.name as source_name,
    p1.category as source_category,
    p2.id as target_id,
    p2.name as target_name,
    p2.category as target_category,
    ROW_NUMBER() OVER (PARTITION BY p1.id ORDER BY RANDOM()) as rn
  FROM sample_products p1
  CROSS JOIN sample_products p2
  WHERE p1.id != p2.id
)
INSERT INTO product_recommendations (
  id,
  session_id,
  recommendation_type,
  source_product_id,
  recommended_product_id,
  recommendation_score,
  recommendation_reason,
  context_data,
  was_clicked,
  was_purchased,
  position_in_list,
  created_at
)
SELECT 
  gen_random_uuid() as id,
  'system_generated_' || extract(epoch from now())::text as session_id,
  CASE 
    WHEN source_category = target_category THEN 'similar'
    WHEN (source_category = 'Suits' AND target_category = 'Accessories') OR
         (source_category = 'Blazers' AND target_category = 'Dress Shirts') OR
         (source_category = 'Accessories' AND target_category = 'Suits') THEN 'complementary'
    ELSE 'cross_sell'
  END as recommendation_type,
  source_id as source_product_id,
  target_id as recommended_product_id,
  ROUND((RANDOM() * 0.4 + 0.6)::numeric, 2) as recommendation_score, -- Scores between 0.6-1.0
  CASE 
    WHEN source_category = target_category THEN 'Similar style and quality in the same category'
    WHEN source_category = 'Suits' AND target_category = 'Accessories' THEN 'Perfect accessories to complete your formal look'
    WHEN source_category = 'Blazers' AND target_category = 'Dress Shirts' THEN 'Ideal dress shirt to pair with this blazer'
    WHEN source_category = 'Accessories' AND target_category = 'Suits' THEN 'Elevate this suit with matching accessories'
    ELSE 'Frequently bought together by other customers'
  END as recommendation_reason,
  jsonb_build_object(
    'algorithm', 'collaborative_filtering',
    'confidence', ROUND((RANDOM() * 0.3 + 0.7)::numeric, 2),
    'source_category', source_category,
    'target_category', target_category,
    'generated_at', NOW()
  ) as context_data,
  false as was_clicked,
  false as was_purchased,
  rn as position_in_list,
  NOW() as created_at
FROM product_pairs
WHERE rn <= 6 -- Max 6 recommendations per product
ON CONFLICT DO NOTHING;

-- Seed some sample analytics data
INSERT INTO analytics_page_views (
  id,
  page_path,
  page_title,
  session_id,
  user_id,
  referrer,
  user_agent,
  timestamp
)
SELECT 
  gen_random_uuid() as id,
  '/dashboard' as page_path,
  'Dashboard - Inventory Management' as page_title,
  'demo_session_' || generate_series as session_id,
  NULL as user_id,
  'https://google.com' as referrer,
  'Mozilla/5.0 (Demo User Agent)' as user_agent,
  NOW() - (generate_series || ' hours')::interval as timestamp
FROM generate_series(1, 24)
ON CONFLICT DO NOTHING;

-- Seed some product view events
WITH sample_products AS (
  SELECT id, name FROM inventory_products LIMIT 5
)
INSERT INTO analytics_events (
  id,
  event_type,
  page_path,
  product_id,
  session_id,
  properties,
  timestamp
)
SELECT 
  gen_random_uuid() as id,
  'product_view' as event_type,
  '/products/' || p.id as page_path,
  p.id as product_id,
  'demo_session_' || gs as session_id,
  jsonb_build_object(
    'product_name', p.name,
    'view_duration', ROUND((RANDOM() * 120 + 30)::numeric, 0), -- 30-150 seconds
    'source', 'dashboard'
  ) as properties,
  NOW() - (gs || ' hours')::interval as timestamp
FROM sample_products p
CROSS JOIN generate_series(1, 12) gs
ON CONFLICT DO NOTHING;

-- Update collection product counts
UPDATE smart_collections 
SET product_count = (
  SELECT COUNT(*) 
  FROM collection_products cp 
  WHERE cp.collection_id = smart_collections.id
);

-- Create some sample analytics product performance data
INSERT INTO analytics_product_performance (
  id,
  product_id,
  views_count,
  clicks_count,
  conversion_rate,
  revenue_generated,
  last_updated
)
SELECT 
  gen_random_uuid() as id,
  p.id as product_id,
  ROUND((RANDOM() * 100 + 10)::numeric, 0) as views_count,
  ROUND((RANDOM() * 20 + 2)::numeric, 0) as clicks_count,
  ROUND((RANDOM() * 0.15 + 0.05)::numeric, 3) as conversion_rate,
  ROUND((RANDOM() * 5000 + 500)::numeric, 2) as revenue_generated,
  NOW() - (RANDOM() * 7 || ' days')::interval as last_updated
FROM inventory_products p
LIMIT 10
ON CONFLICT DO NOTHING;

COMMIT;