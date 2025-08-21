-- Migration: grant_anon_role_access
-- Created at: 1755791940

-- Grant explicit access to anon role for vendor functionality

-- Grant permissions to anon role specifically
GRANT SELECT ON vendor_products TO anon;
GRANT SELECT ON vendor_variants TO anon;
GRANT SELECT ON vendor_images TO anon;
GRANT SELECT ON vendor_inventory_levels TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON vendor_import_decisions TO anon;
GRANT SELECT ON product_overrides TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON analytics_page_views TO anon;

-- Grant access to views for anon role
GRANT SELECT ON v_vendor_inbox_count TO anon;
GRANT SELECT ON v_vendor_inbox TO anon;

-- Grant access to other vendor tables for anon role
GRANT SELECT, INSERT, UPDATE, DELETE ON vendors TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON vendor_communications TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON vendor_product_relationships TO anon;

-- Also grant to authenticated role for completeness
GRANT SELECT ON vendor_products TO authenticated;
GRANT SELECT ON vendor_variants TO authenticated;
GRANT SELECT ON vendor_images TO authenticated;
GRANT SELECT ON vendor_inventory_levels TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON vendor_import_decisions TO authenticated;
GRANT SELECT ON product_overrides TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON analytics_page_views TO authenticated;
GRANT SELECT ON v_vendor_inbox_count TO authenticated;
GRANT SELECT ON v_vendor_inbox TO authenticated;;