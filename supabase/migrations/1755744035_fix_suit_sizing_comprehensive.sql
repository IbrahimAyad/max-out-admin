-- Migration: fix_suit_sizing_comprehensive
-- Created at: 1755744035

-- Delete existing suit variants with incorrect sizing
DELETE FROM enhanced_product_variants 
WHERE variant_type IN ('suit_2piece', 'suit_3piece', 'blazer_single', 'blazer_double', 'tuxedo_single', 'tuxedo_double');

-- Recreate suit variants with proper sizing (34S-54L)
WITH suit_products AS (
  SELECT id, name, base_price, category
  FROM products 
  WHERE category IN ('Suits', 'Double-Breasted Suits', 'Stretch Suits', 'Blazers', 'Tuxedos', 'Formalwear')
),
suit_sizing AS (
  -- Size 34
  SELECT '34S' as size UNION SELECT '34R' as size UNION
  -- Size 36  
  SELECT '36S' as size UNION SELECT '36R' as size UNION
  -- Size 38
  SELECT '38S' as size UNION SELECT '38R' as size UNION SELECT '38L' as size UNION
  -- Size 40
  SELECT '40S' as size UNION SELECT '40R' as size UNION SELECT '40L' as size UNION
  -- Size 42
  SELECT '42S' as size UNION SELECT '42R' as size UNION SELECT '42L' as size UNION
  -- Size 44
  SELECT '44S' as size UNION SELECT '44R' as size UNION SELECT '44L' as size UNION
  -- Size 46
  SELECT '46S' as size UNION SELECT '46R' as size UNION SELECT '46L' as size UNION
  -- Size 48
  SELECT '48S' as size UNION SELECT '48R' as size UNION SELECT '48L' as size UNION
  -- Size 50
  SELECT '50S' as size UNION SELECT '50R' as size UNION SELECT '50L' as size UNION
  -- Size 52
  SELECT '52R' as size UNION SELECT '52L' as size UNION
  -- Size 54
  SELECT '54R' as size UNION SELECT '54L' as size
),
suit_colors AS (
  SELECT 'Navy' as color UNION SELECT 'Black' as color UNION 
  SELECT 'Charcoal' as color UNION SELECT 'Gray' as color
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
    CASE 
      WHEN p.category = 'Double-Breasted Suits' THEN 'DB-'
      WHEN p.category = 'Blazers' THEN 'BLZ-'
      WHEN p.category = 'Tuxedos' THEN 'TUX-'
      WHEN p.category = 'Formalwear' THEN 'FORM-'
      WHEN p.category = 'Stretch Suits' THEN 'STR-'
      ELSE 'SUIT-'
    END || SUBSTRING(REPLACE(p.id::text, '-', ''), 1, 6) || '-' || UPPER(c.color) || '-' || s.size as sku
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
    WHEN color IN ('Navy', 'Black') AND size LIKE '%R' THEN 8  -- Higher stock for regular sizes in popular colors
    WHEN color IN ('Navy', 'Black') THEN 5  -- Medium stock for short/long in popular colors
    WHEN size LIKE '%R' THEN 4  -- Medium stock for regular sizes in other colors
    ELSE 2  -- Lower stock for short/long in other colors
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
    ELSE 2500  -- Full suits
  END as weight_grams
FROM suit_variants;;