import './Checkout.css';
import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { FaCheckCircle, FaTimesCircle, FaWhatsapp } from 'react-icons/fa';
import { useCart } from '../context/CartProvider';
import { verifyPayment } from '../services/payments';
import { orderPublicCode, whatsappUrl } from '../lib/order';
import { setPageSeo, resetPageSeo } from '../lib/seo';

// Landing page ZarinPal redirects back to. Verifies the payment server-side and
// shows the result. Client-only (never pre-rendered).
export default function PaymentCallback() {
  const [params] = useSearchParams();
  const { clear } = useCart();
  const [state, setState] = useState('verifying'); // verifying | success | failed
  const [refId, setRefId] = useState('');
  const [message, setMessage] = useState('');
  const orderId = params.get('order_id');
  const orderCode = orderPublicCode(orderId);
  const ran = useRef(false);

  useEffect(() => {
    setPageSeo({ title: 'نتیجه پرداخت | نیلا گل', description: 'وضعیت پرداخت سفارش شما در نیلا گل.' });
    return () => resetPageSeo();
  }, []);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;
    const authority = params.get('Authority') || params.get('authority');
    const status = params.get('Status') || params.get('status');
    if (!orderId || !authority) {
      setState('failed');
      setMessage('اطلاعات بازگشت از درگاه ناقص است.');
      return;
    }
    verifyPayment({ orderId, authority, status })
      .then((res) => {
        if (res?.ok) {
          setRefId(res.ref_id || '');
          setState('success');
          clear();
        } else if (res?.reason_code === 'canceled' || res?.reason === 'canceled') {
          setState('failed');
          setMessage('پرداخت توسط شما لغو شد.');
        } else if (res?.reason) {
          setState('failed');
          setMessage(res.code ? `${res.reason} (کد ${res.code})` : res.reason);
        } else {
          setState('failed');
          setMessage('پرداخت تأیید نشد.');
        }
      })
      .catch((err) => {
        setState('failed');
        setMessage(err?.message || 'خطا در تأیید پرداخت.');
      });
  }, [orderId, params, clear]);

  if (state === 'verifying') {
    return (
      <div className="checkout">
        <div className="container">
          <div className="checkout-success glass">
            <p className="catalog-state">در حال تأیید پرداخت… لطفاً این صفحه را نبندید.</p>
          </div>
        </div>
      </div>
    );
  }

  if (state === 'success') {
    const waText = `سلام 🌸 سفارش با کد #${orderCode} را پرداخت کردم (کد رهگیری ${refId}). لطفاً برای ارسال هماهنگ کنید.`;
    return (
      <div className="checkout">
        <div className="container">
          <div className="checkout-success glass">
            <span className="checkout-success-icon"><FaCheckCircle aria-hidden="true" /></span>
            <h1 className="checkout-success-title">پرداخت موفق بود ✅</h1>
            <p className="checkout-success-id">
              کد پیگیری سفارش: <strong className="num">#{orderCode}</strong>
            </p>
            {refId && (
              <p className="checkout-success-id">
                کد رهگیری پرداخت: <strong className="num">{refId}</strong>
              </p>
            )}
            <p className="checkout-success-text">
              از خرید شما سپاسگزاریم. سفارش‌تان ثبت و پرداخت شد؛ به‌زودی برای هماهنگی ارسال با شما در ارتباط خواهیم بود.
            </p>
            <div className="checkout-success-actions">
              <a className="btn btn-primary" href={whatsappUrl(waText)} target="_blank" rel="noopener noreferrer">
                <FaWhatsapp aria-hidden="true" /> پیگیری در واتساپ
              </a>
              <Link to="/account" className="btn btn-secondary">سفارش‌های من</Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="checkout">
      <div className="container">
        <div className="checkout-success glass">
          <span className="checkout-success-icon checkout-success-icon--fail"><FaTimesCircle aria-hidden="true" /></span>
          <h1 className="checkout-success-title">پرداخت ناموفق</h1>
          {orderCode && (
            <p className="checkout-success-id">
              کد پیگیری سفارش: <strong className="num">#{orderCode}</strong>
            </p>
          )}
          <p className="checkout-success-text">
            {message || 'پرداخت انجام نشد.'} می‌توانید دوباره تلاش کنید یا با پشتیبانی تماس بگیرید — سبد خرید شما حفظ شده است.
          </p>
          <div className="checkout-success-actions">
            <Link to="/checkout" className="btn btn-primary">تلاش دوباره</Link>
            <Link to="/products" className="btn btn-secondary">بازگشت به فروشگاه</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
