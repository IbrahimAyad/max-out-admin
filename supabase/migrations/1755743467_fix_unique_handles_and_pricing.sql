-- Migration: fix_unique_handles_and_pricing
-- Created at: 1755743467

-- Fix pricing inconsistencies first
UPDATE products 
SET base_price = CASE 
  WHEN base_price > 10000 THEN base_price  -- Already in cents
  ELSE base_price * 100  -- Convert dollars to cents
END;

-- Generate unique handles by adding category suffix where needed
UPDATE products 
SET handle = LOWER(REGEXP_REPLACE(REGEXP_REPLACE(name || '-' || category, '[^a-zA-Z0-9\s-]', '', 'g'), '\s+', '-', 'g'))
WHERE handle IS NULL;

UPDATE products 
SET slug = LOWER(REGEXP_REPLACE(REGEXP_REPLACE(name || '-' || REPLACE(category, ' ', ''), '[^a-zA-Z0-9\s-]', '', 'g'), '\s+', '-', 'g'))
WHERE slug IS NULL;

-- Auto-generate basic SEO meta data
UPDATE products 
SET 
  meta_title = name || ' - ' || category || ' | KCT Menswear',
  meta_description = 'Shop ' || name || ' in ' || category || '. Premium quality formal wear with modern style. Available in multiple sizes and colors. Free shipping on orders over $100.',
  seo_title = name || ' - ' || category || ' | KCT Menswear'
WHERE meta_title IS NULL;;