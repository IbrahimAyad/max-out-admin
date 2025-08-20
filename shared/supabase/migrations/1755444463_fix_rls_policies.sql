-- Migration: fix_rls_policies
-- Created at: 1755444463

-- Fix RLS policies for order management system

-- Enable RLS on orders table if not already enabled
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Service role full access" ON orders;
DROP POLICY IF EXISTS "Admin access orders" ON orders;

-- Create policy for service role (used by edge functions)
CREATE POLICY "Service role full access" ON orders FOR ALL 
USING (true)
WITH CHECK (true);

-- Enable RLS on order_items table
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Service role full access" ON order_items;
DROP POLICY IF EXISTS "Admin access order_items" ON order_items;

-- Create policy for service role on order_items
CREATE POLICY "Service role full access" ON order_items FOR ALL 
USING (true)
WITH CHECK (true);;