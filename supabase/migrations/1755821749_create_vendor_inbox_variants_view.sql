-- Migration: create_vendor_inbox_variants_view
-- Created at: 1755821749

-- Create enhanced vendor inbox view showing variants instead of products
CREATE OR REPLACE VIEW v_vendor_inbox_variants AS
WITH variant_data AS (
  SELECT 
    vv.shopify_variant_id,
    vv.shopify_product_id,
    vv.sku,
    vv.option1 as color_name,
    vv.option2 as size,
    vv.option3 as color_code,
    vv.price,
    vil.available as inventory_quantity,
    vp.title as product_title,
    vp.product_type as category,
    vp.status,
    vp.created_at,
    -- Extract base product code (first part of SKU before the color code)
    SUBSTRING(vv.sku FROM '^([^-]+)') as base_product_code,
    -- Create display title with color and size
    CONCAT(vp.title, ' - ', vv.option1, ' Size ', vv.option2) as variant_display_title,
    -- Get image from vendor images if available
    vi.image_src,
    -- Get import decision from decisions table
    COALESCE(vid.decision, 'none') as decision,
    vid.decided_at
  FROM vendor_variants vv
  JOIN vendor_products vp ON vv.shopify_product_id = vp.shopify_product_id
  LEFT JOIN vendor_inventory_levels vil ON vv.inventory_item_id = vil.inventory_item_id
  LEFT JOIN vendor_images vi ON vv.shopify_product_id = vi.shopify_product_id AND vi.position = 1
  LEFT JOIN vendor_import_decisions vid ON vv.shopify_product_id = vid.shopify_product_id
)
SELECT 
  shopify_variant_id,
  shopify_product_id,
  sku,
  variant_display_title as title,
  color_name,
  size,
  color_code,
  base_product_code,
  product_title,
  category,
  price,
  inventory_quantity,
  status,
  created_at,
  image_src,
  decision,
  decided_at
FROM variant_data
WHERE status = 'active'
ORDER BY base_product_code, color_code, size::integer;;