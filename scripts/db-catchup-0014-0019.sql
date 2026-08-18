-- ============================================================================
-- Nila Gol — production DB catch-up: migrations 0014 → 0019
--
-- WHY: the live database (project msiowolgbuffddhcdmqw) is at 0013_payment_hardening,
-- but the deployed client + Vercel build preflight expect 0019. This one script
-- brings the live schema current. It is idempotent (if exists / if not exists) and
-- safe to run as a single batch in the Supabase SQL Editor.
--
-- Fixes, in order:
--   0014/0015  admin hardening (removes auto-first-admin; locks the allowlist)
--   0016       storage size/type guardrails on the `media` bucket
--   0017       fail-closed order line integrity trigger
--   0018       orders.public_id + payment_token_hash (REQUIRED for checkout)
--   0019       commerce_schema_version() marker (REQUIRED to unblock the Vercel build)
--
-- After running: Supabase Dashboard's "Last migration" ledger will still show 0013
-- (raw SQL bypasses the migration ledger). Reconcile with:
--   supabase migration repair --status applied 0014 0015 0016 0017 0018 0019
-- (or apply via `supabase db push` / the Supabase MCP instead of this script).
-- ============================================================================


-- ----------------------------------------------------------------------------
-- 0014_secure_admin_bootstrap
-- ----------------------------------------------------------------------------
drop trigger if exists on_auth_user_created_make_admin on auth.users;
drop function if exists public.handle_first_admin();
drop function if exists public.admin_exists();


-- ----------------------------------------------------------------------------
-- 0015_admin_defense_in_depth
-- ----------------------------------------------------------------------------
drop trigger if exists on_auth_user_created_make_admin on auth.users;
drop function if exists public.handle_first_admin();
drop function if exists public.admin_exists();

alter table public.admins enable row level security;

revoke all on table public.admins from anon;
revoke insert, update, delete, truncate, references, trigger on table public.admins from authenticated;
grant select on table public.admins to authenticated;

revoke all on function public.is_admin() from public;
revoke all on function public.is_admin() from anon;
grant execute on function public.is_admin() to authenticated;
grant execute on function public.is_admin() to service_role;

comment on table public.admins is
  'Security allowlist. Modify only from trusted service-role/SQL contexts; browser clients are read-only under RLS.';


-- ----------------------------------------------------------------------------
-- 0016_media_upload_limits
-- ----------------------------------------------------------------------------
update storage.buckets
set
  file_size_limit = 10485760, -- 10 MiB hard server ceiling
  allowed_mime_types = array[
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/avif'
  ]::text[]
where id = 'media';


-- ----------------------------------------------------------------------------
-- 0017_order_line_integrity
-- ----------------------------------------------------------------------------
create or replace function public.recompute_order_total()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  it jsonb;
  unit bigint;
  pname text;
  pid bigint;
  q int;
  computed bigint := 0;
  newitems jsonb := '[]'::jsonb;
  line_count int := 0;
begin
  if jsonb_typeof(NEW.items) <> 'array' then
    raise exception using
      errcode = '23514',
      message = 'سبد خرید نامعتبر است.';
  end if;

  if jsonb_array_length(NEW.items) < 1 then
    raise exception using
      errcode = '23514',
      message = 'سبد خرید خالی است.';
  end if;

  if jsonb_array_length(NEW.items) > 50 then
    raise exception using
      errcode = '23514',
      message = 'تعداد اقلام متفاوت سفارش بیش از حد مجاز است.';
  end if;

  for it in select value from jsonb_array_elements(NEW.items) loop
    if coalesce(it->>'id', '') !~ '^\d+$' then
      raise exception using
        errcode = '23514',
        message = 'یک محصول در سبد خرید نامعتبر است.';
    end if;
    pid := (it->>'id')::bigint;

    if coalesce(it->>'qty', '') !~ '^\d+$' then
      raise exception using
        errcode = '23514',
        message = 'تعداد یک محصول نامعتبر است.';
    end if;
    q := (it->>'qty')::int;

    if q < 1 or q > 99 then
      raise exception using
        errcode = '23514',
        message = 'تعداد هر محصول باید بین ۱ تا ۹۹ باشد.';
    end if;

    unit := null;
    pname := null;
    select coalesce(sale_price, price), name
      into unit, pname
      from public.products
      where id = pid
        and is_active = true
        and availability in ('in_stock', 'made_to_order');

    if unit is null or unit <= 0 then
      raise exception using
        errcode = '23514',
        message = 'یک یا چند محصول دیگر قابل سفارش نیست. سبد خرید را بازبینی کنید.';
    end if;

    computed := computed + (unit * q);
    newitems := newitems || jsonb_build_object(
      'id', pid,
      'name', pname,
      'price', unit,
      'qty', q
    );
    line_count := line_count + 1;
  end loop;

  if line_count < 1 or computed <= 0 then
    raise exception using
      errcode = '23514',
      message = 'سفارش معتبر نیست.';
  end if;

  NEW.items := newitems;
  NEW.subtotal := computed;
  return NEW;
end;
$$;

revoke all on function public.recompute_order_total() from public;
revoke all on function public.recompute_order_total() from anon;
revoke all on function public.recompute_order_total() from authenticated;


-- ----------------------------------------------------------------------------
-- 0018_public_order_reference  (REQUIRED for guest checkout)
-- ----------------------------------------------------------------------------
alter table public.orders
  add column if not exists public_id uuid,
  add column if not exists payment_token_hash text;

update public.orders
set public_id = gen_random_uuid()
where public_id is null;

alter table public.orders
  alter column public_id set default gen_random_uuid(),
  alter column public_id set not null;

create unique index if not exists orders_public_id_uidx
  on public.orders (public_id);

alter table public.orders
  drop constraint if exists orders_payment_token_hash_check;
alter table public.orders
  add constraint orders_payment_token_hash_check
  check (payment_token_hash is null or payment_token_hash ~ '^[0-9a-f]{64}$');

comment on column public.orders.public_id is
  'Unguessable public reference. Internal bigint id must not be used on guest payment surfaces.';
comment on column public.orders.payment_token_hash is
  'SHA-256 hash of the high-entropy browser payment capability. Raw payment tokens are never stored.';

drop policy if exists "orders insert" on public.orders;
create policy "orders insert" on public.orders for insert to anon, authenticated
  with check (
    (user_id is null or user_id = auth.uid())
    and char_length(customer_name) between 1 and 120
    and char_length(phone) between 4 and 30
    and char_length(coalesce(note, '')) <= 1000
    and char_length(coalesce(postal_code, '')) <= 20
    and jsonb_typeof(items) = 'array'
    and jsonb_array_length(items) between 1 and 50
    and subtotal > 0
    and payment_method in ('cod','online')
    and payment_status = 'unpaid'
    and payment_ref_id is null
    and paid_at is null
    and payment_token_hash ~ '^[0-9a-f]{64}$'
  );


-- ----------------------------------------------------------------------------
-- 0019_commerce_schema_version  (REQUIRED to unblock the Vercel production build)
-- ----------------------------------------------------------------------------
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

-- ============================================================================
-- Done. Verify:
--   select public.commerce_schema_version();                    -- expect 19
--   select column_name from information_schema.columns
--     where table_schema='public' and table_name='orders'
--       and column_name in ('public_id','payment_token_hash');  -- expect 2 rows
-- ============================================================================
