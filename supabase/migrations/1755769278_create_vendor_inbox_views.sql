-- Migration: create_vendor_inbox_views
-- Created at: 1755769278

-- E) Required Views for Vendor Inbox system

-- View to count inbox items (products not yet imported)
CREATE OR REPLACE VIEW v_vendor_inbox_count AS
SELECT COUNT(*)::int AS inbox_count
FROM shopify_products sp
LEFT JOIN vendor_import_decisions d ON d.shopify_product_id = sp.shopify_product_id
WHERE COALESCE(d.decision,'none') IN ('none','staged');

-- Main inbox view with product details for admin UI
CREATE OR REPLACE VIEW v_vendor_inbox AS
SELECT
  sp.shopify_product_id,
  COALESCE(po.title_override, sp.title) AS title,
  sp.product_type AS category,
  (SELECT sv.price FROM shopify_variants sv
    WHERE sv.shopify_product_id = sp.shopify_product_id
    ORDER BY sv.position NULLS LAST, sv.shopify_variant_id LIMIT 1) AS price,
  (SELECT sil.available FROM shopify_variants sv
   JOIN shopify_inventory_levels sil ON sil.inventory_item_id = sv.inventory_item_id
   WHERE sv.shopify_product_id = sp.shopify_product_id
   ORDER BY sv.position NULLS LAST LIMIT 1) AS inventory,
  (SELECT COUNT(*) FROM shopify_variants sv WHERE sv.shopify_product_id = sp.shopify_product_id) AS variants,
  sp.status,
  sp.created_at,
  (SELECT si.src FROM shopify_images si
   WHERE si.shopify_product_id = sp.shopify_product_id
   ORDER BY si.position LIMIT 1) AS image_src,
  COALESCE(d.decision,'none') AS decision
FROM shopify_products sp
LEFT JOIN product_overrides po ON po.shopify_product_id = sp.shopify_product_id
LEFT JOIN vendor_import_decisions d ON d.shopify_product_id = sp.shopify_product_id
WHERE COALESCE(d.decision,'none') IN ('none','staged');

-- View for product variants with live vendor inventory
CREATE OR REPLACE VIEW v_product_variants_live AS
SELECT
  pv.id AS product_variant_id,
  pv.product_id,
  pv.sku,
  pv.price,
  pv.vendor_inventory_item_id,
  COALESCE(sil.available, 0) AS available_qty,
  sil.updated_at AS vendor_synced_at
FROM product_variants pv
LEFT JOIN shopify_inventory_levels sil
  ON sil.inventory_item_id = pv.vendor_inventory_item_id
 AND sil.location_id = COALESCE(pv.vendor_location_id, 100786209081::bigint); -- Default location ID

-- View for effective available quantities (after reservations)
CREATE OR REPLACE VIEW v_product_variants_effective AS
SELECT
  v.product_variant_id,
  v.product_id,
  v.sku,
  v.price,
  GREATEST(v.available_qty - COALESCE((
     SELECT SUM(r.quantity) FROM inventory_reservations r
     WHERE r.variant_id = v.product_variant_id
       AND r.expires_at > NOW()
  ),0), 0) AS effective_available
FROM v_product_variants_live v;

COMMIT;;