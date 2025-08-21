-- Migration: create_blazer_variants
-- Created at: 1755743491

-- Create variants for all BLAZERS (71 products)
-- Using standard men's formal sizing: 36R, 38R, 40R, 42R, 44R, 46R, 48R
-- Colors: Navy, Black, Charcoal, Gray (most versatile for formal wear)

WITH blazer_products AS (
  SELECT id, name, base_price, category
  FROM products 
  WHERE category = 'Blazers'
  AND id NOT IN (SELECT DISTINCT product_id FROM enhanced_product_variants WHERE product_id IS NOT NULL)
),
blazer_variants AS (
  SELECT 
    p.id as product_id,
    p.name,
    p.base_price,
    v.color,
    v.size,
    'blazer_single' as variant_type,
    UPPER(REGEXP_REPLACE(REGEXP_REPLACE(p.name, '[^a-zA-Z0-9\s-]', '', 'g'), '\s+', '-', 'g')) || '-' || UPPER(v.color) || '-' || v.size as sku
  FROM blazer_products p
  CROSS JOIN (
    VALUES 
      ('Navy', '36R'), ('Navy', '38R'), ('Navy', '40R'), ('Navy', '42R'), ('Navy', '44R'), ('Navy', '46R'),
      ('Black', '36R'), ('Black', '38R'), ('Black', '40R'), ('Black', '42R'), ('Black', '44R'), ('Black', '46R'),
      ('Charcoal', '38R'), ('Charcoal', '40R'), ('Charcoal', '42R'), ('Charcoal', '44R'),
      ('Gray', '38R'), ('Gray', '40R'), ('Gray', '42R'), ('Gray', '44R')
  ) v(color, size)
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
    WHEN color IN ('Navy', 'Black') THEN 15  -- Higher stock for popular colors
    ELSE 8  -- Standard stock
  END as inventory_quantity,
  CASE 
    WHEN color IN ('Navy', 'Black') THEN 15
    ELSE 8
  END as available_quantity,
  0 as reserved_quantity,
  0 as committed_quantity,
  5 as low_stock_threshold,
  'in_stock' as stock_status,
  false as allow_backorders,
  2000 as weight_grams  -- ~2kg for blazer
FROM blazer_variants;;