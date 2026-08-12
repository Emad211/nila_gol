-- Nila Gol — admin defense in depth.
-- The admin allowlist is infrastructure/security state, not application content.
-- Browser clients may verify their own admin status through is_admin(), but may
-- never create, edit or delete allowlist rows. Provision/revoke admins only from
-- Supabase Dashboard/SQL or a service-role controlled operation.

-- Re-assert removal of the legacy "first signup becomes admin" bootstrap in case
-- an older production database missed migration 0014.
drop trigger if exists on_auth_user_created_make_admin on auth.users;
drop function if exists public.handle_first_admin();
drop function if exists public.admin_exists();

alter table public.admins enable row level security;

-- Table privileges are an additional boundary on top of RLS.
revoke all on table public.admins from anon;
revoke insert, update, delete, truncate, references, trigger on table public.admins from authenticated;
grant select on table public.admins to authenticated;

-- is_admin is intentionally available only to authenticated sessions (and the
-- service role). Anonymous storefront traffic has no reason to probe it.
revoke all on function public.is_admin() from public;
revoke all on function public.is_admin() from anon;
grant execute on function public.is_admin() to authenticated;
grant execute on function public.is_admin() to service_role;

comment on table public.admins is
  'Security allowlist. Modify only from trusted service-role/SQL contexts; browser clients are read-only under RLS.';
