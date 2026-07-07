# Redesign B — "Immersive Boutique"

**Direction for نیلا گل (Nila Gol)** — a cinematic, premium e-commerce visual language for a fully-RTL Persian luxury florist selling durable, washable "Russian" flexible flowers (گل روسی).

> **The big idea.** Treat the brand pink→purple gradient as *light* — a living gradient-mesh that pools behind a deep-wine canvas, with petals drifting through it like dust in a sunbeam. Content lives on glass cards floating above that light. Headlines glow with gradient-text; cards lift and breathe on touch; the product page becomes a slow scroll-told story. Vivid but adult: wine ink + blush porcelain keep it boutique, never bubblegum. Conversion (WhatsApp/Telegram/phone) is always one thumb-reach away via floating + sticky rails.

This document is a **developer-ready, plain-CSS** spec. Every value below is implementable against the existing token system in `src/styles/global.css` and the existing component structure. It **extends** the current tokens — it does not rename the ones already in use (`--accent`, `--accent-strong`, `--accent-2`, `--primary-gradient`, `--shadow-*`, `--radius-*`, `--transition-*`, `--font-display`), so existing components keep working while new surfaces opt in.

---

## 0. Non-negotiables (carried from brand)

- **Logo is sacred.** The pink→purple serif wordmark (`logo.webp`) is never recolored, re-typeset, or placed on a busy area. It always sits on a calm glass/solid patch with ≥ its own height of clear space around it.
- **Palette is pink→purple only.** No gold, no black-as-primary. (The previous black+gold attempt was rejected.) Dark surfaces are *deep wine*, not neutral black.
- **Type:** Vazirmatn for ALL Persian (body + headings, heavy weights for display). Playfair Display ONLY for Latin glyphs/numerals as accents (it cannot render Persian).
- **RTL-first.** Logical properties everywhere (`margin-inline`, `padding-inline`, `inset-inline`, `border-inline-*`). No physical `left/right`.
- **Accessible & performant.** Text contrast ≥ 4.5:1, touch targets ≥ 44px, animate only `transform`/`opacity`, honor `prefers-reduced-motion`, WebP imagery, reserve image boxes (no CLS).

---

## 1. Design tokens — full `:root` set

Drop-in addition to `:root` in `global.css`. Existing tokens are shown (unchanged) where a new token references them; **new tokens are marked `/* NEW */`**.

