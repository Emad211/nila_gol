import './Account.css';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FaRegUser,
  FaSignOutAlt,
  FaBoxOpen,
  FaEnvelopeOpenText,
  FaExclamationCircle,
} from 'react-icons/fa';
import { useAuth } from '../context/AuthProvider';
import { listMyOrders } from '../services/orders';
import { formatPrice, formatDate } from '../lib/format';
import { setPageSeo, resetPageSeo } from '../lib/seo';
import { Reveal } from '../lib/motion';

// Map a Supabase auth error to a friendly Persian message.
function authErrorMessage(message) {
  const m = (message || '').toLowerCase();
  if (m.includes('invalid login')) return 'ایمیل یا گذرواژه نادرست است.';
  if (m.includes('email not confirmed')) return 'ابتدا ایمیل خود را تأیید کنید.';
  if (m.includes('already registered') || m.includes('already been registered'))
    return 'این ایمیل قبلاً ثبت شده است. وارد شوید.';
  if (m.includes('password') && m.includes('6')) return 'گذرواژه باید حداقل ۶ نویسه باشد.';
  if (m.includes('rate limit') || m.includes('too many'))
    return 'تلاش‌های زیاد. کمی بعد دوباره امتحان کنید.';
  if (m.includes('not configured') || m.includes('در دسترس'))
    return 'سرویس ورود در دسترس نیست. لطفاً بعداً تلاش کنید.';
  return message || 'خطایی رخ داد. دوباره تلاش کنید.';
}

// status → { label, tone } for the order pill.
const STATUS_MAP = {
  pending: { label: 'در انتظار', tone: 'pending' },
  confirmed: { label: 'تأییدشده', tone: 'confirmed' },
  shipped: { label: 'ارسال‌شده', tone: 'shipped' },
  delivered: { label: 'تحویل‌شده', tone: 'delivered' },
  canceled: { label: 'لغوشده', tone: 'canceled' },
};

function StatusPill({ status }) {
  const info = STATUS_MAP[status] || { label: status || '—', tone: 'pending' };
  return <span className={`order-status order-status--${info.tone}`}>{info.label}</span>;
}

