-- ============================================================================
-- KCT Ecosystem Admin Hub Database Schema
-- ============================================================================
-- Description: Complete database schema for the KCT Ecosystem inventory management system
-- Database: PostgreSQL
-- Created: 2025-08-19
-- Author: MiniMax Agent
-- ============================================================================

-- Enable UUID generation extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- UTILITY FUNCTIONS
-- ============================================================================

-- Function to automatically update timestamp columns
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- CORE TABLES
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Products Table
-- ----------------------------------------------------------------------------
-- Stores main product information including variant configuration flags
-- and integration details for payment processing
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS products (
  -- Primary identification
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Product information
  name TEXT NOT NULL CONSTRAINT products_name_not_empty CHECK (length(trim(name)) > 0),
  description TEXT,
  category TEXT NOT NULL CONSTRAINT products_category_not_empty CHECK (length(trim(category)) > 0),
  
  -- Stripe integration
  stripe_price_id TEXT,
  
  -- Variant configuration flags
  has_size_variants BOOLEAN NOT NULL DEFAULT FALSE,
  has_color_variants BOOLEAN NOT NULL DEFAULT FALSE,
  has_piece_variants BOOLEAN NOT NULL DEFAULT FALSE,
  
  -- Inventory management
  default_low_stock_threshold INTEGER NOT NULL DEFAULT 5 
    CONSTRAINT products_threshold_positive CHECK (default_low_stock_threshold >= 0),
  
  -- Audit timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT products_name_unique UNIQUE (name),
  CONSTRAINT products_stripe_price_id_unique UNIQUE (stripe_price_id) DEFERRABLE
);

