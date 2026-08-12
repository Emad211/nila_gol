import './Cart.css';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FaShoppingBag, FaPlus, FaMinus, FaTrash, FaExclamationTriangle } from 'react-icons/fa';
import { useCart } from '../context/CartProvider';
import { MAX_CART_QTY } from '../lib/cart';
import { formatPrice } from '../lib/format';
import { setPageSeo, resetPageSeo } from '../lib/seo';

export default function Cart() {
  const { items, remove, setQty, syncCatalog, subtotal, count, loaded } = useCart();
  const [catalogChecked, setCatalogChecked] = useState(false);

  useEffect(() => {
    setPageSeo({
      title: 'سبد خرید | نیلا گل',
      description: 'سبد خرید گل‌های روسی و گل مصنوعی ماندگار نیلا گل.',
    });
    return () => resetPageSeo();
  }, []);

  // A persisted cart is only a client snapshot. Refresh it from the current
  // catalog before enabling checkout so price/availability changes are visible.
  useEffect(() => {
    if (!loaded) return undefined;
    let active = true;
    setCatalogChecked(false);

    import('../services/catalog')
      .then(({ getProducts }) => getProducts())
      .then((products) => {
        if (active) syncCatalog(products);
      })
      .catch((error) => {
        console.warn('[cart] catalog sync failed; server validation remains authoritative.', error);
      })
      .finally(() => {
        if (active) setCatalogChecked(true);
      });

    return () => {
      active = false;
    };
  }, [loaded, syncCatalog]);

  if (items.length === 0) {
    return (
      <div className="cart">
        <div className="container">
          <div className="cart-empty glass">
            <span className="cart-empty-icon"><FaShoppingBag aria-hidden="true" /></span>
            <h1 className="cart-empty-title">سبد خرید شما خالی است</h1>
            <p className="cart-empty-text">
              هنوز محصولی به سبد اضافه نکرده‌اید. از میان گل‌های ماندگار ما انتخاب کنید.
            </p>
            <Link to="/products" className="btn btn-primary">مشاهده محصولات</Link>
          </div>
        </div>
      </div>
    );
  }

  const hasUnavailable = items.some((item) => item.unavailable);
  const checkoutReady = catalogChecked && !hasUnavailable;

  return (
    <div className="cart">
      <div className="container">
        <h1 className="cart-title">سبد خرید</h1>
        <p className="cart-count">{count} کالا در سبد شما</p>

        <div className="cart-layout">
          <ul className="cart-items">
            {items.map((item) => (
              <li key={item.id} className={`cart-item ${item.unavailable ? 'is-unavailable' : ''}`}>
                <Link
                  to={item.slug ? `/products/${item.slug}` : '/products'}
                  className="cart-item-media"
                  aria-label={item.name}
                >
                  {item.image_url ? (
                    <img src={item.image_url} alt={item.name} loading="lazy" />
                  ) : (
                    <span className="cart-item-orb" aria-hidden="true" />
                  )}
                </Link>

                <div className="cart-item-body">
                  <Link
                    to={item.slug ? `/products/${item.slug}` : '/products'}
                    className="cart-item-name"
                  >
                    {item.name}
                  </Link>
                  <div className="cart-item-unit">
                    <span className="num">{formatPrice(item.price)}</span> تومان
                  </div>
                  {item.unavailable && (
                    <p className="cart-item-unavailable" role="status">
                      <FaExclamationTriangle aria-hidden="true" /> این محصول در حال حاضر قابل سفارش نیست.
                    </p>
                  )}

                  <div className="cart-item-controls">
                    <div className="qty-stepper" role="group" aria-label={`تعداد ${item.name}`}>
                      <button
                        type="button"
                        className="qty-btn"
                        onClick={() => setQty(item.id, item.qty - 1)}
                        aria-label="کاهش تعداد"
                      >
                        <FaMinus aria-hidden="true" />
                      </button>
                      <span className="qty-value num" aria-live="polite">{item.qty}</span>
                      <button
                        type="button"
                        className="qty-btn"
                        onClick={() => setQty(item.id, item.qty + 1)}
                        aria-label={item.qty >= MAX_CART_QTY ? `حداکثر تعداد ${MAX_CART_QTY} است` : 'افزایش تعداد'}
                        title={item.qty >= MAX_CART_QTY ? `حداکثر ${MAX_CART_QTY} عدد از هر محصول` : undefined}
                        disabled={item.qty >= MAX_CART_QTY}
                      >
                        <FaPlus aria-hidden="true" />
                      </button>
                    </div>

                    <button
                      type="button"
                      className="cart-item-remove"
                      onClick={() => remove(item.id)}
                      aria-label={`حذف ${item.name} از سبد`}
                    >
                      <FaTrash aria-hidden="true" />
                      <span>حذف</span>
                    </button>
                  </div>
                </div>

                <div className="cart-item-line">
                  <span className="cart-item-line-amount">
                    <span className="num">{formatPrice(item.price * item.qty)}</span> تومان
                  </span>
                </div>
              </li>
            ))}
          </ul>

          <aside className="cart-summary glass">
            <h2 className="cart-summary-title">خلاصه سفارش</h2>
            <div className="cart-summary-row">
              <span>جمع کل</span>
              <span className="cart-summary-amount">
                <span className="num">{formatPrice(subtotal)}</span> تومان
              </span>
            </div>
            {!catalogChecked ? (
              <p className="cart-summary-note" role="status">در حال بررسی قیمت و موجودی فعلی سبد…</p>
            ) : hasUnavailable ? (
              <p className="cart-summary-warning" role="alert">
                <FaExclamationTriangle aria-hidden="true" /> برای ادامه، محصول ناموجود را از سبد حذف یا جایگزین کنید.
              </p>
            ) : (
              <p className="cart-summary-note">
                قیمت و موجودی با کاتالوگ فعلی بررسی شد. هزینه ارسال هنگام هماهنگی سفارش محاسبه می‌شود.
              </p>
            )}

            {checkoutReady ? (
              <Link to="/checkout" className="btn btn-primary cart-checkout-btn">
                تکمیل سفارش
              </Link>
            ) : (
              <button type="button" className="btn btn-primary cart-checkout-btn" disabled>
                {catalogChecked ? 'سبد نیاز به بازبینی دارد' : 'در حال بررسی سبد…'}
              </button>
            )}
            <Link to="/products" className="cart-continue">ادامه خرید</Link>
          </aside>
        </div>
      </div>
    </div>
  );
}
