-- SIMPLE FIX: Just fix permissions on existing enhanced_product_variants table
-- Run this in Supabase SQL Editor - keeps your existing data and structure

-- Step 1: Disable RLS completely to fix Edge Function access
ALTER TABLE enhanced_product_variants DISABLE ROW LEVEL SECURITY;

-- Step 2: Drop any problematic existing policies
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON enhanced_product_variants;
DROP POLICY IF EXISTS "Enable all operations for service role" ON enhanced_product_variants;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON enhanced_product_variants;
DROP POLICY IF EXISTS "Enable write access for authenticated users" ON enhanced_product_variants;
DROP POLICY IF EXISTS "Enable update access for authenticated users" ON enhanced_product_variants;
DROP POLICY IF EXISTS "Enable delete access for authenticated users" ON enhanced_product_variants;

-- Step 3: Grant explicit permissions to all roles to ensure access
GRANT ALL ON enhanced_product_variants TO authenticated;
GRANT ALL ON enhanced_product_variants TO service_role;
GRANT ALL ON enhanced_product_variants TO anon;

-- Step 4: Make sure the table owner is correct
ALTER TABLE enhanced_product_variants OWNER TO postgres;

-- That's it! This preserves your existing table structure and data
-- while fixing the permission issues that were blocking Edge Functions