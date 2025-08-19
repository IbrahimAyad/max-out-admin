-- Migration: fix_service_role_permissions
-- Created at: 1755577016

-- Grant explicit permissions to service_role for all inventory tables
GRANT ALL ON inventory_products TO service_role;
GRANT ALL ON inventory_variants TO service_role;
GRANT ALL ON size_definitions TO service_role;
GRANT ALL ON color_definitions TO service_role;
GRANT ALL ON inventory_movements TO service_role;

-- Grant usage on sequences
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- Update RLS policies to be more explicit about service_role access
DROP POLICY IF EXISTS "Enable read access for authenticated users on inventory_variants" ON inventory_variants;
DROP POLICY IF EXISTS "Enable insert access for authenticated users on inventory_variants" ON inventory_variants;
DROP POLICY IF EXISTS "Enable update access for authenticated users on inventory_variants" ON inventory_variants;
DROP POLICY IF EXISTS "Enable delete access for authenticated users on inventory_variants" ON inventory_variants;

-- Create service_role specific policies for inventory_variants
CREATE POLICY "Service role full access on inventory_variants" ON inventory_variants
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users read access on inventory_variants" ON inventory_variants
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users write access on inventory_variants" ON inventory_variants
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users update access on inventory_variants" ON inventory_variants
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- Update other tables similarly
DROP POLICY IF EXISTS "Enable read access for authenticated users on inventory_products" ON inventory_products;
DROP POLICY IF EXISTS "Enable insert access for authenticated users on inventory_products" ON inventory_products;
DROP POLICY IF EXISTS "Enable update access for authenticated users on inventory_products" ON inventory_products;
DROP POLICY IF EXISTS "Enable delete access for authenticated users on inventory_products" ON inventory_products;

CREATE POLICY "Service role full access on inventory_products" ON inventory_products
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users full access on inventory_products" ON inventory_products
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Update inventory_movements
DROP POLICY IF EXISTS "Enable read access for authenticated users on inventory_movements" ON inventory_movements;
DROP POLICY IF EXISTS "Enable insert access for authenticated users on inventory_movements" ON inventory_movements;
DROP POLICY IF EXISTS "Enable update access for service role on inventory_movements" ON inventory_movements;
DROP POLICY IF EXISTS "Enable delete access for service role on inventory_movements" ON inventory_movements;

CREATE POLICY "Service role full access on inventory_movements" ON inventory_movements
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users read/insert access on inventory_movements" ON inventory_movements
  FOR ALL TO authenticated USING (true) WITH CHECK (true);;