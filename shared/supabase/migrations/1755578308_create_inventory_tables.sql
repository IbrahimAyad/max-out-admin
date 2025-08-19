-- Migration: create_inventory_tables
-- Created at: 1755578308

-- migration for inventory management system

-- Create products table if it doesn't exist
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  stripe_price_id TEXT,
  has_size_variants BOOLEAN NOT NULL DEFAULT FALSE,
  has_color_variants BOOLEAN NOT NULL DEFAULT FALSE,
  has_piece_variants BOOLEAN NOT NULL DEFAULT FALSE,
  default_low_stock_threshold INTEGER NOT NULL DEFAULT 5,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create product_variants table if it doesn't exist
CREATE TABLE IF NOT EXISTS product_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  size TEXT,
  color TEXT,
  piece_count INTEGER,
  stock_quantity INTEGER NOT NULL DEFAULT 0,
  low_stock_threshold INTEGER,
  is_available BOOLEAN NOT NULL DEFAULT TRUE,
  stripe_price_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_product_variants_product_id ON product_variants(product_id);

-- Add trigger to update the updated_at timestamp
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers to both tables
DROP TRIGGER IF EXISTS set_timestamp ON products;
CREATE TRIGGER set_timestamp
BEFORE UPDATE ON products
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();

DROP TRIGGER IF EXISTS set_timestamp ON product_variants;
CREATE TRIGGER set_timestamp
BEFORE UPDATE ON product_variants
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();;