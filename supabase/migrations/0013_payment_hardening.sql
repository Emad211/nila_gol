-- 0013_payment_hardening: store the exact charged Rial amount at create time and
-- guarantee one ZarinPal authority / ref_id can settle at most one order.
alter table public.orders add column if not exists payment_amount_rial bigint;

-- A given gateway authority or ref_id may belong to only one order (kills any
-- cross-order replay of a real payment). Partial: nulls are unconstrained.
create unique index if not exists orders_payment_authority_uidx
  on public.orders (payment_authority) where payment_authority is not null;
create unique index if not exists orders_payment_ref_id_uidx
  on public.orders (payment_ref_id) where payment_ref_id is not null;

-- recompute_order_total() (0012) is a trigger function; it fires with the table
-- owner's context and never needs caller EXECUTE. Revoke it so it isn't exposed
-- as an anon/authenticated PostgREST RPC (keeps the security advisors clean).
revoke all on function public.recompute_order_total() from public;
revoke all on function public.recompute_order_total() from anon;
revoke all on function public.recompute_order_total() from authenticated;
