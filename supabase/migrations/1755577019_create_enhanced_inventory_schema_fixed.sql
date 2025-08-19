-- Migration: create_enhanced_inventory_schema_fixed
-- Created at: 1755577019

-- Create enhanced sizing categories table
CREATE TABLE IF NOT EXISTS sizing_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) NOT NULL UNIQUE,
  description TEXT,
  sizes JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert sizing categories for menswear
INSERT INTO sizing_categories (name, description, sizes) VALUES
('suits', 'Suit sizing with S/R/L system', '["34S", "34R", "36S", "36R", "38S", "38R", "38L", "40S", "40R", "40L", "42S", "42R", "42L", "44S", "44R", "44L", "46S", "46R", "46L", "48S", "48R", "48L", "50S", "50R", "50L", "52R", "52L", "54R", "54L"]'),
('dress_shirts', 'Dress shirt collar sizes', '["14.5", "15", "15.5", "16", "16.5", "17", "17.5", "18"]'),
('color_only', 'Products with color variants only', '["One Size"]')
ON CONFLICT (name) DO NOTHING;

-- Create enhanced product variants table for better inventory management
CREATE TABLE IF NOT EXISTS enhanced_product_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL,
  variant_type VARCHAR(20) NOT NULL CHECK (variant_type IN ('suit_2piece', 'suit_3piece', 'shirt_slim', 'shirt_classic', 'color_only')),
  color VARCHAR(100) NOT NULL,
  size VARCHAR(10),
  sku VARCHAR(100) NOT NULL UNIQUE,
  price_cents INTEGER NOT NULL,
  compare_at_price_cents INTEGER,
  
  -- Inventory Management
  inventory_quantity INTEGER DEFAULT 0,
  available_quantity INTEGER DEFAULT 0,
  reserved_quantity INTEGER DEFAULT 0,
  committed_quantity INTEGER DEFAULT 0,
  low_stock_threshold INTEGER DEFAULT 5,
  
  -- Stock Status
  stock_status VARCHAR(20) DEFAULT 'in_stock' CHECK (stock_status IN ('in_stock', 'low_stock', 'out_of_stock', 'discontinued')),
  allow_backorders BOOLEAN DEFAULT false,
  
  -- Stripe Integration
  stripe_price_id VARCHAR(255),
  stripe_active BOOLEAN DEFAULT false,
  
  -- Metadata
  weight_grams INTEGER DEFAULT 0,
  barcode VARCHAR(100),
  supplier_sku VARCHAR(100),
  notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_inventory_update TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_enhanced_variants_product_id ON enhanced_product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_enhanced_variants_sku ON enhanced_product_variants(sku);
CREATE INDEX IF NOT EXISTS idx_enhanced_variants_stock_status ON enhanced_product_variants(stock_status);
CREATE INDEX IF NOT EXISTS idx_enhanced_variants_color_size ON enhanced_product_variants(color, size);

-- Create inventory history table for tracking changes
CREATE TABLE IF NOT EXISTS inventory_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  variant_id UUID NOT NULL,
  change_type VARCHAR(20) NOT NULL CHECK (change_type IN ('adjustment', 'sale', 'return', 'restock', 'damage', 'transfer')),
  quantity_change INTEGER NOT NULL,
  previous_quantity INTEGER NOT NULL,
  new_quantity INTEGER NOT NULL,
  reason TEXT,
  reference_id VARCHAR(100), -- order_id, adjustment_id, etc.
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_inventory_history_variant_id ON inventory_history(variant_id);
CREATE INDEX IF NOT EXISTS idx_inventory_history_created_at ON inventory_history(created_at DESC);

-- Create low stock alerts table
CREATE TABLE IF NOT EXISTS low_stock_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  variant_id UUID NOT NULL UNIQUE,
  alert_threshold INTEGER NOT NULL,
  current_quantity INTEGER NOT NULL,
  alert_status VARCHAR(20) DEFAULT 'active' CHECK (alert_status IN ('active', 'acknowledged', 'resolved')),
  acknowledged_by UUID,
  acknowledged_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_low_stock_alerts_status ON low_stock_alerts(alert_status);
CREATE INDEX IF NOT EXISTS idx_low_stock_alerts_variant_id ON low_stock_alerts(variant_id);;