```css
:root {
  color-scheme: light;

  /* ============ SURFACES ============ */
  /* Warm pink-tinted off-whites — the porcelain canvas */
  --bg:            #fdf7fb;   /* page base (kept) */
  --bg-2:          #f7ecf4;   /* deeper blush for section banding */ /* NEW tone */
  --bg-tint:       #FDF2F8;   /* alt warm wash for alternating bands */ /* NEW */
  --surface:       #ffffff;   /* solid card */
  --surface-2:     #fbf3f9;   /* recessed / inset surface */
  --surface-solid: #fffdfe;

  /* Deep-wine ink family — dark surfaces & strong text */
  --ink:           #2a1c2e;   /* primary text (kept as --text too) */
  --text:          #2a1c2e;
  --wine:          #6b1239;   /* NEW — deep wine for dark sections */
  --wine-2:        #831843;   /* NEW — wine accent / gradient stop */
  --wine-ink:      #4a0f2a;   /* NEW — darkest wine, hero canvas base */
  --muted:         #715f6e;   /* secondary text on light */
  --muted-on-dark: #f3d9e8;   /* NEW — body text on wine surfaces (passes 4.5:1) */

  /* Hairlines & borders */
  --border:        rgba(42, 28, 46, 0.10);
  --border-strong: rgba(42, 28, 46, 0.18);
  --hairline:      #f6d6e6;   /* NEW — soft pink hairline (light surfaces) */
  --hairline-2:    #FBCFE8;   /* NEW — alt pink hairline */
  --hairline-dark: rgba(255, 209, 232, 0.16); /* NEW — hairline on wine */

  /* ============ BRAND ============ */
  --accent:        #d62e8c;   /* magenta-pink (kept) */
  --accent-strong: #b01e74;   /* deeper magenta (kept) */
  --accent-2:      #9647b8;   /* lavender-violet (kept) */
  --accent-2-deep: #7a2f9e;   /* NEW — pressed/active violet */
  --rose:          #e0318c;   /* gradient pink stop (kept) */
  --rose-soft:     #f6c6df;   /* NEW — pale rose for glows/fills */
  --lilac-soft:    #dcbdee;   /* NEW — pale lilac for glows/fills */

  /* ============ GRADIENTS ============ */
  --primary-gradient: linear-gradient(135deg, #e0318c 0%, #9647c0 100%); /* kept — brand spine */
  --primary-gradient-soft: linear-gradient(135deg, #f6c6df 0%, #dcbdee 100%); /* NEW — tints */
  --gradient-text:  linear-gradient(100deg, #e0318c 0%, #b01e74 40%, #9647c0 100%); /* NEW — headline fill */
  --gradient-sheen: linear-gradient(135deg, rgba(255,255,255,0.65), rgba(255,255,255,0.08)); /* NEW — glass top-light */
  /* Cinematic hero mesh — layered radial pools of brand light over wine */
  --mesh-hero:                                                            /* NEW */
    radial-gradient(60% 70% at 18% 12%, rgba(224, 49, 140, 0.55), transparent 60%),
    radial-gradient(55% 65% at 85% 8%,  rgba(150, 71, 192, 0.50), transparent 62%),
    radial-gradient(70% 80% at 70% 90%, rgba(176, 30, 116, 0.45), transparent 65%),
    radial-gradient(50% 60% at 8% 88%,  rgba(220, 189, 238, 0.35), transparent 60%),
    linear-gradient(160deg, #4a0f2a 0%, #6b1239 55%, #831843 100%);
  /* Soft mesh for light bento sections */
  --mesh-soft:                                                            /* NEW */
    radial-gradient(40% 60% at 100% 0%, rgba(224, 49, 140, 0.10), transparent 60%),
    radial-gradient(45% 55% at 0% 100%, rgba(150, 71, 184, 0.08), transparent 60%);

  /* ============ ELEVATION (layered soft shadows) ============ */
  --shadow-soft:   0 6px 20px rgba(74, 30, 64, 0.07);                     /* kept */
  --shadow-medium: 0 14px 38px rgba(74, 30, 64, 0.12);                    /* kept */
  --shadow-hard:   0 26px 60px rgba(74, 30, 64, 0.16);                    /* kept */
  /* NEW — multi-layer "lift" for hover/featured cards (depth, not just blur) */
  --shadow-lift:
    0 2px 4px rgba(74, 30, 64, 0.04),
    0 8px 16px rgba(74, 30, 64, 0.08),
    0 24px 48px rgba(122, 18, 71, 0.14);
  --shadow-float:                                                         /* NEW — floating CTAs */
    0 8px 18px rgba(214, 46, 140, 0.28),
    0 16px 40px rgba(122, 18, 71, 0.22);
  --glow-accent:   0 0 0 1px rgba(214,46,140,0.12), 0 10px 30px rgba(214,46,140,0.20); /* NEW — focus/featured ring */

  /* ============ GLASS / BLUR ============ */
  --glass-bg:        rgba(255, 255, 255, 0.62);   /* NEW — glass on light */
  --glass-bg-strong: rgba(255, 255, 255, 0.78);   /* NEW — chrome/header */
  --glass-bg-dark:   rgba(74, 15, 42, 0.42);       /* NEW — glass on wine/hero */
  --glass-border:    rgba(255, 255, 255, 0.55);    /* NEW */
  --glass-border-dark: rgba(255, 209, 232, 0.22);  /* NEW */
  --blur-sm: 8px;    /* NEW */
  --blur-md: 16px;   /* NEW */
  --blur-lg: 28px;   /* NEW */

  --chrome-bg:     rgba(253, 250, 252, 0.82);
  --chrome-border: rgba(42, 28, 46, 0.08);

  /* ============ TYPE SCALE (fluid, clamp-based) ============ */
  --fs-display: clamp(2.6rem, 7.5vw, 5rem);     /* NEW — hero H1 */
  --fs-h1:      clamp(2.1rem, 5.5vw, 3.4rem);   /* NEW — page titles */
  --fs-h2:      clamp(1.8rem, 4.6vw, 2.6rem);   /* NEW — section titles */
  --fs-h3:      clamp(1.2rem, 2.4vw, 1.5rem);   /* NEW — card titles */
  --fs-lead:    clamp(1.05rem, 2.2vw, 1.35rem); /* NEW — subheads/leads */
  --fs-body:    1rem;                            /* NEW */
  --fs-sm:      0.9rem;                          /* NEW */
  --fs-xs:      0.78rem;                         /* NEW — eyebrows/labels */
  --lh-tight:   1.18;                            /* NEW — Persian display */
  --lh-snug:    1.4;                             /* NEW */
  --lh-body:    1.85;                            /* NEW — Persian body (generous) */

  /* ============ SPACING SCALE (8pt rhythm) ============ */
  --space-1: 0.25rem;  --space-2: 0.5rem;  --space-3: 0.75rem;  --space-4: 1rem;   /* NEW */
  --space-5: 1.5rem;   --space-6: 2rem;    --space-8: 3rem;     --space-10: 4rem;  /* NEW */
  --space-12: 6rem;    --space-16: 8rem;                                            /* NEW */
  --section-y:  clamp(4rem, 9vw, 8rem);  /* NEW — vertical section padding */
  --gutter:     clamp(1.1rem, 4vw, 2rem); /* NEW — page side padding (matches .container) */

  /* ============ RADIUS ============ */
  --radius-xl: 28px;  /* NEW — hero cards, bento tiles */
  --radius-lg: 18px;  /* kept */
  --radius-md: 14px;  /* kept */
  --radius-sm: 10px;  /* kept */
  --radius-pill: 999px; /* NEW */

  /* ============ MOTION ============ */
  --transition-smooth: 220ms cubic-bezier(0.2, 0, 0, 1);   /* kept — micro */
  --transition-slow:   460ms cubic-bezier(0.2, 0, 0, 1);   /* kept — large */
  --ease-out:   cubic-bezier(0.16, 1, 0.3, 1);  /* NEW — expressive enter */
  --ease-soft:  cubic-bezier(0.2, 0, 0, 1);     /* NEW */
  --dur-micro:  180ms;  /* NEW — 150–300ms band */
  --dur-ui:     280ms;  /* NEW */
  --dur-large:  520ms;  /* NEW — 400–600ms band */

  --font-display: 'Playfair Display', 'Vazirmatn', serif;  /* kept — Latin accents only */
  --font-fa: 'Vazirmatn', system-ui, -apple-system, 'Segoe UI', sans-serif; /* NEW */
}
```

