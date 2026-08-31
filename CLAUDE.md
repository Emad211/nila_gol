# AGENTS.md

Guidance for AI coding agents working in this repo. **Deep reference: `AGENT-KNOWLEDGE-BASE.md`** (Persian, very detailed — authoritative except its PWA section, which is stale: the PWA was removed, see "CI, scripts, deployment" below). `CLAUDE.md` mirrors this file for Claude Code — update both together.

## Project

Single-brand Persian (Farsi, fully RTL) marketing + product-catalog site for «گل‌های روسی انعطاف‌پذیر» (Russian flexible flowers). React 18 + Vite, **statically pre-rendered via `vite-react-ssg`** — marketing/product/blog pages ship real HTML for SEO; cart/checkout/account/admin/payment-callback are client-only. Backend is **Supabase** (ref `msiowolgbuffddhcdmqw`): catalog, inquiries, reviews, orders, blog, chat, admin auth, image storage, and two Edge Functions (ZarinPal `payment`, Avalai `ai-chat`). Deploys to Vercel (`https://nilagol.ir`). COD in Gorgan / post nationwide + online ZarinPal payment.

## Commands

```bash
npm run dev          # vite-react-ssg dev server, port 3000 (set in vite.config; --port flag is ignored)
npm run build        # prebuild: scripts/gen-sitemap.mjs → vite-react-ssg build → nested HTML in dist/
npm run preview      # vite preview, port 4173
npm run lint         # eslint . — NOTE: .eslintrc.cjs ignores '*.config.js', so vite.config.js is never linted
npm run gen:sitemap  # standalone sitemap regen (never fails; writes public/sitemap.xml)
```

