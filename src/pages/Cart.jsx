import './Cart.css';
import './CartIntegrity.css';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FaShoppingBag, FaPlus, FaMinus, FaTrash, FaExclamationTriangle, FaTruck, FaUndoAlt, FaLock } from 'react-icons/fa';
import { useCart } from '../context/CartProvider';
import { MAX_CART_QTY } from '../lib/cart';
import { formatPrice } from '../lib/format';
import { priceInfo } from '../lib/product';
import { setPageSeo, resetPageSeo } from '../lib/seo';

export default function Cart() {
  const { items, add, remove, setQty, syncCatalog, subtotal, count, loaded } = useCart();
  const [catalogChecked, setCatalogChecked] = useState(false);
  const [catalogError, setCatalogError] = useState('');
  const [suggestions, setSuggestions] = useState([]);

  useEffect(() => {
    setPageSeo({
      title: 'سبد خرید | نیلا گل',
      description: 'سبد خرید گل‌های روسی و گل مصنوعی ماندگار نیلا گل.',
    });
    return () => resetPageSeo();
  }, []);

  // A persisted cart is only a client snapshot. Refresh it from the strict
  // order-validation catalog before enabling checkout so a network failure can
  // never make bundled fallback prices look like confirmed live prices.
  useEffect(() => {
    if (!loaded) return undefined;
    let active = true;
    setCatalogChecked(false);
    setCatalogError('');

    import('../services/catalog')
      .then(({ getOrderValidationProducts }) => getOrderValidationProducts())
      .then((products) => {
        if (!active) return;
        syncCatalog(products);
        setCatalogChecked(true);
      })
      .catch((error) => {
        console.warn('[cart] live catalog validation failed.', error);
        if (active) {
          setCatalogError('در حال حاضر امکان تأیید قیمت و موجودی سبد وجود ندارد. لطفاً کمی بعد دوباره تلاش کنید.');
        }
      });

    return () => {
      active = false;
    };
  }, [loaded, syncCatalog]);

  // Cross-sell rail: suggest a few active products the shopper doesn't already
  // have in the cart. Purely additive and best-effort — a fetch failure just
  // hides the rail (getProducts returns the static fallback / [] on error).
  useEffect(() => {
    let active = true;
    const inCart = new Set(items.map((item) => item.id));
    import('../services/catalog')
      .then(({ getProducts }) => getProducts())
      .then((products) => {
        if (!active) return;
        const picks = (Array.isArray(products) ? products : [])
          .filter((p) => !inCart.has(p.id) && p.availability !== 'sold_out')
          .slice(0, 3);
        setSuggestions(picks);
      })
      .catch(() => {
        if (active) setSuggestions([]);
      });
    return () => {
      active = false;
    };
    // Re-run when the set of cart item ids changes so bought items drop out.
  }, [items]);

  if (!loaded) {
    return (
      <div className="cart">
        <div className="container">
          <div className="cart-empty glass" role="status">
            <p className="catalog-state">در حال بازیابی سبد خرید…</p>
          </div>
        </div>
      </div>
    );
  }

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
  const checkoutReady = catalogChecked && !catalogError && !hasUnavailable;

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
            {catalogError ? (
              <p className="cart-summary-warning" role="alert">
                <FaExclamationTriangle aria-hidden="true" /> {catalogError}
              </p>
            ) : !catalogChecked ? (
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

            <ul className="cart-reassure" aria-label="مزایای خرید">
              <li><FaTruck aria-hidden="true" /> ارسال رایگان در گرگان</li>
              <li><FaUndoAlt aria-hidden="true" /> ۷ روز ضمانت بازگشت</li>
              <li><FaLock aria-hidden="true" /> پرداخت امن زرین‌پال</li>
            </ul>

            {checkoutReady ? (
              <Link to="/checkout" className="btn btn-primary cart-checkout-btn">
                تکمیل سفارش
              </Link>
            ) : (
              <button type="button" className="btn btn-primary cart-checkout-btn" disabled>
                {catalogError
                  ? 'تأیید سبد ممکن نیست'
                  : catalogChecked
                    ? 'سبد نیاز به بازبینی دارد'
                    : 'در حال بررسی سبد…'}
              </button>
            )}
            <Link to="/products" className="cart-continue">ادامه خرید</Link>
          </aside>
        </div>

        {suggestions.length > 0 && (
          <section className="cart-crosssell" aria-labelledby="cart-crosssell-title">
            <h2 id="cart-crosssell-title" className="cart-crosssell-title">شاید این‌ها را هم بپسندید</h2>
            <div className="cart-crosssell-grid">
              {suggestions.map((product) => {
                const price = priceInfo(product);
                const href = `/products/${product.slug || product.id}`;
                return (
                  <article className="cart-xsell-card" key={product.id}>
                    <Link to={href} className="cart-xsell-media" aria-label={`مشاهده ${product.name}`}>
                      {product.image_url ? (
                        <img src={product.image_url} alt={product.name} loading="lazy" decoding="async" />
                      ) : (
                        <span className="cart-xsell-orb" aria-hidden="true" />
                      )}
                      {price.hasSale && (
                        <span className="cart-xsell-badge"><b className="num">{price.discountPct}٪</b> تخفیف</span>
                      )}
                    </Link>
                    <div className="cart-xsell-body">
                      <Link to={href} className="cart-xsell-name">{product.name}</Link>
                      <div className="cart-xsell-price-row">
                        <div className="cart-xsell-price">
                          {price.hasSale && <del><span className="num">{formatPrice(price.original)}</span> تومان</del>}
                          <strong><span className="num">{formatPrice(price.current)}</span> تومان</strong>
                        </div>
                        <button
                          type="button"
                          className="cart-xsell-add"
                          onClick={() => add(product)}
                          aria-label={`افزودن ${product.name} به سبد خرید`}
                        >
                          <FaPlus aria-hidden="true" />
                          <span>افزودن</span>
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
