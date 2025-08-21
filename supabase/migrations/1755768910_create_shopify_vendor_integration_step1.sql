-- Migration: create_shopify_vendor_integration_step1
-- Created at: 1755768910

-- Create Shopify vendor integration schema - Step 1: Core tables

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

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_shopify_variants_product_id ON shopify_variants(shopify_product_id);
CREATE INDEX IF NOT EXISTS idx_shopify_images_product_id ON shopify_images(shopify_product_id);
CREATE INDEX IF NOT EXISTS idx_shopify_inventory_item ON shopify_inventory_levels(inventory_item_id);

COMMIT;;