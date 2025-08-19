-- Migration: setup_inventory_policies
-- Created at: 1755576156

-- Enable RLS on inventory tables and create policies for service role access

-- Enable RLS
ALTER TABLE inventory_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE size_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE color_definitions ENABLE ROW LEVEL SECURITY;

-- Create policies for service role (allows all operations)
CREATE POLICY "Service role can manage inventory_products" ON inventory_products
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Service role can manage inventory_variants" ON inventory_variants
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Service role can manage size_definitions" ON size_definitions
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Service role can manage color_definitions" ON color_definitions
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Service role can manage inventory_movements" ON inventory_movements
  FOR ALL USING (true) WITH CHECK (true);;