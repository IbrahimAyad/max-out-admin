-- Test script to verify anon role can access vendor tables directly
-- This simulates what the frontend would do

-- Connect using anon key and test queries
SET ROLE anon;

-- Test vendor_products access
SELECT COUNT(*) as product_count FROM vendor_products;

-- Test views access
SELECT inbox_count FROM v_vendor_inbox_count;
SELECT COUNT(*) as inbox_items FROM v_vendor_inbox;

-- Test analytics access
INSERT INTO analytics_page_views (page_path, page_title) VALUES ('/test-anon', 'Test Anon');

-- Reset role
RESET ROLE;