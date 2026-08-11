// Build-time sitemap generator. Runs as `prebuild`, so public/sitemap.xml is
// fresh on every deploy. Never fails the build — falls back to static pages
// if Supabase is unreachable. Set VITE_SITE_URL to override the canonical origin.
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function readEnv() {
  const env = { ...process.env };
  try {
    const txt = fs.readFileSync(path.join(root, '.env'), 'utf8');
    for (const line of txt.split('\n')) {
      const m = line.match(/^\s*([\w.]+)\s*=\s*(.*)\s*$/);
      if (m && env[m[1]] === undefined) env[m[1]] = m[2].trim();
    }
  } catch {
    /* no .env (e.g. CI with real env vars) */
  }
  return env;
}

const env = readEnv();
const DOMAIN = (env.VITE_SITE_URL || 'https://nilagol.ir').replace(/\/$/, '');
const SUPA_URL =
  env.VITE_SUPABASE_URL ||
  env.SUPABASE_URL ||
  env.NEXT_PUBLIC_SUPABASE_URL ||
  'https://msiowolgbuffddhcdmqw.supabase.co';
const SUPA_KEY =
  env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  env.VITE_SUPABASE_ANON_KEY ||
  env.SUPABASE_PUBLISHABLE_KEY ||
  env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  '';

const staticPaths = ['/', '/products', '/blog', '/how-to-order'];

// Fetch published slugs from a Supabase table and map them to URL paths.
async function slugPaths(table, filter, prefix) {
  if (!SUPA_URL || !SUPA_KEY) return [];
  try {
    const res = await fetch(`${SUPA_URL}/rest/v1/${table}?select=slug&${filter}`, {
      headers: { apikey: SUPA_KEY },
    });
    if (!res.ok) return [];
    const rows = await res.json();
    return rows.filter((r) => r.slug).map((r) => `${prefix}/${encodeURIComponent(r.slug)}`);
  } catch {
    return [];
  }
}

const [productUrls, postUrls] = await Promise.all([
  slugPaths('products', 'is_active=eq.true', '/products'),
  slugPaths('posts', 'is_published=eq.true', '/blog'),
]);

const paths = [...staticPaths, ...productUrls, ...postUrls];
const xml =
  `<?xml version="1.0" encoding="UTF-8"?>\n` +
  `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
  paths.map((p) => `  <url><loc>${DOMAIN}${p}</loc></url>`).join('\n') +
  `\n</urlset>\n`;

fs.mkdirSync(path.join(root, 'public'), { recursive: true });
fs.writeFileSync(path.join(root, 'public', 'sitemap.xml'), xml);
console.log(`sitemap: ${paths.length} urls -> public/sitemap.xml`);
