-- Migration: create_tuxedo_and_accessory_variants
-- Created at: 1755743606

-- Create variants for TUXEDOS (20 products)
WITH tuxedo_products AS (
  SELECT id, name, base_price, category
  FROM products 
  WHERE category = 'Tuxedos'
  AND id NOT IN (SELECT DISTINCT product_id FROM enhanced_product_variants WHERE product_id IS NOT NULL)
),
tuxedo_variants AS (
  SELECT 
    p.id as product_id,
    'tuxedo_single' as variant_type,
    v.color,
    v.size,
    'TUX-' || SUBSTRING(REPLACE(p.id::text, '-', ''), 1, 8) || '-' || UPPER(v.color) || '-' || v.size as sku,
    p.base_price
  FROM tuxedo_products p
  CROSS JOIN (
    VALUES 
      ('Black', '36R'), ('Black', '38R'), ('Black', '40R'), ('Black', '42R'), ('Black', '44R'), ('Black', '46R'),
      ('Navy', '38R'), ('Navy', '40R'), ('Navy', '42R'), ('Navy', '44R'),
      ('White', '38R'), ('White', '40R'), ('White', '42R'), ('White', '44R')
  ) v(color, size)
)
INSERT INTO enhanced_product_variants (
  product_id, variant_type, color, size, sku, price_cents, 
  inventory_quantity, available_quantity, reserved_quantity, committed_quantity,
  low_stock_threshold, stock_status, allow_backorders, weight_grams
)
SELECT 
  product_id, variant_type, color, size, sku, base_price,
  CASE WHEN color = 'Black' THEN 8 ELSE 4 END,
  CASE WHEN color = 'Black' THEN 8 ELSE 4 END,
  0, 0, 2, 'in_stock', false, 2200
FROM tuxedo_variants;

-- Create variants for ACCESSORIES (most are one-size, some have color options)
WITH accessory_products AS (
  SELECT id, name, base_price, category
  FROM products 
  WHERE category = 'Accessories'
  AND id NOT IN (SELECT DISTINCT product_id FROM enhanced_product_variants WHERE product_id IS NOT NULL)
),
accessory_variants AS (
  SELECT 
    p.id as product_id,
    'accessory_onesize' as variant_type,
    v.color,
    'One Size' as size,
    'ACC-' || SUBSTRING(REPLACE(p.id::text, '-', ''), 1, 8) || '-' || UPPER(v.color) || '-OS' as sku,
    p.base_price
  FROM accessory_products p
  CROSS JOIN (
    VALUES ('Black'), ('Navy'), ('White'), ('Silver'), ('Gold')
  ) v(color)
)
INSERT INTO enhanced_product_variants (
  product_id, variant_type, color, size, sku, price_cents, 
  inventory_quantity, available_quantity, reserved_quantity, committed_quantity,
  low_stock_threshold, stock_status, allow_backorders, weight_grams
)
SELECT 
  product_id, variant_type, color, size, sku, base_price,
  CASE WHEN color IN ('Black', 'Navy') THEN 25 ELSE 15 END,
  CASE WHEN color IN ('Black', 'Navy') THEN 25 ELSE 15 END,
  0, 0, 5, 'in_stock', false, 200
FROM accessory_variants;;