import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { products as fallbackProducts } from './src/data/products.js'

const MARKETING_ROUTES = ['/', '/products', '/blog', '/how-to-order']
const FALLBACK_PRODUCT_SLUGS = fallbackProducts.map((product) => product.slug).filter(Boolean)
const PROJECT_SUPABASE_URL = 'https://msiowolgbuffddhcdmqw.supabase.co'

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

  // Production must prove both catalog reachability and the commerce schema
  // expected by the deployed client. This prevents Vercel from promoting code
  // that uses public_id/payment capability fields before migration 0018 exists.
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

    let orderSchema
    try {
      orderSchema = await supabaseGet('/rest/v1/orders?select=public_id,payment_token_hash&limit=0')
    } catch (error) {
      throw new Error(
        `[supabase] Production build blocked: unable to validate order schema (${error?.message || 'network error'}).`,
      )
    }
    if (!orderSchema.ok) {
      const detail = await orderSchema.text().catch(() => '')
      throw new Error(
        `[supabase] Production build blocked: migration 0018_public_order_reference.sql is not confirmed on the live database (HTTP ${orderSchema.status}${detail ? ` — ${detail.slice(0, 180)}` : ''}).`,
      )
    }

    console.info(`[supabase] Production preflight OK: catalog + order capability schema @ ${SUPA_URL}`)
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
      react(),
      VitePWA({
        registerType: 'autoUpdate',
        injectRegister: 'script-defer',
        includeAssets: ['apple-touch-icon.png'],
        manifest: {
          name: 'گل‌های روسی انعطاف‌پذیر',
          short_name: 'نیلا گل',
          description: 'گل‌های روسی انعطاف‌پذیر — زیبایی پایدار برای خانه شما',
          lang: 'fa',
          dir: 'rtl',
          start_url: '/',
          scope: '/',
          display: 'standalone',
          background_color: '#f7f3ee',
          theme_color: '#c98f7b',
          icons: [
            { src: '/pwa-192.png', sizes: '192x192', type: 'image/png' },
            { src: '/pwa-512.png', sizes: '512x512', type: 'image/png' },
            { src: '/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
          ]
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,svg,woff,woff2,webp,png,ico}'],
          navigateFallback: '/',
          navigateFallbackDenylist: [/^\/admin/, /^\/api/],
          runtimeCaching: [
            {
              urlPattern: ({ url }) => {
                if (!/^https:\/\/[a-z0-9]+\.supabase\.co$/i.test(url.origin)) return false
                return /^\/rest\/v1\/(products|features|gallery|posts)(?:\/|\?|$)/i.test(url.pathname + url.search)
              },
              handler: 'NetworkFirst',
              options: {
                cacheName: 'supabase-public-catalog',
                networkTimeoutSeconds: 5,
                expiration: { maxEntries: 80, maxAgeSeconds: 60 * 60 * 24 * 7 },
                cacheableResponse: { statuses: [0, 200] }
              }
            },
            {
              urlPattern: /^https:\/\/[a-z0-9]+\.supabase\.co\/storage\/v1\/.*/i,
              handler: 'StaleWhileRevalidate',
              options: {
                cacheName: 'supabase-media',
                expiration: { maxEntries: 120, maxAgeSeconds: 60 * 60 * 24 * 30 },
                cacheableResponse: { statuses: [0, 200] }
              }
            },
            {
              urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/i,
              handler: 'StaleWhileRevalidate',
              options: { cacheName: 'google-fonts', expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 365 } }
            }
          ]
        }
      })
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
