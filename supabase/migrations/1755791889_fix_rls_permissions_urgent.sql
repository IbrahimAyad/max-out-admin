-- Migration: fix_rls_permissions_urgent
-- Created at: 1755791889

-- URGENT: Fix RLS permissions for vendor inbox functionality

-- First, ensure all necessary GRANT statements are in place
GRANT SELECT ON vendor_products TO public;
GRANT SELECT ON vendor_variants TO public;
GRANT SELECT ON vendor_images TO public;
GRANT SELECT ON vendor_inventory_levels TO public;
GRANT SELECT, INSERT, UPDATE, DELETE ON vendor_import_decisions TO public;
GRANT SELECT ON product_overrides TO public;
GRANT SELECT, INSERT, UPDATE, DELETE ON analytics_page_views TO public;

-- Grant access to views
GRANT SELECT ON v_vendor_inbox_count TO public;
GRANT SELECT ON v_vendor_inbox TO public;

-- Grant access to other vendor tables
GRANT SELECT, INSERT, UPDATE, DELETE ON vendors TO public;
GRANT SELECT, INSERT, UPDATE, DELETE ON vendor_communications TO public;
GRANT SELECT, INSERT, UPDATE, DELETE ON vendor_product_relationships TO public;

-- Ensure RLS policies are correctly set for anon role access
-- Drop existing policies that might be conflicting
DROP POLICY IF EXISTS "Allow public read access" ON vendor_products;
DROP POLICY IF EXISTS "Allow public read access" ON vendor_variants;
DROP POLICY IF EXISTS "Allow public read access" ON vendor_images;
DROP POLICY IF EXISTS "Allow public read access" ON vendor_inventory_levels;
DROP POLICY IF EXISTS "Allow public read access" ON vendor_import_decisions;
DROP POLICY IF EXISTS "Allow public write access" ON vendor_import_decisions;
DROP POLICY IF EXISTS "Allow public read access" ON product_overrides;

-- Create comprehensive RLS policies
CREATE POLICY "Allow all public access" ON vendor_products FOR ALL TO public USING (true);
CREATE POLICY "Allow all public access" ON vendor_variants FOR ALL TO public USING (true);
CREATE POLICY "Allow all public access" ON vendor_images FOR ALL TO public USING (true);
CREATE POLICY "Allow all public access" ON vendor_inventory_levels FOR ALL TO public USING (true);
CREATE POLICY "Allow all public access" ON vendor_import_decisions FOR ALL TO public USING (true);
CREATE POLICY "Allow all public access" ON product_overrides FOR ALL TO public USING (true);

-- Ensure analytics policies are comprehensive
DROP POLICY IF EXISTS "Admin full access" ON analytics_page_views;
DROP POLICY IF EXISTS "Allow public insert access" ON analytics_page_views;
DROP POLICY IF EXISTS "Allow public select access" ON analytics_page_views;
DROP POLICY IF EXISTS "public_analytics_access" ON analytics_page_views;

CREATE POLICY "Allow all public access" ON analytics_page_views FOR ALL TO public USING (true);;