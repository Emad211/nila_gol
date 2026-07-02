-- SEO-friendly, keyword-rich Persian slugs for product URLs (/products/:slug).

alter table public.products add column if not exists slug text;

-- Backfill from the product name (spaces -> hyphens).
update public.products
set slug = regexp_replace(trim(name), '\s+', '-', 'g')
where slug is null or slug = '';

-- De-duplicate any colliding slugs by appending the id.
update public.products p
set slug = p.slug || '-' || p.id
from (select slug from public.products group by slug having count(*) > 1) d
where p.slug = d.slug;

create unique index if not exists products_slug_uidx on public.products (slug);
