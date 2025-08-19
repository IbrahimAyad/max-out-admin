-- Migration: create_enhanced_product_schema
-- Created at: 1755575799

-- Create enhanced product schema for inventory management

-- Size definitions for different product categories
CREATE TABLE IF NOT EXISTS size_definitions (
  id BIGSERIAL PRIMARY KEY,
  category VARCHAR(50) NOT NULL,
  size_code VARCHAR(20) NOT NULL,
  size_label VARCHAR(50) NOT NULL,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(category, size_code)
);

-- Color definitions
CREATE TABLE IF NOT EXISTS color_definitions (
  id BIGSERIAL PRIMARY KEY,
  color_name VARCHAR(100) NOT NULL,
  color_code VARCHAR(50) NOT NULL,
  hex_value VARCHAR(7),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(color_code)
);

-- Enhanced products table
CREATE TABLE IF NOT EXISTS products (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100) NOT NULL,
  subcategory VARCHAR(100),
  sku_prefix VARCHAR(20) NOT NULL,
  base_price DECIMAL(10,2) NOT NULL,
  description TEXT,
  image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  requires_size BOOLEAN DEFAULT false,
  requires_color BOOLEAN DEFAULT false,
  sizing_category VARCHAR(50), -- 'suits', 'shirts', etc.
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Product variants table for size/color combinations
CREATE TABLE IF NOT EXISTS product_variants (
  id BIGSERIAL PRIMARY KEY,
  product_id BIGINT NOT NULL,
  size_id BIGINT,
  color_id BIGINT,
  piece_type VARCHAR(50), -- '2-piece', '3-piece' for suits
  sku VARCHAR(100) NOT NULL UNIQUE,
  price DECIMAL(10,2) NOT NULL,
  stock_quantity INTEGER DEFAULT 0,
  low_stock_threshold INTEGER DEFAULT 5,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Inventory movements table for tracking stock changes
CREATE TABLE IF NOT EXISTS inventory_movements (
  id BIGSERIAL PRIMARY KEY,
  variant_id BIGINT NOT NULL,
  movement_type VARCHAR(20) NOT NULL, -- 'in', 'out', 'adjustment'
  quantity INTEGER NOT NULL,
  previous_quantity INTEGER NOT NULL,
  new_quantity INTEGER NOT NULL,
  notes TEXT,
  created_by VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_product_variants_product_id ON product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_product_variants_size_id ON product_variants(size_id);
CREATE INDEX IF NOT EXISTS idx_product_variants_color_id ON product_variants(color_id);
CREATE INDEX IF NOT EXISTS idx_product_variants_stock ON product_variants(stock_quantity);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_variant_id ON inventory_movements(variant_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_active ON products(is_active);;