No JS test framework. Database integrity is tested with pgTAP: `supabase/tests/database/order_integrity.test.sql` (replayed by CI's `supabase-db-check.yml`). Node 20 via `.nvmrc`; CI runs Node 22.

## Build gates (vite.config.js — read before touching migrations or env)

Production builds on Vercel (`VERCEL=1` + `VERCEL_ENV=production`) **fail hard** when: no Supabase key is present, the Data API is unreachable, or RPC `commerce_schema_version()` returns < `REQUIRED_COMMERCE_SCHEMA_VERSION` (currently 19). A migration that changes commerce behavior must also bump the marker in `0019_commerce_schema_version.sql` (and the pgTAP test), or production deploys will block.

Supabase env resolution: `VITE_SUPABASE_PUBLISHABLE_KEY` (preferred, `sb_publishable_…`) or legacy `VITE_SUPABASE_ANON_KEY`; the Vercel Supabase integration's `SUPABASE_URL`/`SUPABASE_PUBLISHABLE_KEY` are bridged automatically. Final values are force-injected via Vite `define` onto `import.meta.env.VITE_SUPABASE_URL/_PUBLISHABLE_KEY` — read them only through `src/lib/supabase.js`.

## Architecture rules that are easy to get wrong

- **No `<BrowserRouter>`.** `src/main.jsx` = `ViteReactSSG({ routes })`; routing is a react-router data router built from the `routes` array in `src/App.jsx`, where the loaders and `PublicLayout` are also defined. `src/layouts/` contains only `AuthOutlet.jsx`.
- **`RootProviders` wraps ONLY `CartProvider`** (+ SpeedInsights). Auth is deliberately NOT global: a lazy `authLayout` (`AuthOutlet` → `AuthProvider`) wraps `[checkout, account]` and separately `[admin/login, admin]`, so marketing pages never need a session. The chat widget mounts its own AuthProvider instance via `SupportChatBoundary` — multiple AuthProvider instances are intentional; don't unify.
- **Route loaders run at build time** (home/products/product/blog/blogPost — defined in `App.jsx`, dynamically importing services) and the data is serialized into the HTML for hydration. All data routes use `shouldRevalidate = revalidateOnPathChange` (pathname-only). This is critical: the SSG data manifest is keyed by exact pathname, and revalidation on a trailing-slash canonical URL returns `null` from `useLoaderData()`. Therefore **always consume loaders as `useLoaderData() ?? {}`** (and default nested fields) — never assume a non-null return.
- **Lazy boundaries:** `HomePage` is eager; other public pages are route-`lazy`; admin is lazy only at the `ProtectedAdminPage` wrapper — the manager components inside `AdminDashboard` are statically imported (keeps `react-markdown` + the admin bundle off the marketing critical path).
- **SSG route inclusion** (`ssgOptions.includedRoutes` in vite.config.js): 4 marketing routes + product/post slugs fetched live from Supabase ∪ fallback product slugs. cart/checkout/account/admin/payment-callback are intentionally excluded.
- **SSR-safety** is done by deferring browser APIs to effects (`CartProvider` has a `loaded` flag; `ThemeToggle` renders a fixed first paint). `ClientOnly` from vite-react-ssg is not used anywhere.
- The hero is the **static `HeroSplit`** (`src/components/home/`) with catalog-driven image slides. The old 3D hero (`HeroOrchid3D`, three.js) was removed — `public/models/pink_rose.glb` (~17 MB) is an orphaned delete candidate.
- The support widget (`SupportChatBoundary`, lazy) is suppressed on `/checkout`, `/account`, `/payment/*` (conversion focus + avoids a second AuthProvider).
- Hash section nav uses `<Link to="/#about">` style (incl. cross-page); `ScrollToHash` handles scrolling. Do not replace with raw `<a href="#…">`.

## Data layer (`src/services/`)

- `catalog.js` — `getProducts`/`getProduct`/`getFeatures`/`getRelatedProducts` degrade silently to static fallbacks in `src/data/products.js`; `getGallery` also has a 4-item static fallback. **Exception: `getOrderValidationProducts()` throws when Supabase is configured but unreachable** — Cart/Checkout must block on failure rather than trust fallback prices. Prices are integers in Toman.
- `orders.js` — `createOrder` generates a public `public_id` (UUID, safe to display) plus a `payment_token` (two concatenated UUIDs); **only its SHA-256 hash is stored**. The insert deliberately omits `.select()` (guests have INSERT-only RLS). Uses `crypto.subtle` → the payment flow requires HTTPS or localhost.
- `reviews.js` — public reads see `is_approved` rows only; public submits are forced `is_approved = false` (RLS). Never swap these.
- Also: `payments.js`, `chat.js`, `aichat.js` (a 429 response carries a Persian `{reply}` rendered as a chat bubble — intentional, don't turn it into an error), `admin.js`, `adminOverview.js`, `inquiries.js` (write-only leads), `posts.js` (returns `[]` on any problem).
- `src/lib/order.js` — WhatsApp/Telegram/**Bale** links (no phone channel), per-product pre-filled WhatsApp order messages, `orderPublicCode()` for tracking codes. Slugs are auto-generated via `slugify` (`src/lib/slug.js`) with one retry on unique-violation `23505`.

## Database (`supabase/migrations/`, now 0001–0021)

Key tables: `products` (slug unique, sale_price, availability CHECK in_stock|made_to_order|sold_out, images[]), `features`, `gallery`, `reviews` (moderated), `posts` (Markdown, is_published), `inquiries` (write-only from browser), `orders` (status/payment_* + `public_id` + `payment_token_hash`; **BEFORE INSERT trigger `recompute_order_total()`** recomputes subtotal and every item price from `products` — fail-closed since 0017: 1..50 items, qty 1..99, active products only, else Persian error `23514`; never make it RPC-callable), `chat_messages` (Realtime, thread-owner-scoped), `admins` (allowlist), `ai_chat_usage` (rate-limit buckets, service-role only).

Migration highlights the older docs missed:
- **0014/0015 dropped `handle_first_admin()` and `admin_exists()` — keep them dropped.** There is NO self-serve first-admin bootstrap; `/admin/login` is login-only. New admins: create the user in the Supabase Dashboard, then insert its UUID into `public.admins` with service role / SQL.
- 0016: `media` bucket upload limit 10 MiB, MIME jpeg/png/webp/avif.
- 0018: `public_id` + `payment_token_hash` on orders (anti-enumeration; guests reference orders by public_id).
- 0019: `commerce_schema_version()` marker (build gate, above). 0020: `(select auth.uid())` initplan-wrap pattern for new orders/chat policies. 0021: `ai_chat_rate_check()` (10/min, 40/hr, 120/day per IP-hash).

RLS model (preserve when changing schema): public reads only `is_active`/`is_published`/`is_approved` rows; inquiries are public-INSERT-only; orders allow guest INSERT with forced `payment_status='unpaid'` (only the `payment` Edge Function with service role may write paid state); users read only their own orders/chat threads; `is_admin()` gets full CRUD everywhere needed. The `media` bucket is public-read-by-URL but has **no SELECT policy** (no listing) and admin-only writes.

DDL workflow: apply with Supabase MCP `apply_migration` (keep the same-named file in `supabase/migrations/`), raw data via `execute_sql`, then run `get_advisors` (known-intentional warnings: KB §17). Keep `supabase/seed.sql` in sync.

## Edge Functions (`supabase/functions/`, config in `supabase/config.toml`)

- **`payment`** — ZarinPal. `verify_jwt = false` (guests pay); it self-validates: `create` requires the hashed high-entropy payment token (constant-time compare; 403 reads like 404), `verify` requires the exact stored authority, `reconcile` is admin-only (validates JWT + `admins` membership in-function). Amounts are Toman → ×10 Rial, read from the DB (`payment_amount_rial` frozen at create — no drift). Atomic paid-writes + unique partial indexes on authority/ref_id (one payment settles one order). Secrets: `ZARINPAL_MERCHANT_ID`, `ZARINPAL_MODE` (sandbox default | production), `SITE_URL` (must equal the ZarinPal-registered domain, else error −14). Full reference: `docs/zarinpal-developer-guide.md`.
- **`ai-chat`** — Avalai (OpenAI-compatible) proxy. `verify_jwt = true` (the anon key is a valid JWT, so guests work). Secret `AVALAI_API_KEY` only (never client-side); model `gpt-4.1-mini` (`gpt-4o-mini` is unreliable at Persian). Rate-limited via 0021. Grounds answers in a 5-min-cached live catalog read; the «گلی» persona must not invent products/prices.
- CI DB uses non-default ports 55432/55430 (config.toml) for deterministic migration replay.

## Auth & admin panel

- `AuthProvider` (per-route) exposes `session`/`isAdmin` (via `rpc('is_admin')`, re-checked on every auth event)/`loading`/`checkingAdmin` — use `checkingAdmin` to avoid the post-login redirect race. Password recovery flows via the `PASSWORD_RECOVERY` auth event, not query params.
- `AdminDashboard` has **8 tabs**: overview, orders (optimistic status updates with rollback + «تأیید مجدد پرداخت» reconcile), products, gallery, posts (Markdown editor with live `.prose` preview), reviews, chat, inquiries. It has a 30-min idle timeout with `is_admin` re-verification on focus. `ChatManager`'s `openIdRef` pattern keeps the Realtime subscription stable — preserve it when refactoring.
- Image uploads go to the `media` bucket via `uploadImage()` (client validates ≤8 MB, jpeg/png/webp/avif; DB enforces 10 MiB).

## Conventions

- **Landing redesign (Aug 2026):** `/` ships the figma-redesign landing (source: `design-briefs/figma-redesign/` — renders, `spec-deep.txt`, `PLAN.md`, `qa-assertions.json`). It uses its own token namespace `--nl-*` in `src/styles/landing.css` (accent `#DF7BB6`, bg `#EAEAEA`, asymmetric signature radii like `--nl-r-cta: 30px 2px 30px 2px` — physical values, never logical-ize) and self-hosted Borna display fonts (`public/fonts/`, `@font-face` in `src/styles/fonts.css`: B Arshia for section titles, B Baran for the hero H1; single Regular weight only). `HomePage` mounts `LandingHeader → Hero → GallerySection → ProductsSection → FeaturesSection → TestimonialsSection → BlogSection → LandingFooter`; `PublicLayout` suppresses the global Header/Footer on `/` (D1 scoping — old Immersive Boutique chrome still serves products/blog/detail). Pure landing helpers (`topProducts`/`priceView`/`postMeta`/`rotateSlides`) live in `src/lib/redesign.js` with `node:test` coverage (`npm test`). `scripts/landing-qa.mjs` runs the redesign assertion suite (viewport-aware: `vp:"desktop"` assertions skip ≤900px).
- Components in `src/components/<Name>/` (+ `home/`, `admin/` groups) with co-located CSS; pages in `src/pages/` (`admin/` for the panel); shared code in `src/lib/`, data access in `src/services/`, context in `src/context/`, static data/config in `src/data/`. Global CSS entry chain (imported in `main.jsx`): `styles/fonts.css` → `styles/global.css` → `styles/ui-polish.css` → `styles/premium-storefront.css` → `styles/landing.css` → `pages/CheckoutLayout.css`.
- **Plain CSS only.** Visual language is **"Immersive Boutique"** — pink→purple/wine gradient mesh + glassmorphism. Canonical: `design-briefs/redesign-B-immersive-boutique.md` + `mockup-B.html`. The black+gold palette was rejected — don't reintroduce. Design tokens are CSS custom properties in `:root` (`global.css`); reuse them, don't hardcode hex.
- **RTL everywhere** (`dir="rtl" lang="fa"`). Use logical properties (`inset-inline-*`, `margin-inline-*`) in new CSS. Fonts: Vazirmatn (body), Playfair Display only for `.num` price numerals — `formatPrice` intentionally emits Latin digits.
- **Framer Motion owns hover-lift**: inside `MotionCard`, remove `transform` from the card's CSS `:hover` (CSS may only adjust shadow/border). Motion toolkit: `src/lib/motion.jsx`. All motion must respect `prefers-reduced-motion`.
- z-index ladder (leave alone): drawer 1002 > header/lightbox 1000 > cart-feedback 980 > ChatWidget 900 > ScrollToTop 899 > scroll-progress 200.
- Icons from `react-icons` only — never emoji as icons.
- Blog/article bodies are Markdown via `react-markdown` + `remark-gfm` (`src/lib/markdown.jsx`); raw HTML intentionally disabled. Article typography = `.prose` class in `src/pages/Blog.css` (not global.css).
- SEO: build-time `<Head>` via `src/lib/pageSeo.jsx` for pre-rendered pages (the filename is `pageSeo.jsx` to avoid a case-insensitive clash with `seo.js`); `src/lib/seo.js` (`setPageSeo`/`resetPageSeo`) only for client-only routes. Product JSON-LD prices are `price × 10` with `'IRR'`; `aggregateRating` only when real reviewCount > 0. Site-wide JSON-LD lives only in `index.html`.

## CI, scripts, deployment

- Workflows (`.github/workflows/`): `ci.yml` (Node 22: npm ci → `npm audit --omit=dev --audit-level=high` → lint → build), `supabase-edge-check.yml` (deno check), `supabase-db-check.yml` (migration replay + db lint + pgTAP), `landing-lighthouse.yml` (gates: mobile Perf ≥90, a11y/BP/SEO =100, CLS ≤0.1), `landing-visual-qa.yml`, `storefront-smoke.yml`. Dependabot weekly.
- `scripts/`: `gen-sitemap.mjs` (prebuild; domain `VITE_SITE_URL` || `https://nilagol.ir`; never fails), `optimize-assets.mjs` (sharp → WebP + PWA icons), `fetch-images.mjs` (Wikimedia Commons → `public/img/*.webp`), `mgmt-sql.mjs` (needs `SUPABASE_ACCESS_TOKEN`), `lighthouse-summary.mjs`, `landing-qa.mjs` + `storefront-smoke.mjs` (**import `playwright`, which is not in package.json — install ad-hoc to run them locally**), `db-catchup-0014-0019.sql` (idempotent batch catch-up).
- Env vars must be `VITE_`-prefixed; `.env.example` is the template. Contact channels: Telegram / WhatsApp / Bale only — **no phone channel**; an unset channel simply doesn't render. Enamad seal defaults are baked into `src/data/config.js` — the `code` attribute on the seal `<img>` is required by Enamad's domain-verification scanner; keep `VITE_ENAMAD_CODE` in sync with the URLs if overriding.
- `vercel.json`: strict security headers + CSP; `/admin*` gets `no-store` + `noindex`; a single catch-all rewrite makes unmatched URLs (e.g. deleted products) serve `/index.html` with HTTP 200 — a known soft-404 behavior. Vercel needs the Supabase env vars (or the integration) in all environments or the build fails/degrades to fallback data.
- **PWA is REMOVED**: `public/sw.js` is a kill-switch and `index.html` actively unregisters service workers. Do not register SWs or add `vite-plugin-pwa` without an explicit decision.

## Known follow-ups / gotchas

- ZarinPal still runs in **sandbox** until Edge secrets `ZARINPAL_MERCHANT_ID` + `ZARINPAL_MODE=production` (+ `SITE_URL` matching the registered domain) are set. Enamad/gateway steps: `docs/راهنمای-مجوز-و-درگاه-پرداخت.md`. Admin runbook: `docs/auth-production-guide.md`.
- `posts` has **no static fallback**: if Supabase is down during a (non-production) build, blog posts are absent from HTML/sitemap until the next build.
- Account page order cards show the internal DB `id` instead of `public_id` (known bug).
- Persian slugs are URL-encoded in sitemap/prerender paths; ZWNJ/RLM are stripped by `slugify`.
- Client subtotal is advisory only — the DB trigger is the truth. Never trust client-sent amounts anywhere.
