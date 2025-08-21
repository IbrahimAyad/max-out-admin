-- Migration: fix_vendor_table_permissions
-- Created at: 1755792900

-- Fix permissions for vendor tables

-- Enable RLS on all vendor tables if not already enabled
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_inventory_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_import_decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_overrides ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_communications ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_product_relationships ENABLE ROW LEVEL SECURITY;

-- Grant all privileges to service_role (which is used by edge functions)
GRANT ALL PRIVILEGES ON vendors TO service_role;
GRANT ALL PRIVILEGES ON vendor_products TO service_role;
GRANT ALL PRIVILEGES ON vendor_variants TO service_role;
GRANT ALL PRIVILEGES ON vendor_images TO service_role;
GRANT ALL PRIVILEGES ON vendor_inventory_levels TO service_role;
GRANT ALL PRIVILEGES ON vendor_import_decisions TO service_role;
GRANT ALL PRIVILEGES ON product_overrides TO service_role;
GRANT ALL PRIVILEGES ON vendor_communications TO service_role;
GRANT ALL PRIVILEGES ON vendor_product_relationships TO service_role;

-- Create or replace RLS policies for service_role access
DROP POLICY IF EXISTS "Allow all service_role access" ON vendors;
CREATE POLICY "Allow all service_role access" ON vendors FOR ALL TO service_role USING (true);

DROP POLICY IF EXISTS "Allow all service_role access" ON vendor_products;
CREATE POLICY "Allow all service_role access" ON vendor_products FOR ALL TO service_role USING (true);

DROP POLICY IF EXISTS "Allow all service_role access" ON vendor_variants;
CREATE POLICY "Allow all service_role access" ON vendor_variants FOR ALL TO service_role USING (true);

DROP POLICY IF EXISTS "Allow all service_role access" ON vendor_images;
CREATE POLICY "Allow all service_role access" ON vendor_images FOR ALL TO service_role USING (true);

DROP POLICY IF EXISTS "Allow all service_role access" ON vendor_inventory_levels;
CREATE POLICY "Allow all service_role access" ON vendor_inventory_levels FOR ALL TO service_role USING (true);

DROP POLICY IF EXISTS "Allow all service_role access" ON vendor_import_decisions;
CREATE POLICY "Allow all service_role access" ON vendor_import_decisions FOR ALL TO service_role USING (true);

DROP POLICY IF EXISTS "Allow all service_role access" ON product_overrides;
CREATE POLICY "Allow all service_role access" ON product_overrides FOR ALL TO service_role USING (true);

DROP POLICY IF EXISTS "Allow all service_role access" ON vendor_communications;
CREATE POLICY "Allow all service_role access" ON vendor_communications FOR ALL TO service_role USING (true);

DROP POLICY IF EXISTS "Allow all service_role access" ON vendor_product_relationships;
CREATE POLICY "Allow all service_role access" ON vendor_product_relationships FOR ALL TO service_role USING (true);;