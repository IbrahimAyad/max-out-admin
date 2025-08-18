-- Migration: add_admin_rls_policy_wedding_invitations
-- Created at: 1755489891

CREATE POLICY "Allow admin full access on wedding_invitations"
ON public.wedding_invitations
FOR ALL
USING (is_admin())
WITH CHECK (is_admin());;