REVOKE ALL ON FUNCTION public.get_preorder_count(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_preorder_count(text) TO service_role;