import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { normalizeCartQty } from '../lib/cart';

// Client-side cart, persisted to localStorage. Prices are integers in Toman and
// honour sale_price when present. SSR-safe: the cart starts empty on the server
// and on the first client render, then loads from localStorage in an effect — so
// the hydrated markup matches the pre-rendered HTML (no mismatch).
const CartContext = createContext(null);
const KEY = 'nila_cart';

function normalizeStoredItem(item) {
  if (!item || item.id == null || typeof item.name !== 'string' || !item.name.trim()) return null;
  const price = Number(item.price);
  return {
    id: item.id,
    name: item.name.trim(),
    price: Number.isFinite(price) && price >= 0 ? Math.floor(price) : 0,
    image_url: typeof item.image_url === 'string' ? item.image_url : null,
    slug: typeof item.slug === 'string' ? item.slug : null,
    qty: normalizeCartQty(item.qty),
  };
}

export function CartProvider({ children }) {
  const [items, setItems] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [lastAdded, setLastAdded] = useState(null);

  // Load the saved cart after mount (client only). Treat localStorage as untrusted:
  // discard malformed entries and clamp quantities before they reach the UI.
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(KEY));
      if (Array.isArray(saved) && saved.length) {
        const normalized = saved.map(normalizeStoredItem).filter(Boolean);
        if (normalized.length) setItems(normalized);
      }
    } catch {
      /* corrupt or blocked storage — ignore */
    }
    setLoaded(true);
  }, []);

  // Persist on change, but only after the initial load so we never clobber the
  // stored cart with the empty starting state.
  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(KEY, JSON.stringify(items));
    } catch {
      /* storage blocked — ignore */
    }
  }, [items, loaded]);

  const add = (product, qty = 1) => {
    if (!product) return false;

    if (product.availability === 'sold_out') {
      setLastAdded({
        id: product.id,
        name: product.name,
        unavailable: true,
        token: Date.now(),
      });
      return false;
    }

    const cleanQty = normalizeCartQty(qty);
    setItems((prev) => {
      const found = prev.find((i) => i.id === product.id);
      if (found) {
        return prev.map((i) =>
          i.id === product.id ? { ...i, qty: normalizeCartQty(i.qty + cleanQty) } : i,
        );
      }
      const rawPrice = Number(product.sale_price ?? product.price ?? 0);
      const price = Number.isFinite(rawPrice) && rawPrice >= 0 ? Math.floor(rawPrice) : 0;
      return [
        ...prev,
        {
          id: product.id,
          name: product.name,
          price,
          image_url: product.image_url ?? null,
          slug: product.slug ?? null,
          qty: cleanQty,
        },
      ];
    });
    // A monotonic token lets repeated clicks on the same product retrigger the
    // global confirmation without coupling product cards to notification UI.
    setLastAdded({ id: product.id, name: product.name, unavailable: false, token: Date.now() });
    return true;
  };

  const dismissLastAdded = () => setLastAdded(null);
  const remove = (id) => setItems((prev) => prev.filter((i) => i.id !== id));
  const setQty = (id, qty) =>
    setItems((prev) =>
      Number(qty) <= 0
        ? prev.filter((i) => i.id !== id)
        : prev.map((i) => (i.id === id ? { ...i, qty: normalizeCartQty(qty) } : i)),
    );
  const clear = () => {
    setItems([]);
    setLastAdded(null);
  };

  const count = useMemo(() => items.reduce((s, i) => s + i.qty, 0), [items]);
  const subtotal = useMemo(() => items.reduce((s, i) => s + i.price * i.qty, 0), [items]);

  const value = {
    items,
    add,
    remove,
    setQty,
    clear,
    count,
    subtotal,
    lastAdded,
    dismissLastAdded,
  };
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within a CartProvider');
  return ctx;
}
