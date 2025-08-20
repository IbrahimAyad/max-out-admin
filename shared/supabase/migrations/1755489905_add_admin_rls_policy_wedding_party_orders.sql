-- Migration: add_admin_rls_policy_wedding_party_orders
-- Created at: 1755489905

CREATE POLICY "Allow admin full access on wedding_party_orders"
ON public.wedding_party_orders
FOR ALL
USING (is_admin())
WITH CHECK (is_admin());;