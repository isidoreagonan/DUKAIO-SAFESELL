revoke all on function public.enforce_product_quota() from public, anon, authenticated;
revoke all on function public.enforce_store_rules() from public, anon, authenticated;
revoke all on function public.effective_plan_key_for_user(uuid) from public, anon, authenticated;
revoke all on function public.plan_product_limit(text) from public, anon;
revoke all on function public.plan_store_limit(text) from public, anon;