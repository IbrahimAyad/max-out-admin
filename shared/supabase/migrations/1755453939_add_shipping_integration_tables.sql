-- Migration: add_shipping_integration_tables
-- Created at: 1755453939

-- Add shipping-related columns to orders table
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS shipping_rate_id TEXT,
ADD COLUMN IF NOT EXISTS shipping_label_url TEXT,
ADD COLUMN IF NOT EXISTS tracking_number TEXT,
ADD COLUMN IF NOT EXISTS tracking_status TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS carrier TEXT,
ADD COLUMN IF NOT EXISTS service_type TEXT,
ADD COLUMN IF NOT EXISTS shipping_cost DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS estimated_delivery_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS shipping_address JSONB,
ADD COLUMN IF NOT EXISTS from_address JSONB,
ADD COLUMN IF NOT EXISTS easypost_shipment_id TEXT;

-- Create shipping_rates table to store rate calculations
CREATE TABLE IF NOT EXISTS shipping_rates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    carrier TEXT NOT NULL,
    service TEXT NOT NULL,
    rate DECIMAL(10,2) NOT NULL,
    delivery_days INTEGER,
    delivery_date TIMESTAMP WITH TIME ZONE,
    easypost_rate_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create shipping_events table for tracking updates
CREATE TABLE IF NOT EXISTS shipping_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    tracking_number TEXT,
    status TEXT NOT NULL,
    message TEXT,
    location TEXT,
    occurred_at TIMESTAMP WITH TIME ZONE,
    easypost_event_id TEXT UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create shipping_labels table for label management
CREATE TABLE IF NOT EXISTS shipping_labels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    easypost_shipment_id TEXT NOT NULL,
    label_url TEXT NOT NULL,
    tracking_number TEXT NOT NULL,
    carrier TEXT NOT NULL,
    service TEXT NOT NULL,
    cost DECIMAL(10,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on new tables
ALTER TABLE shipping_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipping_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipping_labels ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for service role access
CREATE POLICY "Service role can manage shipping_rates" ON shipping_rates
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage shipping_events" ON shipping_events
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage shipping_labels" ON shipping_labels
    FOR ALL USING (auth.role() = 'service_role');

-- Create RLS policies for authenticated users (read access)
CREATE POLICY "Authenticated users can read shipping_rates" ON shipping_rates
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can read shipping_events" ON shipping_events
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can read shipping_labels" ON shipping_labels
    FOR SELECT USING (auth.role() = 'authenticated');;