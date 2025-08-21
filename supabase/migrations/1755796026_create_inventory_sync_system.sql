-- Migration: create_inventory_sync_system
-- Created at: 1755796026

-- Create inventory sync logging table
CREATE TABLE inventory_sync_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sync_type TEXT CHECK (sync_type IN ('scheduled', 'manual', 'webhook')) NOT NULL,
  started_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  status TEXT CHECK (status IN ('running', 'completed', 'failed')) DEFAULT 'running',
  products_synced INT DEFAULT 0,
  errors_count INT DEFAULT 0,
  error_details JSONB,
  triggered_by TEXT NOT NULL, -- 'system', 'admin', 'webhook'
  shopify_location_id BIGINT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enhanced inventory levels with change tracking
ALTER TABLE vendor_inventory_levels 
  ADD COLUMN IF NOT EXISTS previous_available INT,
  ADD COLUMN IF NOT EXISTS last_change_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS sync_batch_id UUID REFERENCES inventory_sync_log(id);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_inventory_sync_log_status ON inventory_sync_log(status);
CREATE INDEX IF NOT EXISTS idx_inventory_sync_log_started_at ON inventory_sync_log(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_vendor_inventory_levels_sync_batch ON vendor_inventory_levels(sync_batch_id);
CREATE INDEX IF NOT EXISTS idx_vendor_inventory_levels_last_change ON vendor_inventory_levels(last_change_at DESC);

-- Create RLS policies for inventory sync log
ALTER TABLE inventory_sync_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow service role full access to inventory_sync_log"
ON inventory_sync_log FOR ALL 
TO service_role
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow anon read access to inventory_sync_log"
ON inventory_sync_log FOR SELECT
TO anon
USING (true);

-- Grant permissions to service role
GRANT ALL ON inventory_sync_log TO service_role;
GRANT SELECT ON inventory_sync_log TO anon;;