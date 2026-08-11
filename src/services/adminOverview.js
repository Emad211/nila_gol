import { supabase } from '../lib/supabase';

async function exactCount(table, apply = (query) => query) {
  let query = supabase.from(table).select('*', { count: 'exact', head: true });
  query = apply(query);
  const { count, error } = await query;
  if (error) throw error;
  return count ?? 0;
}

export async function getAdminOverview() {
  const [products, orders, pendingOrders, pendingReviews, unreadChat, inquiries, posts, gallery] =
    await Promise.all([
      exactCount('products'),
      exactCount('orders'),
      exactCount('orders', (query) => query.eq('status', 'pending')),
      exactCount('reviews', (query) => query.eq('is_approved', false)),
      exactCount('chat_messages', (query) => query.eq('sender', 'customer').is('read_at', null)),
      exactCount('inquiries'),
      exactCount('posts'),
      exactCount('gallery'),
    ]);

  return {
    products,
    orders,
    pendingOrders,
    pendingReviews,
    unreadChat,
    inquiries,
    posts,
    gallery,
  };
}
