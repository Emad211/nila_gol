# Redesign A — "Editorial Atelier" (نیلا گل)

> A quiet-luxury visual direction for نیلا گل. Think a Parisian flower atelier crossed
> with *Kinfolk* / *Cereal* magazine: an editorial print catalogue brought to life,
> in full RTL Persian, strictly in the brand pink→purple family.
>
> **Archived alternative:** this direction is kept for historical comparison. Do not implement or revive it unless the
> user explicitly asks for Direction A. The active design source is `redesign-B-immersive-boutique.md`.
>
> **This is a restyle, not a rebuild.** Every page already exists; this document specifies
> tokens, typography, layout (mobile + desktop), component treatments, motion, and the
> signature artistic details — all implementable in **plain CSS** with the existing
> token + utility system (`src/styles/global.css`, `.container`, `.section-title`,
> `.reveal/.is-revealed`, `.fade-in`, `.stagger-animation`, `.catalog-state`).

---

## 0. The Big Idea

A printed luxury catalogue, set in Persian. The whole site behaves like the spreads of a
high-fashion flower lookbook:

- **Asymmetric editorial grid.** Content sits on a 12-column field but is rarely centered;
  it hangs off the inline-start edge or floats in a wide right margin, with a thin hairline
  rule pinning each section like a magazine folio.
- **Oversized Latin numerals & labels as graphics.** Big Playfair Display numerals
  (`01 · 02 · 03`, the price `۴۵۰٬۰۰۰`, the year `2026`) are used as *art*, not just data —
  ghosted, outlined, oversized in the margin.
- **Persian is the voice; Latin is the ornament.** All Persian (headings + body) is
  **Vazirmatn**. Playfair Display is reserved for Latin words/numerals only (it cannot
  render Persian). Persian "display" weight = Vazirmatn 800.
- **Restraint over decoration.** Generous whitespace, thin pink hairlines, muted deep-wine
  ink on warm pink-white. No drop-shadow soup, no candy gradients on flat blocks. The brand
  gradient appears in *small, precious* doses (the logo, one hero accent, a thin rule),
  never as a full background slab.
- **Slow, line-by-line reveals.** Headlines rise word-line by word-line; images do a slow
  scale-down (1.06 → 1.0); section labels fade and let their hairline draw itself in.

The result reads as expensive, calm, and timeless — never bubblegum, never childish.

---

## 1. Design Tokens (`:root`)

Drop-in extension of the current `:root`. **Names that already exist keep working**
(`--accent`, `--accent-strong`, `--accent-2`, `--primary-gradient`, `--shadow-*`,
`--radius-*`, `--transition-*`, `--font-display`). New tokens are additive.

