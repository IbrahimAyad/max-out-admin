-- Migration: create_vendor_views_and_policies
-- Created at: 1755792790

-- Create vendor inbox views and apply RLS policies

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

-- Enable RLS on all vendor tables
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_inventory_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_import_decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_overrides ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_communications ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_product_relationships ENABLE ROW LEVEL SECURITY;

-- Create comprehensive RLS policies for all tables
CREATE POLICY "Allow all public access" ON vendors FOR ALL TO public USING (true);
CREATE POLICY "Allow all public access" ON vendor_products FOR ALL TO public USING (true);
CREATE POLICY "Allow all public access" ON vendor_variants FOR ALL TO public USING (true);
CREATE POLICY "Allow all public access" ON vendor_images FOR ALL TO public USING (true);
CREATE POLICY "Allow all public access" ON vendor_inventory_levels FOR ALL TO public USING (true);
CREATE POLICY "Allow all public access" ON vendor_import_decisions FOR ALL TO public USING (true);
CREATE POLICY "Allow all public access" ON product_overrides FOR ALL TO public USING (true);
CREATE POLICY "Allow all public access" ON vendor_communications FOR ALL TO public USING (true);
CREATE POLICY "Allow all public access" ON vendor_product_relationships FOR ALL TO public USING (true);

-- Grant permissions to all roles
GRANT ALL PRIVILEGES ON vendors TO public, anon, authenticated;
GRANT ALL PRIVILEGES ON vendor_products TO public, anon, authenticated;
GRANT ALL PRIVILEGES ON vendor_variants TO public, anon, authenticated;
GRANT ALL PRIVILEGES ON vendor_images TO public, anon, authenticated;
GRANT ALL PRIVILEGES ON vendor_inventory_levels TO public, anon, authenticated;
GRANT ALL PRIVILEGES ON vendor_import_decisions TO public, anon, authenticated;
GRANT ALL PRIVILEGES ON product_overrides TO public, anon, authenticated;
GRANT ALL PRIVILEGES ON vendor_communications TO public, anon, authenticated;
GRANT ALL PRIVILEGES ON vendor_product_relationships TO public, anon, authenticated;

-- Grant view permissions
GRANT SELECT ON v_vendor_inbox_count TO public, anon, authenticated;
GRANT SELECT ON v_vendor_inbox TO public, anon, authenticated;;