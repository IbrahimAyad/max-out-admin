-- Migration: disable_rls_for_testing
-- Created at: 1755576187

-- Temporarily disable RLS for testing
ALTER TABLE inventory_products DISABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_variants DISABLE ROW LEVEL SECURITY;
ALTER TABLE size_definitions DISABLE ROW LEVEL SECURITY;
ALTER TABLE color_definitions DISABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_movements DISABLE ROW LEVEL SECURITY;;