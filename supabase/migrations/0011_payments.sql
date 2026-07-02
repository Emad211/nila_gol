-- 0011_payments: online payment (ZarinPal) fields on orders.
-- Payment confirmation is performed server-side by the `payment` Edge Function
-- (service role); the client may only ever create an UNPAID order.
alter table public.orders
  add column if not exists payment_method text not null default 'cod',
  add column if not exists payment_status text not null default 'unpaid',
  add column if not exists payment_gateway text,
  add column if not exists payment_authority text,
  add column if not exists payment_ref_id text,
  add column if not exists paid_at timestamptz;

alter table public.orders drop constraint if exists orders_payment_method_check;
alter table public.orders add constraint orders_payment_method_check
  check (payment_method in ('cod','online'));

alter table public.orders drop constraint if exists orders_payment_status_check;
alter table public.orders add constraint orders_payment_status_check
  check (payment_status in ('unpaid','paid','failed','refunded'));

create index if not exists orders_payment_authority_idx on public.orders (payment_authority);

-- Re-create the public insert policy: a guest/customer can only create an UNPAID
-- order. The Edge Function (service role) is the only writer of paid/ref/paid_at.
drop policy if exists "orders insert" on public.orders;
create policy "orders insert" on public.orders for insert to anon, authenticated
  with check (
    (user_id is null or user_id = auth.uid())
    and char_length(customer_name) between 1 and 120
    and char_length(phone) between 4 and 30
    and char_length(coalesce(note, '')) <= 1000
    and jsonb_typeof(items) = 'array'
    and payment_method in ('cod','online')
    and payment_status = 'unpaid'
    and payment_ref_id is null
    and paid_at is null
  );
