-- Migration: add_vendor_inventory_columns_only
-- Created at: 1755769244

-- D) Link existing variants to vendor inventory (safe addition to existing schema)
DO $$ 
BEGIN
  -- Add to product_variants table
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'product_variants' AND column_name = 'vendor_inventory_item_id') THEN
    ALTER TABLE product_variants ADD COLUMN vendor_inventory_item_id bigint;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'product_variants' AND column_name = 'vendor_location_id') THEN
    ALTER TABLE product_variants ADD COLUMN vendor_location_id bigint;
  END IF;
END $$;

COMMIT;;