```css
:root {
  color-scheme: light;

  /* ----- Surfaces — warm pink-tinted paper ----- */
  --paper:        #fdf7fb;   /* page base ("the page of the catalogue") */
  --paper-2:      #fbf0f6;   /* alternating section band */
  --paper-3:      #f7e8f1;   /* deepest blush band / inset */
  --surface:      #ffffff;   /* cards, raised tiles */
  --surface-warm: #fffdfe;   /* near-white card with a pink whisper */

  /* keep legacy aliases pointed at the new paper system */
  --bg:           var(--paper);
  --bg-2:         var(--paper-2);
  --surface-2:    var(--paper-2);

  /* ----- Ink — deep wine, the "printed" text color ----- */
  --ink:          #5a1538;   /* primary text — deep wine, AA on paper */
  --ink-strong:   #4a1230;   /* headings / darkest */
  --ink-soft:     #7d4e66;   /* secondary text / captions (AA on paper) */
  --ink-faint:    #a98498;   /* hairline labels, metadata, ghosted numerals */
  --text:         var(--ink);        /* legacy alias */
  --muted:        var(--ink-soft);   /* legacy alias */

  /* dark surface (footer, deep-wine bands) */
  --wine:         #3d0f28;   /* deep wine ink surface */
  --wine-2:       #4f1334;   /* slightly lifted wine */
  --on-wine:      #fbe9f2;   /* text on wine */
  --on-wine-soft: #d8a8c2;   /* muted text on wine */

  /* ----- Brand — magenta→violet (FIXED, do not recolor the logo) ----- */
  --accent:        #d62e8c;
  --accent-strong: #b01e74;
  --accent-2:      #9647b8;   /* lavender-violet secondary */
  --rose:          #e0318c;

  /* ----- Hairlines & borders — soft pink ----- */
  --hairline:        #f3d4e5;          /* the signature thin rule */
  --hairline-strong: #e8b9d3;          /* hover / emphasis rule */
  --border:          rgba(90, 21, 56, 0.10);   /* legacy alias */
  --border-strong:   rgba(90, 21, 56, 0.18);

  /* ----- Gradients (use sparingly — precious doses only) ----- */
  --primary-gradient: linear-gradient(135deg, #e0318c 0%, #9647c0 100%);   /* logo/brand only */
  --rose-gradient:    linear-gradient(135deg, #f6c6df 0%, #dcbdee 100%);
  --hairline-gradient: linear-gradient(90deg,
                        transparent, var(--accent) 18%, var(--accent-2) 82%, transparent);

  /* tints for washes / image vignettes */
  --tint-accent-08: rgba(214, 46, 140, 0.08);
  --tint-accent-14: rgba(214, 46, 140, 0.14);
  --tint-violet-10: rgba(150, 71, 184, 0.10);

  /* ----- Elevation — soft, low, never harsh ("paper on paper") ----- */
  --shadow-soft:   0 4px 18px rgba(74, 18, 48, 0.06);
  --shadow-medium: 0 14px 40px rgba(74, 18, 48, 0.10);
  --shadow-hard:   0 28px 64px rgba(74, 18, 48, 0.14);
  --shadow-inset-hairline: inset 0 0 0 1px var(--hairline);

  /* ----- Type families ----- */
  --font-body:    'Vazirmatn', system-ui, -apple-system, 'Segoe UI', sans-serif;
  --font-display: 'Playfair Display', Georgia, 'Times New Roman', serif; /* LATIN ONLY */
  --font-fa-display: 'Vazirmatn', sans-serif; /* Persian display = Vazirmatn 800 */

  /* ----- Type scale (fluid, mobile-first; major-third-ish) ----- */
  --fs-display: clamp(2.4rem, 7.2vw, 5rem);     /* hero Persian headline (Vazirmatn 800) */
  --fs-h1:      clamp(2rem, 5.4vw, 3.4rem);
  --fs-h2:      clamp(1.6rem, 4.2vw, 2.5rem);    /* section titles */
  --fs-h3:      clamp(1.18rem, 2.4vw, 1.45rem);  /* card titles */
  --fs-lead:    clamp(1.02rem, 1.9vw, 1.22rem);  /* lead paragraphs */
  --fs-body:    1rem;
  --fs-sm:      0.9rem;
  --fs-label:   0.74rem;                          /* letter-spaced eyebrow labels */
  --fs-numeral: clamp(3.2rem, 12vw, 8.5rem);      /* oversized Playfair margin numerals */

  --lh-tight: 1.16;    /* display headlines */
  --lh-snug:  1.35;    /* sub-headlines */
  --lh-body:  1.85;    /* Persian body wants generous leading */

  /* tracking — Persian doesn't letter-space well; only Latin/labels do */
  --ls-label: 0.34em;  /* eyebrow labels (applied to Latin or spaced Persian sparingly) */
  --ls-display: -0.01em;

  /* ----- Spacing scale (8px base, generous) ----- */
  --space-3xs: 0.25rem;
  --space-2xs: 0.5rem;
  --space-xs:  0.75rem;
  --space-sm:  1rem;
  --space-md:  1.5rem;
  --space-lg:  2.5rem;
  --space-xl:  4rem;
  --space-2xl: 6rem;
  --space-3xl: 8.5rem;   /* desktop section padding — the "air" of the catalogue */
  --section-y:      clamp(4rem, 9vw, 8.5rem);  /* vertical section rhythm */
  --section-y-tight: clamp(3rem, 6vw, 5.5rem);

  /* ----- Layout ----- */
  --container:       1180px;   /* keep legacy width for body content */
  --container-wide:  1320px;   /* full-bleed-ish editorial spreads */
  --container-text:  680px;    /* measure for prose / article body */
  --gutter:          clamp(1.1rem, 3vw, 2rem);

  /* ----- Radius — gentle, paper-soft; NOT pill-round on cards ----- */
  --radius-xl: 22px;
  --radius-lg: 16px;
  --radius-md: 12px;
  --radius-sm: 8px;
  --radius-pill: 999px;   /* only for chips/CTA where intended */

  /* ----- Motion — slow & editorial for big elements, crisp for micro ----- */
  --ease-editorial: cubic-bezier(0.16, 1, 0.3, 1);   /* slow ease-out, "settle" */
  --ease-out:       cubic-bezier(0.2, 0, 0, 1);
  --dur-reveal: 720ms;   /* hero / large reveals (400–600ms band → use 600–720 for editorial calm) */
  --dur-slow:   560ms;
  --dur-base:   320ms;
  --dur-fast:   180ms;   /* micro-interactions / hovers */
  --transition-smooth: var(--dur-base) var(--ease-out);   /* legacy alias */
  --transition-slow:   var(--dur-slow) var(--ease-editorial);
}
```

**Contrast check (≥4.5:1 on `--paper #fdf7fb`):** `--ink #5a1538` ≈ 10.9:1, `--ink-soft #7d4e66`
≈ 5.1:1, `--accent-strong #b01e74` ≈ 5.0:1. Body text and links pass AA. `--ink-faint` and
the bare `--accent` are for **large/decorative** type only (ghost numerals, hairline labels),
never body copy. On `--wine #3d0f28`, `--on-wine #fbe9f2` ≈ 14:1.

