-- 0012_order_integrity: server-authoritative order totals + precise address.
-- Recompute subtotal & item prices from the products table on insert so a
-- tampered client can never lower the charged amount. Add postal_code.

alter table public.orders add column if not exists postal_code text;

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
begin
  if jsonb_typeof(NEW.items) = 'array' then
    for it in select value from jsonb_array_elements(NEW.items) loop
      if (it->>'id') ~ '^\d+$' then
        pid := (it->>'id')::bigint;
      else
        pid := null;
      end if;
      q := greatest(1, coalesce((it->>'qty')::int, 1));
      if pid is not null then
        select coalesce(sale_price, price), name into unit, pname
          from public.products
          where id = pid and is_active = true;
        if unit is not null then
          computed := computed + unit * q;
          newitems := newitems || jsonb_build_object('id', pid, 'name', pname, 'price', unit, 'qty', q);
        end if;
      end if;
    end loop;
  end if;
  NEW.items := newitems;
  NEW.subtotal := computed;
  return NEW;
end;
$$;

drop trigger if exists orders_recompute_total on public.orders;
create trigger orders_recompute_total
  before insert on public.orders
  for each row execute function public.recompute_order_total();

-- Recreate the public insert policy adding a postal_code length guard.
drop policy if exists "orders insert" on public.orders;
create policy "orders insert" on public.orders for insert to anon, authenticated
  with check (
    (user_id is null or user_id = auth.uid())
    and char_length(customer_name) between 1 and 120
    and char_length(phone) between 4 and 30
    and char_length(coalesce(note, '')) <= 1000
    and char_length(coalesce(postal_code, '')) <= 20
    and jsonb_typeof(items) = 'array'
    and payment_method in ('cod','online')
    and payment_status = 'unpaid'
    and payment_ref_id is null
    and paid_at is null
  );
