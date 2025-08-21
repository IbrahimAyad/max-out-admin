-- Migration: create_vendor_views_only
-- Created at: 1755792803

-- Create vendor inbox views

-- Create vendor inbox count view
CREATE OR REPLACE VIEW v_vendor_inbox_count AS
SELECT (count(*))::integer AS inbox_count
FROM (vendor_products vp
  LEFT JOIN vendor_import_decisions d USING (shopify_product_id))
WHERE (COALESCE(d.decision, 'none'::text) = ANY (ARRAY['none'::text, 'staged'::text]));

-- Create vendor inbox view
CREATE OR REPLACE VIEW v_vendor_inbox AS
SELECT vp.shopify_product_id,
    COALESCE(o.title_override, vp.title) AS title,
    vp.product_type AS category,
    ( SELECT vv.price
           FROM vendor_variants vv
          WHERE (vv.shopify_product_id = vp.shopify_product_id)
          ORDER BY vv.position, vv.shopify_variant_id
         LIMIT 1) AS price,
    ( SELECT vil.available
           FROM (vendor_variants vv
             JOIN vendor_inventory_levels vil ON ((vil.inventory_item_id = vv.inventory_item_id)))
          WHERE (vv.shopify_product_id = vp.shopify_product_id)
          ORDER BY vv.position
         LIMIT 1) AS inventory,
    ( SELECT count(*) AS count
           FROM vendor_variants vv
          WHERE (vv.shopify_product_id = vp.shopify_product_id)) AS variants,
    vp.status,
    vp.created_at,
    ( SELECT vi.src
           FROM vendor_images vi
          WHERE (vi.shopify_product_id = vp.shopify_product_id)
          ORDER BY vi.position
         LIMIT 1) AS image_src,
    COALESCE(d.decision, 'none'::text) AS decision
   FROM ((vendor_products vp
     LEFT JOIN product_overrides o USING (shopify_product_id))
     LEFT JOIN vendor_import_decisions d USING (shopify_product_id))
  WHERE (COALESCE(d.decision, 'none'::text) = ANY (ARRAY['none'::text, 'staged'::text]));

-- Grant view permissions
GRANT SELECT ON v_vendor_inbox_count TO public, anon, authenticated;
GRANT SELECT ON v_vendor_inbox TO public, anon, authenticated;;