-- Migration: add_service_role_wedding_access
-- Created at: 1755489445

-- Add service role policies for admin dashboard access

-- Service role access to weddings
CREATE POLICY "Service role access to weddings" ON weddings
FOR ALL TO service_role USING (true);

-- Service role access to wedding party members  
CREATE POLICY "Service role access to party members" ON wedding_party_members
FOR ALL TO service_role USING (true);

-- Service role access to wedding communications
CREATE POLICY "Service role access to communications" ON wedding_communications
FOR ALL TO service_role USING (true);

-- Check if wedding_tasks table exists, if so add policy
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'wedding_tasks') THEN
        EXECUTE 'CREATE POLICY "Service role access to tasks" ON wedding_tasks FOR ALL TO service_role USING (true)';
    END IF;
END $$;;