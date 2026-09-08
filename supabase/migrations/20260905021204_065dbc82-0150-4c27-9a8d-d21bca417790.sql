revoke execute on function public.effective_plan_key(uuid) from public, anon, authenticated;
revoke execute on function public.best_plan_key(uuid) from public, anon, authenticated;
revoke execute on function public.enforce_product_limit() from public, anon, authenticated;
revoke execute on function public.enforce_store_limit() from public, anon, authenticated;
revoke execute on function public.enforce_custom_domain_plan() from public, anon, authenticated;
revoke execute on function public.enforce_team_limit() from public, anon, authenticated;
revoke execute on function public.grant_platform_admin() from public, anon, authenticated;

create policy "server_only" on public.email_otp_codes for all using (false) with check (false);
create policy "server_only" on public.lifecycle_emails for all using (false) with check (false);