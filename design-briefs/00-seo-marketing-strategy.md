# Nila Gol — SEO & Marketing Strategy (Gorgan, Iran)

> The owner's #1 priority. Synthesised from a 6-specialist research pass (local SEO, technical SEO,
> Persian keywords/content, Iranian marketing, off-page/directories, measurement). Every claim is
> grounded in current Iran-specific sources. **This is the master plan; the page design briefs build on it.**
>
> **Status note (updated after implementation):** this strategy was written before the SSG/cart/payment work landed.
> Treat the current implementation in `CLAUDE.md` as authoritative: the site is now pre-rendered with
> `vite-react-ssg`, has a real cart/checkout, and supports online ZarinPal payment in addition to COD/chat ordering.

**Business facts that drive everything below**
- Brand: **Nila Gol (نیلا گل)** — durable, washable, flexible decorative "Russian" flowers (last years; NOT fresh).
- Location: **Gorgan (گرگان), Golestan province.**
- Fulfillment: **Inside Gorgan → own door-to-door delivery + pay-on-delivery (COD).** **Other cities → post (پست).**
- Ordering: website checkout with **online ZarinPal payment**, **COD in Gorgan**, plus WhatsApp / Telegram / phone with pre-filled messages.
- Stack: React 18 + Vite, **statically pre-rendered via `vite-react-ssg`**, plain CSS, Supabase, Vercel, Persian RTL, PWA.

---

## 0. The big picture (read this first)

1. **You will NOT win on Google alone — Google is crippled in Iran.** Google Business Profile is sanctioned/blocked;
   Google Analytics gets Iranian properties wiped. So the local-search battle is fought on **Neshan (نشان) and Balad
   (بلد)**, and the measurement stack must avoid GA4.
2. **Rendering is now fixed; keep it from regressing.** Public routes are pre-rendered to real HTML with
   `vite-react-ssg`; keep product/blog/how-to pages in the SSG route list and avoid moving SEO-critical content behind
   client-only effects.
3. **Your unfair local advantage is "door delivery + pay-at-door in Gorgan."** It kills scam fear (customer sees the
   product before paying) and is pure local-intent gold. Put it in H1s, meta, schema, Instagram bio, everywhere.
4. **Local + long-tail keywords are the fast wins;** head terms («گل مصنوعی») are a long game.
5. **Marketing reality:** Instagram is the storefront, **Telegram is your blackout insurance** (Iran had a ~2,093-hour
   internet blackout in 2025), DM response under **30 minutes** is non-negotiable, and the **Enamad trust seal** is what
   wary Iranian buyers look for.

---

## 1. Technical SEO — maintain pre-rendering (P0, biggest lever)

**Original problem:** client-side rendering. In 2026 Google *can* render React but on a delayed second-wave queue
(hours→weeks), **Bing recommends pre-rendered HTML and has a small JS budget**, and many AI/search crawlers execute
little or no JS.

**Current status:** this has been addressed. The build uses `vite-react-ssg`; public marketing/product/blog routes ship as
real HTML, while cart/checkout/account/admin remain client-only by design.

**Current implementation — keep `vite-react-ssg` (static pre-render). Do NOT migrate to Next.js without a separate reason.**
- This catalog now has both chat ordering and a live cart/checkout; SEO-critical pages still get nearly all SSR benefits
  from **build-time static HTML** while keeping the Vite/plain-CSS/Supabase stack.
- `vite-react-ssg` reuses the `react-router` data routes; its async `includedRoutes` hook fetches product and post slugs
  from Supabase at build time and pre-renders each `/products/:slug` and `/blog/:slug`. Fallback data keeps the build safe
  when public catalog reads fail.
- Trigger rebuilds on catalog edits: a **Supabase DB webhook → Vercel Deploy Hook** on `products` insert/update, so the
  owner's admin changes regenerate static pages automatically.

**Per-route meta (implemented):** `src/lib/pageSeo.jsx` uses the SSG `<Head>` integration to bake titles, descriptions,
canonical URLs, Open Graph, Twitter cards and JSON-LD into the pre-rendered HTML. `src/lib/seo.js` remains for client-only
routes. `<html lang="fa" dir="rtl">` is already correct.

