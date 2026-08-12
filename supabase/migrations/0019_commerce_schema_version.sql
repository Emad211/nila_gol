-- 0019_commerce_schema_version: expose a minimal, data-free capability check for
-- deployment preflight. This avoids probing protected order rows/columns through
-- RLS just to learn whether the live database is ready for the current client.

create or replace function public.commerce_schema_version()
returns integer
language sql
immutable
set search_path = ''
as $$
  select 19::integer;
$$;

revoke all on function public.commerce_schema_version() from public;
grant execute on function public.commerce_schema_version() to anon;
grant execute on function public.commerce_schema_version() to authenticated;
grant execute on function public.commerce_schema_version() to service_role;

comment on function public.commerce_schema_version() is
  'Data-free deployment capability marker for storefront/checkout schema compatibility.';
