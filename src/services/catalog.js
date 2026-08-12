import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { products as fallbackProducts, features as fallbackFeatures } from '../data/products';

// Data access for the public catalog. Marketing reads degrade gracefully to
// bundled static data, while order-validation reads use a strict path so Cart /
// Checkout never label stale fallback data as the current live price/availability.

const PRODUCT_FIELDS =
  'id, slug, name, description, price, sale_price, category, features, image_url, images, is_featured, availability';

const fallbackGallery = [
  { id: 'fallback-gallery-rose', title: 'چیدمان رز در دکور', image_url: '/img/collection-rose.webp' },
  { id: 'fallback-gallery-2', title: 'بافت و رنگ طبیعی', image_url: '/img/gallery-2.webp' },
  { id: 'fallback-gallery-3', title: 'چیدمان گل لاله', image_url: '/img/gallery-3.webp' },
  { id: 'fallback-gallery-4', title: 'رنگ ماندگار در دکور', image_url: '/img/gallery-4.webp' },
];

async function readActiveProducts() {
  const { data, error } = await supabase
    .from('products')
    .select(PRODUCT_FIELDS)
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export async function getProducts() {
  if (!isSupabaseConfigured) return fallbackProducts;

  try {
    return await readActiveProducts();
  } catch (err) {
    console.warn('[catalog] products fetch failed; using static fallback.', err);
    return fallbackProducts;
  }
}

// Cart/Checkout integrity read. In a real configured deployment this MUST reach
// Supabase successfully; callers should block checkout on failure rather than
// present a bundled fallback price as current. In local/CI degraded mode, where
// Supabase is deliberately unconfigured, fallback products remain the contract.
export async function getOrderValidationProducts() {
  if (!isSupabaseConfigured) return fallbackProducts;
  return readActiveProducts();
}

// Look up by slug first, then fall back to a numeric id (keeps old /products/:id links working).
export async function getProduct(slugOrId) {
  const fallback = () =>
    fallbackProducts.find((p) => p.slug === slugOrId || String(p.id) === String(slugOrId)) ?? null;
  if (!isSupabaseConfigured) return fallback();

  try {
    const bySlug = await supabase
      .from('products')
      .select(PRODUCT_FIELDS)
      .eq('is_active', true)
      .eq('slug', slugOrId)
      .maybeSingle();
    if (bySlug.error) throw bySlug.error;
    if (bySlug.data) return bySlug.data;

    if (/^\d+$/.test(String(slugOrId))) {
      const byId = await supabase
        .from('products')
        .select(PRODUCT_FIELDS)
        .eq('is_active', true)
        .eq('id', slugOrId)
        .maybeSingle();
      if (byId.error) throw byId.error;
      return byId.data ?? null;
    }
    return null;
  } catch (err) {
    console.warn('[catalog] product fetch failed; using static fallback.', err);
    return fallback();
  }
}

// Related items: same category first, then featured/others as filler.
export async function getRelatedProducts(product, limit = 4) {
  if (!product) return [];
  const all = await getProducts();
  const others = all.filter((p) => String(p.id) !== String(product.id));
  const sameCategory = others.filter((p) => p.category && p.category === product.category);
  const rest = others.filter((p) => !sameCategory.includes(p));
  return [...sameCategory, ...rest].slice(0, limit);
}

export async function getFeatures() {
  if (!isSupabaseConfigured) return fallbackFeatures;

  try {
    const { data, error } = await supabase
      .from('features')
      .select('id, title, description, icon')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (error) throw error;
    return data ?? [];
  } catch (err) {
    console.warn('[catalog] features fetch failed; using static fallback.', err);
    return fallbackFeatures;
  }
}

export async function getGallery() {
  if (!isSupabaseConfigured) return fallbackGallery;

  try {
    const { data, error } = await supabase
      .from('gallery')
      .select('id, title, image_url')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
      .order('id', { ascending: true });

    if (error) throw error;
    return data?.length ? data : fallbackGallery;
  } catch (err) {
    console.warn('[catalog] gallery fetch failed; using static lookbook.', err);
    return fallbackGallery;
  }
}
