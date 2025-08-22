-- KCT Menswear Enhanced Inventory Manager Database Setup
-- Run this script in your Supabase SQL Editor to create all required tables and permissions

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==============================================
-- 1. PRODUCTS TABLE
-- ==============================================
CREATE TABLE IF NOT EXISTS products (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100) NOT NULL CHECK (category IN ('Suits', 'Dress Shirts', 'Suspenders', 'Vests', 'Accessories')),
    sku VARCHAR(100) UNIQUE NOT NULL,
    base_price INTEGER DEFAULT 0, -- Price in cents
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'discontinued')),
    track_inventory BOOLEAN DEFAULT true,
    primary_image TEXT,
    variant_count INTEGER DEFAULT 0,
    in_stock BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==============================================
-- 2. ENHANCED PRODUCT VARIANTS TABLE
-- ==============================================
CREATE TABLE IF NOT EXISTS enhanced_product_variants (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    variant_type VARCHAR(50) NOT NULL CHECK (variant_type IN ('suit_2piece', 'suit_3piece', 'shirt_slim', 'shirt_classic', 'color_only')),
    color VARCHAR(100) NOT NULL,
    size VARCHAR(20), -- Can be NULL for color-only variants
    sku VARCHAR(150) UNIQUE NOT NULL,
    price_cents INTEGER NOT NULL DEFAULT 0,
    compare_at_price_cents INTEGER,
    inventory_quantity INTEGER DEFAULT 0,
    available_quantity INTEGER DEFAULT 0,
    reserved_quantity INTEGER DEFAULT 0,
    committed_quantity INTEGER DEFAULT 0,
    low_stock_threshold INTEGER DEFAULT 5,
    stock_status VARCHAR(20) DEFAULT 'out_of_stock' CHECK (stock_status IN ('in_stock', 'low_stock', 'out_of_stock', 'discontinued')),
    allow_backorders BOOLEAN DEFAULT false,
    stripe_price_id VARCHAR(200),
    stripe_active BOOLEAN DEFAULT false,
    weight_grams INTEGER DEFAULT 0,
    barcode VARCHAR(100),
    supplier_sku VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_inventory_update TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==============================================
-- 3. LOW STOCK ALERTS TABLE
-- ==============================================
CREATE TABLE IF NOT EXISTS low_stock_alerts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    variant_id UUID REFERENCES enhanced_product_variants(id) ON DELETE CASCADE,
    alert_threshold INTEGER NOT NULL,
    current_quantity INTEGER NOT NULL,
    alert_status VARCHAR(20) DEFAULT 'active' CHECK (alert_status IN ('active', 'acknowledged', 'resolved')),
    acknowledged_by UUID REFERENCES auth.users(id),
    acknowledged_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==============================================
-- 4. SIZING CATEGORIES TABLE
-- ==============================================
CREATE TABLE IF NOT EXISTS sizing_categories (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    sizes TEXT[] NOT NULL, -- Array of size strings
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==============================================
-- 5. VENDOR TABLES FOR SUPPLIER INTEGRATION
-- ==============================================

-- Vendor Products (from Shopify/external sources)
CREATE TABLE IF NOT EXISTS vendor_products (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    shopify_product_id BIGINT UNIQUE,
    handle VARCHAR(255),
    title VARCHAR(500) NOT NULL,
    body_html TEXT,
    vendor VARCHAR(255),
    product_type VARCHAR(255),
    status VARCHAR(50) DEFAULT 'active',
    tags TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    synced_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Vendor Product Variants
CREATE TABLE IF NOT EXISTS vendor_variants (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    shopify_variant_id BIGINT UNIQUE,
    shopify_product_id BIGINT REFERENCES vendor_products(shopify_product_id) ON DELETE CASCADE,
    sku VARCHAR(255),
    barcode VARCHAR(255),
    price DECIMAL(10,2),
    compare_at_price DECIMAL(10,2),
    position INTEGER DEFAULT 1,
    inventory_item_id BIGINT,
    option1 VARCHAR(255), -- Size
    option2 VARCHAR(255), -- Color
    option3 VARCHAR(255), -- Additional option
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Vendor Product Images
CREATE TABLE IF NOT EXISTS vendor_images (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    shopify_image_id BIGINT UNIQUE,
    shopify_product_id BIGINT REFERENCES vendor_products(shopify_product_id) ON DELETE CASCADE,
    src TEXT NOT NULL,
    alt TEXT,
    position INTEGER DEFAULT 1,
    width INTEGER,
    height INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Vendor Inventory Levels
CREATE TABLE IF NOT EXISTS vendor_inventory_levels (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    inventory_item_id BIGINT UNIQUE NOT NULL,
    location_id BIGINT,
    available INTEGER DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Vendor Import Decisions (tracking what's been imported)
CREATE TABLE IF NOT EXISTS vendor_import_decisions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    shopify_product_id BIGINT REFERENCES vendor_products(shopify_product_id),
    decision VARCHAR(50) CHECK (decision IN ('pending', 'approved', 'rejected', 'imported')),
    decided_by UUID REFERENCES auth.users(id),
    decided_at TIMESTAMP WITH TIME ZONE,
    imported_product_id UUID REFERENCES products(id),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Product Overrides (customizations for vendor products)
CREATE TABLE IF NOT EXISTS product_overrides (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    shopify_product_id BIGINT REFERENCES vendor_products(shopify_product_id),
    title VARCHAR(500),
    category VARCHAR(255),
    price_override_strategy VARCHAR(50) CHECK (price_override_strategy IN ('markup_percentage', 'markup_fixed', 'fixed_price')),
    price_value DECIMAL(10,2),
    tags TEXT[],
    visibility BOOLEAN DEFAULT true,
    featured BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==============================================
-- 6. VENDOR VIEWS FOR UI
-- ==============================================

-- Vendor Inbox Count View
CREATE OR REPLACE VIEW v_vendor_inbox_count AS
SELECT COUNT(*) as inbox_count
FROM vendor_products vp
LEFT JOIN vendor_import_decisions vid ON vp.shopify_product_id = vid.shopify_product_id
WHERE (vid.decision IS NULL OR vid.decision = 'pending')
AND vp.status = 'active';

-- Vendor Inbox Items View
CREATE OR REPLACE VIEW v_vendor_inbox AS
SELECT 
    vp.shopify_product_id,
    vp.title,
    vp.product_type as category,
    MIN(vv.price) as price,
    COUNT(vv.id) as variants,
    vp.status,
    vp.created_at,
    (SELECT vi.src FROM vendor_images vi WHERE vi.shopify_product_id = vp.shopify_product_id ORDER BY vi.position LIMIT 1) as image_src,
    COALESCE(vid.decision, 'pending') as decision
FROM vendor_products vp
LEFT JOIN vendor_variants vv ON vp.shopify_product_id = vv.shopify_product_id
LEFT JOIN vendor_import_decisions vid ON vp.shopify_product_id = vid.shopify_product_id
WHERE vp.status = 'active'
GROUP BY vp.shopify_product_id, vp.title, vp.product_type, vp.status, vp.created_at, vid.decision
ORDER BY vp.created_at DESC;

-- Vendor Inbox Variants View (detailed variant-level view)
CREATE OR REPLACE VIEW v_vendor_inbox_variants AS
SELECT 
    vv.shopify_variant_id,
    vv.shopify_product_id,
    vv.sku,
    vp.title || CASE 
        WHEN vv.option2 IS NOT NULL AND vv.option1 IS NOT NULL THEN ' - ' || vv.option2 || ' ' || vv.option1
        WHEN vv.option1 IS NOT NULL THEN ' - ' || vv.option1
        ELSE ''
    END as title,
    COALESCE(vv.option2, 'Default') as color_name,
    COALESCE(vv.option1, 'One Size') as size,
    vv.option2 as color_code,
    vp.title as product_title,
    vp.product_type as category,
    vv.price,
    COALESCE(vil.available, 0) as inventory_quantity,
    vp.status,
    vp.created_at,
    (SELECT vi.src FROM vendor_images vi WHERE vi.shopify_product_id = vp.shopify_product_id ORDER BY vi.position LIMIT 1) as image_src,
    COALESCE(vid.decision, 'pending') as decision,
    vid.decided_at
FROM vendor_variants vv
JOIN vendor_products vp ON vv.shopify_product_id = vp.shopify_product_id
LEFT JOIN vendor_inventory_levels vil ON vv.inventory_item_id = vil.inventory_item_id
LEFT JOIN vendor_import_decisions vid ON vp.shopify_product_id = vid.shopify_product_id
WHERE vp.status = 'active'
-- ==============================================
-- 7. TRIGGERS FOR AUTOMATIC STOCK STATUS UPDATES
-- ==============================================
CREATE OR REPLACE FUNCTION update_stock_status()
RETURNS TRIGGER AS $$
BEGIN
    -- Update stock status based on available quantity and threshold
    IF NEW.available_quantity <= 0 THEN
        NEW.stock_status = 'out_of_stock';
    ELSIF NEW.available_quantity <= NEW.low_stock_threshold THEN
        NEW.stock_status = 'low_stock';
    ELSE
        NEW.stock_status = 'in_stock';
    END IF;
    
    -- Update timestamp
    NEW.updated_at = NOW();
    NEW.last_inventory_update = NOW();
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to enhanced_product_variants
DROP TRIGGER IF EXISTS trigger_update_stock_status ON enhanced_product_variants;
CREATE TRIGGER trigger_update_stock_status
    BEFORE UPDATE ON enhanced_product_variants
    FOR EACH ROW
    EXECUTE FUNCTION update_stock_status();

-- ==============================================
-- 8. ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================

-- Enable RLS on all tables
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE enhanced_product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE low_stock_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE sizing_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_inventory_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_import_decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_overrides ENABLE ROW LEVEL SECURITY;

-- Products table policies
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON products;
CREATE POLICY "Enable read access for authenticated users" ON products
    FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Enable insert for authenticated users" ON products;
CREATE POLICY "Enable insert for authenticated users" ON products
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Enable update for authenticated users" ON products;
CREATE POLICY "Enable update for authenticated users" ON products
    FOR UPDATE USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Enable delete for authenticated users" ON products;
CREATE POLICY "Enable delete for authenticated users" ON products
    FOR DELETE USING (auth.role() = 'authenticated');

-- Enhanced product variants table policies
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON enhanced_product_variants;
CREATE POLICY "Enable read access for authenticated users" ON enhanced_product_variants
    FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Enable insert for authenticated users" ON enhanced_product_variants;
CREATE POLICY "Enable insert for authenticated users" ON enhanced_product_variants
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Enable update for authenticated users" ON enhanced_product_variants;
CREATE POLICY "Enable update for authenticated users" ON enhanced_product_variants
    FOR UPDATE USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Enable delete for authenticated users" ON enhanced_product_variants;
CREATE POLICY "Enable delete for authenticated users" ON enhanced_product_variants
    FOR DELETE USING (auth.role() = 'authenticated');

-- Low stock alerts table policies
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON low_stock_alerts;
CREATE POLICY "Enable read access for authenticated users" ON low_stock_alerts
    FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Enable insert for authenticated users" ON low_stock_alerts;
CREATE POLICY "Enable insert for authenticated users" ON low_stock_alerts
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Enable update for authenticated users" ON low_stock_alerts;
CREATE POLICY "Enable update for authenticated users" ON low_stock_alerts
    FOR UPDATE USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Enable delete for authenticated users" ON low_stock_alerts;
CREATE POLICY "Enable delete for authenticated users" ON low_stock_alerts
    FOR DELETE USING (auth.role() = 'authenticated');

-- Sizing categories table policies
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON sizing_categories;
CREATE POLICY "Enable read access for authenticated users" ON sizing_categories
    FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Enable insert for authenticated users" ON sizing_categories;
CREATE POLICY "Enable insert for authenticated users" ON sizing_categories
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Enable update for authenticated users" ON sizing_categories;
CREATE POLICY "Enable update for authenticated users" ON sizing_categories
    FOR UPDATE USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Enable delete for authenticated users" ON sizing_categories;
CREATE POLICY "Enable delete for authenticated users" ON sizing_categories
    FOR DELETE USING (auth.role() = 'authenticated');

-- Vendor products table policies
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON vendor_products;
CREATE POLICY "Enable read access for authenticated users" ON vendor_products
    FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Enable insert for authenticated users" ON vendor_products;
CREATE POLICY "Enable insert for authenticated users" ON vendor_products
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Enable update for authenticated users" ON vendor_products;
CREATE POLICY "Enable update for authenticated users" ON vendor_products
    FOR UPDATE USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Enable delete for authenticated users" ON vendor_products;
CREATE POLICY "Enable delete for authenticated users" ON vendor_products
    FOR DELETE USING (auth.role() = 'authenticated');

-- Vendor variants table policies
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON vendor_variants;
CREATE POLICY "Enable read access for authenticated users" ON vendor_variants
    FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Enable insert for authenticated users" ON vendor_variants;
CREATE POLICY "Enable insert for authenticated users" ON vendor_variants
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Enable update for authenticated users" ON vendor_variants;
CREATE POLICY "Enable update for authenticated users" ON vendor_variants
    FOR UPDATE USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Enable delete for authenticated users" ON vendor_variants;
CREATE POLICY "Enable delete for authenticated users" ON vendor_variants
    FOR DELETE USING (auth.role() = 'authenticated');

-- Vendor images table policies
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON vendor_images;
CREATE POLICY "Enable read access for authenticated users" ON vendor_images
    FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Enable insert for authenticated users" ON vendor_images;
CREATE POLICY "Enable insert for authenticated users" ON vendor_images
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Enable update for authenticated users" ON vendor_images;
CREATE POLICY "Enable update for authenticated users" ON vendor_images
    FOR UPDATE USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Enable delete for authenticated users" ON vendor_images;
CREATE POLICY "Enable delete for authenticated users" ON vendor_images
    FOR DELETE USING (auth.role() = 'authenticated');

-- Vendor inventory levels table policies
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON vendor_inventory_levels;
CREATE POLICY "Enable read access for authenticated users" ON vendor_inventory_levels
    FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Enable insert for authenticated users" ON vendor_inventory_levels;
CREATE POLICY "Enable insert for authenticated users" ON vendor_inventory_levels
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Enable update for authenticated users" ON vendor_inventory_levels;
CREATE POLICY "Enable update for authenticated users" ON vendor_inventory_levels
    FOR UPDATE USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Enable delete for authenticated users" ON vendor_inventory_levels;
CREATE POLICY "Enable delete for authenticated users" ON vendor_inventory_levels
    FOR DELETE USING (auth.role() = 'authenticated');

-- Vendor import decisions table policies
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON vendor_import_decisions;
CREATE POLICY "Enable read access for authenticated users" ON vendor_import_decisions
    FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Enable insert for authenticated users" ON vendor_import_decisions;
CREATE POLICY "Enable insert for authenticated users" ON vendor_import_decisions
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Enable update for authenticated users" ON vendor_import_decisions;
CREATE POLICY "Enable update for authenticated users" ON vendor_import_decisions
    FOR UPDATE USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Enable delete for authenticated users" ON vendor_import_decisions;
CREATE POLICY "Enable delete for authenticated users" ON vendor_import_decisions
    FOR DELETE USING (auth.role() = 'authenticated');

-- Product overrides table policies
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON product_overrides;
CREATE POLICY "Enable read access for authenticated users" ON product_overrides
    FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Enable insert for authenticated users" ON product_overrides;
CREATE POLICY "Enable insert for authenticated users" ON product_overrides
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Enable update for authenticated users" ON product_overrides;
CREATE POLICY "Enable update for authenticated users" ON product_overrides
    FOR UPDATE USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Enable delete for authenticated users" ON product_overrides;
CREATE POLICY "Enable delete for authenticated users" ON product_overrides
    FOR DELETE USING (auth.role() = 'authenticated');

-- ==============================================
-- 9. SAMPLE DATA FOR TESTING
-- ==============================================

-- Insert sample sizing categories
INSERT INTO sizing_categories (name, description, sizes) VALUES
('Suit Sizes', 'Standard suit sizing', ARRAY['36R', '38R', '40R', '42R', '44R', '46R', '48R', '36L', '38L', '40L', '42L', '44L', '46L', '48L', '36S', '38S', '40S', '42S', '44S', '46S', '48S'])
ON CONFLICT (name) DO NOTHING;

INSERT INTO sizing_categories (name, description, sizes) VALUES
('Shirt Sizes', 'Dress shirt neck and sleeve sizing', ARRAY['14.5/32', '14.5/33', '15/32', '15/33', '15.5/32', '15.5/33', '16/32', '16/33', '16.5/32', '16.5/33', '17/32', '17/33', '17.5/32', '17.5/33'])
ON CONFLICT (name) DO NOTHING;

-- Insert sample products
INSERT INTO products (name, description, category, sku, base_price, track_inventory) VALUES
('Classic Black Suit', 'Premium black wool suit for formal occasions', 'Suits', 'KCT-SUIT-001', 89900, true),
('White Dress Shirt', 'Classic white cotton dress shirt', 'Dress Shirts', 'KCT-SHIRT-001', 4900, true),
('Black Suspenders', 'Adjustable black suspenders', 'Suspenders', 'KCT-SUSP-001', 2900, true)
ON CONFLICT (sku) DO NOTHING;

-- Insert sample vendor products
INSERT INTO vendor_products (shopify_product_id, handle, title, vendor, product_type, status) VALUES
(9610532815161, 'stacy-adams-boys-5pc-suit-red', 'Stacy Adams Boy''s 5pc Solid Suit - Red', 'Stacy Adams', 'Boys-Suits', 'active'),
(9610532749625, 'stacy-adams-boys-5pc-suit-grey', 'Stacy Adams Boy''s 5pc Solid Suit - Mid Grey', 'Stacy Adams', 'Boys-Suits', 'active'),
(9610532716857, 'stacy-adams-boys-5pc-suit-white', 'Stacy Adams Boy''s 5pc Solid Suit - White', 'Stacy Adams', 'Boys-Suits', 'active')
ON CONFLICT (shopify_product_id) DO NOTHING;

-- Insert sample vendor variants
INSERT INTO vendor_variants (shopify_variant_id, shopify_product_id, sku, price, option1, option2, inventory_item_id) VALUES
(48839264878905, 9610532815161, 'SB282-RED-4', 79.95, '4', 'Red', 50839264878905),
(48839264911673, 9610532815161, 'SB282-RED-5', 79.95, '5', 'Red', 50839264911673),
(48839264944441, 9610532815161, 'SB282-RED-6', 79.95, '6', 'Red', 50839264944441),
(48839264977209, 9610532815161, 'SB282-RED-7', 79.95, '7', 'Red', 50839264977209),
(48839265009977, 9610532815161, 'SB282-RED-8', 79.95, '8', 'Red', 50839265009977)
ON CONFLICT (shopify_variant_id) DO NOTHING;

-- Insert sample vendor inventory levels
INSERT INTO vendor_inventory_levels (inventory_item_id, available) VALUES
(50839264878905, 35),
(50839264911673, 42),
(50839264944441, 28),
(50839264977209, 31),
(50839265009977, 32)
ON CONFLICT (inventory_item_id) DO NOTHING;

-- Insert sample variants (you may need to update product_id values)
DO $$
DECLARE
    suit_id UUID;
    shirt_id UUID;
    susp_id UUID;
BEGIN
    -- Get product IDs
    SELECT id INTO suit_id FROM products WHERE sku = 'KCT-SUIT-001';
    SELECT id INTO shirt_id FROM products WHERE sku = 'KCT-SHIRT-001';
    SELECT id INTO susp_id FROM products WHERE sku = 'KCT-SUSP-001';
    
    -- Insert suit variants
    IF suit_id IS NOT NULL THEN
        INSERT INTO enhanced_product_variants (product_id, variant_type, color, size, sku, price_cents, inventory_quantity, available_quantity, low_stock_threshold) VALUES
        (suit_id, 'suit_2piece', 'Black', '40R', 'KCT-SUIT-001-BLACK-2PC-40R', 89900, 5, 5, 2),
        (suit_id, 'suit_2piece', 'Black', '42R', 'KCT-SUIT-001-BLACK-2PC-42R', 89900, 3, 3, 2),
        (suit_id, 'suit_3piece', 'Black', '40R', 'KCT-SUIT-001-BLACK-3PC-40R', 119900, 2, 2, 1)
        ON CONFLICT (sku) DO NOTHING;
    END IF;
    
    -- Insert shirt variants
    IF shirt_id IS NOT NULL THEN
        INSERT INTO enhanced_product_variants (product_id, variant_type, color, size, sku, price_cents, inventory_quantity, available_quantity, low_stock_threshold) VALUES
        (shirt_id, 'shirt_classic', 'White', '15.5/33', 'KCT-SHIRT-001-WHITE-CLASSIC-15.5/33', 4900, 10, 10, 3),
        (shirt_id, 'shirt_classic', 'White', '16/33', 'KCT-SHIRT-001-WHITE-CLASSIC-16/33', 4900, 8, 8, 3),
        (shirt_id, 'shirt_slim', 'White', '15.5/33', 'KCT-SHIRT-001-WHITE-SLIM-15.5/33', 4900, 6, 6, 2)
        ON CONFLICT (sku) DO NOTHING;
    END IF;
    
    -- Insert suspender variants
    IF susp_id IS NOT NULL THEN
        INSERT INTO enhanced_product_variants (product_id, variant_type, color, sku, price_cents, inventory_quantity, available_quantity, low_stock_threshold) VALUES
        (susp_id, 'color_only', 'Black', 'KCT-SUSP-001-BLACK-OS', 2900, 15, 15, 5)
        ON CONFLICT (sku) DO NOTHING;
    END IF;
END $$;

-- ==============================================
-- 10. INDEXES FOR PERFORMANCE
-- ==============================================
-- Main table indexes
CREATE INDEX IF NOT EXISTS idx_enhanced_product_variants_product_id ON enhanced_product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_enhanced_product_variants_stock_status ON enhanced_product_variants(stock_status);
CREATE INDEX IF NOT EXISTS idx_enhanced_product_variants_variant_type ON enhanced_product_variants(variant_type);
CREATE INDEX IF NOT EXISTS idx_enhanced_product_variants_supplier_sku ON enhanced_product_variants(supplier_sku);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_track_inventory ON products(track_inventory);
CREATE INDEX IF NOT EXISTS idx_low_stock_alerts_status ON low_stock_alerts(alert_status);

-- Vendor table indexes
CREATE INDEX IF NOT EXISTS idx_vendor_products_shopify_id ON vendor_products(shopify_product_id);
CREATE INDEX IF NOT EXISTS idx_vendor_products_status ON vendor_products(status);
CREATE INDEX IF NOT EXISTS idx_vendor_products_vendor ON vendor_products(vendor);
CREATE INDEX IF NOT EXISTS idx_vendor_variants_shopify_product_id ON vendor_variants(shopify_product_id);
CREATE INDEX IF NOT EXISTS idx_vendor_variants_shopify_variant_id ON vendor_variants(shopify_variant_id);
CREATE INDEX IF NOT EXISTS idx_vendor_variants_sku ON vendor_variants(sku);
CREATE INDEX IF NOT EXISTS idx_vendor_variants_inventory_item_id ON vendor_variants(inventory_item_id);
CREATE INDEX IF NOT EXISTS idx_vendor_images_shopify_product_id ON vendor_images(shopify_product_id);
CREATE INDEX IF NOT EXISTS idx_vendor_inventory_levels_inventory_item_id ON vendor_inventory_levels(inventory_item_id);
CREATE INDEX IF NOT EXISTS idx_vendor_import_decisions_shopify_product_id ON vendor_import_decisions(shopify_product_id);
CREATE INDEX IF NOT EXISTS idx_vendor_import_decisions_decision ON vendor_import_decisions(decision);
CREATE INDEX IF NOT EXISTS idx_product_overrides_shopify_product_id ON product_overrides(shopify_product_id);

-- ==============================================
-- SETUP COMPLETE
-- ==============================================
-- Your Enhanced Inventory Manager database is now ready!
-- Make sure to:
-- 1. Create a user account in Supabase Auth
-- 2. Use that account to log into your application
-- 3. The RLS policies will ensure only authenticated users can access the data