-- Migration: add_vendor_inventory_tracking_columns
-- Created at: 1755794757

-- Add vendor inventory tracking fields to enhanced_product_variants table

-- Add vendor inventory tracking columns
ALTER TABLE enhanced_product_variants 
ADD COLUMN IF NOT EXISTS vendor_inventory_item_id BIGINT,
ADD COLUMN IF NOT EXISTS vendor_location_id BIGINT;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_enhanced_product_variants_vendor_inventory 
ON enhanced_product_variants(vendor_inventory_item_id);

CREATE INDEX IF NOT EXISTS idx_enhanced_product_variants_vendor_location 
ON enhanced_product_variants(vendor_location_id);;