**Dark/light note.** The site stays light overall (porcelain). "Dark" = wine surfaces used deliberately for cinematic moments (hero, footer, product sticky bar, occasional bento tile). On any wine surface, body text uses `--muted-on-dark` and headings use white or `--gradient-text`.

---

## 2. Typography system

| Role | Font | Weight | Size token | Line-height | Notes |
|---|---|---|---|---|---|
| Hero headline (fa) | Vazirmatn | 800 | `--fs-display` | `--lh-tight` | Optionally gradient-text; `letter-spacing: -0.5px` (Persian tolerates only slight negative tracking) |
| Page / section title (fa) | Vazirmatn | 800 | `--fs-h2`/`--fs-h1` | `--lh-snug` | Reuse `.section-title`; add gradient-text variant |
| Card title (fa) | Vazirmatn | 700 | `--fs-h3` | `--lh-snug` | |
| Lead / subtitle (fa) | Vazirmatn | 500 | `--fs-lead` | `--lh-body` | `--muted` on light, `--muted-on-dark` on wine |
| Body (fa) | Vazirmatn | 400 | `--fs-body` | `--lh-body` | Generous 1.85 for Farsi legibility |
| Eyebrow / label (fa) | Vazirmatn | 700 | `--fs-xs` | 1 | `letter-spacing: 1.5px`, color `--accent-strong`, often inside a pill |
| Price numerals | Playfair Display | 600 | inherit | — | `.num` class; `font-variant-numeric: tabular-nums` — Latin digits only |
| Latin accents ("Nila Gol", "100%", "24/7", "B") | Playfair Display | 600–700 | contextual | — | Display flourish only; never wrap Persian in it |

**Gradient-text utility** (new, for headlines/numerals):

```css
.text-gradient {
  background: var(--gradient-text);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  /* a11y: keep a solid fallback color for non-clip browsers */
}
@supports not ((-webkit-background-clip: text) or (background-clip: text)) {
  .text-gradient { color: var(--accent-strong); }
}
```

