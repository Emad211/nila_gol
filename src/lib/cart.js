export const MAX_CART_QTY = 99;

export function normalizeCartQty(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return 1;
  return Math.min(MAX_CART_QTY, Math.max(1, Math.floor(numeric)));
}
