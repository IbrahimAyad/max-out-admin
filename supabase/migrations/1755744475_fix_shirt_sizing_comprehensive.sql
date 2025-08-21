-- Migration: fix_shirt_sizing_comprehensive
-- Created at: 1755744475

-- Delete existing shirt variants with incorrect sizing
DELETE FROM enhanced_product_variants 
WHERE variant_type IN ('shirt_slim', 'shirt_classic')
OR sku LIKE 'SHIRT-%';

-- Create comprehensive shirt variants with proper neck + sleeve sizing
WITH shirt_products AS (
  SELECT id, name, base_price, category,
         ROW_NUMBER() OVER (ORDER BY id) as product_seq
  FROM products 
  WHERE category IN ('Mens Shirts', 'Shirts', 'Dress Shirts')
),
shirt_sizes AS (
  -- Neck sizes 14.5-18 with all sleeve lengths (32-33, 34-35, 36-37)
  SELECT neck, sleeve, ROW_NUMBER() OVER (ORDER BY neck, sleeve) as size_seq FROM (
    SELECT '14.5' as neck, '32-33' as sleeve UNION SELECT '14.5' as neck, '34-35' as sleeve UNION SELECT '14.5' as neck, '36-37' as sleeve UNION
    SELECT '15' as neck, '32-33' as sleeve UNION SELECT '15' as neck, '34-35' as sleeve UNION SELECT '15' as neck, '36-37' as sleeve UNION
    SELECT '15.5' as neck, '32-33' as sleeve UNION SELECT '15.5' as neck, '34-35' as sleeve UNION SELECT '15.5' as neck, '36-37' as sleeve UNION
    SELECT '16' as neck, '32-33' as sleeve UNION SELECT '16' as neck, '34-35' as sleeve UNION SELECT '16' as neck, '36-37' as sleeve UNION
    SELECT '16.5' as neck, '32-33' as sleeve UNION SELECT '16.5' as neck, '34-35' as sleeve UNION SELECT '16.5' as neck, '36-37' as sleeve UNION
    SELECT '17' as neck, '32-33' as sleeve UNION SELECT '17' as neck, '34-35' as sleeve UNION SELECT '17' as neck, '36-37' as sleeve UNION
    SELECT '17.5' as neck, '32-33' as sleeve UNION SELECT '17.5' as neck, '34-35' as sleeve UNION SELECT '17.5' as neck, '36-37' as sleeve UNION
    SELECT '18' as neck, '32-33' as sleeve UNION SELECT '18' as neck, '34-35' as sleeve UNION SELECT '18' as neck, '36-37' as sleeve UNION
    SELECT '18.5' as neck, '32-33' as sleeve UNION SELECT '18.5' as neck, '34-35' as sleeve UNION SELECT '18.5' as neck, '36-37' as sleeve UNION
    -- Sizes 19-22 only get 34-35 and 36-37 sleeve lengths (no 32-33)
    SELECT '19' as neck, '34-35' as sleeve UNION SELECT '19' as neck, '36-37' as sleeve UNION
    SELECT '20' as neck, '34-35' as sleeve UNION SELECT '20' as neck, '36-37' as sleeve UNION
    SELECT '22' as neck, '34-35' as sleeve UNION SELECT '22' as neck, '36-37' as sleeve
  ) t
),
shirt_colors AS (
  SELECT color, ROW_NUMBER() OVER (ORDER BY color) as color_seq FROM (
    SELECT 'White' as color UNION SELECT 'Light Blue' as color UNION 
    SELECT 'Blue' as color UNION SELECT 'Navy' as color
  ) t
),
shirt_variants AS (
  SELECT 
    p.id as product_id,
    p.name,
    p.base_price,
    p.category,
    c.color,
    s.neck || '/' || s.sleeve as size,  -- Format: "16/34-35"
    'shirt_classic' as variant_type,
    -- Create unique SKU using sequential numbers
    'SHIRT' || LPAD(p.product_seq::text, 3, '0') || LPAD(c.color_seq::text, 2, '0') || LPAD(s.size_seq::text, 2, '0') as sku
  FROM shirt_products p
  CROSS JOIN shirt_colors c
  CROSS JOIN shirt_sizes s
)
INSERT INTO enhanced_product_variants (
  product_id, variant_type, color, size, sku, price_cents, 
  inventory_quantity, available_quantity, reserved_quantity, committed_quantity,
  low_stock_threshold, stock_status, allow_backorders, weight_grams
)
SELECT 
  product_id,
  variant_type,
  color,
  size,
  sku,
  base_price as price_cents,
  CASE 
    WHEN color = 'White' AND size LIKE '%/34-35' THEN 20  -- Highest stock for white shirts in most common sleeve length
    WHEN color = 'White' THEN 15  -- High stock for white shirts
    WHEN color IN ('Light Blue', 'Blue') AND size LIKE '%/34-35' THEN 12  -- Medium stock for blue shirts in common sleeve
    WHEN color IN ('Light Blue', 'Blue') THEN 8  -- Medium stock for blue shirts
    ELSE 5  -- Lower stock for other colors
  END as inventory_quantity,
  CASE 
    WHEN color = 'White' AND size LIKE '%/34-35' THEN 20
    WHEN color = 'White' THEN 15
    WHEN color IN ('Light Blue', 'Blue') AND size LIKE '%/34-35' THEN 12
    WHEN color IN ('Light Blue', 'Blue') THEN 8
    ELSE 5
  END as available_quantity,
  0 as reserved_quantity,
  0 as committed_quantity,
  CASE 
    WHEN color = 'White' THEN 5  -- Higher threshold for white shirts
    ELSE 2
  END as low_stock_threshold,
  'in_stock' as stock_status,
  false as allow_backorders,
  300 as weight_grams  -- Standard shirt weight
FROM shirt_variants;;