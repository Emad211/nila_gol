-- Premium catalog fields: discount price, availability label, and multi-image galleries.

alter table public.products
  add column if not exists sale_price   integer,                              -- nullable; when set and < price, shown as a discount
  add column if not exists availability text   not null default 'in_stock',   -- in_stock | made_to_order | sold_out
  add column if not exists images       text[] not null default '{}';         -- extra image URLs (PDP gallery), primary stays image_url

alter table public.products drop constraint if exists products_availability_check;
alter table public.products
  add constraint products_availability_check
  check (availability in ('in_stock', 'made_to_order', 'sold_out'));
