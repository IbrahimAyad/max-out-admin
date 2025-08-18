-- Migration: add_admin_rls_policy_wedding_outfits
-- Created at: 1755489738

CREATE POLICY "Allow admin full access on wedding_outfits"
ON public.wedding_outfits
FOR ALL
USING (is_admin())
WITH CHECK (is_admin());;