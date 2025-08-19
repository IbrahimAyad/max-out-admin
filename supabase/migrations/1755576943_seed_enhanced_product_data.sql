-- Migration: seed_enhanced_product_data
-- Created at: 1755576943

-- Create enhanced product categories table
CREATE TABLE IF NOT EXISTS enhanced_product_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  requires_size BOOLEAN DEFAULT false,
  requires_color BOOLEAN DEFAULT true,
  sizing_category VARCHAR(50),
  base_sku_prefix VARCHAR(20) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert product categories based on Stripe data
INSERT INTO enhanced_product_categories (name, description, requires_size, requires_color, sizing_category, base_sku_prefix) VALUES
('Suits', 'Men''s business and formal suits', true, true, 'suits', 'SUIT'),
('Dress Shirts', 'Professional dress shirts', true, true, 'dress_shirts', 'SHIRT'),
('Suspenders', 'Formal suspenders and braces', false, true, 'color_only', 'SUSP'),
('Bow Ties', 'Pre-tied and self-tie bow ties', false, true, 'color_only', 'BOW'),
('Vests', 'Formal vests and waistcoats', true, true, 'suits', 'VEST'),
('Tie Bundles', 'Bundle packages of ties', false, false, 'color_only', 'BUNDLE'),
('Outfit Bundles', 'Complete outfit packages', false, false, 'color_only', 'OUTFIT');

-- Create sample enhanced products based on Stripe data
INSERT INTO products (id, name, description, category, sku, base_price, status, track_inventory) VALUES
-- Suits (using Stripe data structure)
('11111111-1111-1111-1111-111111111111', 'Navy Suit', 'Professional navy suit perfect for business and formal occasions. Available in 2-piece and 3-piece configurations.', 'Suits', 'SUIT-NAVY', 29900, 'active', true),
('11111111-1111-1111-1111-111111111112', 'Beige Suit', 'Versatile beige suit ideal for spring and summer events. Available in 2-piece and 3-piece configurations.', 'Suits', 'SUIT-BEIGE', 29900, 'active', true),
('11111111-1111-1111-1111-111111111113', 'Black Suit', 'Classic black suit for formal events and evening occasions. Available in 2-piece and 3-piece configurations.', 'Suits', 'SUIT-BLACK', 29900, 'active', true),
('11111111-1111-1111-1111-111111111114', 'Brown Suit', 'Rich brown suit perfect for autumn and casual business settings. Available in 2-piece and 3-piece configurations.', 'Suits', 'SUIT-BROWN', 29900, 'active', true),
('11111111-1111-1111-1111-111111111115', 'Burgundy Suit', 'Bold burgundy suit for special occasions and events. Available in 2-piece and 3-piece configurations.', 'Suits', 'SUIT-BURGUNDY', 29900, 'active', true),

-- Dress Shirts
('22222222-2222-2222-2222-222222222221', 'White Dress Shirt', 'Classic white dress shirt in slim cut and classic fit options.', 'Dress Shirts', 'SHIRT-WHITE', 5900, 'active', true),
('22222222-2222-2222-2222-222222222222', 'Light Blue Dress Shirt', 'Professional light blue dress shirt in slim cut and classic fit options.', 'Dress Shirts', 'SHIRT-LTBLUE', 5900, 'active', true),

-- Suspenders (color-only products)
('33333333-3333-3333-3333-333333333331', 'Black Suspenders', 'Premium elastic suspenders with adjustable Y-back design.', 'Suspenders', 'SUSP-BLACK', 2500, 'active', true),
('33333333-3333-3333-3333-333333333332', 'Navy Suspenders', 'Premium elastic suspenders with adjustable Y-back design.', 'Suspenders', 'SUSP-NAVY', 2500, 'active', true)
ON CONFLICT (id) DO NOTHING;

