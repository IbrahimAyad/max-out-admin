-- Migration: create_vendor_tables_fixed
-- Created at: 1755792766

-- Create vendor database schema for Shopify integration

-- Vendors table (for managing vendor information)
CREATE TABLE IF NOT EXISTS vendors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    website VARCHAR(255),
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Vendor products table (stores Shopify product data)
CREATE TABLE IF NOT EXISTS vendor_products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shopify_product_id BIGINT UNIQUE NOT NULL,
    handle VARCHAR(255),
    title TEXT NOT NULL,
    body_html TEXT,
    vendor VARCHAR(255),
    product_type VARCHAR(255),
    status VARCHAR(50) DEFAULT 'active',
    tags TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Vendor variants table (stores Shopify variant data)
CREATE TABLE IF NOT EXISTS vendor_variants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shopify_variant_id BIGINT UNIQUE NOT NULL,
    shopify_product_id BIGINT NOT NULL,
    sku VARCHAR(255),
    barcode VARCHAR(255),
    price DECIMAL(10,2) DEFAULT 0,
    compare_at_price DECIMAL(10,2),
    position INTEGER DEFAULT 1,
    inventory_item_id BIGINT,
    option1 VARCHAR(255),
    option2 VARCHAR(255),
    option3 VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Vendor images table (stores Shopify image data)
CREATE TABLE IF NOT EXISTS vendor_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shopify_image_id BIGINT UNIQUE NOT NULL,
    shopify_product_id BIGINT NOT NULL,
    src TEXT NOT NULL,
    alt TEXT,
    position INTEGER DEFAULT 1,
    width INTEGER,
    height INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Vendor inventory levels table (stores inventory data)
CREATE TABLE IF NOT EXISTS vendor_inventory_levels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    inventory_item_id BIGINT UNIQUE NOT NULL,
    location_id BIGINT,
    available INTEGER DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Vendor import decisions table (tracks which products to import)
CREATE TABLE IF NOT EXISTS vendor_import_decisions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shopify_product_id BIGINT UNIQUE NOT NULL,
    decision VARCHAR(50) DEFAULT 'none', -- 'none', 'staged', 'imported', 'skipped'
    decided_at TIMESTAMP WITH TIME ZONE,
    decided_by UUID,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Product overrides table (for customizing product data before import)
CREATE TABLE IF NOT EXISTS product_overrides (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shopify_product_id BIGINT UNIQUE NOT NULL,
    title_override VARCHAR(255),
    description_override TEXT,
    category_override VARCHAR(255),
    price_override DECIMAL(10,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Vendor communications table (for tracking interactions)
CREATE TABLE IF NOT EXISTS vendor_communications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vendor_id UUID,
    communication_type VARCHAR(50), -- 'email', 'phone', 'meeting', 'note'
    subject VARCHAR(255),
    content TEXT,
    status VARCHAR(50) DEFAULT 'sent',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Vendor product relationships table (for linking vendor products to main catalog)
CREATE TABLE IF NOT EXISTS vendor_product_relationships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shopify_product_id BIGINT NOT NULL,
    main_product_id UUID, -- References main products table
    relationship_type VARCHAR(50) DEFAULT 'imported', -- 'imported', 'linked', 'variant'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_vendor_products_shopify_id ON vendor_products(shopify_product_id);
CREATE INDEX IF NOT EXISTS idx_vendor_variants_shopify_id ON vendor_variants(shopify_variant_id);
CREATE INDEX IF NOT EXISTS idx_vendor_variants_product_id ON vendor_variants(shopify_product_id);
CREATE INDEX IF NOT EXISTS idx_vendor_images_product_id ON vendor_images(shopify_product_id);
CREATE INDEX IF NOT EXISTS idx_vendor_inventory_item_id ON vendor_inventory_levels(inventory_item_id);
CREATE INDEX IF NOT EXISTS idx_vendor_decisions_product_id ON vendor_import_decisions(shopify_product_id);
CREATE INDEX IF NOT EXISTS idx_product_overrides_product_id ON product_overrides(shopify_product_id);;