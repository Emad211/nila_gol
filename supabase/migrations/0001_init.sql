-- Nila Gol — initial schema
-- Tables: products, features (catalog, public read) and inquiries (contact form, public insert-only).

-- ── products ──────────────────────────────────────────────────────────────
create table if not exists public.products (
  id          bigint generated always as identity primary key,
  name        text    not null,
  description text,
  price       integer not null default 0,          -- price in Toman (no separators)
  category    text,
  features    text[]  not null default '{}',
  sort_order  integer not null default 0,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);

-- ── features (the "why choose us" cards) ──────────────────────────────────
create table if not exists public.features (
  id          bigint generated always as identity primary key,
  title       text    not null,
  description text,
  icon        text,                                 -- emoji glyph
  sort_order  integer not null default 0,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);

-- ── inquiries (contact form submissions) ──────────────────────────────────
create table if not exists public.inquiries (
  id          bigint generated always as identity primary key,
  name        text,
  phone       text    not null,
  message     text,
  created_at  timestamptz not null default now()
);

create index if not exists products_sort_idx on public.products (sort_order);
create index if not exists features_sort_idx on public.features (sort_order);
create index if not exists inquiries_created_idx on public.inquiries (created_at desc);

-- ── Row Level Security ────────────────────────────────────────────────────
alter table public.products  enable row level security;
alter table public.features  enable row level security;
alter table public.inquiries enable row level security;

-- Catalog is publicly readable (only active rows).
create policy "Public read active products"
  on public.products for select
  to anon, authenticated
  using (is_active = true);

create policy "Public read active features"
  on public.features for select
  to anon, authenticated
  using (is_active = true);

-- Anyone may submit a contact inquiry, with basic length guards to limit abuse.
-- No SELECT policy exists for inquiries, so submissions stay private
-- (readable only via the Supabase dashboard / service role).
create policy "Public can submit inquiries"
  on public.inquiries for insert
  to anon, authenticated
  with check (
    char_length(phone) between 3 and 30
    and char_length(coalesce(name, '')) <= 120
    and char_length(coalesce(message, '')) <= 2000
  );
