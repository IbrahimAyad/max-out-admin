-- Migration: add_admin_rls_policy_wedding_timeline_tasks
-- Created at: 1755489910

CREATE POLICY "Allow admin full access on wedding_timeline_tasks"
ON public.wedding_timeline_tasks
FOR ALL
USING (is_admin())
WITH CHECK (is_admin());;