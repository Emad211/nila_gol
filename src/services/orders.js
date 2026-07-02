import { supabase, isSupabaseConfigured } from '../lib/supabase';

// Customer order placement + history. Orders are COD (Gorgan) / post — no online
// payment yet. RLS lets a guest insert (user_id null) and a logged-in user read
// only their own orders.
export async function createOrder({ items, subtotal, customer_name, phone, city, address, postal_code, note, user_id, payment_method = 'cod' }) {
  if (!isSupabaseConfigured) throw new Error('سرویس در دسترس نیست.');
  const payload = {
    user_id: user_id ?? null,
    customer_name: (customer_name || '').trim(),
    phone: (phone || '').trim(),
    city: city?.trim() || null,
    address: address?.trim() || null,
    postal_code: postal_code?.trim() || null,
    note: note?.trim() || null,
    items: items ?? [],
    subtotal: subtotal ?? 0,
    payment_method: payment_method === 'online' ? 'online' : 'cod',
  };
  const { data, error } = await supabase.from('orders').insert(payload).select().single();
  if (error) throw error;
  return data;
}

// Returns the logged-in user's orders (RLS scopes to auth.uid()).
export async function listMyOrders() {
  if (!isSupabaseConfigured) return [];
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data ?? [];
  } catch (err) {
    console.warn('[orders] list failed.', err);
    return [];
  }
}
