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
WHERE tablename IN (
    'products', 
    'enhanced_product_variants', 
    'low_stock_alerts', 
    'sizing_categories',
    'vendor_products',
    'vendor_variants', 
    'vendor_images',
    'vendor_inventory_levels',
    'vendor_import_decisions',
    'product_overrides'
)
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
WHERE tablename IN (
    'products', 
    'enhanced_product_variants', 
    'low_stock_alerts', 
    'sizing_categories',
    'vendor_products',
    'vendor_variants', 
    'vendor_images',
    'vendor_inventory_levels',
    'vendor_import_decisions',
    'product_overrides'
)
ORDER BY tablename, policyname;

-- Check table row counts
SELECT 'products' as table_name, COUNT(*) as row_count FROM products
UNION ALL
SELECT 'enhanced_product_variants' as table_name, COUNT(*) as row_count FROM enhanced_product_variants
UNION ALL
SELECT 'low_stock_alerts' as table_name, COUNT(*) as row_count FROM low_stock_alerts
UNION ALL
SELECT 'sizing_categories' as table_name, COUNT(*) as row_count FROM sizing_categories
UNION ALL
SELECT 'vendor_products' as table_name, COUNT(*) as row_count FROM vendor_products
UNION ALL
SELECT 'vendor_variants' as table_name, COUNT(*) as row_count FROM vendor_variants
UNION ALL
SELECT 'vendor_images' as table_name, COUNT(*) as row_count FROM vendor_images
UNION ALL
SELECT 'vendor_inventory_levels' as table_name, COUNT(*) as row_count FROM vendor_inventory_levels
UNION ALL
SELECT 'vendor_import_decisions' as table_name, COUNT(*) as row_count FROM vendor_import_decisions
UNION ALL
SELECT 'product_overrides' as table_name, COUNT(*) as row_count FROM product_overrides
ORDER BY table_name;

-- Check for any authentication issues
SELECT 
    auth.role() as current_role,
    auth.uid() as current_user_id;

-- Test main inventory query
SELECT 
    p.name,
    p.category,
    COUNT(epv.id) as variant_count
FROM products p
LEFT JOIN enhanced_product_variants epv ON p.id = epv.product_id
WHERE p.track_inventory = true
GROUP BY p.id, p.name, p.category
ORDER BY p.category, p.name;

-- Test vendor inbox query
SELECT 
    vp.shopify_product_id,
    vp.title,
    vp.vendor,
    COUNT(vv.id) as variant_count,
    SUM(COALESCE(vil.available, 0)) as total_inventory
FROM vendor_products vp
LEFT JOIN vendor_variants vv ON vp.shopify_product_id = vv.shopify_product_id
LEFT JOIN vendor_inventory_levels vil ON vv.inventory_item_id = vil.inventory_item_id
WHERE vp.status = 'active'
GROUP BY vp.shopify_product_id, vp.title, vp.vendor
ORDER BY vp.title;

-- Test vendor inbox views
SELECT * FROM v_vendor_inbox_count;
SELECT * FROM v_vendor_inbox LIMIT 5;
SELECT * FROM v_vendor_inbox_variants LIMIT 10;