**Rules.**
- Never set Persian in Playfair — it has no Arabic glyphs and will fall through to the serif fallback, breaking rhythm. Wrap only the Latin run: `سفارش از <span class="num">۲۴/۷</span>` etc.
- Persian numerals in body copy are fine in Vazirmatn; use Playfair `.num` only where Latin digits read as a *design accent* (prices, stat counters).
- Eyebrows are uppercase-feel via spacing, not `text-transform` (Persian has no case).

---

## 3. Core component treatments

### 3.1 Buttons

**Primary (magnetic, gradient, lift)** — main CTAs ("مشاهده محصولات", "سفارش در واتساپ").
```css
.btn-primary {
  display: inline-flex; align-items: center; justify-content: center; gap: .55rem;
  min-height: 48px; padding-inline: 1.6rem; padding-block: .9rem;
  border: 0; border-radius: var(--radius-pill);
  font-family: var(--font-fa); font-weight: 700; font-size: 1rem; color: #fff;
  background: var(--primary-gradient);
  box-shadow: var(--shadow-float);
  transition: transform var(--dur-ui) var(--ease-out),
              box-shadow var(--dur-large) var(--ease-out), filter var(--dur-micro);
  position: relative; overflow: hidden;
}
.btn-primary:hover { transform: translateY(-3px); filter: brightness(1.05); }
.btn-primary:active { transform: scale(.97); }            /* tactile press */
.btn-primary:focus-visible { outline: 3px solid var(--accent-2); outline-offset: 3px; }
/* moving sheen on hover (transform/opacity only) */
.btn-primary::after {
  content:""; position:absolute; inset:0; background: var(--gradient-sheen);
  opacity:0; transform: translateX(-60%); transition: opacity var(--dur-ui), transform var(--dur-large) var(--ease-out);
}
.btn-primary:hover::after { opacity:.5; transform: translateX(60%); }
```
*Magnetic option (JS-light, progressive):* on pointer-move within the button, translate it up to ±4px toward the cursor via a CSS custom property; falls back to the hover lift with no JS. Disabled under `prefers-reduced-motion`.

**Secondary (glass outline)** — "داستان محصول", "مشاوره".
```css
.btn-secondary {
  min-height: 48px; padding-inline: 1.4rem; padding-block: .85rem;
  border-radius: var(--radius-pill);
  background: var(--glass-bg); backdrop-filter: blur(var(--blur-sm));
  border: 1px solid var(--hairline);
  color: var(--accent-strong); font-weight: 700;
  transition: background var(--dur-ui), border-color var(--dur-ui), transform var(--dur-micro);
}
.btn-secondary:hover { background: var(--surface); border-color: var(--accent); transform: translateY(-2px); }
.btn-secondary:active { transform: scale(.97); }
```
On wine surfaces: `--btn-secondary` swaps to `background: var(--glass-bg-dark)`, `border-color: var(--glass-border-dark)`, `color: #fff`.

**Channel buttons** (WhatsApp/Telegram/Call): same pill anatomy; WhatsApp keeps the brand gradient (primary action), Telegram/Call use the glass-secondary style with their react-icon. **Never** recolor to platform brand colors — keep the boutique palette so the rail reads as one family.

### 3.2 Glass surface (the workhorse)
```css
.glass {
  background: var(--glass-bg);
  backdrop-filter: blur(var(--blur-md)) saturate(1.2);
  -webkit-backdrop-filter: blur(var(--blur-md)) saturate(1.2);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-soft);
  position: relative;
}
.glass::before { /* top-light hairline for the "real glass" read */
  content:""; position:absolute; inset:0; border-radius:inherit; pointer-events:none;
  background: linear-gradient(180deg, rgba(255,255,255,.5), transparent 30%);
  mix-blend-mode: screen; opacity:.6;
}
.glass--dark { background: var(--glass-bg-dark); border-color: var(--glass-border-dark);
  backdrop-filter: blur(var(--blur-md)); }
```
**Performance guardrails:** cap concurrent blurred layers (≤ ~6 in viewport); never blur a full-bleed scrolling background; promote with `will-change: transform` only while animating; provide a `@supports not (backdrop-filter: blur(1px))` fallback to a solid `--surface` with `--shadow-soft`.