---

## 2. Typography System

### Families & rules
- **Vazirmatn** — ALL Persian (body + every heading) and Persian/Arabic-Indic numerals.
  Weights loaded: 300, 400, 500, 600, 700, 800.
- **Playfair Display** — **Latin words & numerals only**, as display ornament: the oversized
  margin numerals (`01`, `02`), Latin brand echoes (`Nila Gol`, `ATELIER`, `2026`), the
  Latin-figure price echo. Weights: 500, 600, 700 (+ italic for captions). **Never** wrap
  Persian glyphs in Playfair — they fall back to a serif that can't shape Persian.
- Implementation: keep one Google Fonts import (already present), `display=swap`. Body uses
  `--font-body`; apply `--font-display` only on explicit `.latin` / numeral classes.

### Roles
| Role | Family / weight | Size token | Notes |
|---|---|---|---|
| Hero headline (fa) | Vazirmatn 800 | `--fs-display` | `line-height: var(--lh-tight)`; reveal line-by-line |
| Section title (fa) | Vazirmatn 800 | `--fs-h2` | left-hung (inline-start), not centered |
| Card title (fa) | Vazirmatn 700 | `--fs-h3` | |
| Lead / standfirst | Vazirmatn 400 | `--fs-lead` | `color: var(--ink-soft)`; `max-width: 46ch` |
| Body | Vazirmatn 400 | `--fs-body` | `line-height: var(--lh-body)`; measure ~62–68ch |
| Eyebrow label (fa) | Vazirmatn 600 | `--fs-label` | UPPERCASE-equivalent: letter-spaced + hairline; see §6 |
| Margin numeral (latin) | Playfair 600 | `--fs-numeral` | `color: transparent` w/ `-webkit-text-stroke: 1px var(--hairline-strong)` (outline) OR `--ink-faint` ghost |
| Price figure | Vazirmatn 700 + `.num` | — | tabular-nums; Latin echo optional in Playfair |
| Caption (latin) | Playfair 500 italic | `--fs-sm` | image captions, e.g. *Fig. 01* |
| Prose body (`.prose`) | Vazirmatn 400 | 1.08rem | `line-height: 2`; headings Vazirmatn 700 |

### The eyebrow / section label (signature)
Persian doesn't letter-space gracefully, so the "small-caps editorial label" effect is built
from a **thin pink hairline + a short Latin tag + the Persian label**, e.g.:

```
———  ATELIER · ۰۱   ویژگی‌های برجسته
```

Pattern: a 28px hairline rule, an optional Playfair Latin micro-tag (letter-spaced
`--ls-label`), then the Persian word in Vazirmatn 600 at `--fs-label`, color `--ink-soft`.
On Persian-only labels, use a *modest* `letter-spacing: 0.04em` max.

---

## 3. Global Page Shell

- **Background:** flat `--paper`, with two *very* faint fixed radial washes top-corners
  (reuse the existing body radial-gradient idea but lower alpha — `--tint-accent-08`,
  `--tint-violet-10`). No busy texture.
- **Section rhythm:** vertical padding `var(--section-y)`; alternate `--paper` / `--paper-2`
  bands. Each section opens with the eyebrow-label + hairline (§2) hung to the inline-start.
- **The folio hairline:** a 1px `--hairline` rule runs under the header and reappears as a
  thin top-border between major sections — the through-line that makes it feel "bound."
- **Containers:** body `--container` (1180); editorial spreads may use `--container-wide`.
  Prose uses `--container-text`.
- **Logo is untouchable** — render the existing gradient wordmark image as-is; never recolor
  or place it on a busy field. Give it clear space ≥ its cap-height on all sides.

---

## 4. Page-by-Page Layouts

> Breakpoints: **375 / 768 / 1024 / 1440**. Mobile-first; no horizontal scroll on mobile.
> Grid notation below = desktop 12-col on `--container-wide` with `--gutter` gaps.

### 4.1 Header (global chrome)
**Desktop (≥1024):** a tall, airy bar (height ~88px) on `--paper` with a 1px `--hairline`
bottom border; becomes `--surface-warm` + `--shadow-soft` + slight height shrink (→72px) when
scrolled. Layout (RTL): **logo at inline-start edge**, nav centered-to-end, with the
`محصولات` link rendered as the lone **primary** affordance (see nav, §6). A hairline `|`
divider sits before the primary link. Letter the nav items with comfortable
`gap: var(--space-md)`.

**Mobile (<768):** logo inline-start, hamburger inline-end (two thin lines, animates to an
`×`). Menu opens as a **full-height inset-inline-end drawer** (85vw, max 360px) sliding in on
`--ease-editorial`, `--paper` panel with a left `--hairline` edge and a dimmed `--wine`/40%
backdrop; links stack large (Vazirmatn 600, `--fs-h3`) each with its own bottom hairline and a
small Playfair index numeral (`۰۱…`) in the margin. Touch targets ≥48px.

