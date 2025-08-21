-- Migration: fix_vendor_inbox_rls_policies
-- Created at: 1755790566

-- Fix RLS policies for vendor inbox functionality

-- Ensure all vendor tables have public SELECT access
DROP POLICY IF EXISTS "Allow public read access" ON vendor_products;
CREATE POLICY "Allow public read access" ON vendor_products FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "Allow public read access" ON vendor_variants;
CREATE POLICY "Allow public read access" ON vendor_variants FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "Allow public read access" ON vendor_images;
CREATE POLICY "Allow public read access" ON vendor_images FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "Allow public read access" ON vendor_inventory_levels;
CREATE POLICY "Allow public read access" ON vendor_inventory_levels FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "Allow public read access" ON vendor_import_decisions;
CREATE POLICY "Allow public read access" ON vendor_import_decisions FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "Allow public read access" ON product_overrides;
CREATE POLICY "Allow public read access" ON product_overrides FOR SELECT TO public USING (true);

-- Also need INSERT/UPDATE access for vendor_import_decisions since the app needs to update decisions
DROP POLICY IF EXISTS "Allow public write access" ON vendor_import_decisions;
CREATE POLICY "Allow public write access" ON vendor_import_decisions FOR ALL TO public USING (true);;