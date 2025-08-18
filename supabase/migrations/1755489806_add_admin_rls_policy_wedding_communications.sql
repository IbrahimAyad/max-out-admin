-- Migration: add_admin_rls_policy_wedding_communications
-- Created at: 1755489806

CREATE POLICY "Allow admin full access on wedding_communications"
ON public.wedding_communications
FOR ALL
USING (is_admin())
WITH CHECK (is_admin());;