**Signature detail:** the active/section link gets a 2px under-rule drawn with
`--hairline-gradient` that animates its width from 0 on hover (`transform: scaleX` from the
inline-start).

### 4.2 Home — Hero
Real copy: eyebrow `دکورهای آرام، ماندگار و خاص`, title `گل‌های روسی انعطاف‌پذیر`,
subtitle `زیبایی پایدار برای خانه شما`, note line, CTAs `مشاهده محصولات` / `داستان محصول`.

**Desktop (≥1024) — asymmetric editorial split (no full-bleed photo slab):**
- 12-col: **text block cols 1–6** (inline-start), **image cols 7–12** (inline-end), unequal
  on purpose. Min-height ~`min(86vh, 760px)`.
- Text column: the eyebrow-label+hairline; then the **oversized Persian headline** (Vazirmatn
  800, `--fs-display`) revealed line-by-line; a `--fs-lead` subtitle (`--ink-soft`, 42ch);
  the note in smaller `--ink-soft`; then CTAs.
- **Margin numeral:** a giant ghosted Playfair `2026` (or `۰۱`) outlined in `--hairline`,
  absolutely placed bleeding off the inline-start/top, `z-index:0`, `aria-hidden`.
- Image: a single large soft-cornered (`--radius-xl`) flower photo (WebP, the existing
  `hero.webp`) inside a thin `--hairline` frame with `--shadow-soft`; a **Playfair caption**
  pinned beneath in the margin: *Fig. 01 — Collection Atelier*. Reserve the box (aspect-ratio
  4/5) so there's no layout shift; slow scale-in 1.06→1.0 on load.
- A single **brand-gradient hairline** (3px, `--hairline-gradient`) underlines the headline's
  last line — the one precious gradient moment of the hero.

**Mobile (<768):** single column, text first. Order: eyebrow → headline (still oversized but
`--fs-h1`) → subtitle → image (full-width, aspect 4/5, `--radius-lg`) with caption → note →
CTAs full-width stacked (primary first). Ghost numeral shrinks to `--fs-numeral` lower bound,
sits behind the headline at low opacity.

**Hero CTAs:** primary = filled wine pill `مشاهده محصولات`; secondary = "ghost/underline" link
`داستان محصول` with an animated under-rule + a small inline-start arrow `←` (RTL-correct).

### 4.3 Home — About
Real copy from `aboutContent` (`description`, `uses[]`).
**Desktop:** asymmetric two-col on `--paper-2`. Inline-end: a stacked pair of soft images /
or one tall image with a Playfair caption. Inline-start: eyebrow `داستان محصول`, a short
Vazirmatn-800 title, the description in `--container-text` measure, then **`uses[]` as an
editorial list** — each item a row with a hairline divider, a tiny `۰۱` Playfair index, and
the Persian phrase; not bullet dots. Generous `--space-lg` row gaps.
**Mobile:** stack image → text → list (full-width rows, each with bottom hairline).

### 4.4 Home — Features
Real copy: eyebrow `ویژگی‌های برجسته`, title `انتخابی مطمئن برای فضای شما`, lead, then 6
feature cards (icon + title + desc from `features[]`), and a 3-up stat **bar**
(`30+ مدل پرطرفدار`, `100% ماندگاری رنگ`, `7/24 پاسخگویی سریع`).

**Header block:** the existing two-part header (title inline-start, lead inline-end) →
restyle as eyebrow+hairline + Vazirmatn-800 title on the inline-start, lead text dropped into
the inline-end column at `--ink-soft`, separated by a vertical hairline on desktop.

**Cards grid:**
- Desktop ≥1024: **3 columns**; 1024–768: 2 columns; mobile: 1 column.
- **Card anatomy (editorial, flat — not a glossy box):** `--surface-warm`, `--radius-lg`,
  `box-shadow: var(--shadow-inset-hairline)` (hairline border) + `--shadow-soft`; padding
  `--space-lg`. Top row = a **line icon** (react-icons, `1.4rem`, in `--accent-strong`) inside
  a 44px circle with a `--hairline` ring **and** a big ghosted Playfair index numeral
  (`۰۱…۰۶`) in the card's inline-end corner (`--fs-numeral` lower bound, `--ink-faint` @ ~12%).
  Then Vazirmatn-700 title, then `--ink-soft` description (`--lh-body`).
- **Hover:** lift `translateY(-4px)`, hairline → `--hairline-strong`, the index numeral fades
  up slightly, icon ring fills with `--tint-accent-08`. 180–220ms, transform/opacity only.
- Use `.stagger-animation` for entrance.

