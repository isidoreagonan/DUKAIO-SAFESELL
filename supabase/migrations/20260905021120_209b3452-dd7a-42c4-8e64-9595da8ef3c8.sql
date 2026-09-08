revoke execute on function public.effective_plan_key(uuid) from anon, authenticated;
revoke execute on function public.best_plan_key(uuid) from anon, authenticated;
revoke execute on function public.enforce_product_limit() from anon, authenticated;
revoke execute on function public.enforce_store_limit() from anon, authenticated;
revoke execute on function public.enforce_custom_domain_plan() from anon, authenticated;
revoke execute on function public.enforce_team_limit() from anon, authenticated;