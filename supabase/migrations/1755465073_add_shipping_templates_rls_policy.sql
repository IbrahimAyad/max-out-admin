-- Migration: add_shipping_templates_rls_policy
-- Created at: 1755465073

-- Enable RLS on shipping_templates table
ALTER TABLE shipping_templates ENABLE ROW LEVEL SECURITY;

-- Create policy to allow service role to read all templates
CREATE POLICY \"Service role can read shipping templates\" ON shipping_templates
    FOR SELECT
    TO service_role
    USING (true);

-- Create policy to allow authenticated users to read active templates
CREATE POLICY \"Users can read active shipping templates\" ON shipping_templates
    FOR SELECT
    TO authenticated
    USING (is_active = true);;