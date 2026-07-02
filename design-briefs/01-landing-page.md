# Nila Gol — Landing Page Design Brief

> A complete, production-ready design brief for the **home / landing page** of Nila Gol (نیلا گل).
> Hand this to a designer or to "Claude Design." It is intentionally prescriptive about strategy, brand,
> and system, and deliberately open about layout invention — you are encouraged to propose a **bold, original,
> best-in-class** design, as long as you honor the brand, the constraints, and the conversion job.

---

## 0. The brief in one sentence

Design the most beautiful, trustworthy, **mobile-first Persian (RTL)** landing page for a premium brand of
**durable, washable, flexible decorative flowers**, whose single job is to turn a first-time visitor into a
**WhatsApp / Telegram order conversation** — because in Iran there is no online card checkout.

Deliver **desktop (1440) and mobile (375)** high-fidelity comps for **every section and every state**, a full
**design-token sheet**, component specs, motion notes, and an image art-direction guide.

---

## 1. Brand snapshot

- **Name:** Nila Gol — نیلا گل ("Nila's Flower"). Tagline in use: «زیبایی پایدار برای خانه شما» (Lasting beauty for your home).
- **Product:** "Russian" flexible flowers — artificial/preserved-style decorative flowers and arrangements that are
  **durable, washable, colour-fast, bendable (formable stems), allergy-free, and last for years.** This is the entire
  value wedge: not fresh-flower romance, but **realism + longevity + reusability + zero maintenance.**
- **Logo (DO NOT REDESIGN — design around it):** a wordmark "NILA GOL" set in an **elegant high-contrast serif**, filled
  with a **left-to-right gradient from violet `#9647C0` to magenta-pink `#E0318C`**, accompanied by a single
  hibiscus/rose mark and a thin stem flourish in the same gradient. The logo IS the brand's colour DNA.
- **Personality:** feminine-premium, romantic, calm, trustworthy, boutique. Not loud, not "discount," not corporate.
- **Market:** Iran. Language **Persian/Farsi, fully RTL.** Currency **Toman.** Audience skews mobile.

---

## 2. The audience & the hard local truths (design must respect all of these)

1. **No online card payment.** Checkout/cart paradigms do not apply. Ordering happens over **WhatsApp, Telegram, and
   phone.** Every "buy" affordance is really a "start a chat" affordance with a **pre-filled message** naming the product.
2. **Trust is earned, not assumed.** Iranian buyers actively fear fake Instagram/Telegram shops and deposit scams.
   The page must radiate legitimacy: the **Enamad e-trust seal** (نماد اعتماد), guarantees, real customer proof,
   transparent pricing, a clear "how to order & pay" explanation.
3. **Social platforms can go dark.** Nationwide internet blackouts happen; owning a real site (installable PWA,
   offline catalog) is a competitive moat — the design should treat the site as the **owned storefront**, with
   social channels as order rails, not the other way around.
4. **Visual product.** The buyer's only question is *"will this look real and expensive in MY home?"* → **photography
   quality is the #1 conversion lever.** Design the page as a stage for large, styled, in-room photography with
   tap-to-zoom for texture.
5. **Price-sensitive but value-driven.** Show Toman prices openly; reframe price as years-of-value via the durability story.

---

## 3. Objectives & success signals

**Primary objective:** maximize **catalog → WhatsApp/Telegram order** starts.

**Secondary:** build trust on first scroll; grow the Telegram channel (owned audience); capture leads (callback form);
make the brand feel unmistakably premium so the same flowers can command a higher price.

**On-page success signals to design toward:** an order CTA visible within one thumb-reach at all times; a hero that
communicates "premium + durable" in <3 seconds; at least three distinct trust proofs above the fold or just below it.

---

## 4. Art direction — the look & feel

**Direction: "Modern editorial botanical luxury."** Think a high-end interior/florist magazine, not an e-commerce grid.

- **Generous whitespace**, confident large type, a strong editorial grid, and **immersive full-bleed photography.**
- The **brand pink→violet gradient is a jewel accent** — used on the logo, primary CTAs, key highlights, active states,
  price emphasis, and small flourishes — **never** as large flat fills or noisy backgrounds. The canvas stays soft and
  near-neutral so the flowers and the gradient pop.
- **Romantic but restrained.** Soft, airy, calm. Avoid clutter, avoid heavy borders, avoid drop-shadow soup.
- **Tasteful cinematic motion:** a slow Ken-Burns hero, gentle scroll-reveal of sections, micro-interactions on cards,
  a full-screen lightbox for photos. All **must respect `prefers-reduced-motion`.**
