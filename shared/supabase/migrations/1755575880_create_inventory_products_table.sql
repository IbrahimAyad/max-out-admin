-- Migration: create_inventory_products_table
-- Created at: 1755575880

-- Enhanced inventory products table
CREATE TABLE IF NOT EXISTS inventory_products (
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
  stripe_product_id VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);;