**Stat bar:** full-width strip on a `--wine` band (the one dark moment up top) OR a hairline-
framed band on `--paper`; 3 cells split by vertical hairlines. Each cell: a **Playfair**
Latin figure (`30+`, `100%`, `7/24`) at large size in `--accent`/`--on-wine`, with the Persian
label under it in `--ink-soft`/`--on-wine-soft`. On mobile, stack to 1 column with horizontal
hairlines between.

### 4.5 Home — Gallery (hides if empty)
**Desktop:** an **asymmetric editorial mosaic** — a CSS grid where a few tiles span 2 rows /
2 cols (intentional rhythm, not a uniform matrix). `gap: var(--gutter)`; each tile
`--radius-md`, thin `--hairline` frame, image `object-fit: cover`, reserved aspect-ratio.
Hover: slow image scale 1.0→1.05 + a soft `--tint-accent-14` vignette wash and a small
Playfair index caption fading in (`Fig. 0X`).
**Mobile:** 2-column masonry-ish grid (or single column for hero tiles); keep aspect-ratios to
avoid shift. Section opens with eyebrow `گالری` + hairline.

### 4.6 Home — Testimonials / Reviews (star ratings)
**Desktop:** an editorial **quote spread** — one large featured review centered in a wide
margin: an oversized Playfair opening quotation mark `“` as a graphic in the inline-start
margin (`--accent-2`, ghosted), the Persian testimonial in Vazirmatn 500 at `--fs-lead`, then
the reviewer name (Vazirmatn 600) + star row. Below, a row of 2–3 smaller review cards
(hairline-framed, `--surface`). Stars = react-icons `FaStar` in `--accent` (filled) /
`--hairline-strong` (empty), not emoji.
**Mobile:** featured quote stacked, then a horizontal **snap-scroll** rail of review cards
(scroll-snap, each ~85vw) — no grid cramping. Eyebrow `نظر مشتری‌ها`.

### 4.7 Home — Contact (form)
**Desktop:** asymmetric two-col on `--paper-3`. Inline-start: eyebrow `تماس با ما`,
Vazirmatn-800 title, a short line, then the **direct channels** as big hairline-separated rows
(WhatsApp / Telegram / phone) each with a line icon, label, and value — these are the real
"checkout," so they're visually primary. Inline-end: the form card (`--surface`, `--radius-xl`,
hairline border, `--shadow-medium`).
**Form fields:** label above (Vazirmatn 600, `--fs-label`, `--ink-soft`); input is **bottom-
ruled** (transparent bg, only a `--hairline` bottom border that animates to a 2px
`--hairline-gradient` underline on focus) — very "editorial form," minimal boxes. 16px text
(prevents iOS zoom), min-height 48px. Submit = primary wine pill, full-width on mobile.
**Mobile:** stack channels → form; fields full-width.

### 4.8 Products catalog (`/products`)
Real chrome: category filter + product grid of `ProductCard`s.
**Page head:** an editorial masthead — eyebrow `فروشگاه`, Vazirmatn-800 title `محصولات`, a
ghosted Playfair `Catalogue` / `۲۰۲۶` numeral in the margin, a `--hairline-gradient` rule
under it; a short standfirst.
**Category filter:** a horizontal row of **hairline pills** (chips). Default = ghost (text
`--ink-soft`, 1px `--hairline` border, transparent). Active = filled wine (`--wine` bg,
`--on-wine` text) — *not* the brand gradient (kept precious). Scrollable, no-wrap on mobile
with `scroll-snap`; ≥44px tall.
**Grid:** desktop ≥1024 **3 cols**; 1024–768 2 cols; mobile 1–2 cols (cards remain legible at
2-up on ≥420px). `gap: var(--gutter)`. Featured cards sort first (existing behavior).

**ProductCard anatomy (editorial):**
- Frame: `--surface`, `--radius-lg`, `box-shadow: var(--shadow-inset-hairline)`; hover adds
  `--shadow-medium` + `translateY(-4px)`.
- Cover: aspect-ratio 4/5 (reserved), `object-fit: cover`, `--radius-md` top; fallback = the
  existing decorative orb on a `--paper-2` field. Slow image scale 1.0→1.04 on hover.
- Badges (top inline-start, stacked): **`ویژه`** = wine chip with a thin `--accent` hairline
  + tiny Playfair star/`★`-as-svg; **sale `٪`** = solid `--accent` chip, white text; avail
  chip uses tone colors but muted. Small, letter-restrained, `--radius-pill`.
- Body: category as a **hairline kicker** (`--ink-faint`, `--fs-label`), Vazirmatn-700 name,
  `--ink-soft` description (clamp 2 lines), up to 3 **feature tags** as tiny hairline chips.
- Footer (pinned bottom, separated by a top `--hairline`): price block — old price struck
  through in `--ink-faint`, current price Vazirmatn-700 `.num` (tabular) with `تومان`; and the
  **WhatsApp order** button. Order button = compact **wine pill** with the `FaWhatsapp` glyph;
  keep the state on-brand wine so the page stays editorial.