- **Mood words:** lasting, lush, refined, gentle, real, trustworthy, boutique.
- **Reference feelings (for mood, not copying):** the restraint of Aesop, the editorial warmth of a florist lookbook,
  the softness of a high-end candle/home-fragrance brand, the romance of a preserved-rose boutique.

You MAY propose a distinctly different layout/structure than what is sketched in §6 if it serves the objective better —
but keep the brand colours, the serif+Persian type pairing, RTL correctness, and the WhatsApp-first conversion model.

---

## 5. Design system (define these as tokens)

### Colour
| Role | Value | Notes |
|---|---|---|
| Brand magenta | `#E0318C` | from logo; CTAs, accents |
| Brand violet | `#9647C0` | from logo; gradient end, secondary accent |
| Brand gradient | `linear-gradient(135deg, #E0318C, #9647C0)` | primary buttons, key highlights |
| Ink (text) | `#2A1C2E` | deep plum-black; body & headings |
| Muted text | `#715F6E` | secondary text |
| Canvas | `#FBF7FA` → `#F5ECF3` | soft blush page background |
| Surface | `#FFFFFF` | cards, sheets |
| Border | `rgba(42,28,46,0.10)` | hairline |
| Success (in-stock) | sage `#3F7A63` on tint | availability "موجود" |
| WhatsApp green | `#1FAA59` | **keep** for order buttons (recognisability) |
| Telegram blue | `#2AABEE` | keep for Telegram |

Provide full light-mode tints; verify **WCAG AA (4.5:1 text, 3:1 large/UI).** Use the violet end for text-on-light where
the pink is too light for contrast.

### Typography
- **Display / headings:** a high-contrast serif that echoes the logo — Latin: **Playfair Display** (or Cormorant Garamond).
  For Persian headings, pair Vazirmatn 800 (or propose a refined Persian display face). Use the serif for the wordmark,
  large numerals, and prices (Latin numerals look editorial in Playfair).
- **Body / UI:** **Vazirmatn** (Persian, already the brand font), weights 300–800.
- **Type scale (suggest):** 13 / 14 / 16 (base) / 18 / 22 / 28 / 36 / 48 / 64. Line-height 1.6 body, 1.25–1.4 headings.
- **Prices** use tabular numerals; format Toman with thousands separators.

### Spacing, radius, elevation
- 4 / 8 px spacing system; section vertical rhythm 80–120px desktop, 56–72px mobile.
- Radius: cards `18px`, controls `14px`, pills `999px`.
- Shadows: soft, **plum-tinted**, low-spread (e.g. `0 6px 20px rgba(74,30,64,.07)`); one consistent elevation scale.

### Iconography
- **Line SVG icons only** (Lucide or Font Awesome), one consistent family/stroke. **Never emoji as structural icons.**
  Brand-tint the icons (magenta) inside soft tinted chips.

### Motion principles
- Micro-interactions 150–300ms, ease-out in / ease-in out; entrances stagger 30–50ms.
- Hero: 18–22s Ken-Burns scale. Cards: lift + image cross-fade/zoom on hover/press. Sections: fade-up on scroll.
- **Always** gate behind `prefers-reduced-motion`.

### Photography art-direction (critical — this brand lives or dies on imagery)
Every product/gallery image set should include, by convention: **(a)** a clean studio shot on a soft neutral,
**(b)** a **macro detail** showing petal texture/realism, **(c)** a **styled in-room** shot (on a console, beside a sofa,
on a dining table, in an Iranian living space). Consistent warm-soft white balance, gentle depth of field, no harsh
shadows. Design placeholders that gracefully degrade when a real photo is missing.

---

## 6. The landing page, section by section (RTL, top → bottom)

> For each section give: **desktop (1440)** and **mobile (375)** layouts, copy slots, data source, interactions, motion,
> and empty/loading states.

### 6.1 Header / top bar
- Logo (right in RTL), primary nav (about, features, gallery, products, how-to-order, contact), and a **persistent
  primary CTA pill** ("مشاهده محصولات" / "سفارش"). Slim, translucent, blurs on scroll; active link uses brand gradient.
- **Mobile:** logo + hamburger; full-screen menu sheet; CTA pinned.
- Include the **Enamad seal** small in the header OR a thin trust bar directly under it.

