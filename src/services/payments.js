import { supabase, isSupabaseConfigured } from '../lib/supabase';

// Online payment via the `payment` Edge Function (ZarinPal). The merchant id and
// the verification both live server-side; the browser only kicks off the payment
// and confirms the result on return.

// Create a transaction for an existing order and return the gateway redirect URL.
export async function startPayment(orderId) {
  if (!isSupabaseConfigured) throw new Error('سرویس پرداخت در دسترس نیست.');
  const { data, error } = await supabase.functions.invoke('payment', {
    body: { action: 'create', order_id: orderId, origin: window.location.origin },
  });
  if (error) throw new Error(error.message || 'اتصال به درگاه پرداخت ممکن نشد.');
  if (data?.error) throw new Error(data.error);
  if (!data?.url) throw new Error('آدرس درگاه پرداخت دریافت نشد.');
  return data.url;
}

// Confirm a payment on return from the gateway. Returns { ok, ref_id, reason }.
export async function verifyPayment({ orderId, authority, status }) {
  if (!isSupabaseConfigured) throw new Error('سرویس پرداخت در دسترس نیست.');
  const { data, error } = await supabase.functions.invoke('payment', {
    body: { action: 'verify', order_id: orderId, authority, status },
  });
  if (error) throw new Error(error.message || 'تأیید پرداخت ناموفق بود.');
  return data;
}
