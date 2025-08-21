-- Migration: add_tags_column_to_inventory_products
-- Created at: 1755762944

-- Add tags column to inventory_products table
ALTER TABLE inventory_products 
ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';

-- Add index for efficient tag searching
CREATE INDEX IF NOT EXISTS idx_inventory_products_tags 
ON inventory_products USING GIN(tags);

-- Add comment to document the column
COMMENT ON COLUMN inventory_products.tags IS 'Array of descriptive tags for AI chatbot search and filtering (colors, styles, materials, occasions, etc.)';

COMMIT;;