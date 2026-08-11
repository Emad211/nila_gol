import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// Marketing routes that should always be pre-rendered (dynamic product/blog
// pages are added below from the database).
const MARKETING_ROUTES = ['/', '/products', '/blog', '/how-to-order']

// The project ref is public metadata (also used by the repo Supabase MCP config).
// Keeping the URL fallback here prevents a harmless naming mismatch from making
// the whole storefront silently drop to static data. The publishable key still
// MUST come from the deployment environment and is never hard-coded.
const PROJECT_SUPABASE_URL = 'https://msiowolgbuffddhcdmqw.supabase.co'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load both .env files and variables injected by the deployment platform.
  // Vercel's Supabase integration currently injects SUPABASE_URL and
  // SUPABASE_PUBLISHABLE_KEY (plus NEXT_PUBLIC_* aliases), while Vite apps
  // traditionally use VITE_* names. Resolve all supported public aliases here
  // and expose ONLY the URL + publishable/anon key to browser code.
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

  if (!SUPA_KEY) {
    console.warn(
      '[supabase] No public/publishable key found. The public catalog will use fallback data and app features that require Supabase will be unavailable.',
    )
  }

  // Fetch published slugs from a Supabase table (best-effort; never fails the build).
  async function fetchSlugs(table, filter) {
    if (!SUPA_URL || !SUPA_KEY) return []
    try {
      const res = await fetch(`${SUPA_URL}/rest/v1/${table}?select=slug&${filter}`, {
        headers: { apikey: SUPA_KEY, Authorization: `Bearer ${SUPA_KEY}` },
      })
      if (!res.ok) return []
      const rows = await res.json()
      return rows.filter((r) => r.slug).map((r) => r.slug)
    } catch {
      return []
    }
  }

  return {
    // Vite only exposes VITE_* variables automatically. Define the two safe
    // Supabase public values explicitly so Vercel Marketplace's unprefixed
    // variables work in browser code without exposing SUPABASE_SECRET_KEY.
    define: {
      __NILA_SUPABASE_URL__: JSON.stringify(SUPA_URL),
      __NILA_SUPABASE_PUBLISHABLE_KEY__: JSON.stringify(SUPA_KEY),
    },
    plugins: [
      react(),
      VitePWA({
        registerType: 'autoUpdate',
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
          // The app shell is pre-rendered per route; let navigations fall back to '/'.
          navigateFallback: '/',
          navigateFallbackDenylist: [/^\/admin/, /^\/api/],
          runtimeCaching: [
            {
              // Cache only public catalog resources. Never cache private/authenticated
              // REST responses such as orders, chat or admin reads on a shared device.
              urlPattern: ({ url }) => {
                if (!/^https:\/\/[a-z0-9]+\.supabase\.co$/i.test(url.origin)) return false
                return /^\/rest\/v1\/(products|features|gallery|posts)(?:\?|$)/i.test(url.pathname + url.search)
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
              // Uploaded product / gallery images.
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
    // vite-react-ssg: pre-render the marketing + dynamic content pages to static
    // HTML for SEO. App-only pages (cart/checkout/account/admin) stay client-only.
    ssgOptions: {
      entry: 'src/main.jsx',
      dirStyle: 'nested',
      formatting: 'none',
      // Return the exact allow-list to pre-render: the marketing pages plus every
      // product/article. App-only pages (cart/checkout/account/admin) are omitted
      // on purpose — they need client auth/cart and are served via the SPA fallback.
      async includedRoutes() {
        const [products, posts] = await Promise.all([
          fetchSlugs('products', 'is_active=eq.true'),
          fetchSlugs('posts', 'is_published=eq.true'),
        ])
        return [
          ...MARKETING_ROUTES,
          ...products.map((s) => `/products/${encodeURIComponent(s)}`),
          ...posts.map((s) => `/blog/${encodeURIComponent(s)}`),
        ]
      },
    },
  }
})
