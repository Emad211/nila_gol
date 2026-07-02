-- Security hardening (from `get_advisors`).

-- A public bucket serves object URLs without any SELECT policy; the broad policy
-- only enabled listing every file. Remove it — public image URLs still resolve.
drop policy if exists "Public read media" on storage.objects;

-- Trigger function must never be callable from the REST/RPC API.
revoke execute on function public.handle_first_admin() from public, anon, authenticated;

-- is_admin() is only needed by signed-in users (RPC + authenticated-only policies).
revoke execute on function public.is_admin() from public, anon;
grant  execute on function public.is_admin() to authenticated;

-- NOTE: admin_exists() intentionally stays anon-executable — the login page calls
-- it (returns only a boolean) to decide whether to show the create-admin form.