### 3.3 Cards (base + featured)
- **Base card:** `--surface`, `1px solid --hairline`, `--radius-lg`, `--shadow-soft`, padding `--space-5`. Hover: `transform: translateY(-6px)`, `box-shadow: --shadow-lift`, hairline → `--accent` at 30%.
- **Featured card:** swap border for a 1px pink→violet gradient ring (border-image or layered background), add `--glow-accent`, and a "ویژه" badge.
- **Press feedback (mobile):** `:active { transform: scale(.985); }` on the whole card link.

### 3.4 Badges
- **Sale** `٪… تخفیف`: solid `--accent`, white text, `--radius-pill`, `--fs-xs/700`, soft shadow; top-inline-start of the cover.
- **Featured** `ویژه`: glass pill with gradient text + 1px gradient ring; top-inline-end.
- **Availability**: tone variants — `in_stock` (pink-tint bg / `--accent-strong` text), `low` (amber-rose), `sold_out` (muted wine on `--surface-2`). All ≥ 4.5:1.

### 3.5 Forms (Contact)
- Inputs: `--surface-2` fill, `1px solid --hairline`, `--radius-md`, min-height 48px, generous `--space-3` padding, label above (RTL right-aligned).
- Focus: border `--accent`, `box-shadow: var(--glow-accent)`, no layout shift.
- Submit: `.btn-primary` full-width on mobile.
- Validation text inline below field, `--fs-sm`; error tone is a desaturated wine (`#a13a63`), not pure red, to stay on-palette.

### 3.6 Navigation (Header)
- **Desktop:** sticky glass bar (`--glass-bg-strong`, `backdrop-filter: blur(var(--blur-md))`, bottom hairline `--hairline`), height ~72px. Logo at inline-start; nav links inline-end. Links: `--ink`, hover slides a 2px gradient underline in from the inline-end via `transform: scaleX()`. "محصولات" is the primary link — rendered as a small gradient pill.
- **Scrolled state:** raise opacity to `--glass-bg-strong` + `--shadow-soft` (toggle a `.is-scrolled` class on scroll; transform/opacity only).
- **Mobile:** logo + hamburger (animated to X). Menu = full-height glass sheet sliding from the inline-end (RTL) over a dimmed `--wine-ink` backdrop; links stagger-fade in; large 56px tap rows; the channel rail (WA/TG/Call) pinned to the sheet bottom. Body scroll locks (already implemented).

### 3.7 FloatingContact rail & sticky bars
- **Desktop:** vertical glass capsule fixed at inset-block-end / inset-inline-end, three circular 52px channel buttons (WA gradient, TG/Call glass), `--shadow-float`, gentle entrance from off-screen, hover scale 1.08. Hidden when the footer is in view (optional).
- **Mobile product page:** sticky bottom **glass** bar — price (Playfair numerals) at inline-start, compact add-to-cart plus WhatsApp quick-order at inline-end, `--shadow-hard`, `padding-block-end: env(safe-area-inset-bottom)`. It supports the website checkout while keeping the chat channel one tap away; keep it visible and ≥ 56px tall.

---

## 4. Signature artistic details (what makes Direction B distinctive)

1. **Living gradient-mesh hero.** `--mesh-hero` on the hero canvas with three blurred "petal-light" pseudo-blobs drifting on a 24–32s `transform: translate/scale` loop (GPU-only). The mesh hue subtly shifts via animating the blob positions, never the gradient itself (cheap, smooth).
2. **Drifting petals.** 5–8 absolutely-positioned petal SVGs (simple teardrop/`border-radius:50% 0` shapes) at low opacity, each on a slow `translateY + rotate` keyframe with staggered delays. Pointer-events none. Capped count; all disabled under reduced-motion.
3. **Gradient-text headlines** for the hero H1 and section titles (Persian, Vazirmatn 800) — the brand gradient becomes the type fill.
4. **Glass over light.** Every content card is glass floating above a soft `--mesh-soft` wash, so the brand color is always *present but ambient*, never flat fill.
5. **Bento grids** for Features and Gallery: asymmetric tiles of varying span (a 2×2 "hero feature" tile beside 1×1 tiles), unified by radius + hairline, with one tile rendered as a wine "spotlight" panel containing a stat or quote.
6. **Tactile micro-interactions:** scale-0.97 press on all CTAs/cards, image `scale(1.06)` zoom-on-hover inside a clipped cover, magnetic primary button, hover-lift with layered shadow.
7. **Sticky scroll storytelling (Product Detail, desktop):** the image gallery is `position: sticky` while the info/feature column scrolls past it, so the product "holds" in view as its story unfolds.
8. **Petal divider / scroll-reveal:** sections rise via the existing `.reveal`/`.is-revealed`; section transitions can carry a thin `--luxury-gradient` hairline or a small centered petal mark instead of a hard edge.
9. **Number flourishes in Playfair** for stat bars ("30+", "100%", "24/7") and prices — the only Latin typographic accent, giving an editorial, boutique feel.

