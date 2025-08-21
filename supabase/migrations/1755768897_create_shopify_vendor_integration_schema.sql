-- Migration: create_shopify_vendor_integration_schema
-- Created at: 1755768897

-- Create Shopify vendor integration schema (separate from existing vendor_products table)

-- A) Shopify mirror tables (read-only source from Shopify)
CREATE TABLE IF NOT EXISTS shopify_products (
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

CREATE TABLE IF NOT EXISTS shopify_variants (
  shopify_variant_id bigint PRIMARY KEY,
  shopify_product_id bigint REFERENCES shopify_products(shopify_product_id) ON DELETE CASCADE,
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

CREATE TABLE IF NOT EXISTS shopify_images (
  shopify_image_id bigint PRIMARY KEY,
  shopify_product_id bigint REFERENCES shopify_products(shopify_product_id) ON DELETE CASCADE,
  src text,
  alt text,
  position int,
  width int,
  height int
);

CREATE TABLE IF NOT EXISTS shopify_inventory_levels (
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
  shopify_product_id bigint PRIMARY KEY REFERENCES shopify_products(shopify_product_id) ON DELETE CASCADE,
  title_override text,
  price_override_strategy text CHECK (price_override_strategy IN ('absolute','percent')),
  price_value numeric(10,2),
  primary_image_url_override text,
  hidden boolean DEFAULT false
);

-- D) Link existing variants to vendor inventory (safe addition to existing schema)
DO $$ 
BEGIN
  -- Add to product_variants table (not inventory_variants)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'product_variants' AND column_name = 'vendor_inventory_item_id') THEN
    ALTER TABLE product_variants ADD COLUMN vendor_inventory_item_id bigint;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'product_variants' AND column_name = 'vendor_location_id') THEN
    ALTER TABLE product_variants ADD COLUMN vendor_location_id bigint;
  END IF;
END $$;

-- E) Optional inventory reservations for checkout protection
CREATE TABLE IF NOT EXISTS inventory_reservations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_variant_id uuid REFERENCES product_variants(id),
  qty int NOT NULL,
  expires_at timestamptz NOT NULL,
  order_id uuid
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_shopify_variants_product_id ON shopify_variants(shopify_product_id);
CREATE INDEX IF NOT EXISTS idx_shopify_images_product_id ON shopify_images(shopify_product_id);
CREATE INDEX IF NOT EXISTS idx_shopify_inventory_item ON shopify_inventory_levels(inventory_item_id);
CREATE INDEX IF NOT EXISTS idx_vendor_decisions_decision ON vendor_import_decisions(decision);
CREATE INDEX IF NOT EXISTS idx_inventory_reservations_variant ON inventory_reservations(product_variant_id);
CREATE INDEX IF NOT EXISTS idx_inventory_reservations_expires ON inventory_reservations(expires_at);

COMMIT;;