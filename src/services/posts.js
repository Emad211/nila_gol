import { supabase, isSupabaseConfigured } from '../lib/supabase';

// Public read access for the blog. Like the gallery, there is no static
// fallback — if Supabase is unreachable the blog simply renders empty.

const LIST_FIELDS = 'id, slug, title, excerpt, cover_image_url, author, tags, published_at';
const FULL_FIELDS = 'id, slug, title, excerpt, content, cover_image_url, author, tags, published_at';

export async function getPosts() {
  if (!isSupabaseConfigured) return [];
  try {
    const { data, error } = await supabase
      .from('posts')
      .select(LIST_FIELDS)
      .eq('is_published', true)
      .order('published_at', { ascending: false, nullsFirst: false })
      .order('id', { ascending: false });
    if (error) throw error;
    return data ?? [];
  } catch (err) {
    console.warn('[blog] posts fetch failed.', err);
    return [];
  }
}

export async function getPost(slug) {
  if (!isSupabaseConfigured || !slug) return null;
  try {
    const { data, error } = await supabase
      .from('posts')
      .select(FULL_FIELDS)
      .eq('is_published', true)
      .eq('slug', slug)
      .maybeSingle();
    if (error) throw error;
    return data ?? null;
  } catch (err) {
    console.warn('[blog] post fetch failed.', err);
    return null;
  }
}

// Recent posts for the "more articles" rail, excluding the current one.
export async function getRecentPosts(excludeId, limit = 3) {
  const all = await getPosts();
  return all.filter((p) => p.id !== excludeId).slice(0, limit);
}
