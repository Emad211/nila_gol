import { config } from '../data/config';

// Normalise an Iranian number to international WhatsApp format (e.g. 0912... -> 98912...).
function waNumber() {
  let n = (config.contact.whatsapp || config.contact.phone || '').replace(/[^\d]/g, '');
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

// Per-product order link with a pre-filled Persian message naming the product —
// the owner instantly knows which item the customer wants.
export function whatsappOrderUrl(product) {
  const text = product?.name
    ? `سلام 🌸 برای سفارش «${product.name}» می‌خواستم هماهنگ کنم.`
    : 'سلام 🌸 برای سفارش گل می‌خواستم هماهنگ کنم.';
  return whatsappUrl(text);
}

export function telegramUrl() {
  return config.contact.telegram || '';
}

export function phoneUrl() {
  return `tel:${config.contact.phone}`;
}
