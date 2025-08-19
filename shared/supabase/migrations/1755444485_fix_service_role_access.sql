-- Migration: fix_service_role_access
-- Created at: 1755444485

-- Fix service role access for edge functions

-- Temporarily disable RLS on orders table for service role access
ALTER TABLE orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE order_items DISABLE ROW LEVEL SECURITY;

-- Grant explicit permissions to service role
GRANT ALL ON orders TO service_role;
GRANT ALL ON order_items TO service_role;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO service_role;;