import { createContext, useContext, useEffect, useMemo, useState } from 'react';

// Client-side cart, persisted to localStorage. Prices are integers in Toman and
// honour sale_price when present. SSR-safe: the cart starts empty on the server
// and on the first client render, then loads from localStorage in an effect — so
// the hydrated markup matches the pre-rendered HTML (no mismatch).
const CartContext = createContext(null);
const KEY = 'nila_cart';

export function CartProvider({ children }) {
  const [items, setItems] = useState([]);
  const [loaded, setLoaded] = useState(false);

  // Load the saved cart after mount (client only).
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(KEY));
      if (Array.isArray(saved) && saved.length) setItems(saved);
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
    setItems((prev) => {
      const found = prev.find((i) => i.id === product.id);
      if (found) return prev.map((i) => (i.id === product.id ? { ...i, qty: i.qty + qty } : i));
      const price = product.sale_price ?? product.price ?? 0;
      return [
        ...prev,
        {
          id: product.id,
          name: product.name,
          price,
          image_url: product.image_url ?? null,
          slug: product.slug ?? null,
          qty,
        },
      ];
    });
  };

  const remove = (id) => setItems((prev) => prev.filter((i) => i.id !== id));
  const setQty = (id, qty) =>
    setItems((prev) =>
      qty <= 0 ? prev.filter((i) => i.id !== id) : prev.map((i) => (i.id === id ? { ...i, qty } : i)),
    );
  const clear = () => setItems([]);

  const count = useMemo(() => items.reduce((s, i) => s + i.qty, 0), [items]);
  const subtotal = useMemo(() => items.reduce((s, i) => s + i.price * i.qty, 0), [items]);

  const value = { items, add, remove, setQty, clear, count, subtotal };
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within a CartProvider');
  return ctx;
}
