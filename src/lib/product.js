// Shared product display helpers used by ProductCard and the product detail page.

// Primary image first, then any extra gallery images, de-duplicated.
export function productImages(product) {
  if (!product) return [];
  const list = [product.image_url, ...(product.images || [])].filter(Boolean);
  return [...new Set(list)];
}

// Resolve the effective price + whether a discount applies.
export function priceInfo(product) {
  const price = Number(product?.price) || 0;
  const sale = product?.sale_price != null ? Number(product.sale_price) : null;
  const hasSale = sale != null && sale > 0 && sale < price;
  return {
    hasSale,
    current: hasSale ? sale : price,
    original: price,
    discountPct: hasSale ? Math.round((1 - sale / price) * 100) : 0,
  };
}

export const AVAILABILITY = {
  in_stock: { label: 'موجود', tone: 'ok' },
  made_to_order: { label: 'سفارشی‌دوز', tone: 'warn' },
  sold_out: { label: 'ناموجود', tone: 'off' },
};

export function availabilityInfo(product) {
  return AVAILABILITY[product?.availability] || AVAILABILITY.in_stock;
}
