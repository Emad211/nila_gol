begin;

create extension if not exists pgtap with schema extensions;

select plan(9);

select has_column('public', 'orders', 'public_id', 'orders exposes an unguessable public reference');
select has_column('public', 'orders', 'payment_token_hash', 'orders stores only a payment capability hash');
select has_index('public', 'orders', 'orders_public_id_uidx', 'public order reference has a unique index');

insert into public.products (
  id, name, description, price, sale_price, category, availability, is_active, sort_order
) overriding system value values
  (900001, 'Order integrity product', 'test', 75000, 65000, 'test', 'in_stock', true, 0),
  (900002, 'Sold out product', 'test', 80000, null, 'test', 'sold_out', true, 0),
  (900003, 'Inactive product', 'test', 90000, null, 'test', 'in_stock', false, 0);

insert into public.orders (
  public_id,
  payment_token_hash,
  customer_name,
  phone,
  city,
  address,
  postal_code,
  items,
  subtotal,
  payment_method,
  payment_status
) values (
  '11111111-1111-4111-8111-111111111111'::uuid,
  repeat('a', 64),
  'Test Customer',
  '09123456789',
  'Gorgan',
  'Test address',
  '1234567890',
  '[{"id":900001,"name":"tampered name","price":1,"qty":2}]'::jsonb,
  2,
  'cod',
  'unpaid'
);

select results_eq(
  $$select subtotal from public.orders where public_id = '11111111-1111-4111-8111-111111111111'::uuid$$,
  $$values (130000::bigint)$$,
  'subtotal is recomputed from the current server sale price'
);

select results_eq(
  $$select (items->0->>'price')::bigint from public.orders where public_id = '11111111-1111-4111-8111-111111111111'::uuid$$,
  $$values (65000::bigint)$$,
  'client item price is replaced by the current server price'
);

select throws_ok(
  $$
    insert into public.orders (public_id, payment_token_hash, customer_name, phone, items, subtotal)
    values ('22222222-2222-4222-8222-222222222222'::uuid, repeat('b', 64), 'Empty', '09123456789', '[]'::jsonb, 1)
  $$,
  '23514',
  'سبد خرید خالی است.',
  'empty carts are rejected server-side'
);

select throws_ok(
  $$
    insert into public.orders (public_id, payment_token_hash, customer_name, phone, items, subtotal)
    values (
      '33333333-3333-4333-8333-333333333333'::uuid,
      repeat('c', 64),
      'Oversized',
      '09123456789',
      '[{"id":900001,"qty":100}]'::jsonb,
      1
    )
  $$,
  '23514',
  'تعداد هر محصول باید بین ۱ تا ۹۹ باشد.',
  'quantities above the commerce limit are rejected server-side'
);

select throws_ok(
  $$
    insert into public.orders (public_id, payment_token_hash, customer_name, phone, items, subtotal)
    values (
      '44444444-4444-4444-8444-444444444444'::uuid,
      repeat('d', 64),
      'Sold out',
      '09123456789',
      '[{"id":900002,"qty":1}]'::jsonb,
      1
    )
  $$,
  '23514',
  'یک یا چند محصول دیگر قابل سفارش نیست. سبد خرید را بازبینی کنید.',
  'sold-out products cannot be ordered from a stale cart'
);

select throws_ok(
  $$
    insert into public.orders (public_id, payment_token_hash, customer_name, phone, items, subtotal)
    values (
      '55555555-5555-4555-8555-555555555555'::uuid,
      repeat('e', 64),
      'Inactive',
      '09123456789',
      '[{"id":900003,"qty":1}]'::jsonb,
      1
    )
  $$,
  '23514',
  'یک یا چند محصول دیگر قابل سفارش نیست. سبد خرید را بازبینی کنید.',
  'inactive products cannot be ordered from a stale cart'
);

select * from finish();
rollback;
