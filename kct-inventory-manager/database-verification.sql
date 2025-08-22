-- Database Verification Script for Enhanced Inventory Manager
-- Run this in Supabase SQL Editor to verify all tables and policies exist

-- Check if all required tables exist
SELECT 
    schemaname,
    tablename,
    hasindexes,
    hasrules,
    hastriggers,
    rowsecurity
FROM pg_tables 
WHERE tablename IN ('products', 'enhanced_product_variants', 'low_stock_alerts', 'sizing_categories')
AND schemaname = 'public'
ORDER BY tablename;

-- Check RLS policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename IN ('products', 'enhanced_product_variants', 'low_stock_alerts', 'sizing_categories')
ORDER BY tablename, policyname;

-- Check table row counts
SELECT 
    'products' as table_name, 
    COUNT(*) as row_count 
FROM products
UNION ALL
SELECT 
    'enhanced_product_variants' as table_name, 
    COUNT(*) as row_count 
FROM enhanced_product_variants
UNION ALL
SELECT 
    'low_stock_alerts' as table_name, 
    COUNT(*) as row_count 
FROM low_stock_alerts
UNION ALL
SELECT 
    'sizing_categories' as table_name, 
    COUNT(*) as row_count 
FROM sizing_categories
ORDER BY table_name;

-- Check for any authentication issues
SELECT 
    auth.role() as current_role,
    auth.uid() as current_user_id;

-- Test a simple query that the app would make
SELECT 
    p.name,
    p.category,
    COUNT(epv.id) as variant_count
FROM products p
LEFT JOIN enhanced_product_variants epv ON p.id = epv.product_id
WHERE p.track_inventory = true
GROUP BY p.id, p.name, p.category
ORDER BY p.category, p.name;