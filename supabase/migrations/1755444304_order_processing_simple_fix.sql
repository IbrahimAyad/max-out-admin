-- Migration: order_processing_simple_fix
-- Created at: 1755444304

-- Simple fix for order processing schema
-- Drop any problematic triggers first
DROP TRIGGER IF EXISTS log_order_status_change ON orders;
DROP FUNCTION IF EXISTS log_order_status_change();

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum types (with error handling)
DO $$ BEGIN
    CREATE TYPE order_status AS ENUM (
      'pending_payment',
      'payment_confirmed', 
      'processing',
      'in_production',
      'quality_check',
      'packaging',
      'shipped',
      'out_for_delivery',
      'delivered',
      'completed',
      'cancelled',
      'refunded',
      'on_hold',
      'exception'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE order_priority AS ENUM (
      'low',
      'normal',
      'high',
      'urgent',
      'rush',
      'wedding_party',
      'prom_group',
      'vip_customer'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add essential columns to orders table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS order_number VARCHAR(50);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_name VARCHAR(255);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS order_status order_status DEFAULT 'pending_payment';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS billing_address_line1 VARCHAR(255);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS billing_city VARCHAR(100);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS billing_state VARCHAR(100);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS billing_postal_code VARCHAR(20);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS billing_country VARCHAR(100);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS subtotal_amount DECIMAL(10,2) DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS tax_amount DECIMAL(10,2) DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_amount DECIMAL(10,2) DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS discount_amount DECIMAL(10,2) DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS is_rush_order BOOLEAN DEFAULT FALSE;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS is_group_order BOOLEAN DEFAULT FALSE;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS special_instructions TEXT;

-- Update missing data
UPDATE orders SET order_number = CONCAT('KCT-', extract(epoch from created_at)::bigint, '-', substring(id::text, 1, 4)) 
WHERE order_number IS NULL;

UPDATE orders SET customer_name = COALESCE(customer_email, 'Customer') WHERE customer_name IS NULL;

UPDATE orders SET order_status = 'pending_payment' WHERE order_status IS NULL;

-- Add essential columns to order_items table
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS unit_price DECIMAL(10,2) DEFAULT 0;
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS total_price DECIMAL(10,2) DEFAULT 0;
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS product_source VARCHAR(50) DEFAULT 'catalog_supabase';
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS stripe_product_id VARCHAR(255);
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS is_bundle_item BOOLEAN DEFAULT FALSE;

-- Update missing order_items data
UPDATE order_items SET unit_price = COALESCE(price_at_time, 0) WHERE unit_price = 0;
UPDATE order_items SET total_price = unit_price * quantity WHERE total_price = 0;;