-- Migration: disable_problematic_triggers
-- Created at: 1755444631

-- Disable any triggers that might be causing issues
-- Drop all triggers on orders table temporarily

SELECT 'DROP TRIGGER IF EXISTS ' || tgname || ' ON ' || tgrelid::regclass || ';' 
FROM pg_trigger 
WHERE tgrelid = 'orders'::regclass AND tgname NOT LIKE 'RI_%';

-- Manually drop known triggers
DROP TRIGGER IF EXISTS order_processing_queue_trigger ON orders;
DROP TRIGGER IF EXISTS auto_create_queue_entry ON orders;
DROP TRIGGER IF EXISTS update_orders_updated_at ON orders;

-- Also grant permissions to any additional tables
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;;