import { supabase, isSupabaseConfigured } from '../lib/supabase';

async function sha256Hex(value) {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

// Customer order placement + history. Orders support online ZarinPal payment,
// COD in Gorgan, and post-shipping coordination. RLS lets a guest insert
// (user_id null) and a logged-in user read only their own orders.
export async function createOrder({ items, subtotal, customer_name, phone, city, address, postal_code, note, user_id, payment_method = 'cod' }) {
  if (!isSupabaseConfigured) throw new Error('سرویس در دسترس نیست.');

  // The public UUID is safe to display. Payment creation uses a separate 256-bit
  // capability so knowing an order reference alone cannot create/overwrite a
  // ZarinPal authority. Only its SHA-256 hash is persisted in Postgres.
  const publicId = crypto.randomUUID();
  const paymentToken = `${crypto.randomUUID()}${crypto.randomUUID()}`;
  const paymentTokenHash = await sha256Hex(paymentToken);

  const payload = {
    public_id: publicId,
    payment_token_hash: paymentTokenHash,
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

  // Do not call `.select()` here. Guest orders intentionally have no SELECT RLS
  // policy, and returning the inserted row would require read authorization.
  const { error } = await supabase.from('orders').insert(payload);
  if (error) throw error;

  return {
    id: publicId,
    public_id: publicId,
    payment_token: paymentToken,
    subtotal: subtotal ?? 0,
    payment_method: payload.payment_method,
  };
}

// Returns the logged-in user's orders (RLS scopes to auth.uid()).
export async function listMyOrders() {
  if (!isSupabaseConfigured) return [];
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('id, public_id, customer_name, phone, city, address, postal_code, note, items, subtotal, status, payment_method, payment_status, payment_ref_id, created_at, updated_at')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data ?? [];
  } catch (err) {
    console.warn('[orders] list failed.', err);
    return [];
  }
}
