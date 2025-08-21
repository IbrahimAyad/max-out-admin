-- Migration: create_shopify_vendor_integration_step2_minimal
-- Created at: 1755769180

-- Create Shopify vendor integration schema - Step 2: Decision and override tables (minimal)

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

-- E) Optional inventory reservations for checkout protection (without FK initially)
CREATE TABLE IF NOT EXISTS inventory_reservations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_variant_id uuid, -- Will reference product_variants later
  qty int NOT NULL,
  expires_at timestamptz NOT NULL,
  order_id uuid
);

-- Create indexes only for existing columns
CREATE INDEX IF NOT EXISTS idx_vendor_decisions_decision ON vendor_import_decisions(decision);
CREATE INDEX IF NOT EXISTS idx_inventory_reservations_expires ON inventory_reservations(expires_at);

COMMIT;;