-- Migration: grant_shipping_templates_permissions
-- Created at: 1755465115

-- Grant SELECT permission to service_role on shipping_templates table
GRANT SELECT ON shipping_templates TO service_role;

-- Also grant to authenticated users
GRANT SELECT ON shipping_templates TO authenticated;;