---

## 5. Page-by-page layouts (mobile **and** desktop)

> Grid language below assumes `.container` (`max-width: 1180px`, side padding `--gutter`). "cols" = CSS Grid template columns. Mobile = ≤767px, tablet 768–1023, desktop ≥1024, wide ≥1440.

### 5.1 Home

**Hero** — *cinematic, CTA above the fold.*
- **Canvas:** full-bleed `min-height: 92vh` (mobile `88vh`), background `--mesh-hero` (wine + brand-light pools), drifting petal SVGs + 3 mesh blobs, a faint vignette toward the edges. A subtle dark→transparent gradient at the block-end blends into the next (light) section.
- **Composition — desktop:** centered content column, max-width ~860px. Order: eyebrow pill ("دکورهای آرام، ماندگار و خاص") → H1 gradient-text "گل‌های روسی انعطاف‌پذیر" (Vazirmatn 800, `--fs-display`) → lead subtitle (`--muted-on-dark`) → one-line note → CTA row [Primary "مشاهده محصولات" gradient pill] [Secondary glass "داستان محصول"]. Below CTAs, a thin **trust strip** of 3 inline glass chips (ارسال سراسری · پرداخت آنلاین یا درب منزل · ضمانت دوام) with react-icons.
- **Composition — mobile:** same vertical order, full-width stacked CTAs (primary first), eyebrow + H1 sized down via clamp, trust chips wrap to a 1–2 per row scroll-free row. Petal count reduced to ~4.
- **Optional product peek (desktop ≥1024):** a single glass product "hero card" floated to the inline-start showing the featured flower image with a price chip — reinforces commerce immediately. Hidden on mobile to protect the fold.

**About** — *editorial split.*
- Desktop: 2-col `1.05fr .95fr` — left (inline-start) a large image in a `--radius-xl` clipped frame with a soft gradient corner-glow behind it; right the story copy (`aboutContent.description`) with a vertical gradient hairline marking the column, plus a small "uses" list as pill tags. Section sits on `--bg` with a `--mesh-soft` wash.
- Mobile: image first (16:10, reserved box), copy below, uses-list as wrapping pills.

**Features** — *bento grid.*
- Desktop (≥1024): a 4-col bento. Arrangement: one **2×2 spotlight tile** (wine `--glass--dark` panel: big Playfair stat "100%" + "ماندگاری رنگ" + short line) + the six `FeatureCard`s as 1×1 glass tiles (icon-in-gradient-chip, title, desc). Total grid ~`grid-template-columns: repeat(4, 1fr); auto-rows: minmax(150px, auto);` with the spotlight spanning `grid-column: span 2; grid-row: span 2;`. The existing **features-bar** (30+, 100%, 24/7) becomes a slim glass strip beneath, numerals in Playfair.
- Tablet: 2-col bento (spotlight spans full width as a banner).
- Mobile: single column; spotlight becomes the first full-width tile, FeatureCards stack; keep the icon-chip + generous padding. `.stagger-animation` on reveal.
- **FeatureCard anatomy:** 56px rounded-square icon chip with `--primary-gradient-soft` fill + `--accent` icon (react-icon, never emoji) → title (`--fs-h3`/700) → description (`--muted`, `--lh-body`). Hover lift + chip brightens.

**Gallery** — *bento masonry (hides if empty).*
- Desktop: asymmetric bento, `repeat(6, 1fr)`, tiles spanning 2–3 cols and 1–2 rows for a magazine feel; each image in a clipped `--radius-lg` frame, `scale(1.06)` zoom + a wine→transparent bottom scrim with an optional caption on hover. Lightbox on click (existing).
- Mobile: 2-col grid, uniform squares, tap → lightbox. Reserve every tile's aspect box.

