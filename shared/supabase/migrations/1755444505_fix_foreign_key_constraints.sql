-- Migration: fix_foreign_key_constraints
-- Created at: 1755444505

-- Temporarily remove foreign key constraints that might be causing issues

-- Drop foreign key constraints to auth.users for now
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_customer_id_fkey;
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_assigned_processor_id_fkey;

-- Grant permissions to related tables
GRANT ALL ON auth.users TO service_role;
GRANT USAGE ON SCHEMA auth TO service_role;;