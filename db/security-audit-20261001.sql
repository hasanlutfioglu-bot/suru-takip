-- Applied to the existing Suru Takip database. No user data is modified.
ALTER FUNCTION public.touch_subscription_updated_at() SET search_path = public;
-- Plans are server-managed, not editable from public clients.
DROP POLICY IF EXISTS subscriptions_owner_update ON public.subscriptions;
DROP POLICY IF EXISTS subscriptions_owner_insert ON public.subscriptions;
