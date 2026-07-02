import { supabase } from '../lib/supabase';
import { slugify } from '../lib/slug';

// Admin-only data access. Every write is additionally guarded by RLS
// (public.is_admin()), so these calls only succeed for an authenticated admin.

const MEDIA_BUCKET = 'media';

// ── Storage ───────────────────────────────────────────────────────────────
export async function uploadImage(file, folder = 'products') {
  const safeExt = (file.name.split('.').pop() || 'jpg').toLowerCase();
  const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${safeExt}`;

  const { error } = await supabase.storage
    .from(MEDIA_BUCKET)
    .upload(path, file, { cacheControl: '3600', upsert: false });
  if (error) throw error;

  const { data } = supabase.storage.from(MEDIA_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

// Best-effort removal of a previously uploaded media object given its public URL.
export async function removeImageByUrl(url) {
  if (!url) return;
  const marker = `/${MEDIA_BUCKET}/`;
  const idx = url.indexOf(marker);
  if (idx === -1) return;
  const path = url.slice(idx + marker.length);
  await supabase.storage.from(MEDIA_BUCKET).remove([path]);
}

// ── Products ──────────────────────────────────────────────────────────────
export async function listAllProducts() {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .order('sort_order', { ascending: true })
    .order('id', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function createProduct(payload) {
  const body = { ...payload, slug: payload.slug || slugify(payload.name) };
  let res = await supabase.from('products').insert(body).select().single();
  if (res.error && res.error.code === '23505') {
    // slug already taken — append a short suffix and retry
    body.slug = `${body.slug}-${Math.random().toString(36).slice(2, 6)}`;
    res = await supabase.from('products').insert(body).select().single();
  }
  if (res.error) throw res.error;
  return res.data;
}

export async function updateProduct(id, payload) {
  const { data, error } = await supabase
    .from('products')
    .update(payload)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteProduct(id) {
  const { error } = await supabase.from('products').delete().eq('id', id);
  if (error) throw error;
}

// ── Features (the "why choose us" cards) ──────────────────────────────────
export async function listAllFeatures() {
  const { data, error } = await supabase
    .from('features')
    .select('*')
    .order('sort_order', { ascending: true })
    .order('id', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function createFeature(payload) {
  const { data, error } = await supabase.from('features').insert(payload).select().single();
  if (error) throw error;
  return data;
}

export async function updateFeature(id, payload) {
  const { data, error } = await supabase
    .from('features')
    .update(payload)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteFeature(id) {
  const { error } = await supabase.from('features').delete().eq('id', id);
  if (error) throw error;
}

// ── Gallery ───────────────────────────────────────────────────────────────
export async function listAllGallery() {
  const { data, error } = await supabase
    .from('gallery')
    .select('*')
    .order('sort_order', { ascending: true })
    .order('id', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function createGalleryItem(payload) {
  const { data, error } = await supabase.from('gallery').insert(payload).select().single();
  if (error) throw error;
  return data;
}

export async function updateGalleryItem(id, payload) {
  const { data, error } = await supabase
    .from('gallery')
    .update(payload)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteGalleryItem(id) {
  const { error } = await supabase.from('gallery').delete().eq('id', id);
  if (error) throw error;
}

// ── Inquiries (contact-form leads) ────────────────────────────────────────
export async function listInquiries() {
  const { data, error } = await supabase
    .from('inquiries')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function deleteInquiry(id) {
  const { error } = await supabase.from('inquiries').delete().eq('id', id);
  if (error) throw error;
}

// ── Reviews (moderation) ──────────────────────────────────────────────────
export async function listAllReviews() {
  const { data, error } = await supabase
    .from('reviews')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function createReview(payload) {
  const { data, error } = await supabase
    .from('reviews')
    .insert({ ...payload, is_approved: true })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function setReviewApproved(id, is_approved) {
  const { error } = await supabase.from('reviews').update({ is_approved }).eq('id', id);
  if (error) throw error;
}

export async function deleteReview(id) {
  const { error } = await supabase.from('reviews').delete().eq('id', id);
  if (error) throw error;
}

// ── Posts (blog / articles) ───────────────────────────────────────────────
export async function listAllPosts() {
  const { data, error } = await supabase
    .from('posts')
    .select('*')
    .order('published_at', { ascending: false, nullsFirst: false })
    .order('id', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

// Stamp published_at the first time a post goes live (keeps ordering stable).
function withPublishMeta(payload) {
  const body = { ...payload };
  if (body.is_published && !body.published_at) {
    body.published_at = new Date().toISOString();
  }
  return body;
}

export async function createPost(payload) {
  const body = withPublishMeta({ ...payload, slug: payload.slug || slugify(payload.title) });
  let res = await supabase.from('posts').insert(body).select().single();
  if (res.error && res.error.code === '23505') {
    // slug already taken — append a short suffix and retry
    body.slug = `${body.slug}-${Math.random().toString(36).slice(2, 6)}`;
    res = await supabase.from('posts').insert(body).select().single();
  }
  if (res.error) throw res.error;
  return res.data;
}

export async function updatePost(id, payload) {
  const body = withPublishMeta(payload);
  const { data, error } = await supabase
    .from('posts')
    .update(body)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deletePost(id) {
  const { error } = await supabase.from('posts').delete().eq('id', id);
  if (error) throw error;
}

// ── Orders ────────────────────────────────────────────────────────────────
export async function listAllOrders() {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function updateOrderStatus(id, status) {
  const { error } = await supabase.from('orders').update({ status }).eq('id', id);
  if (error) throw error;
}

export async function deleteOrder(id) {
  const { error } = await supabase.from('orders').delete().eq('id', id);
  if (error) throw error;
}

// ── Chat (live customer support) ───────────────────────────────────────────
// Group all messages into per-customer threads (newest first) with unread count.
export async function listChatThreads() {
  const { data, error } = await supabase
    .from('chat_messages')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  const threads = new Map();
  for (const m of data ?? []) {
    if (!threads.has(m.user_id)) {
      threads.set(m.user_id, { user_id: m.user_id, email: null, last: m, unread: 0 });
    }
    const t = threads.get(m.user_id);
    if (m.customer_email && !t.email) t.email = m.customer_email;
    if (m.sender === 'customer' && !m.read_at) t.unread += 1;
  }
  return [...threads.values()];
}

export async function getThreadMessages(userId) {
  const { data, error } = await supabase
    .from('chat_messages')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function sendAdminMessage(userId, body, customerEmail = null) {
  const { data, error } = await supabase
    .from('chat_messages')
    .insert({ user_id: userId, sender: 'admin', body: body.trim(), customer_email: customerEmail })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function markThreadRead(userId) {
  const { error } = await supabase
    .from('chat_messages')
    .update({ read_at: new Date().toISOString() })
    .eq('user_id', userId)
    .eq('sender', 'customer')
    .is('read_at', null);
  if (error) throw error;
}

// Realtime: notify on every new chat message (admin panel). Returns unsubscribe.
export function subscribeAllChat(onInsert) {
  const channel = supabase
    .channel('chat-admin-all')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages' }, (payload) =>
      onInsert(payload.new),
    )
    .subscribe();
  return () => supabase.removeChannel(channel);
}
