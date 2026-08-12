-- 0016_public_order_reference: separate public/payment order references from the
-- sequential internal bigint primary key.
--
-- `orders.id` remains an internal/admin key. Browser checkout and guest payment
-- flows use `public_id` (UUID), removing predictable order ids from the public
-- payment surface without changing existing foreign-key/admin behavior.

alter table public.orders
  add column if not exists public_id uuid;

update public.orders
set public_id = gen_random_uuid()
where public_id is null;

alter table public.orders
  alter column public_id set default gen_random_uuid(),
  alter column public_id set not null;

create unique index if not exists orders_public_id_uidx
  on public.orders (public_id);

comment on column public.orders.public_id is
  'Unguessable public/payment reference. Internal bigint id must not be used as a guest authorization capability.';
