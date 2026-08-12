import './Checkout.css';
import './CheckoutIntegrity.css';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FaWhatsapp, FaCheckCircle, FaCreditCard, FaTruck, FaExclamationTriangle } from 'react-icons/fa';
import { useCart } from '../context/CartProvider';
import { useAuth } from '../context/AuthProvider';
import { createOrder } from '../services/orders';
import { startPayment } from '../services/payments';
import { formatPrice } from '../lib/format';
import { whatsappUrl } from '../lib/order';
import { setPageSeo, resetPageSeo } from '../lib/seo';

const toLatinDigits = (s = '') =>
  s
    .replace(/[۰-۹]/g, (d) => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d))
    .replace(/[٠-٩]/g, (d) => '٠١٢٣٤٥٦٧٨٩'.indexOf(d));

const publicOrderCode = (value) => String(value || '').split('-')[0].toUpperCase();

export default function Checkout() {
  const { items, subtotal, clear, loaded, syncCatalog } = useCart();
  const { user } = useAuth();

  const [form, setForm] = useState({
    customer_name: '',
    phone: '',
    city: '',
    address: '',
    postal_code: '',
    note: '',
  });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [placed, setPlaced] = useState(null);
  const [payMethod, setPayMethod] = useState('online');
  const [catalogChecked, setCatalogChecked] = useState(false);
  const [catalogError, setCatalogError] = useState('');

  const hasUnavailable = items.some((item) => item.unavailable);
  const checkoutReady = loaded && catalogChecked && !catalogError && !hasUnavailable;

  useEffect(() => {
    setPageSeo({
      title: 'تکمیل سفارش | نیلا گل',
      description: 'ثبت سفارش گل‌های ماندگار نیلا گل — پرداخت آنلاین امن با زرین‌پال یا پرداخت درب منزل در گرگان و ارسال پستی به سراسر کشور.',
    });
    return () => resetPageSeo();
  }, []);

  useEffect(() => {
    if (!loaded) return undefined;
    if (items.length === 0) {
      setCatalogChecked(true);
      setCatalogError('');
      return undefined;
    }

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
        console.warn('[checkout] live catalog validation failed.', error);
        if (active) {
          setCatalogError('در حال حاضر امکان تأیید قیمت و موجودی سبد وجود ندارد. لطفاً کمی بعد دوباره تلاش کنید.');
        }
      });

    return () => {
      active = false;
    };
    // syncCatalog updates the cart snapshot; do not restart this pass recursively.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded, syncCatalog]);

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const validate = () => {
    const next = {};
    if (!form.customer_name.trim()) next.customer_name = 'نام و نام خانوادگی را وارد کنید.';
    const phone = toLatinDigits(form.phone).trim();
    if (!phone) next.phone = 'شماره تماس را وارد کنید.';
    else if (!/^0?\d{10,11}$/.test(phone.replace(/[\s-]/g, '')))
      next.phone = 'شماره تماس معتبر نیست.';
    if (!form.city.trim()) next.city = 'شهر را وارد کنید.';
    if (!form.address.trim()) next.address = 'آدرس دقیق پستی را وارد کنید.';
    const pc = toLatinDigits(form.postal_code).replace(/[\s-]/g, '');
    if (!pc) next.postal_code = 'کد پستی را وارد کنید.';
    else if (!/^\d{10}$/.test(pc)) next.postal_code = 'کد پستی باید ۱۰ رقم باشد.';
    setErrors(next);
    return next;
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');

    if (catalogError) {
      setSubmitError(catalogError);
      return;
    }
    if (!catalogChecked) {
      setSubmitError('در حال بررسی قیمت و موجودی سبد هستیم. چند لحظه صبر کنید.');
      return;
    }
    if (hasUnavailable) {
      setSubmitError('یک یا چند محصول دیگر قابل سفارش نیست. لطفاً سبد خرید را بازبینی کنید.');
      return;
    }

    const validationErrors = validate();
    const firstInvalid = Object.keys(validationErrors)[0];
    if (firstInvalid) {
      window.requestAnimationFrame(() => {
        document.querySelector(`[name="${firstInvalid}"]`)?.focus();
      });
      return;
    }

    setSaving(true);
    try {
      const order = await createOrder({
        items,
        subtotal,
        customer_name: form.customer_name,
        phone: toLatinDigits(form.phone),
        city: form.city,
        address: form.address,
        postal_code: toLatinDigits(form.postal_code),
        note: form.note,
        user_id: user?.id,
        payment_method: payMethod,
      });
      if (payMethod === 'online') {
        const url = await startPayment(order.id, order.payment_token);
        window.location.href = url;
        return;
      }
      clear();
      setPlaced(order);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setSubmitError(err?.message || 'ثبت سفارش با خطا مواجه شد. لطفاً دوباره تلاش کنید.');
    } finally {
      setSaving(false);
    }
  };

  if (placed) {
    const code = publicOrderCode(placed.public_id || placed.id);
    const waText = `سلام 🌸 سفارش من با کد #${code} ثبت شد. ممنون می‌شوم برای هماهنگی پیگیری کنید.`;
    return (
      <div className="checkout">
        <div className="container">
          <div className="checkout-success glass">
            <span className="checkout-success-icon"><FaCheckCircle aria-hidden="true" /></span>
            <h1 className="checkout-success-title">سفارش شما ثبت شد</h1>
            <p className="checkout-success-id">
              کد پیگیری سفارش: <strong className="num">#{code}</strong>
            </p>
            <p className="checkout-success-text">
              از خرید شما سپاسگزاریم. به‌زودی از طریق تماس تلفنی یا واتساپ برای هماهنگی نهایی با شما
              در ارتباط خواهیم بود. در گرگان پرداخت درب منزل انجام می‌شود و برای سایر شهرها ارسال پستی هماهنگ خواهد شد.
            </p>
            <div className="checkout-success-actions">
              <a
                className="btn btn-primary"
                href={whatsappUrl(waText)}
                target="_blank"
                rel="noopener noreferrer"
              >
                <FaWhatsapp aria-hidden="true" /> پیگیری در واتساپ
              </a>
              <Link to="/products" className="btn btn-secondary">ادامه خرید</Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!loaded) {
    return (
      <div className="checkout">
        <div className="container">
          <div className="checkout-empty glass" role="status">
            <p className="catalog-state">در حال بازیابی و بررسی سبد خرید…</p>
          </div>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="checkout">
        <div className="container">
          <div className="checkout-empty glass">
            <h1 className="checkout-empty-title">سبد خرید شما خالی است</h1>
            <p className="checkout-empty-text">
              برای تکمیل سفارش ابتدا محصولی به سبد اضافه کنید.
            </p>
            <Link to="/products" className="btn btn-primary">مشاهده محصولات</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="checkout">
      <div className="container">
        <h1 className="checkout-title">تکمیل سفارش</h1>

        <div className="checkout-layout">
          <aside className="checkout-summary glass" aria-label="خلاصه سفارش">
            <h2 className="checkout-summary-title">خلاصه سفارش</h2>
            <ul className="checkout-summary-items">
              {items.map((item) => (
                <li key={item.id} className={`checkout-summary-item ${item.unavailable ? 'is-unavailable' : ''}`}>
                  <span className="checkout-summary-item-name">
                    {item.name}
                    <span className="checkout-summary-item-qty num"> × {item.qty}</span>
                  </span>
                  <span className="checkout-summary-item-amount">
                    <span className="num">{formatPrice(item.price * item.qty)}</span> تومان
                  </span>
                </li>
              ))}
            </ul>
            <div className="checkout-summary-total">
              <span>جمع کل</span>
              <span className="checkout-summary-total-amount">
                <span className="num">{formatPrice(subtotal)}</span> تومان
              </span>
            </div>

            {catalogError ? (
              <p className="checkout-summary-warning" role="alert">
                <FaExclamationTriangle aria-hidden="true" /> {catalogError}
              </p>
            ) : !catalogChecked ? (
              <p className="checkout-summary-check" role="status">در حال تأیید قیمت و موجودی فعلی…</p>
            ) : hasUnavailable ? (
              <div className="checkout-summary-warning" role="alert">
                <FaExclamationTriangle aria-hidden="true" />
                <span>یک یا چند محصول دیگر قابل سفارش نیست. <Link to="/cart">بازبینی سبد خرید</Link></span>
              </div>
            ) : (
              <p className="checkout-summary-check is-ok">قیمت و موجودی فعلی سبد تأیید شد.</p>
            )}
          </aside>

          <form className="checkout-form" onSubmit={onSubmit} noValidate aria-busy={saving || !catalogChecked}>
            <div className="field">
              <label htmlFor="co-name" className="field-label">نام و نام خانوادگی *</label>
              <input
                id="co-name"
                name="customer_name"
                type="text"
                className={`field-input ${errors.customer_name ? 'field-input--error' : ''}`}
                value={form.customer_name}
                onChange={onChange}
                autoComplete="name"
                required
                aria-invalid={errors.customer_name ? 'true' : undefined}
                aria-describedby={errors.customer_name ? 'co-name-err' : undefined}
              />
              {errors.customer_name && (
                <span id="co-name-err" className="field-error">{errors.customer_name}</span>
              )}
            </div>

            <div className="field">
              <label htmlFor="co-phone" className="field-label">شماره تماس *</label>
              <input
                id="co-phone"
                name="phone"
                type="tel"
                inputMode="tel"
                dir="ltr"
                className={`field-input field-input--ltr ${errors.phone ? 'field-input--error' : ''}`}
                value={form.phone}
                onChange={onChange}
                autoComplete="tel"
                placeholder="09xxxxxxxxx"
                required
                aria-invalid={errors.phone ? 'true' : undefined}
                aria-describedby={errors.phone ? 'co-phone-err' : undefined}
              />
              {errors.phone && (
                <span id="co-phone-err" className="field-error">{errors.phone}</span>
              )}
            </div>

            <div className="field">
              <label htmlFor="co-city" className="field-label">شهر *</label>
              <input
                id="co-city"
                name="city"
                type="text"
                className={`field-input ${errors.city ? 'field-input--error' : ''}`}
                value={form.city}
                onChange={onChange}
                autoComplete="address-level2"
                required
                aria-invalid={errors.city ? 'true' : undefined}
                aria-describedby={errors.city ? 'co-city-err' : undefined}
              />
              {errors.city && <span id="co-city-err" className="field-error">{errors.city}</span>}
            </div>

            <div className="field">
              <label htmlFor="co-postal" className="field-label">کد پستی * (۱۰ رقم)</label>
              <input
                id="co-postal"
                name="postal_code"
                type="text"
                inputMode="numeric"
                dir="ltr"
                className={`field-input field-input--ltr ${errors.postal_code ? 'field-input--error' : ''}`}
                value={form.postal_code}
                onChange={onChange}
                autoComplete="postal-code"
                placeholder="۴۹۱۶۶۳۴۵۶۷"
                required
                aria-invalid={errors.postal_code ? 'true' : undefined}
                aria-describedby={errors.postal_code ? 'co-postal-err' : undefined}
              />
              {errors.postal_code && <span id="co-postal-err" className="field-error">{errors.postal_code}</span>}
            </div>

            <div className="field">
              <label htmlFor="co-address" className="field-label">آدرس دقیق پستی *</label>
              <textarea
                id="co-address"
                name="address"
                rows={3}
                className={`field-input field-textarea ${errors.address ? 'field-input--error' : ''}`}
                value={form.address}
                onChange={onChange}
                autoComplete="street-address"
                placeholder="استان، شهر، خیابان، کوچه، پلاک و واحد — کامل و دقیق بنویسید"
                required
                aria-invalid={errors.address ? 'true' : undefined}
                aria-describedby={errors.address ? 'co-address-err' : undefined}
              />
              {errors.address && <span id="co-address-err" className="field-error">{errors.address}</span>}
            </div>

            <div className="field">
              <label htmlFor="co-note" className="field-label">توضیحات</label>
              <textarea
                id="co-note"
                name="note"
                className="field-input field-textarea"
                rows={3}
                value={form.note}
                onChange={onChange}
                placeholder="توضیحات تکمیلی، زمان ارسال یا هر نکته‌ای که لازم است بدانیم…"
              />
            </div>

            {user?.email && (
              <p className="checkout-account-note">
                این سفارش با حساب کاربری {user.email} ثبت می‌شود.
              </p>
            )}

            <fieldset className="pay-methods">
              <legend className="field-label">روش پرداخت</legend>
              <label className={`pay-method ${payMethod === 'online' ? 'is-active' : ''}`}>
                <input
                  type="radio"
                  name="payMethod"
                  value="online"
                  checked={payMethod === 'online'}
                  onChange={() => setPayMethod('online')}
                />
                <span className="pay-method-body">
                  <span className="pay-method-title">
                    <FaCreditCard aria-hidden="true" /> پرداخت آنلاین (درگاه امن)
                  </span>
                  <span className="pay-method-desc">پرداخت با کارت بانکی از طریق درگاه زرین‌پال.</span>
                </span>
              </label>
              <label className={`pay-method ${payMethod === 'cod' ? 'is-active' : ''}`}>
                <input
                  type="radio"
                  name="payMethod"
                  value="cod"
                  checked={payMethod === 'cod'}
                  onChange={() => setPayMethod('cod')}
                />
                <span className="pay-method-body">
                  <span className="pay-method-title">
                    <FaTruck aria-hidden="true" /> پرداخت در محل / پستی
                  </span>
                  <span className="pay-method-desc">گرگان: پرداخت درب منزل. سایر شهرها: هماهنگی و ارسال پستی.</span>
                </span>
              </label>
            </fieldset>

            {submitError && <p className="checkout-submit-error" role="alert">{submitError}</p>}

            <button type="submit" className="btn btn-primary checkout-submit" disabled={saving || !checkoutReady}>
              {!catalogChecked
                ? catalogError
                  ? 'تأیید سبد ممکن نیست'
                  : 'در حال بررسی سبد…'
                : hasUnavailable
                  ? 'سبد نیاز به بازبینی دارد'
                  : payMethod === 'online'
                    ? saving
                      ? 'در حال انتقال به درگاه…'
                      : 'پرداخت آنلاین'
                    : saving
                      ? 'در حال ثبت…'
                      : 'ثبت سفارش'}
            </button>

            <p className="checkout-pay-note">
              پرداخت آنلاین امن از طریق درگاه زرین‌پال، یا پرداخت در محل (گرگان) و ارسال پستی به سایر شهرها.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