**Testimonials / Reviews** — *glass quote cards.*
- Desktop: 3-col glass cards over `--mesh-soft`; each = 5 star icons (gradient-filled react-icons), Persian quote (`--fs-lead`/500), name + role, small avatar orb. One card may be a wine spotlight for contrast.
- Mobile: horizontal snap-scroll of glass cards (1.1 cards visible) or a simple stack; stars ≥ 20px.

**Contact** — *form on glass over wine-tinted band.*
- Desktop: 2-col `1fr 1fr` — left a `--glass` form card (name, phone, message, submit), right a "channels" panel (WA/TG/Call big rows + hours + delivery note "ارسال درون‌شهری گرگان درب منزل، سراسر کشور با پست"). Background a soft wine-tinted band (`--bg-2` → faint mesh) to close the page cinematically.
- Mobile: channels panel first (fastest conversion), then the form; submit full-width.

### 5.2 Products catalog

- **Header block:** eyebrow pill + gradient-text H1 (`config.productsPage.title`) + subtitle, over `--mesh-soft`.
- **Filter bar:** sticky glass pill-row of category chips (`رز`, `آفتابگردان`, `لاله`, `ترکیبی`, `همه`). Active chip = gradient fill + white; inactive = glass + `--accent-strong`. Horizontally scrollable on mobile (no wrap, momentum), ≥44px tall.
- **Grid:** desktop `repeat(auto-fill, minmax(280px, 1fr))` (≈3–4 cols at 1180px), gap `--space-6`; tablet 2-col; mobile 1-col (or 2-col compact at ≥420px). Featured items sort first (existing logic).
- **ProductCard anatomy** (restyle existing): clipped cover (4:3, reserved) with `image_url` zoom-on-hover or decorative orb fallback; badges (sale inline-start, ویژه inline-end, availability); category micro-label; name (`--fs-h3`); 3 feature tag pills; **footer**: price (Playfair numerals, sale shows struck old price) at inline-start, add-to-cart control plus WhatsApp quick-order pill at inline-end. Whole card lifts; press scales 0.985.

### 5.3 Product Detail — *sticky scroll storytelling.*

- **Breadcrumb** (glass, small) → **2-col layout** desktop `1.05fr .95fr`:
  - **Inline-start — gallery (sticky on desktop):** main image in `--radius-xl` clipped frame (`position: sticky; top: 88px`), badges overlaid; thumbnail row beneath (active thumb = gradient ring). Click → Lightbox.
  - **Inline-end — info (scrolls):** category micro-label → H1 name → price row (Playfair current + struck old + availability chip) → description (`--lh-body`) → feature list as check-row items → **order block** (add-to-cart primary, WhatsApp quick-order, Telegram + Call as glass secondaries) → "روش خرید" link → **trust row** (3 glass chips: ضمانت دوام / تعویض‌مرجوعی / مشاوره رایگان, react-icons).
- **Reviews** section (glass cards) then **Related** grid (reuse ProductCard).
- **Mobile:** single column — gallery first (swipeable thumbs), info below; the **sticky bottom glass order bar** (price + add-to-cart + WhatsApp) is always present (≥56px, safe-area padded). No desktop sticky gallery on mobile.

### 5.4 Blog index + Article

- **Index:** wine-tinted hero strip (kicker pill + gradient-text title + sub). Cards in a bento-ish grid: the newest post a wide 2-col **feature card** (large cover, title overlay on a wine scrim), remaining posts 1-col glass cards (cover 16:9 reserved, tag pill, title, excerpt, date). Desktop `repeat(3, 1fr)` with the lead spanning 2; mobile single column.
- **Article:** centered measure `min(720px, 92vw)`. Cover image in `--radius-xl` frame → tag + title (gradient-text) + meta → `.prose` body (Vazirmatn, `--lh-body`, headings 700, links `--accent-strong` with hairline underline, blockquotes with an inline-start gradient bar on `--surface-2`, images rounded with `--shadow-soft`). A floating "بازگشت به مجله" glass pill; sticky reading-progress hairline (gradient) at the top is an optional flourish.

### 5.5 How-to-order