### 4.9 Product Detail (`/products/:slug`)
Real anatomy: breadcrumb, image gallery + thumbs, category, name, price row (+old/avail),
desc, feature list, order block (WhatsApp primary; Telegram/Call secondary), `روش خرید` link,
trust row (`ضمانت دوام` / `تعویض/مرجوعی` / `مشاوره رایگان`), reviews, related, sticky mobile bar.

**Desktop (≥1024) — two-column gallery/info spread on `--container`:**
- **Breadcrumb** as a hairline-underlined micro-row (`خانه / محصولات / {name}`),
  `--ink-faint`, with `/` separators.
- **Gallery (inline-start, ~7 cols):** large main image in a thin `--hairline` frame,
  `--radius-xl`, reserved aspect 4/5, click → existing Lightbox. **Thumbnails** as a vertical
  (desktop) / horizontal (mobile) strip of hairline-framed squares; active thumb gets a 2px
  `--accent` ring. A Playfair `Fig. 0X` caption sits under the main image.
- **Info (inline-end, ~5 cols, sticky on desktop):** category kicker → Vazirmatn-800 name →
  **price row** (current `.num` large, old struck, avail chip) → `--ink-soft` description →
  **feature list** as hairline-separated rows each with a small `FaLeaf`/check line-icon (not
  disc bullets) → **order block**.
- **Order block:** WhatsApp = full-width primary wine pill `سفارش در واتساپ`; a 2-up secondary
  row of `تلگرام` / `تماس` ghost-hairline buttons. Under it the `روش خرید و پرداخت را ببینید ←`
  link, then the **trust row** as 3 hairline-separated cells with line icons (`--accent-strong`).
- **Reviews** + **Related** (`محصولات مرتبط`, reuse ProductCard grid) follow below the spread,
  each opened by an eyebrow+hairline.

**Mobile (<768):** stack — breadcrumb, main image (full-width 4/5), horizontal thumb strip,
info, order block. **Sticky order bar** pinned to viewport bottom: a `--surface` bar with a top
`--hairline` + `--shadow-hard`, price on the inline-start, a compact WhatsApp wine pill on the
inline-end (≥48px). Respect safe-area inset.

### 4.10 Blog index (`/blog`)
Real copy: kicker `مجله نیلا گل`, title `مقالات و راهنمای گل روسی`, sub, then article cards
(cover, first tag, title, excerpt, date).
**Desktop:** a **magazine front page** — the most recent post as a wide **featured spread**
(cols 1–7 image, 8–12 text, or vice-versa), then the rest as a 2–3-col card grid below.
Each card: hairline-framed cover (reserved 3/2), a tag **hairline kicker**, Vazirmatn-700
title, `--ink-soft` excerpt (2-line clamp), and a Playfair date + a hairline read-more rule.
Section masthead uses eyebrow+hairline + a ghosted Playfair `Journal` numeral.
**Mobile:** single column; featured collapses to a normal (slightly larger) card.

### 4.11 Blog article (`.prose`)
- Article masthead: kicker (tag), Vazirmatn-800 title (`--fs-h1`), a Playfair byline/date in
  the margin, a wide cover image (reserved 16/9, `--radius-lg`, hairline frame).
- Body in `.prose` on `--container-text` (≈680px measure): Vazirmatn 400, `font-size: 1.08rem`,
  `line-height: 2`; `h2/h3` Vazirmatn 700 with a short `--accent` hairline before them; links
  `--accent-strong` underlined on hover; blockquotes = inline-start `3px --accent-2` rule, ink
  italic-equivalent (Vazirmatn 500), `--paper-2` wash; `code`/`pre` on `--paper-3`. First
  paragraph may use a **drop-cap-style** larger lead. Generous paragraph spacing
  (`--space-md`). Images full-measure with Playfair captions.

### 4.12 How-to-order (numbered steps + FAQ)
**Steps:** a vertical editorial list where each step is a row: a **giant Playfair numeral**
(`۰۱…`) in the inline-start margin (outlined in `--hairline-strong`), a Vazirmatn-700 step
title, and `--ink-soft` body; rows separated by `--hairline`. On desktop the numerals hang in
a dedicated narrow margin column; on mobile they sit inline above each step.
**FAQ:** hairline-divided accordion list — question row (Vazirmatn 600) with a thin `+`/`−`
line icon that rotates; answer reveals with a height/opacity transition. No heavy boxes.

