// Pure helpers for the figma-redesign landing (PLAN.md WU0). No React, no DOM —
// exercised directly by `node --test tests/` (decision D7) and reused across
// the landing sections. Every helper is null-safe: bad or missing input never
// throws, it degrades to an empty/neutral result.

// Featured products first (is_featured), then catalog order (sort_order asc).
// `n` is clamped to [0, list.length]; ties keep the input order (stable sort).
export function topProducts(products, n = 3) {
  if (!Array.isArray(products)) return [];
  const ranked = [...products].sort(
    (a, b) =>
      Number(Boolean(b?.is_featured)) - Number(Boolean(a?.is_featured)) ||
      Number(a?.sort_order ?? 0) - Number(b?.sort_order ?? 0),
  );
  const limit = Math.max(0, Math.floor(Number(n) || 0));
  return ranked.slice(0, limit);
}

// Sale-aware price pair for cards: `price` is what the customer pays
// (sale_price when set), `oldPrice` is the struck-through base price or null.
export function priceView(product) {
  if (!product) return { price: null, oldPrice: null };
  const price = product.sale_price ?? product.price;
  return {
    price: price ?? null,
    oldPrice: product.sale_price ? product.price : null,
  };
}

const countWords = (text) =>
  typeof text === 'string' ? text.trim().split(/\s+/).filter(Boolean).length : 0;

const faDayMonth = (value) => {
  if (!value) return '';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  try {
    return new Intl.DateTimeFormat('fa-IR', { day: 'numeric', month: 'long' }).format(date);
  } catch {
    return '';
  }
};

// Blog card meta. Words come from `content` (full row) or `excerpt` (list row —
// services/posts.js LIST_FIELDS has no content). Category has no DB column on
// the list row, hence the «آموزشی» fallback (PLAN.md WU7).
export function postMeta(post) {
  if (!post) return { readMinutes: 1, dateShort: '', category: 'آموزشی' };
  const words = countWords(post.content) || countWords(post.excerpt);
  return {
    readMinutes: Math.max(1, Math.ceil(words / 200)),
    dateShort: faDayMonth(post.published_at),
    category: post.category || 'آموزشی',
  };
}

// Queue rotation with HeroSplit semantics: the front slot is always the active
// slide and every advance shifts each image one slot forward (wraps both ways).
export function rotateSlides(slides, active = 0) {
  if (!Array.isArray(slides) || slides.length === 0) return [];
  const count = slides.length;
  const offset = Number.isFinite(active) ? Math.trunc(active) : 0;
  return Array.from(
    { length: count },
    (_, i) => slides[(((i + offset) % count) + count) % count],
  );
}
