-- Migration: add_admin_rls_policy_wedding_measurements
-- Created at: 1755489896

CREATE POLICY "Allow admin full access on wedding_measurements"
ON public.wedding_measurements
FOR ALL
USING (is_admin())
WITH CHECK (is_admin());;