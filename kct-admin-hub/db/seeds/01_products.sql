-- Seed script for initial inventory data

-- Suits (14 products with 2-piece and 3-piece variants)

-- Navy Suit
INSERT INTO products (name, description, category, has_size_variants, has_color_variants, has_piece_variants, default_low_stock_threshold)
VALUES ('Navy Suit', 'Classic navy suit available in 2-piece and 3-piece variants', 'suits', TRUE, TRUE, TRUE, 3)
RETURNING id;

-- Beige Suit
INSERT INTO products (name, description, category, has_size_variants, has_color_variants, has_piece_variants, default_low_stock_threshold)
VALUES ('Beige Suit', 'Light beige suit available in 2-piece and 3-piece variants', 'suits', TRUE, TRUE, TRUE, 3)
RETURNING id;

-- Black Suit
INSERT INTO products (name, description, category, has_size_variants, has_color_variants, has_piece_variants, default_low_stock_threshold)
VALUES ('Black Suit', 'Formal black suit available in 2-piece and 3-piece variants', 'suits', TRUE, TRUE, TRUE, 3)
RETURNING id;

-- Brown Suit
INSERT INTO products (name, description, category, has_size_variants, has_color_variants, has_piece_variants, default_low_stock_threshold)
VALUES ('Brown Suit', 'Rich brown suit available in 2-piece and 3-piece variants', 'suits', TRUE, TRUE, TRUE, 3)
RETURNING id;

-- Burgundy Suit
INSERT INTO products (name, description, category, has_size_variants, has_color_variants, has_piece_variants, default_low_stock_threshold)
VALUES ('Burgundy Suit', 'Bold burgundy suit available in 2-piece and 3-piece variants', 'suits', TRUE, TRUE, TRUE, 3)
RETURNING id;

-- Charcoal Grey Suit
INSERT INTO products (name, description, category, has_size_variants, has_color_variants, has_piece_variants, default_low_stock_threshold)
VALUES ('Charcoal Grey Suit', 'Professional charcoal grey suit available in 2-piece and 3-piece variants', 'suits', TRUE, TRUE, TRUE, 3)
RETURNING id;

-- Dark Brown Suit
INSERT INTO products (name, description, category, has_size_variants, has_color_variants, has_piece_variants, default_low_stock_threshold)
VALUES ('Dark Brown Suit', 'Deep dark brown suit available in 2-piece and 3-piece variants', 'suits', TRUE, TRUE, TRUE, 3)
RETURNING id;

-- Emerald Suit
INSERT INTO products (name, description, category, has_size_variants, has_color_variants, has_piece_variants, default_low_stock_threshold)
VALUES ('Emerald Suit', 'Eye-catching emerald suit available in 2-piece and 3-piece variants', 'suits', TRUE, TRUE, TRUE, 3)
RETURNING id;

-- Hunter Green Suit
INSERT INTO products (name, description, category, has_size_variants, has_color_variants, has_piece_variants, default_low_stock_threshold)
VALUES ('Hunter Green Suit', 'Distinguished hunter green suit available in 2-piece and 3-piece variants', 'suits', TRUE, TRUE, TRUE, 3)
RETURNING id;

-- Indigo Suit
INSERT INTO products (name, description, category, has_size_variants, has_color_variants, has_piece_variants, default_low_stock_threshold)
VALUES ('Indigo Suit', 'Rich indigo suit available in 2-piece and 3-piece variants', 'suits', TRUE, TRUE, TRUE, 3)
RETURNING id;

-- Light Grey Suit
INSERT INTO products (name, description, category, has_size_variants, has_color_variants, has_piece_variants, default_low_stock_threshold)
VALUES ('Light Grey Suit', 'Versatile light grey suit available in 2-piece and 3-piece variants', 'suits', TRUE, TRUE, TRUE, 3)
RETURNING id;

-- Midnight Blue Suit
INSERT INTO products (name, description, category, has_size_variants, has_color_variants, has_piece_variants, default_low_stock_threshold)
VALUES ('Midnight Blue Suit', 'Elegant midnight blue suit available in 2-piece and 3-piece variants', 'suits', TRUE, TRUE, TRUE, 3)
RETURNING id;

