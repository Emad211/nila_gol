-- 0016_order_line_integrity: fail closed on malformed/empty order lines.
--
-- 0012 made price/subtotal server-authoritative. This revision keeps that model
-- but rejects invalid product ids, inactive/sold-out products, malformed
-- quantities and empty carts instead of silently dropping bad lines and allowing
-- a zero or no-longer-orderable order.

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

-- Trigger functions execute through the table trigger only; keep RPC execution
-- unavailable to browser roles.
revoke all on function public.recompute_order_total() from public;
revoke all on function public.recompute_order_total() from anon;
revoke all on function public.recompute_order_total() from authenticated;

-- Recreate the insert policy with explicit post-trigger cart/total constraints.
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
  );
