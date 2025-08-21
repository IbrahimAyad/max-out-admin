-- Migration: create_vendor_integration_schema
-- Created at: 1755768651

-- Create vendor integration schema for Shopify read-only mirror

-- A) Vendor mirror tables (read-only source from Shopify)
CREATE TABLE IF NOT EXISTS vendor_products (
  shopify_product_id bigint PRIMARY KEY,
  handle text,
  title text,
  body_html text,
  vendor text,
  product_type text,
  status text,
  tags text[],
  created_at timestamptz,
  updated_at timestamptz
);

CREATE TABLE IF NOT EXISTS vendor_variants (
  shopify_variant_id bigint PRIMARY KEY,
  shopify_product_id bigint REFERENCES vendor_products(shopify_product_id) ON DELETE CASCADE,
  sku text,
  barcode text,
  price numeric(10,2),
  compare_at_price numeric(10,2),
  position int,
  inventory_item_id bigint,
  option1 text,
  option2 text,
  option3 text
);

CREATE TABLE IF NOT EXISTS vendor_images (
  shopify_image_id bigint PRIMARY KEY,
  shopify_product_id bigint REFERENCES vendor_products(shopify_product_id) ON DELETE CASCADE,
  src text,
  alt text,
  position int,
  width int,
  height int
);

CREATE TABLE IF NOT EXISTS vendor_inventory_levels (
  inventory_item_id bigint,
  location_id bigint,
  available int,
  updated_at timestamptz DEFAULT NOW(),
  PRIMARY KEY (inventory_item_id, location_id)
);

-- B) Inbox decisions tracking
CREATE TABLE IF NOT EXISTS vendor_import_decisions (
  shopify_product_id bigint PRIMARY KEY,
  decision text CHECK (decision IN ('none','staged','imported','skipped')) DEFAULT 'none',
  decided_at timestamptz
);

-- C) Product overrides for customization
CREATE TABLE IF NOT EXISTS product_overrides (
  shopify_product_id bigint PRIMARY KEY REFERENCES vendor_products(shopify_product_id) ON DELETE CASCADE,
  title_override text,
  price_override_strategy text CHECK (price_override_strategy IN ('absolute','percent')),
  price_value numeric(10,2),
  primary_image_url_override text,
  hidden boolean DEFAULT false
);

-- D) Link existing variants to vendor inventory (safe addition to existing schema)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'inventory_variants' AND column_name = 'vendor_inventory_item_id') THEN
    ALTER TABLE inventory_variants ADD COLUMN vendor_inventory_item_id bigint;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'inventory_variants' AND column_name = 'vendor_location_id') THEN
    ALTER TABLE inventory_variants ADD COLUMN vendor_location_id bigint;
  END IF;
END $$;

-- E) Optional inventory reservations for checkout protection
CREATE TABLE IF NOT EXISTS inventory_reservations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_variant_id uuid, -- Will reference inventory_variants when that exists
  qty int NOT NULL,
  expires_at timestamptz NOT NULL,
  order_id uuid
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_vendor_variants_product_id ON vendor_variants(shopify_product_id);
CREATE INDEX IF NOT EXISTS idx_vendor_images_product_id ON vendor_images(shopify_product_id);
CREATE INDEX IF NOT EXISTS idx_vendor_inventory_item ON vendor_inventory_levels(inventory_item_id);
CREATE INDEX IF NOT EXISTS idx_vendor_decisions_decision ON vendor_import_decisions(decision);
CREATE INDEX IF NOT EXISTS idx_inventory_reservations_variant ON inventory_reservations(product_variant_id);
CREATE INDEX IF NOT EXISTS idx_inventory_reservations_expires ON inventory_reservations(expires_at);

COMMIT;;