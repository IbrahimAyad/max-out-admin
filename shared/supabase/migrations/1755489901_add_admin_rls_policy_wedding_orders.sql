-- Migration: add_admin_rls_policy_wedding_orders
-- Created at: 1755489901

CREATE POLICY "Allow admin full access on wedding_orders"
ON public.wedding_orders
FOR ALL
USING (is_admin())
WITH CHECK (is_admin());;