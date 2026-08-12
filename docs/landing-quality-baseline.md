# Nila Gol Landing Quality Baseline

Validated on 2026-08-12 against the production build generated from `main`.

## Design / discovery model

Homepage order:

1. Editorial Hero
2. Product discovery search + category cards
3. Curated featured-product edit
4. Product quality/features
5. Product story / why Russian flowers
6. Lookbook gallery
7. Approved customer testimonials when real data exists
8. Concierge/contact section

The homepage intentionally removes fixed chat/contact widgets so the landing composition has one clear visual hierarchy. Support remains available through the header/navigation and the dedicated contact section.

## Responsive visual QA

Automated Chromium QA runs in both light and dark mode at:

- 360 × 800
- 390 × 844
- 768 × 1024
- 1440 × 900

Required checks:

- no horizontal overflow
- visible hero H1, hero image, and primary CTA
- visible homepage product search
- featured product edit present
- no broken visible images
- interactive targets at least 24 CSS px
- CLS <= 0.1

Current validated visual runs reached CLS `0.000` across the four viewport sizes after the final layout/font work.

## Lighthouse CI baseline

Lighthouse CI runs three times per mode and evaluates the median run.

### Mobile

- Performance: **92**
- Accessibility: **100**
- Best Practices: **100**
- SEO: **100**
- FCP: **1509 ms**
- LCP: **3239 ms**
- TBT: **15 ms**
- CLS: **0.000**

### Desktop

- Performance: **100**
- Accessibility: **100**
- Best Practices: **100**
- SEO: **100**
- FCP: **640 ms**
- LCP: **725 ms**
- TBT: **0 ms**
- CLS: **0.000**

Reference workflow run: `31590696125`.

## Enforced Lighthouse gates

The workflow fails if the median run drops below:

- Performance: 90
- Accessibility: 100
- Best Practices: 100
- SEO: 100
- CLS: 0.1 maximum

## Critical-path / bundle work

The homepage no longer eagerly loads Supabase Auth, support chat, checkout/account/admin routes, or Framer Motion just to render the landing page.

Observed client build after route/auth splitting:

- main app JavaScript: ~312 KB minified / ~103 KB gzip
- main app CSS: ~92 KB minified / ~18 KB gzip
- Supabase client: separate async chunk
- Framer Motion: separate async chunk
- admin/editor/markdown: separate async chunks

Additional render-path work:

- hero image has intrinsic dimensions and high fetch priority
- Google Fonts are non-render-blocking and use `display=optional`
- service-worker registration uses deferred injection
- homepage products/features/gallery are supplied by SSG loader data to avoid post-hydration layout insertion
- static fallback products and gallery use real local imagery; no fabricated review/testimonial fallback is used

## Permanent QA workflows

- `.github/workflows/ci.yml` — install, lint, production build
- `.github/workflows/landing-visual-qa.yml` — viewport/light/dark visual QA and screenshots
- `.github/workflows/landing-lighthouse.yml` — mobile + desktop Lighthouse quality gates
