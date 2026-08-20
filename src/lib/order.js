import { config } from '../data/config';

// Normalise an Iranian number to international WhatsApp format (e.g. 0912... -> 98912...).
function waNumber() {
  let n = (config.contact.whatsapp || '').replace(/[^\d]/g, '');
  if (n.startsWith('00')) n = n.slice(2);
  if (n.startsWith('0')) n = '98' + n.slice(1);
  else if (n.length === 10 && n.startsWith('9')) n = '98' + n;
  return n;
}

export function whatsappUrl(text) {
  const n = waNumber();
  const base = `https://wa.me/${n}`;
  return text ? `${base}?text=${encodeURIComponent(text)}` : base;
}

export function whatsappOrderUrl(product) {
  const text = product?.name
    ? `سلام 🌸 برای سفارش «${product.name}» می‌خواستم هماهنگ کنم.`
    : 'سلام 🌸 برای سفارش گل می‌خواستم هماهنگ کنم.';
  return whatsappUrl(text);
}

// Customer-facing order code. New orders use public UUIDs, but legacy numeric
// rows remain readable after the migration.
export function orderPublicCode(orderOrRef) {
  const ref =
    orderOrRef && typeof orderOrRef === 'object'
      ? orderOrRef.public_id || orderOrRef.id
      : orderOrRef;
  const value = String(ref || '');
  return value.includes('-') ? value.split('-')[0].toUpperCase() : value;
}

export function telegramUrl() {
  return config.contact.telegram || '';
}

// Bale (بله) — Iranian messenger. Returns the full profile deep-link.
export function baleUrl() {
  return config.contact.bale || '';
}
