import { supabase, isSupabaseConfigured } from '../lib/supabase';

// Online payment via the `payment` Edge Function (ZarinPal). The merchant id and
// the verification both live server-side; the browser only kicks off the payment
// and confirms the result on return.

const ZARINPAL_GATEWAY_HOSTS = new Set([
  'payment.zarinpal.com',
  'sandbox.zarinpal.com',
]);

// Defense in depth: the Edge Function already constructs the gateway URL from a
// hard-coded ZarinPal base. Validate it again before the browser is ever allowed
// to leave the storefront so a malformed/compromised response cannot become an
// arbitrary external redirect.
export function validatePaymentGatewayUrl(value) {
  let url;
  try {
    url = new URL(String(value));
  } catch {
    throw new Error('آدرس درگاه پرداخت معتبر نیست.');
  }

  if (
    url.protocol !== 'https:' ||
    !ZARINPAL_GATEWAY_HOSTS.has(url.hostname) ||
    !url.pathname.startsWith('/pg/StartPay/')
  ) {
    throw new Error('آدرس درگاه پرداخت معتبر نیست.');
  }

  return url.toString();
}

// Create a transaction for an existing order. `paymentToken` is a high-entropy
// capability created with the order; knowing/displaying the public order UUID is
// not sufficient to create or overwrite a gateway authority.
export async function startPayment(orderId, paymentToken) {
  if (!isSupabaseConfigured) throw new Error('سرویس پرداخت در دسترس نیست.');
  if (!orderId || !paymentToken) throw new Error('مجوز پرداخت سفارش ناقص است.');

  const { data, error } = await supabase.functions.invoke('payment', {
    body: {
      action: 'create',
      order_id: orderId,
      payment_token: paymentToken,
      origin: window.location.origin,
    },
  });
  if (error) throw new Error(error.message || 'اتصال به درگاه پرداخت ممکن نشد.');
  if (data?.error) throw new Error(data.error);
  if (!data?.url) throw new Error('آدرس درگاه پرداخت دریافت نشد.');
  return validatePaymentGatewayUrl(data.url);
}

// Confirm a payment on return from the gateway. Verification does not need the
// creation token: it requires the unguessable public order UUID AND an authority
// that must exactly match the authority previously stored by the server.
export async function verifyPayment({ orderId, authority, status }) {
  if (!isSupabaseConfigured) throw new Error('سرویس پرداخت در دسترس نیست.');
  const { data, error } = await supabase.functions.invoke('payment', {
    body: { action: 'verify', order_id: orderId, authority, status },
  });
  if (error) throw new Error(error.message || 'تأیید پرداخت ناموفق بود.');
  return data;
}
