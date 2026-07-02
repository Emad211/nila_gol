import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { products as fallbackProducts, features as fallbackFeatures } from '../data/products';

// Data access for the public catalog. Each function reads from Supabase and
// degrades gracefully to bundled static data when Supabase is unconfigured or
// unreachable, so the marketing site never renders a hard error.

const PRODUCT_FIELDS =
  'id, slug, name, description, price, sale_price, category, features, image_url, images, is_featured, availability';

export async function getProducts() {
  if (!isSupabaseConfigured) return fallbackProducts;

  try {
    const { data, error } = await supabase
      .from('products')
      .select(PRODUCT_FIELDS)
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (error) throw error;
    return data ?? [];
  } catch (err) {
    console.warn('[catalog] products fetch failed; using static fallback.', err);
    return fallbackProducts;
  }
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

// Gallery has no static fallback — an empty list simply hides the section.
export async function getGallery() {
  if (!isSupabaseConfigured) return [];

  try {
    const { data, error } = await supabase
      .from('gallery')
      .select('id, title, image_url')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
      .order('id', { ascending: true });

    if (error) throw error;
    return data ?? [];
  } catch (err) {
    console.warn('[catalog] gallery fetch failed.', err);
    return [];
  }
}