- **Stepper:** vertical timeline on mobile / horizontal on desktop. Each step = numbered gradient orb (Playfair numeral) + title + line; connector is a `--luxury-gradient` hairline. 3–4 steps (مشاهده محصول → تماس/واتساپ → تأیید و ارسال → پرداخت درب منزل).
- **FAQ:** accordion list on `--surface`, `--hairline` dividers; chevron react-icon rotates on open; answer reveals via height/opacity. Generous tap rows.
- **CTA band** at the end: wine glass panel with the channel rail.

### 5.6 Global chrome

- **Header:** §3.6.
- **Footer:** wine surface (`--wine` → `--wine-ink` subtle gradient) closing the page. 3–4 col grid desktop (brand blurb + logo on a calm patch / quick links / quick contact / trust), `--muted-on-dark` text, hairline `--hairline-dark` dividers, the existing **trust row** (4 icons) as a centered glass strip, Enamad seal slot, copyright bottom. Mobile: stacked, links in a 2-col mini-grid, trust row wraps. Channel links repeated for last-chance conversion.
- **FloatingContact + sticky bars:** §3.7.

---

## 6. Section rhythm & responsive rules

- **Vertical rhythm:** every section `padding-block: var(--section-y)`; alternate band backgrounds: `--bg` ↔ `--bg-tint` (with `--mesh-soft`) ↔ occasional wine moment (hero, contact band, footer) for cinematic pacing.
- **Container:** keep `.container` (1180/`--gutter`). Bento grids live inside it.
- **Breakpoints:** 375 (smallest design target — verify no clipping), 768 (1→2 col, bento collapses), 1024 (full bento + sticky PDP gallery + desktop nav), 1440 (cap content width, let mesh breathe in the margins). **No horizontal scroll on mobile** — `overflow-x: hidden` stays; bento uses `minmax(0,1fr)` to prevent blowout; filter/snap rows are the only intentional horizontal scrollers.
- **Touch:** all interactive ≥ 44×44px; sticky bars ≥ 56px; spacing increased one step on mobile for thumb comfort.

## 7. Motion spec (summary)

| Element | Property | Duration | Easing | Notes |
|---|---|---|---|---|
| Hero mesh blobs / petals | transform (translate/scale/rotate) | 24–32s loop | linear/ease-soft | GPU-only, capped count |
| Section reveal | opacity + translateY(26px→0) | 700ms | `--ease-soft` | existing `.reveal` |
| Card hover-lift | transform + box-shadow | `--dur-ui` | `--ease-out` | |
| Image zoom | transform: scale(1→1.06) | `--dur-large` | `--ease-out` | inside clipped cover |
| Button press | transform: scale(.97) | `--dur-micro` | `--ease-out` | all CTAs/cards |
| Magnetic button | transform translate ≤4px | `--dur-micro` | `--ease-out` | pointer-driven, optional |
| Nav underline | transform: scaleX | `--dur-ui` | `--ease-soft` | |
| Mobile menu sheet | transform: translateX + opacity | `--dur-large` | `--ease-out` | from inline-end (RTL) |
| Accordion | height/opacity | `--dur-ui` | `--ease-soft` | |

**`prefers-reduced-motion`:** disable mesh/petal loops, magnetic motion, image zoom, and reveal translate (already handled globally); keep instant opacity. Never animate layout-affecting properties.

## 8. Accessibility & performance checklist

- Contrast: wine surfaces use `--muted-on-dark`/white (verified ≥4.5:1); accent text only as `--accent-strong` on light. Gradient-text always has a solid fallback.
- Focus-visible rings on every interactive element (`outline: 3px var(--accent-2)`, offset 3px).
- Icons are react-icons SVG (never emoji); decorative orbs/petals are `aria-hidden`.
- Images: WebP, explicit aspect boxes (no CLS), `loading="lazy"` below the fold, hero image preloaded.
- Glass blur is capped and `@supports`-gated; backgrounds are not blurred while scrolling.
- Honor `env(safe-area-inset-*)` on sticky/floating bars for notched phones.

---

*Implementation note:* introduce these as new tokens/utilities in `global.css` and opt components in incrementally (Hero → Features bento → ProductCard → PDP sticky → Footer). Existing class names and the `.reveal`/`.stagger-animation`/`.container`/`.section-title`/`.catalog-state` utilities are preserved and extended, so the migration is non-breaking. A visual reference of the direction is in `design-briefs/mockup-B.html`.
