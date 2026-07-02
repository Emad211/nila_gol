-- Nila Gol — admin authorization, media storage, gallery, and admin RLS.

-- ── products: real image + featured flag ──────────────────────────────────
alter table public.products
  add column if not exists image_url   text,
  add column if not exists is_featured boolean not null default false;

-- ── gallery ───────────────────────────────────────────────────────────────
create table if not exists public.gallery (
  id          bigint generated always as identity primary key,
  title       text,
  image_url   text    not null,
  sort_order  integer not null default 0,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);
create index if not exists gallery_sort_idx on public.gallery (sort_order);

-- ── admins allowlist ──────────────────────────────────────────────────────
create table if not exists public.admins (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

-- is_admin(): SECURITY DEFINER so it bypasses RLS on public.admins and does not
-- recurse when referenced inside policies on other tables.
create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (select 1 from public.admins where user_id = auth.uid());
$$;

-- Bootstrap: the first account to ever sign up is promoted to admin.
create or replace function public.handle_first_admin()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (select 1 from public.admins) then
    insert into public.admins (user_id) values (new.id);
  end if;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_make_admin on auth.users;
create trigger on_auth_user_created_make_admin
  after insert on auth.users
  for each row execute function public.handle_first_admin();

-- ── RLS ───────────────────────────────────────────────────────────────────
alter table public.gallery enable row level security;
alter table public.admins  enable row level security;

drop policy if exists "Public read active gallery" on public.gallery;
create policy "Public read active gallery"
  on public.gallery for select to anon, authenticated
  using (is_active = true);

drop policy if exists "Admin manage gallery" on public.gallery;
create policy "Admin manage gallery"
  on public.gallery for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Admin read admins" on public.admins;
create policy "Admin read admins"
  on public.admins for select to authenticated
  using (public.is_admin());

drop policy if exists "Admin manage products" on public.products;
create policy "Admin manage products"
  on public.products for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Admin manage features" on public.features;
create policy "Admin manage features"
  on public.features for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Admin read inquiries" on public.inquiries;
create policy "Admin read inquiries"
  on public.inquiries for select to authenticated
  using (public.is_admin());

drop policy if exists "Admin delete inquiries" on public.inquiries;
create policy "Admin delete inquiries"
  on public.inquiries for delete to authenticated
  using (public.is_admin());

-- ── Storage: public 'media' bucket, admin-only writes ─────────────────────
insert into storage.buckets (id, name, public)
values ('media', 'media', true)
on conflict (id) do nothing;

drop policy if exists "Public read media" on storage.objects;
create policy "Public read media"
  on storage.objects for select to anon, authenticated
  using (bucket_id = 'media');

drop policy if exists "Admin upload media" on storage.objects;
create policy "Admin upload media"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'media' and public.is_admin());

drop policy if exists "Admin update media" on storage.objects;
create policy "Admin update media"
  on storage.objects for update to authenticated
  using (bucket_id = 'media' and public.is_admin())
  with check (bucket_id = 'media' and public.is_admin());

drop policy if exists "Admin delete media" on storage.objects;
create policy "Admin delete media"
  on storage.objects for delete to authenticated
  using (bucket_id = 'media' and public.is_admin());