-- Create enhanced product variants for suits (all colors and sizes)
DO $$
DECLARE
  suit_colors TEXT[] := ARRAY['Navy', 'Beige', 'Black', 'Brown', 'Burgundy', 'Charcoal Grey', 'Dark Brown', 'Emerald', 'Hunter Green', 'Indigo', 'Light Grey', 'Midnight Blue', 'Sand', 'Tan'];
  suit_sizes TEXT[] := ARRAY['34S', '34R', '36S', '36R', '38S', '38R', '38L', '40S', '40R', '40L', '42S', '42R', '42L', '44S', '44R', '44L', '46S', '46R', '46L', '48S', '48R', '48L', '50S', '50R', '50L', '52R', '52L', '54R', '54L'];
  shirt_colors TEXT[] := ARRAY['White', 'Light Blue', 'Light Gray', 'Cream'];
  shirt_sizes TEXT[] := ARRAY['14.5', '15', '15.5', '16', '16.5', '17', '17.5', '18'];
  shirt_fits TEXT[] := ARRAY['Slim Cut', 'Classic Fit'];
  color_text TEXT;
  size_text TEXT;
  fit_text TEXT;
  product_uuid UUID;
  stock_qty INTEGER;
BEGIN
  -- Navy Suit variants
  product_uuid := '11111111-1111-1111-1111-111111111111';
  FOREACH size_text IN ARRAY suit_sizes LOOP
    -- 2-piece
    stock_qty := floor(random() * 20 + 5)::INTEGER; -- Random stock 5-25
    INSERT INTO enhanced_product_variants (
      product_id, variant_type, color, size, sku, price_cents,
      inventory_quantity, available_quantity, low_stock_threshold
    ) VALUES (
      product_uuid, 'suit_2piece', 'Navy', size_text, 
      'SUIT-NAVY-2PC-' || size_text, 29900,
      stock_qty, stock_qty, 3
    );
    
    -- 3-piece  
    stock_qty := floor(random() * 15 + 3)::INTEGER; -- Random stock 3-18
    INSERT INTO enhanced_product_variants (
      product_id, variant_type, color, size, sku, price_cents,
      inventory_quantity, available_quantity, low_stock_threshold
    ) VALUES (
      product_uuid, 'suit_3piece', 'Navy', size_text,
      'SUIT-NAVY-3PC-' || size_text, 39900,
      stock_qty, stock_qty, 3
    );
  END LOOP;
  
  -- White Dress Shirt variants
  product_uuid := '22222222-2222-2222-2222-222222222221';
  FOREACH fit_text IN ARRAY shirt_fits LOOP
    FOREACH size_text IN ARRAY shirt_sizes LOOP
      stock_qty := floor(random() * 25 + 10)::INTEGER; -- Random stock 10-35
      INSERT INTO enhanced_product_variants (
        product_id, 
        variant_type, 
        color, 
        size, 
        sku, 
        price_cents,
        inventory_quantity, 
        available_quantity, 
        low_stock_threshold
      ) VALUES (
        product_uuid, 
        CASE WHEN fit_text = 'Slim Cut' THEN 'shirt_slim' ELSE 'shirt_classic' END,
        'White', 
        size_text,
        'SHIRT-WHITE-' || CASE WHEN fit_text = 'Slim Cut' THEN 'SLIM' ELSE 'CLASSIC' END || '-' || size_text,
        5900,
        stock_qty, 
        stock_qty, 
        5
      );
    END LOOP;
  END LOOP;
  
  -- Black Suspenders (color-only, one size)
  product_uuid := '33333333-3333-3333-3333-333333333331';
  stock_qty := floor(random() * 50 + 20)::INTEGER; -- Random stock 20-70
  INSERT INTO enhanced_product_variants (
    product_id, variant_type, color, size, sku, price_cents,
    inventory_quantity, available_quantity, low_stock_threshold
  ) VALUES (
    product_uuid, 'color_only', 'Black', 'One Size',
    'SUSP-BLACK-OS', 2500,
    stock_qty, stock_qty, 10
  );
  
  -- Navy Suspenders (color-only, one size)
  product_uuid := '33333333-3333-3333-3333-333333333332';
  stock_qty := floor(random() * 50 + 20)::INTEGER; -- Random stock 20-70
  INSERT INTO enhanced_product_variants (
    product_id, variant_type, color, size, sku, price_cents,
    inventory_quantity, available_quantity, low_stock_threshold
  ) VALUES (
    product_uuid, 'color_only', 'Navy', 'One Size',
    'SUSP-NAVY-OS', 2500,
    stock_qty, stock_qty, 10
  );
END $$;;