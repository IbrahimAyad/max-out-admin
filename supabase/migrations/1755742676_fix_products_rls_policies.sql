-- Migration: fix_products_rls_policies
-- Created at: 1755742676

-- Enable RLS on products table
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Enable RLS on enhanced_product_variants table  
ALTER TABLE enhanced_product_variants ENABLE ROW LEVEL SECURITY;

-- Clean up redundant policies on products table
DROP POLICY IF EXISTS "Anyone can view products" ON products;
DROP POLICY IF EXISTS "Public read access for products" ON products; 
DROP POLICY IF EXISTS "allow_read_products" ON products;
DROP POLICY IF EXISTS "anyone_can_read_products" ON products;
DROP POLICY IF EXISTS "products_public_read" ON products;

-- Keep the essential policies
-- Products policies are already good with:
-- "Allow all operations for authenticated users on products" 
-- "Service role has full access to products"
-- "allow_admin_modify_products" 
-- "products_auth_all"

-- Add missing policies for enhanced_product_variants
CREATE POLICY "authenticated_users_read_variants" ON enhanced_product_variants
  FOR SELECT TO authenticated 
  USING (true);

CREATE POLICY "service_role_all_variants" ON enhanced_product_variants  
  FOR ALL TO service_role
  USING (true);

CREATE POLICY "admin_all_variants" ON enhanced_product_variants
  FOR ALL TO public
  USING (is_admin());;