### 4.13 Footer (global)
Real content: brand blurb, quick links, contact (phone/telegram), trust row (4 items),
optional ENAMAD seal, copyright with year.
**Treatment:** the **deep-wine band** (`--wine`) — the grounding dark page-end of the catalogue.
Top edge = a full-width `--hairline-gradient` 2px rule (the brand's one last gradient flourish).
- Desktop: 3–4 col grid — brand (wordmark on wine — ensure the gradient logo reads; if not,
  keep it on a small `--surface` plate), blurb (`--on-wine-soft`); quick links column;
  contact column; an inline-start **oversized ghosted Playfair `Nila Gol` / `2026`** watermark
  bleeding off the edge.
- Trust row: 4 hairline-separated cells with line icons in `--accent`.
- ENAMAD seal kept on a `--surface` plate so it stays legible/clickable.
- Bottom bar: copyright `--on-wine-soft`, separated by a `--hairline`-on-wine rule.
**Mobile:** stack columns, trust row wraps to 2×2 with hairlines, watermark hidden.

### 4.14 FloatingContact rail (global)
A vertical stack pinned `inset-block-end`/`inset-inline-start` (away from the sticky order bar
on PDP). Three circular 48px buttons (WhatsApp / Telegram / phone), `--surface` with a
`--hairline` ring + `--shadow-medium`, line icons in `--accent-strong`; on hover the ring →
`--hairline-strong` and a small Persian label slides out. Respect safe-area; collapse to a
single expandable button on the smallest screens if it crowds the sticky bar.

---

## 5. Signature Artistic Details (the "house style")
1. **The hairline folio system.** A consistent 1px `--hairline` rule under the header, between
   sections, and separating list rows — the visual "binding" of the catalogue.
2. **Oversized ghosted Playfair numerals/labels** in the margins (`01–06`, `2026`, `Catalogue`,
   `Journal`, `“`) — outlined (`-webkit-text-stroke`) or `--ink-faint` @ ≤12%, always
   `aria-hidden`, `z-index:0`, `pointer-events:none`.
3. **One precious gradient.** The brand gradient appears only as: the logo, a single 2–3px
   hairline rule under a hero/masthead headline, and the footer top rule. Never a flat slab.
4. **Editorial captions.** Playfair Latin italic `Fig. 0X — …` under key images.
5. **Asymmetry as default.** Headlines and content hang to the inline-start; wide breathing
   margins on the inline-end. Centered layouts are the exception (featured quote only).
6. **Bottom-ruled forms & ghost chips.** Inputs and filters are line-based, not boxed.
7. **Slow, line-by-line reveals** with `--ease-editorial`; images settle from a 1.06 scale.

---

## 6. Component Treatments (plain-CSS specs)

### Buttons
```css
/* Primary — confident, calm wine pill (NOT the loud brand gradient) */
.btn-primary{
  display:inline-flex; align-items:center; gap:.55rem;
  padding:.85rem 1.6rem; min-height:48px;
  font:600 1rem/1 var(--font-body);
  color:var(--on-wine); background:var(--wine);
  border:1px solid var(--wine); border-radius:var(--radius-pill);
  box-shadow:var(--shadow-soft);
  transition:transform var(--dur-fast) var(--ease-out),
             box-shadow var(--dur-fast) var(--ease-out),
             background var(--dur-fast) var(--ease-out);
}
.btn-primary:hover{ transform:translateY(-2px); box-shadow:var(--shadow-medium);
  background:var(--ink-strong); }
.btn-primary:focus-visible{ outline:2px solid var(--accent); outline-offset:3px; }

/* Secondary — ghost / animated under-rule editorial link */
.btn-ghost{
  display:inline-flex; align-items:center; gap:.5rem;
  padding:.85rem 1.2rem; min-height:48px;
  font:600 1rem/1 var(--font-body); color:var(--ink);
  background:transparent; border:1px solid var(--hairline);
  border-radius:var(--radius-pill);
  transition:border-color var(--dur-fast) var(--ease-out),
             color var(--dur-fast) var(--ease-out),
             background var(--dur-fast) var(--ease-out);
}
.btn-ghost:hover{ border-color:var(--hairline-strong); color:var(--accent-strong);
  background:var(--tint-accent-08); }

/* WhatsApp order — resting wine pill, WA-green only as a hover micro-accent */
.btn-order{ /* extends .btn-primary */ }
.btn-order:hover{ box-shadow:0 0 0 2px rgba(37,211,102,.35), var(--shadow-medium); }
```

### Nav link (animated under-rule)
```css
.nav-link{ position:relative; color:var(--ink); font-weight:500; padding:.4rem .2rem; }
.nav-link::after{ content:""; position:absolute; inset-inline-start:0; inset-block-end:-2px;
  block-size:2px; inline-size:100%; background:var(--hairline-gradient);
  transform:scaleX(0); transform-origin:inline-start; transition:transform var(--dur-base) var(--ease-out); }
.nav-link:hover::after,.nav-link[aria-current]::after{ transform:scaleX(1); }
.nav-link--primary{ /* the lone محصولات affordance → .btn-primary compact */ }
```

### Cards (feature / product / blog — shared skeleton)
```css
.card{ background:var(--surface-warm); border-radius:var(--radius-lg);
  box-shadow:var(--shadow-inset-hairline), var(--shadow-soft);
  transition:transform var(--dur-base) var(--ease-out),
             box-shadow var(--dur-base) var(--ease-out); }
.card:hover{ transform:translateY(-4px); box-shadow:inset 0 0 0 1px var(--hairline-strong), var(--shadow-medium); }
.card__index{ /* oversized Playfair numeral */ position:absolute; inset-block-start:.4rem;
  inset-inline-end:.8rem; font:600 var(--fs-numeral)/.8 var(--font-display);
  color:var(--ink-faint); opacity:.12; pointer-events:none; }
```

### Eyebrow label + hairline (signature)
```css
.eyebrow{ display:inline-flex; align-items:center; gap:.7rem;
  font:600 var(--fs-label)/1 var(--font-body); color:var(--ink-soft);
  letter-spacing:.04em; margin-block-end:var(--space-sm); }
.eyebrow::before{ content:""; inline-size:28px; block-size:1px; background:var(--accent); }
.eyebrow .lat{ font-family:var(--font-display); letter-spacing:var(--ls-label); color:var(--accent-strong); }
```

### Badges / chips
- `ویژه` (featured): `--wine` bg, `--on-wine` text, 1px `--accent` hairline, svg star, pill.
- Sale `٪`: solid `--accent`, white text, pill.
- Filter chip: ghost (hairline) default → solid `--wine` active.
- Feature tag: tiny hairline chip, `--ink-soft`.

### Forms (bottom-ruled)
```css
.field input,.field textarea{ inline-size:100%; min-height:48px; font-size:16px;
  color:var(--ink); background:transparent; border:0; border-block-end:1px solid var(--hairline);
  padding:.6rem .2rem; transition:border-color var(--dur-base) var(--ease-out); }
.field input:focus,.field textarea:focus{ outline:none;
  border-block-end:2px solid transparent;
  border-image:var(--hairline-gradient) 1; }
.field label{ font:600 var(--fs-label)/1 var(--font-body); color:var(--ink-soft); }
```

---

## 7. Motion System
- **Big elements (hero, masthead, featured spread):** enter on `--ease-editorial`, `--dur-reveal`
  (~720ms). Headlines reveal **line-by-line** (each line: `translateY(0.6em)` + opacity, staggered
  60–90ms via `.stagger-animation` or per-line spans). Images **settle** from `scale(1.06)`→`1`.
- **Scroll reveals:** reuse `.reveal/.is-revealed` (already opacity+translateY); extend with a
  variant `.reveal--line` for headline lines.
- **Micro-interactions (hover/focus on buttons, cards, chips, nav under-rules):** `--dur-fast`–
  `--dur-base` (180–320ms), `--ease-out`. **Animate `transform`/`opacity` only.**
- **Hairlines draw in:** section rules use `transform:scaleX()` from inline-start on reveal.
- **prefers-reduced-motion:** the existing global guard already neutralizes animations/reveals;
  ensure new hover transforms also collapse (cards/buttons: no translate when reduced).

---

## 8. Responsive & A11y Checklist
- Breakpoints 375 / 768 / 1024 / 1440; **no horizontal scroll** at 375 (test ghost numerals —
  they must `overflow:hidden`/clip on their section, never widen the page).
- Touch targets ≥44–48px (nav, chips, buttons, thumbs, floating rail, sticky bar).
- Contrast ≥4.5:1 for all body/label text (see §1); decorative-only colors excluded.
- Icons are **react-icons SVG** (`--accent-strong`), never emoji; the emoji→icon map in
  `FeatureCard.jsx` and the public PDP/Blog fallbacks should stay as SVG placeholders.
- Images: **WebP**, `loading="lazy"` (already used), reserved aspect-ratios everywhere → zero CLS.
- Visible `:focus-visible` rings (`2px --accent`, `offset 3px`) on all interactive elements.
- Keep all RTL with **logical properties** (`margin-inline`, `inset-inline`, `padding-inline`,
  `border-inline-*`); never hard-code left/right.
- Logo image untouched; never recolored or set on a busy ground.

---

## 9. Implementation Map (where this lands)
- Tokens → extend `:root` in `src/styles/global.css` (additive; keep legacy aliases).
- Shared utilities → extend `.eyebrow`, add `.card`, `.btn-*`, `.field`, `.chip`, `.index-numeral`,
  `.hairline`, `.reveal--line` in `global.css`.
- Per-component CSS (co-located `*.css`) absorbs the layouts in §4 using the tokens — Hero.css,
  Features.css/FeatureCard.css, Products.css/ProductCard.css, ProductDetail.css, Blog.css,
  Header.css, Footer.css, Contact.css, FloatingContact.css, HowToOrder.css.
- No JSX/feature changes required for the restyle; the icon-map + public fallback SVG swap is the
  only optional markup nicety. **Plain CSS only; no new dependencies.**
