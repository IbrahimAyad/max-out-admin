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
-- 5. TRIGGERS FOR AUTOMATIC STOCK STATUS UPDATES
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
-- 6. ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================

-- Enable RLS on all tables
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE enhanced_product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE low_stock_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE sizing_categories ENABLE ROW LEVEL SECURITY;

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

-- ==============================================
-- 7. SAMPLE DATA FOR TESTING
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
-- 8. INDEXES FOR PERFORMANCE
-- ==============================================
CREATE INDEX IF NOT EXISTS idx_enhanced_product_variants_product_id ON enhanced_product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_enhanced_product_variants_stock_status ON enhanced_product_variants(stock_status);
CREATE INDEX IF NOT EXISTS idx_enhanced_product_variants_variant_type ON enhanced_product_variants(variant_type);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_track_inventory ON products(track_inventory);
CREATE INDEX IF NOT EXISTS idx_low_stock_alerts_status ON low_stock_alerts(alert_status);

-- ==============================================
-- SETUP COMPLETE
-- ==============================================
-- Your Enhanced Inventory Manager database is now ready!
-- Make sure to:
-- 1. Create a user account in Supabase Auth
-- 2. Use that account to log into your application
-- 3. The RLS policies will ensure only authenticated users can access the data