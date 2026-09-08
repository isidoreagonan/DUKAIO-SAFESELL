REVOKE EXECUTE ON FUNCTION public.grant_platform_admin() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.order_in_published_store(uuid) FROM anon, authenticated;