**Structured data (JSON-LD, injected via SSG `<Head>`/static HTML):**
- **FloristStore** (LocalBusiness subtype) sitewide: name, Gorgan `address` (PostalAddress, addressRegion "استان گلستان",
  postalCode), `geo` lat/lng, `telephone`, `openingHoursSpecification`, `areaServed` (گرگان + "ارسال به سراسر کشور"), `priceRange`.
- **Product** per detail page: `name`, `image[]`, `description`, `brand`, `offers{ price, priceCurrency:"IRR",
  availability }`. ⚠️ **Prices are stored in Toman — multiply ×10 to Rial for `IRR`, or the value is 10× wrong.** Price must be > 0.
- **BreadcrumbList**, **Organization**, **WebSite + SearchAction**, **FAQPage** on `/how-to-order`.

**Sitemap & robots:** generate `sitemap.xml` at build time from the same route/slug list (add `lastmod` from
`products.updated_at`); add `public/robots.txt` with `Allow: /`, **`Disallow: /admin`**, and the sitemap URL. Never ship `noindex`.

**URLs:** `/products/:slug` is implemented with a unique `slug` column; numeric ids should only remain as internal or
fallback references, never as the primary public URL.

**Core Web Vitals:** SSG fixes the biggest LCP risk (content no longer waits on JS). Also: real favicon (not the heavy
`/pwa-192.png`), `preconnect` to `fonts.gstatic.com` + `*.supabase.co`, hero `<img>` explicit width/height +
`fetchpriority="high"`, lazy-load gallery. WebP is already done.

**Index hygiene:** register **Google Search Console** + **Bing Webmaster Tools** (Bing = priority for Iran); submit sitemap.

---

## 2. Local SEO — own Gorgan (P0/P1)

> Google Maps is weak in Iran; **Neshan + Balad are where Iranian "near me" searches actually happen.**

**Must do now (week 1–2):**
1. **Lock your NAP** (Name / Address / Phone) — one exact Persian form (نام، نشانی کاملِ گرگان شامل خیابان/پلاک/کد پستی،
   یک شماره). Use it **byte-for-byte identically everywhere** (site, maps, directories). Inconsistent NAP is the #1
   local-ranking killer.
2. **Neshan (نشان)** — free: add the place, then submit «مدیریت کسب‌وکار» to claim ownership + earn the **blue tick**
   (unlocks hours, category, photos, phone, website). Category: گل‌فروشی / لوازم تزئینی.
3. **Balad (بلد)** — free, via `business.balad.ir` («کسب‌وکار خود را اضافه کنید»); owner name + کد ملی must match ID.
4. **Google Maps** — you can't run a full GBP from Iran, but use **"Add a missing place / افزودن مکان"** (submit from an
   account with some Local Guide activity, fill every field). It's your only Google-map presence.
5. **Divar (Gorgan) + Sheypoor (Golestan)** business/product listings — huge local reach + NAP citations.

**On-page local signals (week 3–6):**
6. **Florist/LocalBusiness JSON-LD** with the Gorgan address/geo/hours/areaServed (mirror Neshan exactly).
7. **Dedicated `/contact` (تماس و آدرس) page** with an **embedded Neshan map** (Google embeds are unreliable in Iran),
   full address, hours, phone, and an H1 like **«خرید گل مصنوعی در گرگان»**.
8. **Weaponise fulfillment in copy + schema + meta:** **«ارسال درب‌منزل با پرداخت در محل، ویژه گرگان»** and **«ارسال
   پستی به سراسر کشور»** in H1/intro/meta. This is local-intent gold — own it.

**Local keyword targets** (titles, H1s, alt text, product copy):
گل مصنوعی گرگان · گل روسی گرگان · خرید گل مصنوعی در گرگان · گل انعطاف‌پذیر گلستان · گل‌فروشی گرگان · فروش گل مصنوعی گلستان ·
گل مصنوعی لوکس گرگان · گل تزئینی گرگان · سفارش گل آنلاین گرگان · ارسال گل درب منزل گرگان · بهترین گل‌فروشی گرگان.

**Reviews:** after each delivery, message the customer (WhatsApp/Telegram) asking for a نظر/امتیاز on **Neshan/Balad** —
recent local-review volume is the strongest non-Google signal you control.

