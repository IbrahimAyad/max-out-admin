-- Migration: create_remaining_suit_and_shirt_variants
-- Created at: 1755743631

-- Create variants for remaining SUIT categories
WITH remaining_suit_products AS (
  SELECT id, name, base_price, category
  FROM products 
  WHERE category IN ('Suits', 'Double-Breasted Suits', 'Stretch Suits')
  AND id NOT IN (SELECT DISTINCT product_id FROM enhanced_product_variants WHERE product_id IS NOT NULL)
),
suit_variants AS (
  SELECT 
    p.id as product_id,
    CASE 
      WHEN p.category = 'Double-Breasted Suits' THEN 'blazer_double'
      ELSE 'suit_2piece'
    END as variant_type,
    v.color,
    v.size,
    CASE 
      WHEN p.category = 'Double-Breasted Suits' THEN 'DB-'
      WHEN p.category = 'Stretch Suits' THEN 'STR-'
      ELSE 'SUIT-'
    END || SUBSTRING(REPLACE(p.id::text, '-', ''), 1, 6) || '-' || UPPER(v.color) || '-' || v.size as sku,
    p.base_price
  FROM remaining_suit_products p
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
  product_id, variant_type, color, size, sku, base_price,
  CASE WHEN color IN ('Navy', 'Black') THEN 10 ELSE 5 END,
  CASE WHEN color IN ('Navy', 'Black') THEN 10 ELSE 5 END,
  0, 0, 3, 'in_stock', false, 2500
FROM suit_variants;

-- Create variants for remaining SHIRT categories  
WITH shirt_products AS (
  SELECT id, name, base_price, category
  FROM products 
  WHERE category IN ('Mens Shirts', 'Shirts')
  AND id NOT IN (SELECT DISTINCT product_id FROM enhanced_product_variants WHERE product_id IS NOT NULL)
),
shirt_variants AS (
  SELECT 
    p.id as product_id,
    'shirt_classic' as variant_type,
    v.color,
    v.size,
    'SHIRT-' || SUBSTRING(REPLACE(p.id::text, '-', ''), 1, 6) || '-' || UPPER(v.color) || '-' || v.size as sku,
    p.base_price
  FROM shirt_products p
  CROSS JOIN (
    VALUES 
      ('White', '14.5'), ('White', '15'), ('White', '15.5'), ('White', '16'), ('White', '16.5'), ('White', '17'), ('White', '17.5'),
      ('Blue', '15'), ('Blue', '15.5'), ('Blue', '16'), ('Blue', '16.5'), ('Blue', '17'),
      ('Light Blue', '15.5'), ('Light Blue', '16'), ('Light Blue', '16.5')
  ) v(color, size)
)
INSERT INTO enhanced_product_variants (
  product_id, variant_type, color, size, sku, price_cents, 
  inventory_quantity, available_quantity, reserved_quantity, committed_quantity,
  low_stock_threshold, stock_status, allow_backorders, weight_grams
)
SELECT 
  product_id, variant_type, color, size, sku, base_price,
  CASE WHEN color = 'White' THEN 20 ELSE 12 END,
  CASE WHEN color = 'White' THEN 20 ELSE 12 END,
  0, 0, 5, 'in_stock', false, 300
FROM shirt_variants;;