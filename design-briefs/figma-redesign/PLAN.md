# Work Breakdown Plan — Pixel-Faithful Landing Redesign (nila_gol)

**Source of truth:** `design-briefs/figma-redesign/` — `desktop-home.png` (1920×6948), `mobile-home.png` (440×9723), `spec-overview.txt`, `spec-deep.txt` (1218 lines), `images/manifest.json` (15 unique images), fonts already at `public/fonts/` (B-Arshia.woff2, B-Baran.woff2 + woff/ttf fallbacks).

**Palette:** bg `#EAEAEA` (flat, no mesh), accent `#DF7BB6`, ink `#252525`, muted `#595959`, footer `#0D0D0D`, star `#E1CB00` / `#E6E6E6@50%`, prev/next muted btn `#99547D`, blog title on image `#E6E6E6`. Fonts: **B Baran** (hero 160/80px), **B Arshia** (section display), **Vazirmatn** (everything else).

---

## 0. Key Decisions (locked)

| # | Decision | Resolution |
|---|----------|------------|
| D1 | **Header/Footer: landing-scoped, not global replacement** | Products/blog/detail pages keep the current «Immersive Boutique» Header/Footer. New `LandingHeader`/`LandingFooter` render inside `HomePage`; `PublicLayout` skips global Header/Footer only when `pathname === '/'`. SSG-safe (pathname static per prerendered route), zero risk, reversible. |
| D2 | **Landing header icons** | Map the two white glyph slots to **cart** + **contact** (WhatsApp/Telegram per config). Hamburger opens a full-screen drawer (nav links + account + theme toggle + channels, styled in design language). |
| D3 | **Images → `public/img/redesign/`** | CSP `img-src 'self'` allows same-origin. Keep existing `src/assets/logo.webp` for header/footer logo; copy the other images with kebab names. |
| D4 | **Tokens: new `--nl-*` namespace in `src/styles/landing.css` — do NOT edit `global.css` `:root`** | Old pages depend on current tokens; parallel namespace = zero regression. |
| D5 | **Pink contrast** | Pixel-faithful `#DF7BB6` for fills/strokes/bands/prices. ONLY the 14px eyebrow chip text uses `--nl-accent-text` (#B44D86) for WCAG. Documented deviation. |
| D6 | **Slide-counter digits** | Latin `1..4` in Vazirmatn (`.num` convention). |
| D7 | **Pure helpers tested via `node:test`** (`tests/redesign.test.js`, `node --test tests/`, package.json `"test"` script). |
| D8 | **Features section copy is static** (verbatim from design); testimonials/products/blog/gallery use live loader data. |

---

## 1. Shared Foundations — WU0 (blocking everything)

| File | Action | Contents |
|------|--------|----------|
| `src/styles/fonts.css` | **new** | `@font-face` for `'B Arshia'` and `'B Baran'` — woff2 primary, woff/ttf fallback, `font-display: swap`. **Verify exact filenames/case** in `public/fonts/` (Vercel is case-sensitive). Import in `main.jsx` **before** `global.css`. |
| `src/styles/landing.css` | **new** | All landing tokens + utilities (below). Imported in `main.jsx` after `premium-storefront.css`. |
| `src/lib/redesign.js` | **new** | Pure helpers: `topProducts(products, n=3)`, `priceView(product)` → `{price, oldPrice|null}` from `price`/`sale_price`, `postMeta(post)` → `{readMinutes, dateShort, category}`, `rotateSlides(slides, active)`. |
| `tests/redesign.test.js` | **new** | `node:test` suites for helpers (write FIRST — red — then implement). |
| `src/components/home/SectionHeading.jsx` | **new** | Eyebrow chip (`r9999`, pad `8px 16px`, gap 8, fill `rgba(223,123,182,.1)`, stroke `1px rgba(223,123,182,.2)`, text 14px/500 `var(--nl-accent-text)`, trailing react-icon) + display title (B Arshia; size prop; supports mixed pink span) + decorative `#DF7BB6@0.2` underline vector (width/height props: 83×2, 41×2, 199×13, 100×7, 70×5). |
| `src/components/home/CtaButton.jsx` | **new** | Signature CTA: `border-radius: 30px 2px 30px 2px` (physical, verbatim), pad `32px 56px`, fill `#DF7BB6`, Vazirmatn SemiBold 24px white + `FaChevronLeft` white. Props: `to`, children. |
| `public/img/redesign/` | **new dir** | Copy from `design-briefs/figma-redesign/images/` per `manifest.json` (match by tree path + dims). Names: `hero-main.jpg` (454×664), `hero-thumb-1.jpg` (128×187), `hero-thumb-2.jpg` (132×187), `explore-circle.jpg` (64×64), `gallery-1.jpg`…`gallery-5.jpg` (5 slots share 3 unique refs — reuse files), `features-mid.jpg` (738×587), `testimonial-pfp.jpg` (64×64), `blog-card-1..4.jpg` (512×640, 1 unique ref → copy ×4). |
| `scripts/landing-qa.mjs` | **modified** | Add `redesign` assertion-suite skeleton (per-section assertions added by each WU). |

**`landing.css` token sheet (authoritative):**

```css
--nl-bg:#EAEAEA; --nl-accent:#DF7BB6; --nl-accent-text:#B44D86;
--nl-ink:#252525; --nl-muted:#595959; --nl-surface:#FFF; --nl-footer-bg:#0D0D0D;
--nl-footer-ink:#E6E6E6; --nl-star:#E1CB00; --nl-star-empty:#E6E6E6;
--nl-btn-muted:#99547D; --nl-btn-muted-ink:#733F5E; --nl-dark-btn:#151515;
--nl-chip-bg:rgba(223,123,182,.1); --nl-chip-border:rgba(223,123,182,.2);
--nl-underline:rgba(223,123,182,.2);
--nl-r-cta:30px 2px 30px 2px; --nl-r-comment:5px 35px 5px 35px; --nl-r-arch:300px 300px 10px 10px;
--nl-r-card:20px; --nl-r-iconbox:16px; --nl-r-pill:9999px; --nl-r-footer:20px 20px 0 0;
--nl-container:1760px;
--nl-font-display:'B Arshia','Vazirmatn',sans-serif; --nl-font-hero:'B Baran','B Arshia','Vazirmatn',sans-serif;
.landing { background: var(--nl-bg); min-height: 100vh; }
.nl-container { max-width:1760px; margin-inline:auto; padding-inline:80px; }
@media (max-width:900px) { .nl-container { padding-inline:16px; } }
```

---

## 2. File-by-File Change List

### New files
```
src/styles/fonts.css
src/styles/landing.css
src/lib/redesign.js
tests/redesign.test.js
src/components/home/SectionHeading.jsx
src/components/home/CtaButton.jsx
src/components/home/LandingHeader/LandingHeader.jsx + .css
src/components/home/Hero/Hero.jsx + .css
src/components/home/GallerySection/GallerySection.jsx + .css
src/components/home/ProductsSection/ProductsSection.jsx + .css + ProductCardNl.jsx
src/components/home/FeaturesSection/FeaturesSection.jsx + .css
src/components/home/TestimonialsSection/TestimonialsSection.jsx + .css
src/components/home/BlogSection/BlogSection.jsx + .css + BlogCardNl.jsx
src/components/home/LandingFooter/LandingFooter.jsx + .css
public/img/redesign/*.jpg
```

### Modified files
```
src/main.jsx                      (import fonts.css before global.css; landing.css after premium-storefront.css)
src/pages/HomePage.jsx            (swap to new sections + LandingHeader/Footer + .landing wrapper; keep Seo + useLoaderData() ?? {}; review ../styles/pdf.css import)
src/App.jsx                       (PublicLayout: pathname !== '/' && <Header/> ; same for <Footer/>; nothing else)
scripts/landing-qa.mjs            (redesign assertions)
package.json                      ("test": "node --test tests/")
AGENTS.md, CLAUDE.md              (docs, WU10)
```

### Deleted files (WU10 only — grep zero importers first)
```
src/components/home/HeroSplit.jsx + .css
src/components/Products/FeaturedProducts.jsx + .css
src/components/Gallery/Gallery.jsx + .css
src/components/Reviews/Testimonials.jsx + TestimonialsBand.css
src/components/home/FeaturesRose.jsx + .css
src/components/home/Magazine.jsx + .css
```
**Protected (shared, must NOT touch):** `Products.jsx`, `ProductCard.jsx`, `Products.css`, `ProductCard.css`, `ProductReviews.jsx`, `Stars.jsx` (may be REUSED), `Reviews/Reviews.css`, `Header/*`, `Footer/*`, `pageSeo.jsx`, `seo.js`.

---

## 3. Work Units & Integration Order

WU0 (solo, first) → WU1–WU8 parallel (each owns one component dir; zero overlap) → WU9 integration (solo) → WU10 cleanup (solo).

HomePage order: `LandingHeader → Hero → GallerySection → ProductsSection → FeaturesSection → TestimonialsSection → BlogSection → LandingFooter`. Section ids: `hero, gallery, products, features, testimonials, blog` (hash-anchor compat with ScrollToHash).

---

## 4. Per-Section Spec Sheets

All sizes **desktop @1920 / mobile @440**. Text verbatim from spec files (Persian incl. ZWNJ). Icons via react-icons only.

### WU1 — LandingHeader
- Desktop bar 1760×62 **transparent over hero** (hero panel shows through): hamburger (two 40×2 white lines) + cart icon + contact icon (white); **logo 133×62 far end**. No nav links on the bar.
- Hamburger → full-screen drawer (z-index 1002 — same slot as current drawer): nav (خانه/محصولات/مجله/روش خرید/حساب کاربری), cart, theme toggle, contact channels; focus-trap + Escape + scroll-lock (copy a11y pattern from current `src/components/Header/Header.jsx`).
- Mobile bar: hamburger (33px `#252525` lines) + logo 96×45. Non-sticky per design.

### WU2 — Hero (`landing` frame, 1920×1080)
- Desktop split: **right = copy col (813px)**, **left = pink gradient panel (768px)**. Panel: `linear-gradient` `#DF7BB6@0 → #EAEAEA@1` (pink at outer/left edge fading to page bg toward right — verify against desktop-home.png); floral sketch vectors `#000 @3%`.
- H1: `'B Baran'` **160px/lh160** w400 `#252525` right-aligned: «زیبایی گل طبیعی بدون پژمردگی» + pink underline vector 549×13 `rgba(223,123,182,.2)`. Subtitle Vazirmatn Medium 24px `#252525` (verbatim spec text).
- «explore more» row: text 16px + line + **circle 64×64 r50** `explore-circle.jpg`. → `/products`.
- Panel copy: «لیلیوم های سفید» B Arshia 40px `#EAEAEA` + 64px white rule; body Vazirmatn 16px `#EAEAEA` (verbatim).
- **Slide counter**: 4 slots; inactive 30×30 (outer r20 pad 5, inner 20×20 r17.5) text 12px/500 `#737373`; **active 32×32 r50 stroke `#DF7BB6` 0.75px, inner fill `#DF7BB6`, text 12px/900 white**; gap 2.5px; RTL order (1 rightmost); Latin digits; click advances main image (queue rotation like current HeroSplit).
- Main pic 454×664 (FIT) live `products[].image_url` fallback `hero-main.jpg`; thumbs 128×187 ×2 (second arch `--nl-r-arch`).
- Mobile: menu bar → title B Baran **80px centered** → sub 16px → vector 262×15 → explore → pic 408×596 → dots → **4 thumbs 90×131 r[10,10,300,300]**, active stroke `#DF7BB6` 2px.

### WU3 — GallerySection (`collection`)
- Heading: chip «گالری نیلا» + gallery icon; title B Arshia **64px** (mobile 48px centered); sub 24px `#595959` (mobile 16px); underline 83×2. Title: «فضاهایی که با یک جزئیات تغییر می‌کنند.»
- Desktop grid 1760×664 gap 32: col 621px (2×621×316 stacked) + col 454px (1×454×664 tall) + col 621px (2×621×316). **Square corners**. Live `gallery[]` first (max 5), fallback `gallery-*.jpg`.
- Mobile: 5 stacked images 408 wide (heights ratio 324/324/597/324/324), gap 20.
- Lightbox out of scope.

### WU4 — ProductsSection
- Heading: chip «محصولات نیلا» + flower icon; title 64px **mixed pink span** («زیبایی ماندگار،» ink + «همیشه سبز» `#DF7BB6`); sub 24px `#595959`; underline 41×2.
- Cards ×3 (565px desktop / 408 mobile, gap 32/40). Data: `topProducts(products, 3)`.
- Image: desktop 565×664 FIT aspect-ratio (w/h attrs, CLS); **mobile arch `--nl-r-arch`**; desktop square corners.
- Detail row (pad 32 gap 16): name 32px/500 `#252525` (mobile 24). Price row: «/ شاخه» 16px/800 `#595959` + toman icon 28×28 `#DF7BB6` + price `formatPrice(sale_price ?? price)` 32px/800 `#DF7BB6`.
- **Sale badge** (sale_price): old price 12px white, strikethrough @50%, on dark pill (check render for backdrop). Non-sale variant: grey old-price 16px `#595959` strikethrough.
- Image-overlay circle buttons 64×64 r90 fill `#DF7BB6`, shadow `4px 0 0 rgba(0,0,0,.25)` (x-offset, RTL-authored), white glyphs, gap 24, bottom-center over image. Wire same interactions as current FeaturedProducts/ProductCard (product link + WhatsApp via `lib/order.js` + useCart).
- CTA «مشاهده محصولات» → `/products`; mobile full-width.

### WU5 — FeaturesSection («چرا نیلاگل؟»)
- Heading: chip «چرا نیلاگل؟»; title B Arshia **128px** (mobile 80px centered); underline 199×13.
- Desktop grid 526fr/664fr/506fr: left 2 reasons — mid image 664×552 white frame `--nl-r-arch` (img 738×587) — right 2 reasons. Mobile: reason, reason, image (408×279 arch), reason, reason.
- Reason block: icon box **64×64 r16** fill `rgba(223,123,182,.1)` stroke `rgba(223,123,182,.2)` blur(4px), pink 24px icon; title Bold 24px `#252525`; desc SemiBold 16px `#595959` centered.
- Static copy verbatim: قابل شست‌وشو / ماندگاری بالا / ظاهر طبیعی و باورپذیر / فرم‌پذیر و انعطاف‌پذیر + descriptions.

### WU6 — TestimonialsSection («نظرات شما»)
- Heading: chip «تجربه مشتریان»; title 128px (mobile 80px); underline 100×7.
- **Full-bleed band** `#DF7BB6` (spans viewport, not container), height ≈384 desktop / pad 32px 16px mobile.
- Cards 472×284 / 408×236, `border-radius: 5px 35px 5px 35px` verbatim, white, pad 32. Quote 20px lh31.25 `#252525` (mobile 16px) ~4-line clamp.
- Info row: stars 20px `#E1CB00`/`#E6E6E6@50%` (may reuse `Reviews/Stars.jsx`); name 16px + city 12px; **pfp 64×64 circle** (`photo_url`, fallback `testimonial-pfp.jpg`).
- Data: loader `reviews` (`getApprovedReviews(3)`). Empty → render heading, band empty-safe.
- Prev/next 64×64 r90: first white bg `#252525` arrow, second `#99547D` bg `#733F5E` arrow, shadow `4px 0 0 rgba(0,0,0,.25)`; instant swap (reduced-motion safe). Mobile: 1 card + controls.

### WU7 — BlogSection («مقاله ها و مجله ها»)
- Heading: chip «مجله ها»; title 64px (mobile 48px); underline 70×5.
- Cards ×4 512×640 (gap 20); **mobile horizontal scroll** 194×288 `flex:1 0 194px` scroll-snap.
- Card image `r20` + bottom gradient `linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,.7) 46%, #000 100%)`; live image else `blog-card-N.jpg`.
- Chips over image (pad 8/16 r10 blur 15): read-time + date (fill `rgba(255,255,255,.8)` text `#252525` shadow `10px 0 0 rgba(0,0,0,.1)`); category chip solid white shadow `4px 0 0 rgba(0,0,0,.5)`. Mobile chips: `rgba(21,21,21,.8)` white text 8px.
- Bottom overlay: title Bold 20px `#E6E6E6` 2-line clamp (mobile 12px); «خواندن مقاله» 16px + arrow → `/blog/:slug`.
- Meta: `postMeta(post)` — readMinutes = ceil(words/200) min 1; dateShort = Intl fa-IR `{day:'numeric',month:'long'}`; category fallback «آموزشی». Verify `services/posts.js` select fields first.
- CTA «مشاهده همه» → `/blog`.

### WU8 — LandingFooter
- `border-radius: 20px 20px 0 0`, `#0D0D0D`, pad 64 (mobile 16/64), gap 80.
- Row 1: **logo 469×218** desktop / 302×141 mobile (`src/assets/logo.webp`) + «دسترسی سریع» col (B Arshia 32px `#E6E6E6` + 18px vertical `#DF7BB6` rule; links خانه/محصولات/مجلات/روش خرید و پرداخت/تماس با ما 16px white gap 40) + «راه های ارتباطی» col (3 icon links 32×32 `#E6E6E6` WhatsApp/Telegram/Bale gap 40 — from `config`, unset renders nothing).
- Divider 1px `rgba(255,255,255,.25)`.
- Row 2: **Enamad seal — keep existing `dangerouslySetInnerHTML` enamadHtml block** (the `code` attribute is required by Enamad's scanner); copyright 12px white/50%; **scroll-top 56×56 r10 `#151515`** `FaArrowUp`.
- Mobile: stacked centered; copyright 8px.

---

## 5. Responsive Strategy

- Reference widths: **≥1600 desktop** (container 1760) and **≤440 mobile** (container 408). Desktop↔mobile switch at **900px**. Between: fluid (`clamp()`, `fr/minmax`, aspect-ratio). Fidelity contractual only at the two reference widths.
- Columns as fractions: products `repeat(3, minmax(0,1fr))` aspect 565/664; gallery `621fr 454fr 621fr`; features `526fr 664fr 506fr`; blog 4×`minmax(0,1fr)` / mobile scroll row.
- Collapses at ≤900px per section sheets above.
- Logical properties for symmetric spacing; **physical verbatim** for asymmetric radii + x-offset shadows (Figma authored in RTL).

---

## 6. Verification (every WU)

**Green = `npm run lint` clean + `npm run build` passes + section renders (build prerenders `/`) + any new pure logic tested via `node --test tests/`.**

1. Assertion-first: extend `scripts/landing-qa.mjs` per section BEFORE implementing (presence + Persian text + computed-style spot checks + data-binding).
2. SSG build = integration test (SSR-unsafe code fails build; carousel renders `active=0` server-side).
3. WU9: `npm run preview` + playwright screenshots at 1920 & 440 vs `desktop-home.png`/`mobile-home.png`; fix deltas >4px.
4. CI gates: mobile Perf ≥90, a11y/BP/SEO =100, CLS ≤0.1 — set explicit width/height/aspect-ratio on all images; `fetchpriority="high"` on hero main only; lazy below-fold.

---

## 7. Risk Register (abridged)

| Risk | Mitigation |
|------|-----------|
| SSG loader contract | Loaders untouched; `useLoaderData() ?? {}` + default `[]`. |
| PublicLayout conditional | Pure `pathname === '/'`; verify prerendered `/`, `/products`, `/blog` HTML each has exactly one header/footer variant. |
| Old-page regression | Zero edits to global/ui-polish/premium-storefront.css; `.nl-` scoped classes only. |
| Shared components | Deletion list explicit; grep importers before rm; protected list above. |
| CSP | All assets same-origin; never hotlink Figma URLs. |
| Fonts case-sensitivity | Verify `public/fonts/` filenames exactly; `font-display: swap`; Vazirmatn fallback. |
| RTL | Physical values verbatim; verify gradient direction + radii vs PNGs; test ZWNJ overflow. |
| Motion | `MotionCard` for hover-lift (no CSS transform in :hover); global reduced-motion kill-switch applies; carousels swap instantly. |
| z-index | Drawer 1002; header ≤1000; ChatWidget 900 untouched. |
| Hydration | Deterministic first render; state only in effects/handlers. |
| Enamad seal | Keep enamadHtml block verbatim in LandingFooter. |
| CLS | Explicit dims/aspect-ratios; hero fetchpriority; lazy below-fold. |
| Supabase down at build | Sections render empty-safe (no `.map` on undefined). |

---

## 8. Commit Strategy (each commit build-green)

1. `feat(redesign): landing foundations — fonts, nl tokens, shared primitives, assets`
2–9. `feat(redesign): <section>` per WU
10. `feat(redesign): switch home page to new landing design` (HomePage + App.jsx — the visible change)
11. `chore(redesign): remove superseded home components`
12. `docs: record landing redesign direction in AGENTS/CLAUDE`

*(Commits only on explicit owner request — this plan implements; committing is a separate approval.)*