-- Sand Suit
INSERT INTO products (name, description, category, has_size_variants, has_color_variants, has_piece_variants, default_low_stock_threshold)
VALUES ('Sand Suit', 'Light sand-colored suit available in 2-piece and 3-piece variants', 'suits', TRUE, TRUE, TRUE, 3)
RETURNING id;

-- Tan Suit
INSERT INTO products (name, description, category, has_size_variants, has_color_variants, has_piece_variants, default_low_stock_threshold)
VALUES ('Tan Suit', 'Classic tan suit available in 2-piece and 3-piece variants', 'suits', TRUE, TRUE, TRUE, 3)
RETURNING id;

-- Shirts

-- Slim Cut Dress Shirt
INSERT INTO products (name, description, category, has_size_variants, has_color_variants, default_low_stock_threshold)
VALUES ('Slim Cut Dress Shirt', 'Modern slim cut dress shirt available in various colors', 'shirts', TRUE, TRUE, 5)
RETURNING id;

-- Classic Fit Dress Shirt
INSERT INTO products (name, description, category, has_size_variants, has_color_variants, default_low_stock_threshold)
VALUES ('Classic Fit Dress Shirt', 'Traditional classic fit dress shirt available in various colors', 'shirts', TRUE, TRUE, 5)
RETURNING id;

-- Ties

-- Ultra Skinny Tie
INSERT INTO products (name, description, category, has_color_variants, default_low_stock_threshold)
VALUES ('Ultra Skinny Tie (2.25")', 'Modern ultra skinny tie available in various colors', 'ties', FALSE, TRUE, 10)
RETURNING id;

-- Skinny Tie
INSERT INTO products (name, description, category, has_color_variants, default_low_stock_threshold)
VALUES ('Skinny Tie (2.75")', 'Contemporary skinny tie available in various colors', 'ties', FALSE, TRUE, 10)
RETURNING id;

-- Classic Width Tie
INSERT INTO products (name, description, category, has_color_variants, default_low_stock_threshold)
VALUES ('Classic Width Tie (3.25")', 'Traditional classic width tie available in various colors', 'ties', FALSE, TRUE, 10)
RETURNING id;

-- Pre-tied Bow Tie
INSERT INTO products (name, description, category, has_color_variants, default_low_stock_threshold)
VALUES ('Pre-tied Bow Tie', 'Convenient pre-tied bow tie available in various colors', 'ties', FALSE, TRUE, 10)
RETURNING id;

-- Tie Bundles

-- 5-Tie Bundle
INSERT INTO products (name, description, category, default_low_stock_threshold)
VALUES ('5-Tie Bundle (Buy 4 Get 1 Free)', 'Value pack of 5 ties (Buy 4 Get 1 Free)', 'tieBundles', 8)
RETURNING id;

-- 8-Tie Bundle
INSERT INTO products (name, description, category, default_low_stock_threshold)
VALUES ('8-Tie Bundle (Buy 6 Get 2 Free)', 'Value pack of 8 ties (Buy 6 Get 2 Free)', 'tieBundles', 5)
RETURNING id;

-- 11-Tie Bundle
INSERT INTO products (name, description, category, default_low_stock_threshold)
VALUES ('11-Tie Bundle (Buy 8 Get 3 Free)', 'Value pack of 11 ties (Buy 8 Get 3 Free)', 'tieBundles', 3)
RETURNING id;

-- Outfit Bundles

-- Starter Bundle
INSERT INTO products (name, description, category, default_low_stock_threshold)
VALUES ('Starter Bundle', 'Essential starter bundle with suit, shirt, and tie', 'outfitBundles', 3)
RETURNING id;

-- Professional Bundle
INSERT INTO products (name, description, category, default_low_stock_threshold)
VALUES ('Professional Bundle', 'Complete professional outfit bundle with premium suit, shirt, and tie', 'outfitBundles', 3)
RETURNING id;

-- Executive Bundle
INSERT INTO products (name, description, category, default_low_stock_threshold)
VALUES ('Executive Bundle', 'Premium executive outfit bundle with luxury suit, shirt, and tie', 'outfitBundles', 3)
RETURNING id;

-- Premium Bundle
INSERT INTO products (name, description, category, default_low_stock_threshold)
VALUES ('Premium Bundle', 'Top-tier premium outfit bundle with our finest suit, shirt, and tie', 'outfitBundles', 3)
RETURNING id;
