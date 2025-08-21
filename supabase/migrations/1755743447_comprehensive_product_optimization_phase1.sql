-- Migration: comprehensive_product_optimization_phase1
-- Created at: 1755743447

-- PHASE 1: Fix pricing inconsistencies and update SEO basics
-- Standardize all prices to cents (some are in dollars)
UPDATE products 
SET base_price = CASE 
  WHEN base_price > 10000 THEN base_price  -- Already in cents
  ELSE base_price * 100  -- Convert dollars to cents
END;

-- Auto-generate SEO-friendly handles/slugs for all products
UPDATE products 
SET handle = LOWER(REGEXP_REPLACE(REGEXP_REPLACE(name, '[^a-zA-Z0-9\s-]', '', 'g'), '\s+', '-', 'g'))
WHERE handle IS NULL;

UPDATE products 
SET slug = LOWER(REGEXP_REPLACE(REGEXP_REPLACE(name, '[^a-zA-Z0-9\s-]', '', 'g'), '\s+', '-', 'g'))
WHERE slug IS NULL;

-- Auto-generate basic SEO meta data
UPDATE products 
SET 
  meta_title = name || ' - ' || category || ' | KCT Menswear',
  meta_description = 'Shop ' || name || ' in ' || category || '. Premium quality formal wear with modern style. Available in multiple sizes and colors. Free shipping on orders over $100.',
  seo_title = name || ' - ' || category || ' | KCT Menswear',
  seo_description = 'Premium ' || name || ' from KCT Menswear. ' || SUBSTRING(description, 1, 120) || '...'
WHERE meta_title IS NULL;;