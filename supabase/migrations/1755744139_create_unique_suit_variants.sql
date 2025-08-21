-- Migration: create_unique_suit_variants
-- Created at: 1755744139

-- Create suit variants with guaranteed unique SKUs using sequential numbering
WITH suit_products AS (
  SELECT id, name, base_price, category,
         ROW_NUMBER() OVER (ORDER BY id) as product_seq
  FROM products 
  WHERE category IN ('Suits', 'Double-Breasted Suits', 'Stretch Suits', 'Blazers', 'Tuxedos', 'Formalwear')
),
suit_sizing AS (
  SELECT size, ROW_NUMBER() OVER (ORDER BY size) as size_seq FROM (
    SELECT '34S' as size UNION SELECT '34R' as size UNION
    SELECT '36S' as size UNION SELECT '36R' as size UNION
    SELECT '38S' as size UNION SELECT '38R' as size UNION SELECT '38L' as size UNION
    SELECT '40S' as size UNION SELECT '40R' as size UNION SELECT '40L' as size UNION
    SELECT '42S' as size UNION SELECT '42R' as size UNION SELECT '42L' as size UNION
    SELECT '44S' as size UNION SELECT '44R' as size UNION SELECT '44L' as size UNION
    SELECT '46S' as size UNION SELECT '46R' as size UNION SELECT '46L' as size UNION
    SELECT '48S' as size UNION SELECT '48R' as size UNION SELECT '48L' as size UNION
    SELECT '50S' as size UNION SELECT '50R' as size UNION SELECT '50L' as size UNION
    SELECT '52R' as size UNION SELECT '52L' as size UNION
    SELECT '54R' as size UNION SELECT '54L' as size
  ) t
),
suit_colors AS (
  SELECT color, ROW_NUMBER() OVER (ORDER BY color) as color_seq FROM (
    SELECT 'Navy' as color UNION SELECT 'Black' as color UNION 
    SELECT 'Charcoal' as color UNION SELECT 'Gray' as color
  ) t
),
suit_variants AS (
  SELECT 
    p.id as product_id,
    p.name,
    p.base_price,
    p.category,
    c.color,
    s.size,
    CASE 
      WHEN p.category = 'Double-Breasted Suits' THEN 'blazer_double'
      WHEN p.category = 'Blazers' THEN 'blazer_single'
      WHEN p.category = 'Tuxedos' THEN 'tuxedo_single'
      WHEN p.category = 'Formalwear' THEN 'tuxedo_single'
      ELSE 'suit_2piece'
    END as variant_type,
    -- Create truly unique SKU using sequential numbers
    'SKU' || LPAD(p.product_seq::text, 3, '0') || LPAD(c.color_seq::text, 2, '0') || LPAD(s.size_seq::text, 2, '0') as sku
  FROM suit_products p
  CROSS JOIN suit_colors c
  CROSS JOIN suit_sizing s
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
    WHEN color IN ('Navy', 'Black') AND size LIKE '%R' THEN 8
    WHEN color IN ('Navy', 'Black') THEN 5
    WHEN size LIKE '%R' THEN 4
    ELSE 2
  END as inventory_quantity,
  CASE 
    WHEN color IN ('Navy', 'Black') AND size LIKE '%R' THEN 8
    WHEN color IN ('Navy', 'Black') THEN 5
    WHEN size LIKE '%R' THEN 4
    ELSE 2
  END as available_quantity,
  0 as reserved_quantity,
  0 as committed_quantity,
  CASE 
    WHEN color IN ('Navy', 'Black') AND size LIKE '%R' THEN 3
    ELSE 1
  END as low_stock_threshold,
  'in_stock' as stock_status,
  false as allow_backorders,
  CASE 
    WHEN category IN ('Blazers') THEN 1800
    WHEN category IN ('Tuxedos', 'Formalwear') THEN 2200
    ELSE 2500
  END as weight_grams
FROM suit_variants;;