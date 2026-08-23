import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { products as fallbackProducts } from './src/data/products.js'

const MARKETING_ROUTES = ['/', '/products', '/blog', '/how-to-order']
const FALLBACK_PRODUCT_SLUGS = fallbackProducts.map((product) => product.slug).filter(Boolean)
const PROJECT_SUPABASE_URL = 'https://msiowolgbuffddhcdmqw.supabase.co'
const REQUIRED_COMMERCE_SCHEMA_VERSION = 19

export default defineConfig(async ({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const SUPA_URL =
    env.VITE_SUPABASE_URL ||
    env.SUPABASE_URL ||
    env.NEXT_PUBLIC_SUPABASE_URL ||
    PROJECT_SUPABASE_URL
  const SUPA_KEY =
    env.VITE_SUPABASE_PUBLISHABLE_KEY ||
    env.VITE_SUPABASE_ANON_KEY ||
    env.SUPABASE_PUBLISHABLE_KEY ||
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    ''

  const isVercelProduction = env.VERCEL === '1' && env.VERCEL_ENV === 'production'
  if (isVercelProduction && !SUPA_KEY) {
    throw new Error(
      '[supabase] Production build blocked: no Supabase publishable/anon key is available. Connect the Supabase integration or define VITE_SUPABASE_PUBLISHABLE_KEY for Production.',
    )
  }

  if (!SUPA_KEY) {
    console.warn(
      '[supabase] No public/publishable key found. The public catalog will use fallback data and app features that require Supabase will be unavailable.',
    )
  }

  async function supabaseGet(path) {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 8000)
    try {
      return await fetch(`${SUPA_URL}${path}`, {
        headers: { apikey: SUPA_KEY, Authorization: `Bearer ${SUPA_KEY}` },
        signal: controller.signal,
      })
    } finally {
      clearTimeout(timeout)
    }
  }

  // Production must prove both public catalog reachability and a data-free
  // commerce compatibility marker. The marker avoids probing protected orders
  // through RLS merely to learn whether the live schema is new enough.
  if (isVercelProduction) {
    let response
    try {
      response = await supabaseGet('/rest/v1/products?select=id&limit=1')
    } catch (error) {
      throw new Error(
        `[supabase] Production build blocked: Supabase Data API is unreachable (${error?.message || 'network error'}).`,
      )
    }
    if (!response.ok) {
      const detail = await response.text().catch(() => '')
      throw new Error(
        `[supabase] Production build blocked: Data API returned HTTP ${response.status}${detail ? ` — ${detail.slice(0, 180)}` : ''}.`,
      )
    }

    let schemaResponse
    try {
      schemaResponse = await supabaseGet('/rest/v1/rpc/commerce_schema_version')
    } catch (error) {
      throw new Error(
        `[supabase] Production build blocked: unable to validate commerce schema (${error?.message || 'network error'}).`,
      )
    }
    if (!schemaResponse.ok) {
      const detail = await schemaResponse.text().catch(() => '')
      throw new Error(
        `[supabase] Production build blocked: commerce schema marker from migration 0019 is unavailable (HTTP ${schemaResponse.status}${detail ? ` — ${detail.slice(0, 180)}` : ''}).`,
      )
    }

    let schemaVersion = Number.NaN
    try {
      const payload = await schemaResponse.json()
      schemaVersion = Number(Array.isArray(payload) ? payload[0] : payload)
    } catch {
      schemaVersion = Number.NaN
    }
    if (!Number.isInteger(schemaVersion) || schemaVersion < REQUIRED_COMMERCE_SCHEMA_VERSION) {
      throw new Error(
        `[supabase] Production build blocked: commerce schema version ${Number.isFinite(schemaVersion) ? schemaVersion : 'unknown'} is below required version ${REQUIRED_COMMERCE_SCHEMA_VERSION}.`,
      )
    }

    console.info(`[supabase] Production preflight OK: catalog + commerce schema v${schemaVersion} @ ${SUPA_URL}`)
  }

  async function fetchSlugs(table, filter) {
    if (!SUPA_URL || !SUPA_KEY) return []
    try {
      const res = await supabaseGet(`/rest/v1/${table}?select=slug&${filter}`)
      if (!res.ok) return []
      const rows = await res.json()
      return rows.filter((r) => r.slug).map((r) => r.slug)
    } catch {
      return []
    }
  }

  return {
    define: {
      'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(SUPA_URL),
      'import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY': JSON.stringify(SUPA_KEY),
    },
    plugins: [
      react()
    ],
    server: {
      port: 3000,
      open: true
    },
    build: {
      outDir: 'dist',
      sourcemap: false
    },
    ssgOptions: {
      entry: 'src/main.jsx',
      dirStyle: 'nested',
      formatting: 'none',
      async includedRoutes() {
        const [remoteProducts, posts] = await Promise.all([
          fetchSlugs('products', 'is_active=eq.true'),
          fetchSlugs('posts', 'is_published=eq.true'),
        ])
        const productSlugs = [...new Set([...FALLBACK_PRODUCT_SLUGS, ...remoteProducts])]
        return [
          ...MARKETING_ROUTES,
          ...productSlugs.map((s) => `/products/${encodeURIComponent(s)}`),
          ...posts.map((s) => `/blog/${encodeURIComponent(s)}`),
        ]
      },
    },
  }
})
