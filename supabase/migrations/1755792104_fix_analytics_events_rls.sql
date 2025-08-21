-- Migration: fix_analytics_events_rls
-- Created at: 1755792104

-- Fix RLS policies for analytics_events table

-- Create comprehensive RLS policy for analytics_events
DROP POLICY IF EXISTS "Allow all public access" ON analytics_events;
CREATE POLICY "Allow all public access" ON analytics_events FOR ALL TO public USING (true);;