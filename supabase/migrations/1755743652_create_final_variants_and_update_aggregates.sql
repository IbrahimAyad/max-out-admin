-- Migration: create_final_variants_and_update_aggregates
-- Created at: 1755743652

-- Create variants for remaining FORMALWEAR category
WITH final_products AS (
  SELECT id, name, base_price, category
  FROM products 
  WHERE category = 'Formalwear'
  AND id NOT IN (SELECT DISTINCT product_id FROM enhanced_product_variants WHERE product_id IS NOT NULL)
),
final_variants AS (
  SELECT 
    p.id as product_id,
    'tuxedo_single' as variant_type,
    v.color,
    v.size,
    'FORM-' || SUBSTRING(REPLACE(p.id::text, '-', ''), 1, 6) || '-' || UPPER(v.color) || '-' || v.size as sku,
    p.base_price
  FROM final_products p
  CROSS JOIN (
    VALUES 
      ('Black', '38R'), ('Black', '40R'), ('Black', '42R'), ('Black', '44R'),
      ('Navy', '40R'), ('Navy', '42R')
  ) v(color, size)
)
INSERT INTO enhanced_product_variants (
  product_id, variant_type, color, size, sku, price_cents, 
  inventory_quantity, available_quantity, reserved_quantity, committed_quantity,
  low_stock_threshold, stock_status, allow_backorders, weight_grams
)
SELECT 
  product_id, variant_type, color, size, sku, base_price,
  3, 3, 0, 0, 1, 'in_stock', false, 2500
FROM final_variants;

-- Now update all aggregate fields on products table
UPDATE products 
SET 
  total_inventory = (
    SELECT COALESCE(SUM(epv.inventory_quantity), 0)
    FROM enhanced_product_variants epv 
    WHERE epv.product_id = products.id
  ),
  variant_count = (
    SELECT COUNT(*)
    FROM enhanced_product_variants epv 
    WHERE epv.product_id = products.id
  ),
  in_stock = (
    SELECT COALESCE(SUM(epv.inventory_quantity), 0) > 0
    FROM enhanced_product_variants epv 
    WHERE epv.product_id = products.id
  );

-- Update search keywords for better searchability
UPDATE products 
SET search_keywords = LOWER(name || ' ' || category || ' ' || COALESCE(subcategory, '') || ' ' || vendor)
WHERE search_keywords IS NULL;;