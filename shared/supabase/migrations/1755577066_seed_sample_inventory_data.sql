-- Migration: seed_sample_inventory_data
-- Created at: 1755577066

-- Create sample enhanced products and variants for testing
INSERT INTO products (id, name, description, category, sku, base_price, status, track_inventory) VALUES
-- Suits
('11111111-1111-1111-1111-111111111111', 'Navy Suit', 'Professional navy suit perfect for business and formal occasions. Available in 2-piece and 3-piece configurations.', 'Suits', 'SUIT-NAVY', 29900, 'active', true),
('11111111-1111-1111-1111-111111111112', 'Black Suit', 'Classic black suit for formal events and evening occasions. Available in 2-piece and 3-piece configurations.', 'Suits', 'SUIT-BLACK', 29900, 'active', true),
-- Dress Shirts
('22222222-2222-2222-2222-222222222221', 'White Dress Shirt', 'Classic white dress shirt in slim cut and classic fit options.', 'Dress Shirts', 'SHIRT-WHITE', 5900, 'active', true),
('22222222-2222-2222-2222-222222222222', 'Light Blue Dress Shirt', 'Professional light blue dress shirt in slim cut and classic fit options.', 'Dress Shirts', 'SHIRT-LTBLUE', 5900, 'active', true),
-- Suspenders
('33333333-3333-3333-3333-333333333331', 'Black Suspenders', 'Premium elastic suspenders with adjustable Y-back design.', 'Suspenders', 'SUSP-BLACK', 2500, 'active', true),
('33333333-3333-3333-3333-333333333332', 'Navy Suspenders', 'Premium elastic suspenders with adjustable Y-back design.', 'Suspenders', 'SUSP-NAVY', 2500, 'active', true)
ON CONFLICT (id) DO NOTHING;

-- Create enhanced product variants with realistic inventory
-- Navy Suit - Sample sizes with varying stock levels
INSERT INTO enhanced_product_variants (
  product_id, variant_type, color, size, sku, price_cents,
  inventory_quantity, available_quantity, low_stock_threshold
) VALUES 
-- Navy Suit 2-piece (sample sizes)
('11111111-1111-1111-1111-111111111111', 'suit_2piece', 'Navy', '38R', 'SUIT-NAVY-2PC-38R', 29900, 15, 15, 3),
('11111111-1111-1111-1111-111111111111', 'suit_2piece', 'Navy', '40R', 'SUIT-NAVY-2PC-40R', 29900, 8, 8, 3),
('11111111-1111-1111-1111-111111111111', 'suit_2piece', 'Navy', '42R', 'SUIT-NAVY-2PC-42R', 29900, 2, 2, 3),
('11111111-1111-1111-1111-111111111111', 'suit_2piece', 'Navy', '44R', 'SUIT-NAVY-2PC-44R', 29900, 12, 12, 3),
-- Navy Suit 3-piece (sample sizes)
('11111111-1111-1111-1111-111111111111', 'suit_3piece', 'Navy', '38R', 'SUIT-NAVY-3PC-38R', 39900, 10, 10, 3),
('11111111-1111-1111-1111-111111111111', 'suit_3piece', 'Navy', '40R', 'SUIT-NAVY-3PC-40R', 39900, 1, 1, 3),
('11111111-1111-1111-1111-111111111111', 'suit_3piece', 'Navy', '42R', 'SUIT-NAVY-3PC-42R', 39900, 7, 7, 3),

-- Black Suit variants (sample sizes)
('11111111-1111-1111-1111-111111111112', 'suit_2piece', 'Black', '38R', 'SUIT-BLACK-2PC-38R', 29900, 18, 18, 3),
('11111111-1111-1111-1111-111111111112', 'suit_2piece', 'Black', '40R', 'SUIT-BLACK-2PC-40R', 29900, 0, 0, 3),
('11111111-1111-1111-1111-111111111112', 'suit_2piece', 'Black', '42R', 'SUIT-BLACK-2PC-42R', 29900, 5, 5, 3),

-- White Dress Shirt variants
('22222222-2222-2222-2222-222222222221', 'shirt_slim', 'White', '15.5', 'SHIRT-WHITE-SLIM-15.5', 5900, 25, 25, 5),
('22222222-2222-2222-2222-222222222221', 'shirt_slim', 'White', '16', 'SHIRT-WHITE-SLIM-16', 5900, 3, 3, 5),
('22222222-2222-2222-2222-222222222221', 'shirt_slim', 'White', '16.5', 'SHIRT-WHITE-SLIM-16.5', 5900, 30, 30, 5),
('22222222-2222-2222-2222-222222222221', 'shirt_classic', 'White', '15.5', 'SHIRT-WHITE-CLASSIC-15.5', 5900, 20, 20, 5),
('22222222-2222-2222-2222-222222222221', 'shirt_classic', 'White', '16', 'SHIRT-WHITE-CLASSIC-16', 5900, 4, 4, 5),

-- Suspenders (color-only products)
('33333333-3333-3333-3333-333333333331', 'color_only', 'Black', 'One Size', 'SUSP-BLACK-OS', 2500, 50, 50, 10),
('33333333-3333-3333-3333-333333333332', 'color_only', 'Navy', 'One Size', 'SUSP-NAVY-OS', 2500, 8, 8, 10)
ON CONFLICT (sku) DO NOTHING;;