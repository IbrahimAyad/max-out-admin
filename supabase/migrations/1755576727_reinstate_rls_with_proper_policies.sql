-- Migration: reinstate_rls_with_proper_policies
-- Created at: 1755576727

-- Re-enable RLS on all inventory tables
ALTER TABLE inventory_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE size_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE color_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_movements ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies to start fresh
DROP POLICY IF EXISTS "Allow authenticated access to inventory_products" ON inventory_products;
DROP POLICY IF EXISTS "Allow authenticated access to inventory_variants" ON inventory_variants;
DROP POLICY IF EXISTS "Allow authenticated access to size_definitions" ON size_definitions;
DROP POLICY IF EXISTS "Allow authenticated access to color_definitions" ON color_definitions;
DROP POLICY IF EXISTS "Allow authenticated access to inventory_movements" ON inventory_movements;

-- Create comprehensive policies for authenticated users and service role
-- Inventory Products Policies
CREATE POLICY "Enable read access for authenticated users on inventory_products" ON inventory_products
  FOR SELECT USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');

CREATE POLICY "Enable insert access for authenticated users on inventory_products" ON inventory_products
  FOR INSERT WITH CHECK (auth.role() = 'authenticated' OR auth.role() = 'service_role');

CREATE POLICY "Enable update access for authenticated users on inventory_products" ON inventory_products
  FOR UPDATE USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');

CREATE POLICY "Enable delete access for authenticated users on inventory_products" ON inventory_products
  FOR DELETE USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');

-- Inventory Variants Policies  
CREATE POLICY "Enable read access for authenticated users on inventory_variants" ON inventory_variants
  FOR SELECT USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');

CREATE POLICY "Enable insert access for authenticated users on inventory_variants" ON inventory_variants
  FOR INSERT WITH CHECK (auth.role() = 'authenticated' OR auth.role() = 'service_role');

CREATE POLICY "Enable update access for authenticated users on inventory_variants" ON inventory_variants
  FOR UPDATE USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');

CREATE POLICY "Enable delete access for authenticated users on inventory_variants" ON inventory_variants
  FOR DELETE USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');

-- Size Definitions Policies (Read-only for most users)
CREATE POLICY "Enable read access for authenticated users on size_definitions" ON size_definitions
  FOR SELECT USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');

CREATE POLICY "Enable full access for service role on size_definitions" ON size_definitions
  FOR ALL USING (auth.role() = 'service_role');

-- Color Definitions Policies (Read-only for most users)
CREATE POLICY "Enable read access for authenticated users on color_definitions" ON color_definitions
  FOR SELECT USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');

CREATE POLICY "Enable full access for service role on color_definitions" ON color_definitions
  FOR ALL USING (auth.role() = 'service_role');

-- Inventory Movements Policies
CREATE POLICY "Enable read access for authenticated users on inventory_movements" ON inventory_movements
  FOR SELECT USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');

CREATE POLICY "Enable insert access for authenticated users on inventory_movements" ON inventory_movements
  FOR INSERT WITH CHECK (auth.role() = 'authenticated' OR auth.role() = 'service_role');

CREATE POLICY "Enable update access for service role on inventory_movements" ON inventory_movements
  FOR UPDATE USING (auth.role() = 'service_role');

CREATE POLICY "Enable delete access for service role on inventory_movements" ON inventory_movements
  FOR DELETE USING (auth.role() = 'service_role');;