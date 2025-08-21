-- Migration: create_blazer_variants_unique_sku
-- Created at: 1755743586

-- Create variants for all BLAZERS with unique SKUs using product ID
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
    'BLZ-' || SUBSTRING(REPLACE(p.id::text, '-', ''), 1, 8) || '-' || UPPER(v.color) || '-' || v.size as sku
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
    WHEN color IN ('Navy', 'Black') THEN 12
    ELSE 6
  END as inventory_quantity,
  CASE 
    WHEN color IN ('Navy', 'Black') THEN 12
    ELSE 6
  END as available_quantity,
  0 as reserved_quantity,
  0 as committed_quantity,
  3 as low_stock_threshold,
  'in_stock' as stock_status,
  false as allow_backorders,
  1800 as weight_grams
FROM blazer_variants;;