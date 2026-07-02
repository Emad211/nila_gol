// Keyword-rich, URL-safe slug from a (Persian or Latin) name.
export function slugify(input) {
  return String(input || '')
    .trim()
    .replace(/[‌‏]/g, '') // strip ZWNJ / RLM
    .replace(/\s+/g, '-')
    .replace(/[^\p{L}\p{N}-]+/gu, '') // keep letters, numbers, hyphens
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase();
}
