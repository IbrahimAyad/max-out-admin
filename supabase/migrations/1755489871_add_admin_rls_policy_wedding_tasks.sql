-- Migration: add_admin_rls_policy_wedding_tasks
-- Created at: 1755489871

CREATE POLICY "Allow admin full access on wedding_tasks"
ON public.wedding_tasks
FOR ALL
USING (is_admin())
WITH CHECK (is_admin());;