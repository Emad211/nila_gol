-- Nila Gol — production auth hardening.
--
-- Never promote a public signup to administrator automatically. On a fresh
-- deployment, create the auth user from the Supabase Dashboard (or another
-- operator-controlled channel) and then explicitly allowlist that user in
-- public.admins from the SQL editor/service-role context.

-- Remove the legacy trigger before removing its function.
drop trigger if exists on_auth_user_created_make_admin on auth.users;
drop function if exists public.handle_first_admin();

-- The storefront/admin UI no longer needs to reveal whether an administrator
-- exists. Removing this RPC also reduces unnecessary public auth surface area.
drop function if exists public.admin_exists();