---

## 3. Keywords & content (P1)

**Priority order of clusters (attack in this sequence):**
1. **Local (LOW competition, fastest wins):** گل مصنوعی گرگان، خرید گل مصنوعی گرگان، گل مصنوعی گلستان، گل آرایی گرگان.
2. **Long-tail product (MED, best ROI):** دسته گل مصنوعی، شاخه گل مصنوعی، گل رز مصنوعی، گل مصنوعی پایه‌دار، باکس گل مصنوعی، گل مصنوعی برای گلدان.
3. **Occasion (seasonal spikes — publish 4–6 weeks early):** گل یلدا، گل مصنوعی شب یلدا، گل نوروز، گل مصنوعی عروسی، گل مصنوعی دکوراسیون، گل هدیه.
4. **Buyer-intent (MED-HIGH):** خرید گل مصنوعی، قیمت گل مصنوعی، گل مصنوعی لوکس/باکیفیت، گل مصنوعی ارزان.
5. **Head terms (HIGH, long game):** گل مصنوعی، گل روسی، گل انعطاف‌پذیر، گل لمسی. (Anchor «گل روسی» — lower comp, brand-defining.)

**Information architecture (hub-and-spoke for topical authority):** home (brand hub) → `/products` with category facets
(رز · دسته‌گل · شاخه‌ای · گلدانی · باکس) → `/products/[slug]` → occasion hubs (`/یلدا /نوروز /عروسی /دکوراسیون`) → `/گرگان`
local landing → `/وبلاگ`. Every blog post links **up** to ≥2 category/occasion hubs with exact-match Persian anchors;
products cross-link «محصولات مرتبط».

**Content plan (14 pieces — title · target keyword):**
1. گل مصنوعی یا طبیعی؟ مقایسه کامل · *گل مصنوعی بهتر است یا طبیعی* (link-magnet)
2. راهنمای خرید گل مصنوعی باکیفیت · *خرید گل مصنوعی باکیفیت*
3. گل روسی چیست و چرا ماندگار است؟ · *گل روسی*
4. چطور گل مصنوعی را تمیز و نگهداری کنیم · *نگهداری گل مصنوعی* (durability USP)
5. گل مصنوعی برای دکوراسیون پذیرایی · *گل مصنوعی دکوراسیون*
6. خرید گل مصنوعی در گرگان (ارسال درب منزل) · *گل مصنوعی گرگان* (local)
7. گل مصنوعی شب یلدا · *گل یلدا* (seasonal)
8. گل مصنوعی برای عید نوروز · *گل نوروز* (seasonal)
9. گل مصنوعی برای عروسی و مجالس · *گل مصنوعی عروسی*
10. قیمت گل مصنوعی چقدر است؟ · *قیمت گل مصنوعی*
11. تفاوت گل لمسی، سیلیکونی و معمولی · *گل لمسی*
12. بهترین گل مصنوعی برای هدیه · *گل هدیه*
13. مزایای گل مصنوعی شوینده و ماندگار · *گل مصنوعی ماندگار*
14. چیدمان گل مصنوعی در خانه (آموزش تصویری) · *چیدمان گل مصنوعی*

**On-page Persian formulas:**
- **Title (≤60):** `{کلیدواژه} | {مزیت} – نیلا گل` → «خرید گل روسی ماندگار و شستشوپذیر | نیلا گل گرگان».
- **H1:** one per page, human-readable target phrase (≠ title).
- **Meta (~155):** keyword + local hook + CTA → «گل مصنوعی لوکس و ماندگار نیلا گل در گرگان؛ ارسال و پرداخت درب منزل. همین حالا سفارش دهید.»
- **Image alt (every image):** descriptive Persian, keyword-bearing → `alt="دسته گل رز مصنوعی قرمز ماندگار نیلا گل"`.
- **Product descriptions:** ≥150 **unique** Persian words each (material، ماندگاری، ابعاد، کاربرد + 1 long-tail). Never
  duplicate copy across SKUs — thin/duplicate text is the top Persian e-commerce ranking killer.

**Research methods (paid tools are sanctioned):** Google autocomplete + «جستجوهای مرتبط», **Google Trends (region=Iran)**
for seasonality, **GSC Performance** for real queries once live, and Iranian tools (KWRank etc.).

