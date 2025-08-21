-- Migration: update_product_aggregates_final
-- Created at: 1755744501

-- Update all aggregate fields on products table
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
  ),
  -- Update price range based on variant pricing
  price_range = (
    SELECT jsonb_build_object(
      'min', MIN(epv.price_cents),
      'max', MAX(epv.price_cents)
    )
    FROM enhanced_product_variants epv 
    WHERE epv.product_id = products.id
  );;