function AuthForm() {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState('signin'); // 'signin' | 'signup'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const switchMode = (next) => {
    if (next === mode) return;
    setMode(next);
    setError('');
    setNotice('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    setError('');
    setNotice('');
    setSubmitting(true);
    try {
      const action = mode === 'signin' ? signIn : signUp;
      const { data, error: authError } = await action(email.trim(), password);
      if (authError) {
        setError(authErrorMessage(authError.message));
        return;
      }
      // Sign-up with email confirmation on: a user exists but no session yet.
      if (mode === 'signup' && data && !data.session && data.user) {
        setNotice('ایمیل تأییدت را چک کن — برای فعال‌سازی حساب روی لینک تأیید کلیک کن.');
        setPassword('');
      }
      // Otherwise AuthProvider's onAuthStateChange flips the page to the
      // logged-in view automatically.
    } catch (err) {
      setError(authErrorMessage(err?.message));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="account">
      <div className="container">
        <div className="account-auth glass">
          <span className="account-icon" aria-hidden="true">
            <FaRegUser />
          </span>
          <h1 className="account-title">حساب کاربری</h1>
          <p className="account-text">
            برای ثبت و پیگیری سفارش‌های خود وارد شوید یا حساب بسازید.
          </p>

          <div className="account-tabs" role="tablist" aria-label="ورود یا ثبت‌نام">
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'signin'}
              className={`account-tab ${mode === 'signin' ? 'is-active' : ''}`}
              onClick={() => switchMode('signin')}
            >
              ورود
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'signup'}
              className={`account-tab ${mode === 'signup' ? 'is-active' : ''}`}
              onClick={() => switchMode('signup')}
            >
              ثبت‌نام
            </button>
          </div>

          <form className="account-form" onSubmit={handleSubmit} noValidate>
            <label className="account-field">
              <span className="account-label">ایمیل</span>
              <input
                type="email"
                name="email"
                autoComplete="email"
                inputMode="email"
                dir="ltr"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="account-input"
              />
            </label>

            <label className="account-field">
              <span className="account-label">گذرواژه</span>
              <input
                type="password"
                name="password"
                autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                dir="ltr"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="account-input"
              />
            </label>

            {error && (
              <p className="account-alert account-alert--error" role="alert">
                <FaExclamationCircle aria-hidden="true" />
                <span>{error}</span>
              </p>
            )}
            {notice && (
              <p className="account-alert account-alert--notice" role="status">
                <FaEnvelopeOpenText aria-hidden="true" />
                <span>{notice}</span>
              </p>
            )}

            <button type="submit" className="btn btn-primary account-submit" disabled={submitting}>
              {submitting
                ? 'در حال ارسال…'
                : mode === 'signin'
                  ? 'ورود'
                  : 'ساخت حساب'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

function OrderCard({ order }) {
  const items = Array.isArray(order.items) ? order.items : [];
  return (
    <article className="order-card glass">
      <header className="order-head">
        <div className="order-head-main">
          <span className="order-id num">سفارش #{order.id}</span>
          <time className="order-date" dateTime={order.created_at}>
            {formatDate(order.created_at)}
          </time>
        </div>
        <StatusPill status={order.status} />
      </header>

      {items.length > 0 && (
        <ul className="order-items">
          {items.map((item, i) => (
            <li className="order-item" key={item.id ?? `${order.id}-${i}`}>
              <span className="order-item-name">{item.name}</span>
              <span className="order-item-qty num">× {item.qty}</span>
            </li>
          ))}
        </ul>
      )}

      <footer className="order-foot">
        <span className="order-total-label">مجموع</span>
        <span className="order-total">
          <span className="num">{formatPrice(order.subtotal)}</span> تومان
        </span>
      </footer>
    </article>
  );
}

function OrdersList() {
  const [orders, setOrders] = useState(null); // null = loading
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;
    setOrders(null);
    setFailed(false);
    listMyOrders()
      .then((rows) => {
        if (active) setOrders(rows);
      })
      .catch(() => {
        if (active) {
          setOrders([]);
          setFailed(true);
        }
      });
    return () => {
      active = false;
    };
  }, []);

  if (orders === null) {
    return <div className="catalog-state">در حال بارگذاری سفارش‌ها…</div>;
  }

  if (orders.length === 0) {
    return (
      <div className="order-empty">
        <span className="account-icon account-icon--soft" aria-hidden="true">
          <FaBoxOpen />
        </span>
        <p className="account-text">
          {failed ? 'بارگذاری سفارش‌ها ممکن نشد.' : 'هنوز سفارشی ثبت نکرده‌اید.'}
        </p>
        <Link to="/products" className="btn btn-primary">
          مشاهده محصولات
        </Link>
      </div>
    );
  }

  return (
    <div className="order-list">
      {orders.map((order) => (
        <OrderCard key={order.id} order={order} />
      ))}
    </div>
  );
}

function Dashboard() {
  const { user, signOut } = useAuth();
  const [signingOut, setSigningOut] = useState(false);

  const handleSignOut = async () => {
    if (signingOut) return;
    setSigningOut(true);
    try {
      await signOut();
    } finally {
      setSigningOut(false);
    }
  };

  return (
    <div className="account account--dash">
      <div className="container">
        <Reveal>
          <header className="account-bar glass">
            <div className="account-bar-id">
              <span className="account-icon account-icon--sm" aria-hidden="true">
                <FaRegUser />
              </span>
              <div className="account-greeting">
                <span className="account-hello">خوش آمدید</span>
                <span className="account-email" dir="ltr">
                  {user?.email}
                </span>
              </div>
            </div>
            <button
              type="button"
              className="btn btn-secondary account-signout"
              onClick={handleSignOut}
              disabled={signingOut}
            >
              <FaSignOutAlt aria-hidden="true" />
              {signingOut ? 'در حال خروج…' : 'خروج'}
            </button>
          </header>
        </Reveal>

        <section className="account-orders" aria-labelledby="account-orders-title">
          <h2 id="account-orders-title" className="account-section-title">
            سفارش‌های من
          </h2>
          <OrdersList />
        </section>
      </div>
    </div>
  );
}

export default function Account() {
  const { session, loading } = useAuth();

  useEffect(() => {
    setPageSeo({
      title: 'حساب کاربری | نیلا گل',
      description: 'ورود به حساب کاربری، ثبت و پیگیری سفارش‌های گل روسی و گل مصنوعی نیلا گل.',
    });
    return () => resetPageSeo();
  }, []);

  if (loading) {
    return (
      <div className="account">
        <div className="container">
          <div className="catalog-state">در حال بارگذاری…</div>
        </div>
      </div>
    );
  }

  return session ? <Dashboard /> : <AuthForm />;
}