---

## 4. Off-page, directories, marketplaces & trust (P1)

**Order of operations:** Enamad (bootstrap) → Neshan/Balad + Google Maps → Torob + Basalam → Divar/Sheypoor →
directories → 1 رپورتاژ + local press → JSON-LD + GSC.

- **اینماد / Enamad** ([enamad.ir](https://enamad.ir/)) — the e-trust seal Iranians look for; start at the **بی‌ستاره
  (no-star)** tier (≤100 tx / 100M Toman per month). Required by Torob's online path; display the verified badge in the footer.
- **Torob (ترب)** — Iran's price-comparison engine buyers search directly; list to get product+price visibility +
  referral traffic (needs Enamad).
- **Basalam (باسلام)** — natural marketplace for home-decor/handmade; open a غرفه for hosted discovery + a ranking profile.
- **Divar (دیوار) + Sheypoor (شیپور)** — giant classifieds; post products under Gorgan with keyword-rich Persian titles
  («گل مصنوعی مرغوب گرگان»). Free reach; both rank in Google.
- **Business directories (free NAP citations):** کتاب اول (avval.ir), بهترینو (behtarino.com — supports reviews),
  صنف‌یاب (senfyab.com), آدرس‌دان, شهرآگهی (agahi.city); Golestan-local: asnafinfo.com.
- **Backlinks (no spam/PBN):** one quality **رپورتاژ آگهی** on a reputable Persian site > cheap link packs; pitch local
  Golestan news/blogs a "Gorgan small business making durable washable flowers" story; supplier/partner cross-links.

---

## 5. Marketing growth engine (Iran / Gorgan)

**Quick wins (week 1–2, free):**
- **Instagram bio + highlights:** bio = «گل‌های روسی بادوام و قابل شست‌وشو | گرگان 🌸 ارسال و پرداخت درب منزل در گرگان |
  پست به سراسر کشور»; link = the site's pre-filled WhatsApp/Telegram order links. Fixed highlights: گارانتی · نظر
  مشتری‌ها · نحوه سفارش · ارسال گرگان · ارسال شهرستان.
- **Sub-30-minute DM response** with WhatsApp Business **Quick Replies** for price/shipping/guarantee. (Note: WhatsApp
  **catalog is blocked in Iran** → the site's pre-filled order links replace it.)
- **Create the Telegram channel now** and push "our backup is on Telegram" in every post/story — collect the audience
  *before* the next blackout.

**Content & Reels (3/week, post 8–12 & 18–20):**
- **Durability proof (the hook):** washing a flower under the tap, bending the stem, "still new after 2 years" — your
  differentiator vs. fresh flowers.
- **Before/after styling**, **room reveals**, **behind-the-scenes packing of a Gorgan order** (trust). Trend audio.

**Local Gorgan:** partnerships (wedding halls, cafés/offices, décor shops, photographers — durable flowers = no recurring
cost); promote in **local Golestan/Gorgan Telegram channels & Instagram pages**; add the **Telegram location** so brand
searches surface the address; local bazaars/expos.

**Trust + COD as a marketing asset:** headline **«ارسال و پرداخت درب منزل در گرگان»** (see the product before paying) +
Enamad + real reviews + guarantee.

**Bigger bets (month 2–3):** seasonal campaigns (یلدا، نوروز، ولنتاین، روز مادر) with pre-order deadlines; UGC + referral
codes; micro-influencer décor accounts in Golestan.

**#1 lever:** DM speed + a Telegram channel — cheapest, highest-impact.

---

## 6. Measurement & analytics

- **Google Search Console — works for Iran** (free webmaster tool, not a publisher product). Install **first**; verify via
  DNS TXT or `google-site-verification` meta; submit sitemap. Add **Bing Webmaster Tools**.
- **Do NOT use Google Analytics (GA4)** — Google **blocks/wipes Iranian Analytics properties** (sanctions). Use instead:
  **Microsoft Clarity** (free, not sanctioned — heatmaps + recordings) + **self-hosted Umami** (≈2 KB, you own the data),
  and/or Iranian **Metricet / StatsFa**. Install in `index.html`/`main.jsx` and fire a pageview on React-Router
  `location` change (SPA).
- **Conversion tracking:** track the checkout funnel (`add_to_cart`, `begin_checkout`, `payment_start`, `payment_success`)
  plus WhatsApp/Telegram/phone quick-order clicks with a `product_name` param. This shows both checkout conversion and
  which products drive assisted/chat orders.
- **Rank tracking (Persian + Gorgan-local):** Iranian trackers crawling from Iranian IPs — **KWRank, JetSEO, RankFind,
  Segmento**; cross-check with Google Trends + GSC.
- **KPIs:** GSC impressions/position/CTR · rankings for Gorgan + product terms · Neshan/Balad views & calls · **order-click
  rate** · order-clicks per product · Instagram/Telegram referral growth.

---

## 7. The 30 / 60 / 90-day roadmap (sequenced)

**Days 0–30 — Foundations (index + measure):**
1. **Done:** `vite-react-ssg` pre-render + SSG Head metadata via `src/lib/pageSeo.jsx`.
2. **Done:** Product + FloristStore/Organization/WebSite + Breadcrumb + FAQ/Blog JSON-LD (Toman→Rial fix).
3. **Done:** generate **sitemap.xml** + `robots.txt` (Disallow `/admin`); product/blog **slugs**.
4. Verify **GSC + Bing**; submit sitemap.
5. Install **Umami + Clarity**; SPA pageview hook; instrument `*_click` order events with `product_name`.
6. **Enamad** (بی‌ستاره) application; show seal in footer.
7. **Neshan + Balad** business listings + Google Maps add-place; lock NAP.

**Days 31–60 — Content + local:**
8. Persian keyword research → map terms to products/pages; rewrite product copy + alt text (unique, keyword-bearing).
9. Build the **`/گرگان` local landing** + `/contact` with Neshan map; weaponise COD/post copy.
10. Publish 4–6 articles (durability, نگهداری, گل مصنوعی vs طبیعی, occasion pages timed to season).
11. List on **Torob, Basalam, Divar/Sheypoor** + directories (کتاب اول، بهترینو، صنف‌یاب).
12. Seed Neshan/Balad reviews after each delivery; set up rank tracking (~20 keywords).

**Days 61–90 — Authority + scale:**
13. One **رپورتاژ** + local Golestan press/blog links; partner cross-links.
14. Seasonal campaign (next occasion) with pre-order; UTM-tag Instagram/Telegram → site.
15. Review Clarity recordings; A/B the order CTAs; monthly GSC + Umami KPI review; double down on top order-driving products.

---

## 8. Concrete code/build changes this implies (dev checklist mapped to our stack)

These are the engineering tasks the strategy requires (separate from page design):
- [x] Add **`vite-react-ssg`**; move routes to its entry; `includedRoutes` fetches Supabase product/post slugs at build.
- [x] Per-page `<title>`/meta/OG/canonical via `src/lib/pageSeo.jsx` for SSG pages and `src/lib/seo.js` for client-only routes.
- [x] JSON-LD: FloristStore/Organization/WebSite sitewide, Product (Toman→Rial), Breadcrumb, Blog/BlogPosting, FAQ.
- [x] Add **`slug`** column to `products`; route `/products/:slug`; backfill slugs.
- [x] Build-time **`sitemap.xml`** + **`public/robots.txt`** (Disallow `/admin`).
- [ ] **Supabase → Vercel Deploy Hook** for auto-rebuild on catalog edits.
- [ ] Analytics: self-hosted **Umami** + **Clarity**; `track()` wrapper + `*_click` events with `product_name`; SPA pageview hook.
- [ ] CWV: real favicon, `preconnect`, hero `fetchpriority`, gallery lazy-load.
- [ ] Footer: render the **Enamad** verified badge (env-driven slot already exists).
- [ ] `/گرگان` local landing page + `/contact` with embedded **Neshan** map.

---

### One-line takeaway
**Pre-render the site (vite-react-ssg) + win Neshan/Balad + lock NAP + add LocalBusiness/Product JSON-LD + headline the
Gorgan door-delivery/pay-at-door hook + measure with Umami/Clarity (never GA4) — and you will own "گل مصنوعی گرگان" and
build national reach from there.**
