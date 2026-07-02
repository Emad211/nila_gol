import './Cart.css';
import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaShoppingBag, FaPlus, FaMinus, FaTrash } from 'react-icons/fa';
import { useCart } from '../context/CartProvider';
import { formatPrice } from '../lib/format';
import { setPageSeo, resetPageSeo } from '../lib/seo';

export default function Cart() {
  const { items, remove, setQty, subtotal, count } = useCart();

  useEffect(() => {
    setPageSeo({
      title: 'سبد خرید | نیلا گل',
      description: 'سبد خرید گل‌های روسی و گل مصنوعی ماندگار نیلا گل.',
    });
    return () => resetPageSeo();
  }, []);

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

  return (
    <div className="cart">
      <div className="container">
        <h1 className="cart-title">سبد خرید</h1>
        <p className="cart-count">{count} کالا در سبد شما</p>

        <div className="cart-layout">
          <ul className="cart-items">
            {items.map((item) => (
              <li key={item.id} className="cart-item">
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
                        aria-label="افزایش تعداد"
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
            <p className="cart-summary-note">
              هزینه ارسال هنگام هماهنگی سفارش محاسبه می‌شود (پرداخت درب منزل در گرگان، ارسال پستی به سایر شهرها).
            </p>
            <Link to="/checkout" className="btn btn-primary cart-checkout-btn">
              تکمیل سفارش
            </Link>
            <Link to="/products" className="cart-continue">ادامه خرید</Link>
          </aside>
        </div>
      </div>
    </div>
  );
}