-- ----------------------------------------------------------------------------
-- Product Variants Table
-- ----------------------------------------------------------------------------
-- Stores specific variants of products with size, color, and piece variations
-- Each variant maintains its own inventory and availability status
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS product_variants (
  -- Primary identification
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Product relationship
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  
  -- Variant attributes
  size TEXT,
  color TEXT,
  piece_count INTEGER CONSTRAINT product_variants_piece_count_positive CHECK (piece_count > 0),
  
  -- Inventory management
  stock_quantity INTEGER NOT NULL DEFAULT 0 
    CONSTRAINT product_variants_stock_non_negative CHECK (stock_quantity >= 0),
  low_stock_threshold INTEGER 
    CONSTRAINT product_variants_threshold_positive CHECK (low_stock_threshold >= 0),
  is_available BOOLEAN NOT NULL DEFAULT TRUE,
  
  -- Stripe integration
  stripe_price_id TEXT,
  
  -- Audit timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT product_variants_unique_combination 
    UNIQUE (product_id, size, color, piece_count),
  CONSTRAINT product_variants_stripe_price_id_unique 
    UNIQUE (stripe_price_id) DEFERRABLE
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Primary performance indexes
CREATE INDEX IF NOT EXISTS idx_product_variants_product_id 
  ON product_variants(product_id);

-- Category-based queries
CREATE INDEX IF NOT EXISTS idx_products_category 
  ON products(category);

-- Inventory management queries
CREATE INDEX IF NOT EXISTS idx_product_variants_stock_availability 
  ON product_variants(is_available, stock_quantity) 
  WHERE is_available = TRUE;

-- Low stock monitoring
CREATE INDEX IF NOT EXISTS idx_product_variants_low_stock 
  ON product_variants(product_id, stock_quantity, low_stock_threshold) 
  WHERE stock_quantity <= COALESCE(low_stock_threshold, 5);

-- Variant attribute searches
CREATE INDEX IF NOT EXISTS idx_product_variants_size 
  ON product_variants(size) 
  WHERE size IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_product_variants_color 
  ON product_variants(color) 
  WHERE color IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_product_variants_piece_count 
  ON product_variants(piece_count) 
  WHERE piece_count IS NOT NULL;

-- Stripe integration queries
CREATE INDEX IF NOT EXISTS idx_products_stripe_price_id 
  ON products(stripe_price_id) 
  WHERE stripe_price_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_product_variants_stripe_price_id 
  ON product_variants(stripe_price_id) 
  WHERE stripe_price_id IS NOT NULL;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Auto-update timestamps for products table
DROP TRIGGER IF EXISTS set_timestamp ON products;
CREATE TRIGGER set_timestamp
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION trigger_set_timestamp();

-- Auto-update timestamps for product_variants table
DROP TRIGGER IF EXISTS set_timestamp ON product_variants;
CREATE TRIGGER set_timestamp
  BEFORE UPDATE ON product_variants
  FOR EACH ROW
  EXECUTE FUNCTION trigger_set_timestamp();

-- ============================================================================
-- VIEWS
-- ============================================================================

-- Complete product catalog view with variant counts
CREATE OR REPLACE VIEW product_catalog AS
SELECT 
  p.id,
  p.name,
  p.description,
  p.category,
  p.has_size_variants,
  p.has_color_variants,
  p.has_piece_variants,
  p.default_low_stock_threshold,
  p.stripe_price_id,
  p.created_at,
  p.updated_at,
  COUNT(pv.id) as variant_count,
  SUM(CASE WHEN pv.is_available THEN 1 ELSE 0 END) as available_variants,
  SUM(pv.stock_quantity) as total_stock
FROM products p
LEFT JOIN product_variants pv ON p.id = pv.product_id
GROUP BY p.id, p.name, p.description, p.category, p.has_size_variants, 
         p.has_color_variants, p.has_piece_variants, p.default_low_stock_threshold,
         p.stripe_price_id, p.created_at, p.updated_at;

-- Low stock alerts view
CREATE OR REPLACE VIEW low_stock_alerts AS
SELECT 
  p.name as product_name,
  p.category,
  pv.id as variant_id,
  pv.size,
  pv.color,
  pv.piece_count,
  pv.stock_quantity,
  COALESCE(pv.low_stock_threshold, p.default_low_stock_threshold) as threshold,
  pv.is_available
FROM products p
JOIN product_variants pv ON p.id = pv.product_id
WHERE pv.stock_quantity <= COALESCE(pv.low_stock_threshold, p.default_low_stock_threshold)
  AND pv.is_available = TRUE
ORDER BY pv.stock_quantity ASC, p.category, p.name;

-- Product variants with full details
CREATE OR REPLACE VIEW product_variants_detailed AS
SELECT 
  pv.id as variant_id,
  p.id as product_id,
  p.name as product_name,
  p.description as product_description,
  p.category,
  pv.size,
  pv.color,
  pv.piece_count,
  pv.stock_quantity,
  COALESCE(pv.low_stock_threshold, p.default_low_stock_threshold) as effective_threshold,
  pv.is_available,
  pv.stripe_price_id as variant_stripe_price_id,
  p.stripe_price_id as product_stripe_price_id,
  pv.created_at as variant_created_at,
  pv.updated_at as variant_updated_at,
  p.created_at as product_created_at,
  p.updated_at as product_updated_at
FROM product_variants pv
JOIN products p ON pv.product_id = p.id;

-- ============================================================================
-- COMMENTS
-- ============================================================================

-- Table comments
COMMENT ON TABLE products IS 'Main product catalog containing base product information and variant configuration';
COMMENT ON TABLE product_variants IS 'Specific product variants with inventory tracking and availability status';

-- Column comments for products table
COMMENT ON COLUMN products.id IS 'Unique identifier for the product (UUID)';
COMMENT ON COLUMN products.name IS 'Product display name (must be unique)';
COMMENT ON COLUMN products.description IS 'Product description for marketing/display purposes';
COMMENT ON COLUMN products.category IS 'Product category (suits, shirts, ties, tieBundles, outfitBundles)';
COMMENT ON COLUMN products.stripe_price_id IS 'Stripe price ID for payment processing integration';
COMMENT ON COLUMN products.has_size_variants IS 'Flag indicating if product has size variations';
COMMENT ON COLUMN products.has_color_variants IS 'Flag indicating if product has color variations';
COMMENT ON COLUMN products.has_piece_variants IS 'Flag indicating if product has piece count variations';
COMMENT ON COLUMN products.default_low_stock_threshold IS 'Default threshold for low stock alerts';

-- Column comments for product_variants table
COMMENT ON COLUMN product_variants.id IS 'Unique identifier for the product variant (UUID)';
COMMENT ON COLUMN product_variants.product_id IS 'Foreign key reference to products table';
COMMENT ON COLUMN product_variants.size IS 'Size specification for the variant (e.g., S, M, L, XL)';
COMMENT ON COLUMN product_variants.color IS 'Color specification for the variant';
COMMENT ON COLUMN product_variants.piece_count IS 'Number of pieces in the variant (e.g., 2-piece suit, 3-piece suit)';
COMMENT ON COLUMN product_variants.stock_quantity IS 'Current stock quantity for this specific variant';
COMMENT ON COLUMN product_variants.low_stock_threshold IS 'Custom low stock threshold (overrides product default)';
COMMENT ON COLUMN product_variants.is_available IS 'Availability flag for the variant';
COMMENT ON COLUMN product_variants.stripe_price_id IS 'Variant-specific Stripe price ID';

-- ============================================================================
-- END OF SCHEMA
-- ============================================================================