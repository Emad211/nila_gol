-- 0017_public_order_reference: separate public/payment order references from the
-- sequential internal bigint primary key and add a one-order payment capability.
--
-- `orders.id` remains an internal/admin key. Browser checkout and guest payment
-- flows use `public_id` (UUID). Creating a gateway authority additionally requires
-- a high-entropy payment token; only its SHA-256 hash is stored in the database.

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

-- New browser-created orders must provide a valid payment capability hash. Rows
-- created before this migration may remain NULL for history/reconciliation.
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
