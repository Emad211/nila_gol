// Format a price for display with thousands separators.
// Accepts a number (450000) or a pre-formatted string ("450,000") and always
// returns a grouped string ("450,000"), so DB rows and static fallback data
// render identically.
export function formatPrice(value) {
  const number =
    typeof value === 'number' ? value : Number(String(value ?? '').replace(/[^\d.]/g, ''));

  if (!Number.isFinite(number)) return String(value ?? '');

  return number.toLocaleString('en-US');
}

// Format an ISO date as a Persian (Jalali) date, e.g. "۱۴ خرداد ۱۴۰۵".
export function formatDate(value) {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  try {
    return new Intl.DateTimeFormat('fa-IR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(d);
  } catch {
    return d.toLocaleDateString();
  }
}
