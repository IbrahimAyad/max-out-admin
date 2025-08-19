-- Migration: create_inventory_system_indexes
-- Created at: 1755575897

-- Create indexes for the new inventory system
CREATE INDEX IF NOT EXISTS idx_inventory_variants_product_id ON inventory_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_variants_size_id ON inventory_variants(size_id);
CREATE INDEX IF NOT EXISTS idx_inventory_variants_color_id ON inventory_variants(color_id);
CREATE INDEX IF NOT EXISTS idx_inventory_variants_stock ON inventory_variants(stock_quantity);
CREATE INDEX IF NOT EXISTS idx_inventory_variants_active ON inventory_variants(is_active);
CREATE INDEX IF NOT EXISTS idx_inventory_products_category ON inventory_products(category);
CREATE INDEX IF NOT EXISTS idx_inventory_products_active ON inventory_products(is_active);
CREATE INDEX IF NOT EXISTS idx_inventory_products_requires_size ON inventory_products(requires_size);
CREATE INDEX IF NOT EXISTS idx_inventory_products_requires_color ON inventory_products(requires_color);;