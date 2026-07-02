// Minimal head manager: sets document title, description/OG meta, and a JSON-LD
// block per page — no extra dependency. Call resetPageSeo() on unmount.

const JSONLD_ID = 'page-jsonld';
const DEFAULT_TITLE = 'گل‌های روسی انعطاف‌پذیر';

function upsertMeta(attr, key, content) {
  if (!content) return;
  let el = document.head.querySelector(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

export function setPageSeo({ title, description, image, url, jsonLd } = {}) {
  if (title) document.title = title;
  upsertMeta('name', 'description', description);
  upsertMeta('property', 'og:title', title);
  upsertMeta('property', 'og:description', description);
  upsertMeta('property', 'og:image', image);
  upsertMeta('property', 'og:url', url);
  upsertMeta('property', 'og:type', 'website');

  let script = document.getElementById(JSONLD_ID);
  if (jsonLd) {
    if (!script) {
      script = document.createElement('script');
      script.id = JSONLD_ID;
      script.type = 'application/ld+json';
      document.head.appendChild(script);
    }
    script.textContent = JSON.stringify(jsonLd);
  } else if (script) {
    script.remove();
  }
}

export function resetPageSeo(title = DEFAULT_TITLE) {
  document.title = title;
  const script = document.getElementById(JSONLD_ID);
  if (script) script.remove();
}
