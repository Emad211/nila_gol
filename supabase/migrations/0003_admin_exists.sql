-- Lets the login screen show a one-time "create admin account" form only while
-- no admin exists yet. Returns a single boolean; safe to expose to anon.
create or replace function public.admin_exists()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (select 1 from public.admins);
$$;
