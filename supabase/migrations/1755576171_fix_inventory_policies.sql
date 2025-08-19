-- Migration: fix_inventory_policies
-- Created at: 1755576171

-- Drop existing policies and create simpler ones
DROP POLICY IF EXISTS "Service role can manage inventory_products" ON inventory_products;
DROP POLICY IF EXISTS "Service role can manage inventory_variants" ON inventory_variants;
DROP POLICY IF EXISTS "Service role can manage size_definitions" ON size_definitions;
DROP POLICY IF EXISTS "Service role can manage color_definitions" ON color_definitions;
DROP POLICY IF EXISTS "Service role can manage inventory_movements" ON inventory_movements;

-- Create policies that allow authenticated users and service role
CREATE POLICY "Allow authenticated access to inventory_products" ON inventory_products
  FOR ALL TO authenticated, service_role USING (true) WITH CHECK (true);

CREATE POLICY "Allow authenticated access to inventory_variants" ON inventory_variants
  FOR ALL TO authenticated, service_role USING (true) WITH CHECK (true);

CREATE POLICY "Allow authenticated access to size_definitions" ON size_definitions
  FOR ALL TO authenticated, service_role USING (true) WITH CHECK (true);

CREATE POLICY "Allow authenticated access to color_definitions" ON color_definitions
  FOR ALL TO authenticated, service_role USING (true) WITH CHECK (true);

CREATE POLICY "Allow authenticated access to inventory_movements" ON inventory_movements
  FOR ALL TO authenticated, service_role USING (true) WITH CHECK (true);;