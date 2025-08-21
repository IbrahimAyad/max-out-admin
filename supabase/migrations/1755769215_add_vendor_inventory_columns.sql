-- Migration: add_vendor_inventory_columns
-- Created at: 1755769215

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

-- Now add the missing index for inventory_reservations
CREATE INDEX IF NOT EXISTS idx_inventory_reservations_variant ON inventory_reservations(product_variant_id);

COMMIT;;