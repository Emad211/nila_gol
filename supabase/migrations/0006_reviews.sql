-- Customer reviews / testimonials (social proof). Public can read approved rows
-- and submit (moderated, unapproved) ones; admins manage everything.

create table if not exists public.reviews (
  id           bigint generated always as identity primary key,
  product_id   bigint references public.products (id) on delete cascade, -- null = general/site testimonial
  author_name  text    not null,
  city         text,
  rating       int     not null,
  body         text,
  photo_url    text,
  is_approved  boolean not null default false,
  created_at   timestamptz not null default now(),
  constraint reviews_rating_check check (rating between 1 and 5)
);

create index if not exists reviews_approved_idx on public.reviews (is_approved, created_at desc);
create index if not exists reviews_product_idx on public.reviews (product_id);

alter table public.reviews enable row level security;

drop policy if exists "Public read approved reviews" on public.reviews;
create policy "Public read approved reviews"
  on public.reviews for select to anon, authenticated
  using (is_approved = true);

-- Public submissions are forced unapproved and length-guarded; admins moderate.
drop policy if exists "Public submit review" on public.reviews;
create policy "Public submit review"
  on public.reviews for insert to anon, authenticated
  with check (
    is_approved = false
    and char_length(author_name) between 1 and 80
    and char_length(coalesce(body, '')) <= 1000
    and rating between 1 and 5
  );

drop policy if exists "Admin manage reviews" on public.reviews;
create policy "Admin manage reviews"
  on public.reviews for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