### 6.2 Hero (above the fold) — the 3-second pitch
- Full-viewport, **cinematic styled photograph** of a signature arrangement in a beautiful room (Ken-Burns).
- Editorial stack: small gold/violet **eyebrow**, a large serif **headline** (the durability promise, e.g.
  «زیباییِ ماندگار، بدون پژمردگی»), a one-line subhead, then **two CTAs**: primary gradient "View the collection" and a
  ghost "How ordering works." A subtle trust hint ("ضمانت دوام • ارسال سراسری • نماد اعتماد").
- **Mobile:** image as backdrop with a legible scrim; headline ~32–40px; full-width primary CTA.

### 6.3 Trust bar (immediately under hero)
- A slim band of 4 proofs with line icons: **Enamad seal**, quality/durability guarantee, 7-day exchange/return,
  free styling consultation. This is the legitimacy handshake — keep it elegant, not busy.

### 6.4 The durability story / "Why Nila Gol"
- A short editorial block (image + text, alternating on desktop) that reframes price as value: **lasts years, washable,
  colour-fast, formable, allergy-free.** 3–5 benefit points with refined line icons. This is the brand's unique argument —
  give it room and beautiful supporting macro photography.

### 6.5 Featured collection / bestsellers
- A horizontally-scannable row or refined grid of **3–6 featured product cards.** Card = large image (with hover
  cross-fade to the in-room shot), category chip, name, Toman **price** (serif numerals, strikethrough if on sale),
  availability badge, and an order affordance. Cards link to the product detail page.
- A "ویژه" (featured) ribbon and a "٪ تخفیف" badge where relevant. "View all products" link to the catalog.

### 6.6 Shop by occasion / collection
- Visual entry points (image tiles) for occasions and rooms: **Yalda, Nowruz, wedding, gift under X, living room,
  entryway, office/café decor.** Each tile is a styled photo with a label; tap → filtered catalog/landing.
- This is both merchandising and SEO (occasion landing pages). Design the tile system to scale.

### 6.7 Gallery — "styled in real homes"
- A masonry/justified gallery of real arrangements in real spaces. **Tap → full-screen lightbox** with swipe + zoom for
  texture. This is the proof-of-realism engine; make it generous and beautiful. Hides gracefully when empty.

### 6.8 Social proof / customer wall
- Testimonials with **star rating, customer name + city, short quote, and (ideally) a customer photo** of the flowers in
  their home. Optionally screenshots of thank-you messages. Include an average-rating summary. Design an "add your review"
  affordance (moderated). Hides when empty.

### 6.9 How to order & pay (no-card explainer)
- A clean **3–4 step** visual: 1) pick a product, 2) tap WhatsApp (message is pre-filled with the product name),
  3) confirm by card-to-card or pay-on-delivery, 4) we pack & ship with a tracking code. Removes the #1 hesitation
  ("how do I even buy this without a payment gateway?").

### 6.10 Lead capture / contact
- A warm **callback / consultation** block: name, phone (required), short message, plus prominent
  **WhatsApp / Telegram / phone** buttons and business hours. Free styling-consultation offer. Saves the lead.
- Also surface a **"join our Telegram channel"** CTA (owned audience / blackout resilience).

### 6.11 Footer
- Brand blurb, quick links, contact, **Telegram/WhatsApp/phone**, the **Enamad seal**, the guarantee trust strip,
  and copyright. Calm, organized, on-brand.

### 6.12 Persistent conversion furniture
- **Floating contact rail** (WhatsApp / Telegram / phone), always reachable.
- **Mobile sticky order bar** that appears after the hero on product contexts (price + one-tap WhatsApp order).

---

## 7. Conversion & marketing mechanics to bake into the visuals

- **Per-product WhatsApp deep link** with a pre-filled Persian message naming the product (`wa.me/<number>?text=…`).
  Design the order buttons to make this the path of least resistance everywhere.
