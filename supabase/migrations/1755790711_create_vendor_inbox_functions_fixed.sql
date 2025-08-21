-- Migration: create_vendor_inbox_functions_fixed
-- Created at: 1755790711

-- Create PostgreSQL functions to handle vendor inbox queries

-- Function to get vendor inbox count
CREATE OR REPLACE FUNCTION get_vendor_inbox_count()
RETURNS TABLE(inbox_count integer)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT (count(*))::integer AS inbox_count
  FROM (vendor_products vp
    LEFT JOIN vendor_import_decisions d USING (shopify_product_id))
  WHERE (COALESCE(d.decision, 'none'::text) = ANY (ARRAY['none'::text, 'staged'::text]));
$$;

-- Function to get vendor inbox items with filters
CREATE OR REPLACE FUNCTION get_vendor_inbox_items(
  search_term text DEFAULT '',
  status_filter text DEFAULT '',
  decision_filter text DEFAULT '',
  page_offset integer DEFAULT 0,
  page_limit integer DEFAULT 20
)
RETURNS TABLE(
  shopify_product_id integer,
  title text,
  category text,
  price numeric,
  inventory integer,
  variants bigint,
  status text,
  created_at timestamp with time zone,
  image_src text,
  decision text
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    vp.shopify_product_id,
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
  WHERE 
    (COALESCE(d.decision, 'none'::text) = ANY (ARRAY['none'::text, 'staged'::text]))
    AND (search_term = '' OR (
      vp.title ILIKE '%' || search_term || '%' 
      OR vp.product_type ILIKE '%' || search_term || '%'
    ))
    AND (status_filter = '' OR vp.status = status_filter)
    AND (decision_filter = '' OR COALESCE(d.decision, 'none'::text) = decision_filter)
  ORDER BY vp.created_at DESC
  OFFSET page_offset
  LIMIT page_limit;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_vendor_inbox_count() TO public;
GRANT EXECUTE ON FUNCTION get_vendor_inbox_items(text, text, text, integer, integer) TO public;;