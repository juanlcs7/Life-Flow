-- market_rates: restrict to authenticated users
DROP POLICY IF EXISTS "Public read market rates" ON public.market_rates;
CREATE POLICY "Authenticated read market rates" ON public.market_rates
  FOR SELECT TO authenticated USING (true);
REVOKE SELECT ON public.market_rates FROM anon;

-- profiles: allow users to insert their own profile
CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Revoke EXECUTE on SECURITY DEFINER trigger functions from API roles
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_updated_at() FROM PUBLIC, anon, authenticated;