-- Migration: add_vendor_inventory_tracking
-- Created at: 1755794744

-- Add vendor inventory tracking fields to enhanced_product_variants table

-- Add vendor inventory tracking columns
ALTER TABLE enhanced_product_variants 
ADD COLUMN IF NOT EXISTS vendor_inventory_item_id BIGINT,
ADD COLUMN IF NOT EXISTS vendor_location_id BIGINT;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_enhanced_product_variants_vendor_inventory 
ON enhanced_product_variants(vendor_inventory_item_id);

CREATE INDEX IF NOT EXISTS idx_enhanced_product_variants_vendor_location 
ON enhanced_product_variants(vendor_location_id);

-- Create a view for live inventory from vendor
CREATE OR REPLACE VIEW v_product_variants_live AS
SELECT 
    epv.*,
    vil.available as vendor_available_quantity,
    vil.updated_at as vendor_inventory_updated_at
FROM enhanced_product_variants epv
LEFT JOIN vendor_inventory_levels vil ON vil.inventory_item_id = epv.vendor_inventory_item_id
WHERE epv.vendor_location_id IS NULL OR vil.location_id = epv.vendor_location_id;

-- Grant access to the view
GRANT SELECT ON v_product_variants_live TO public, anon, authenticated;;