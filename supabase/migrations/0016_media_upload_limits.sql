-- Nila Gol — storage guardrails for admin-managed public media.
-- RLS already limits writes to admins. These bucket-level restrictions also
-- reject oversized/non-image objects if a client bypasses the frontend checks.

update storage.buckets
set
  file_size_limit = 10485760, -- 10 MiB hard server ceiling
  allowed_mime_types = array[
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/avif'
  ]::text[]
where id = 'media';
