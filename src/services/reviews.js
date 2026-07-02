import { supabase, isSupabaseConfigured } from '../lib/supabase';

// Public reviews access. Reads are limited by RLS to approved rows; submissions
// are forced unapproved (the owner moderates them in the admin panel).

export async function getApprovedReviews(limit = 12) {
  if (!isSupabaseConfigured) return [];
  try {
    const { data, error } = await supabase
      .from('reviews')
      .select('id, product_id, author_name, city, rating, body, photo_url, created_at')
      .eq('is_approved', true)
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) throw error;
    return data ?? [];
  } catch (err) {
    console.warn('[reviews] fetch failed.', err);
    return [];
  }
}

export async function getProductReviews(productId) {
  if (!isSupabaseConfigured || !productId) return [];
  try {
    const { data, error } = await supabase
      .from('reviews')
      .select('id, author_name, city, rating, body, photo_url, created_at')
      .eq('is_approved', true)
      .eq('product_id', productId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data ?? [];
  } catch (err) {
    console.warn('[reviews] product fetch failed.', err);
    return [];
  }
}

export async function submitReview({ product_id, author_name, city, rating, body }) {
  if (!isSupabaseConfigured) throw new Error('Supabase is not configured.');
  const { error } = await supabase.from('reviews').insert({
    product_id: product_id ?? null,
    author_name: author_name.trim(),
    city: city?.trim() || null,
    rating,
    body: body?.trim() || null,
    is_approved: false,
  });
  if (error) throw error;
}