- **Enamad seal** rendered as the official verifiable badge (image + link) wherever trust is needed.
- **Occasion/seasonal campaigns** (Yalda, Nowruz, Valentine, Mother's Day) as reusable hero/landing variants.
- **Telegram channel growth** CTA (header, post-inquiry thank-you, footer).
- Honest, real **scarcity/availability** signals only (in-stock / made-to-order / sold-out) — never fake timers.

---

## 8. Responsive & RTL

- Mobile-first. Breakpoints **375 / 768 / 1024 / 1440.** No horizontal scroll. Fluid type via `clamp()`.
- **RTL-correct everything:** logical properties, mirrored layouts, right-aligned text, correct icon/cta placement.
- Touch targets ≥ **44×44px**; comfortable spacing; thumb-reachable primary CTA.

## 9. Accessibility & quality bar (WCAG AA)

- Text contrast ≥ 4.5:1 (3:1 large/UI). Visible focus rings. Full keyboard nav. Descriptive alt text & aria-labels.
- Sequential headings. Colour never the sole signal. **`prefers-reduced-motion`** fully honored. Forms: visible labels,
  inline errors, success feedback, correct mobile keyboards (`tel`).

## 10. Production / technical context (so the design maps cleanly to the build)

- **Stack:** React 18 + Vite SPA, **plain CSS with design tokens** (CSS custom properties), Vazirmatn via Google Fonts,
  react-icons. Backend **Supabase** (products, gallery, reviews, inquiries; image storage); deploys to **Vercel**.
- **Performance:** WebP/AVIF responsive images, lazy-load below the fold, reserve image dimensions (CLS < 0.1),
  good LCP. The site is an **installable PWA with an offline catalog** (blackout resilience) — design an app icon,
  splash, and an "installable/offline" sensibility.
- **SEO:** per-page `<title>`/meta/OG + **Product / LocalBusiness JSON-LD**; clean URLs; sitemap.
- Data is dynamic (Supabase), so design **empty / loading / error** states for every data-driven section
  (catalog, gallery, reviews) — never a broken or blank block.

## 11. Deliverables expected from the designer

1. **Desktop (1440)** and **mobile (375)** comps for the full landing page and **every section in §6.**
2. **All component states:** default / hover / pressed / focus / disabled / loading / empty / error.
3. A **design-token sheet** (colour, type, spacing, radius, shadow, motion) ready to translate to CSS variables.
4. **Component specs** for: header, hero, trust bar, product card, occasion tile, gallery cell + lightbox, testimonial
   card, how-to-order step, lead form, footer, floating rail, mobile sticky order bar.
5. A short **motion spec** (durations, easings, scroll-reveal, hero, lightbox) with reduced-motion fallbacks.
6. A 1-page **photography/art-direction guide** (shot list, treatment, do/don't).
7. (Optional, encouraged) **one bold alternative hero direction** to compare.

## 12. Constraints — do & don't

**Do:** keep the logo as-is; derive all colour from the logo's pink↔violet; keep WhatsApp green / Telegram blue for those
order rails; use line SVG icons; keep it fast, RTL-correct, and accessible; design every data state.

**Don't:** redesign or recolor the logo; use emoji as icons; use large flat brand-colour fills or noisy gradient
backgrounds; add a cart/checkout (there is none); rely on hover-only interactions; introduce a second accent colour
outside the brand pink/violet (sage green is allowed only as the "in-stock" semantic).

---

## 13. Production scope — what the finished site will include (feature inventory)

So everyone is aligned on what "production" means, the full site (beyond this landing page) includes:

- **Public:** Home/landing (this brief), Products catalog (category filter, sort, featured-first), **Product detail pages**
  (multi-image gallery + lightbox zoom, price + sale price, availability, spec/benefits, multi-channel order, related
  products, reviews), Gallery, How-to-order, Reviews/social-proof, Contact + lead form.
- **Conversion furniture:** per-product WhatsApp/Telegram/phone ordering with pre-filled messages, floating contact rail,
  mobile sticky order bar, Enamad trust seal, guarantee trust strips.
- **Admin panel (`/admin`, self-service for a non-technical owner):** secure login; **products** CRUD with multi-image
  upload, price + sale price, availability, featured/active toggles, ordering; **gallery** manager; **reviews** moderation;
  **inquiries/leads** viewer. (Roadmap: lead pipeline with one-tap WhatsApp reply, editable site settings, drag-reorder.)
- **Platform:** Supabase backend with RLS security, **PWA (installable + offline catalog)**, WebP image pipeline,
  SEO (meta + JSON-LD), Persian RTL throughout, Vercel hosting.
- **Roadmap (next):** bundles/sets & gift packaging, occasion gift-guide landing pages, B2B/bulk inquiry flow,
  multi-product "order list → one WhatsApp message," editorial lookbook / shop-the-room scenes.

---

### Final note to the designer
This brand wins by looking **more premium and more trustworthy** than the Instagram shops it competes with, while making
**ordering frictionless over chat.** Lead with photography and the durability story, prove legitimacy early, keep the
canvas calm so the pink↔violet brand and the flowers sing, and make "order on WhatsApp" the easiest thing on the page.
Be ambitious — this should look like the best decorative-flower brand in the country.
