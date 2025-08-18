-- Migration: add_admin_rls_policy_wedding_analytics
-- Created at: 1755489885

CREATE POLICY "Allow admin full access on wedding_analytics"
ON public.wedding_analytics
FOR ALL
USING (is_admin())
WITH CHECK (is_admin());;