import './Account.css';
import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  FaRegUser,
  FaSignOutAlt,
  FaBoxOpen,
  FaEnvelopeOpenText,
  FaExclamationCircle,
  FaKey,
} from 'react-icons/fa';
import { useAuth } from '../context/AuthProvider';
import { listMyOrders } from '../services/orders';
import { formatPrice, formatDate } from '../lib/format';
import { setPageSeo, resetPageSeo } from '../lib/seo';
import { Reveal } from '../lib/motion';

const MIN_PASSWORD_LENGTH = 8;

// Map a Supabase auth error to a friendly Persian message.
function authErrorMessage(message) {
  const m = (message || '').toLowerCase();
  if (m.includes('invalid login')) return 'ایمیل یا گذرواژه نادرست است.';
  if (m.includes('email not confirmed')) return 'ابتدا ایمیل خود را تأیید کنید.';
  if (m.includes('already registered') || m.includes('already been registered'))
    return 'این ایمیل قبلاً ثبت شده است. وارد شوید.';
  if (m.includes('weak password') || (m.includes('password') && m.includes('characters')))
    return `گذرواژه باید حداقل ${MIN_PASSWORD_LENGTH} نویسه و به‌اندازه کافی قوی باشد.`;
  if (m.includes('same password')) return 'گذرواژه جدید باید با گذرواژه فعلی متفاوت باشد.';
  if (m.includes('current password')) return 'گذرواژه فعلی نادرست است.';
  if (m.includes('rate limit') || m.includes('too many'))
    return 'تلاش‌های زیاد. کمی بعد دوباره امتحان کنید.';
  if (m.includes('expired') || m.includes('invalid token'))
    return 'لینک بازیابی منقضی یا نامعتبر است. دوباره درخواست بازیابی بدهید.';
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

function AuthForm({ initialNotice = '' }) {
  const { signIn, signUp, requestPasswordReset } = useAuth();
  const [mode, setMode] = useState('signin'); // 'signin' | 'signup' | 'forgot'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState(initialNotice);

  const switchMode = (next) => {
    if (next === mode) return;
    setMode(next);
    setPassword('');
    setError('');
    setNotice('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;

    const cleanEmail = email.trim();
    setError('');
    setNotice('');

    if (mode === 'signup' && password.length < MIN_PASSWORD_LENGTH) {
      setError(`گذرواژه باید حداقل ${MIN_PASSWORD_LENGTH} نویسه باشد.`);
      return;
    }

    setSubmitting(true);
    try {
      if (mode === 'forgot') {
        const { error: resetError } = await requestPasswordReset(cleanEmail);
        if (resetError) {
          setError(authErrorMessage(resetError.message));
          return;
        }
        // Keep the response generic so the UI does not reveal whether an email
        // is registered in Supabase Auth.
        setNotice('اگر حسابی با این ایمیل وجود داشته باشد، لینک بازیابی برای آن ارسال می‌شود.');
        return;
      }

      const action = mode === 'signin' ? signIn : signUp;
      const { data, error: authError } = await action(cleanEmail, password);
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

  const isForgot = mode === 'forgot';

  return (
    <div className="account">
      <div className="container">
        <div className="account-auth glass">
          <span className="account-icon" aria-hidden="true">
            {isForgot ? <FaKey /> : <FaRegUser />}
          </span>
          <h1 className="account-title">{isForgot ? 'بازیابی گذرواژه' : 'حساب کاربری'}</h1>
          <p className="account-text">
            {isForgot
              ? 'ایمیل حساب را وارد کنید تا لینک امن بازیابی برایتان ارسال شود.'
              : 'برای ثبت و پیگیری سفارش‌های خود وارد شوید یا حساب بسازید.'}
          </p>

          {!isForgot && (
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
          )}

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

            {!isForgot && (
              <label className="account-field">
                <span className="account-label">گذرواژه</span>
                <input
                  type="password"
                  name="password"
                  autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                  dir="ltr"
                  required
                  minLength={mode === 'signup' ? MIN_PASSWORD_LENGTH : undefined}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="account-input"
                />
              </label>
            )}

            {mode === 'signin' && (
              <button type="button" className="account-link-btn" onClick={() => switchMode('forgot')}>
                گذرواژه را فراموش کرده‌اید؟
              </button>
            )}

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
                : isForgot
                  ? 'ارسال لینک بازیابی'
                  : mode === 'signin'
                    ? 'ورود'
                    : 'ساخت حساب'}
            </button>

            {isForgot && (
              <button type="button" className="account-link-btn account-link-btn--center" onClick={() => switchMode('signin')}>
                بازگشت به ورود
              </button>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}

function PasswordRecoveryForm({ onDone }) {
  const { updatePassword } = useAuth();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    setError('');

    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(`گذرواژه باید حداقل ${MIN_PASSWORD_LENGTH} نویسه باشد.`);
      return;
    }
    if (password !== confirmPassword) {
      setError('تکرار گذرواژه با گذرواژه جدید یکسان نیست.');
      return;
    }

    setSubmitting(true);
    try {
      const { error: updateError } = await updatePassword(password);
      if (updateError) {
        setError(authErrorMessage(updateError.message));
        return;
      }
      setPassword('');
      setConfirmPassword('');
      setSuccess(true);
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
          <span className="account-icon" aria-hidden="true"><FaKey /></span>
          <h1 className="account-title">تنظیم گذرواژه جدید</h1>
          <p className="account-text">برای حساب خود یک گذرواژه جدید و قوی انتخاب کنید.</p>

          {success ? (
            <>
              <p className="account-alert account-alert--notice" role="status">
                <FaEnvelopeOpenText aria-hidden="true" />
                <span>گذرواژه با موفقیت تغییر کرد.</span>
              </p>
              <button type="button" className="btn btn-primary account-submit" onClick={onDone}>
                ورود به حساب
              </button>
            </>
          ) : (
            <form className="account-form" onSubmit={handleSubmit} noValidate>
              <label className="account-field">
                <span className="account-label">گذرواژه جدید</span>
                <input
                  type="password"
                  autoComplete="new-password"
                  dir="ltr"
                  required
                  minLength={MIN_PASSWORD_LENGTH}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="account-input"
                />
              </label>
              <label className="account-field">
                <span className="account-label">تکرار گذرواژه جدید</span>
                <input
                  type="password"
                  autoComplete="new-password"
                  dir="ltr"
                  required
                  minLength={MIN_PASSWORD_LENGTH}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="account-input"
                />
              </label>

              {error && (
                <p className="account-alert account-alert--error" role="alert">
                  <FaExclamationCircle aria-hidden="true" />
                  <span>{error}</span>
                </p>
              )}

              <button type="submit" className="btn btn-primary account-submit" disabled={submitting}>
                {submitting ? 'در حال ذخیره…' : 'ثبت گذرواژه جدید'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

function PasswordChangeForm() {
  const { updatePassword } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    setError('');
    setNotice('');

    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(`گذرواژه جدید باید حداقل ${MIN_PASSWORD_LENGTH} نویسه باشد.`);
      return;
    }
    if (password !== confirmPassword) {
      setError('تکرار گذرواژه با گذرواژه جدید یکسان نیست.');
      return;
    }

    setSubmitting(true);
    try {
      const { error: updateError } = await updatePassword(password, currentPassword);
      if (updateError) {
        setError(authErrorMessage(updateError.message));
        return;
      }
      setCurrentPassword('');
      setPassword('');
      setConfirmPassword('');
      setNotice('گذرواژه حساب با موفقیت تغییر کرد.');
    } catch (err) {
      setError(authErrorMessage(err?.message));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="account-security-card glass" onSubmit={handleSubmit} noValidate>
      <div className="account-security-head">
        <span className="account-icon account-icon--sm" aria-hidden="true"><FaKey /></span>
        <div>
          <h3 className="account-security-title">تغییر گذرواژه</h3>
          <p className="account-text">برای امنیت بیشتر، گذرواژه فعلی را نیز وارد کنید.</p>
        </div>
      </div>

      <div className="account-security-grid">
        <label className="account-field">
          <span className="account-label">گذرواژه فعلی</span>
          <input
            type="password"
            autoComplete="current-password"
            dir="ltr"
            required
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className="account-input"
          />
        </label>
        <label className="account-field">
          <span className="account-label">گذرواژه جدید</span>
          <input
            type="password"
            autoComplete="new-password"
            dir="ltr"
            required
            minLength={MIN_PASSWORD_LENGTH}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="account-input"
          />
        </label>
        <label className="account-field">
          <span className="account-label">تکرار گذرواژه جدید</span>
          <input
            type="password"
            autoComplete="new-password"
            dir="ltr"
            required
            minLength={MIN_PASSWORD_LENGTH}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="account-input"
          />
        </label>
      </div>

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

      <button type="submit" className="btn btn-secondary account-security-submit" disabled={submitting}>
        {submitting ? 'در حال ذخیره…' : 'تغییر گذرواژه'}
      </button>
    </form>
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

        <section className="account-security" aria-labelledby="account-security-title">
          <h2 id="account-security-title" className="account-section-title">امنیت حساب</h2>
          <PasswordChangeForm />
        </section>

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
  const { session, loading, passwordRecovery, finishPasswordRecovery } = useAuth();
  const [searchParams] = useSearchParams();
  const recoveryRequested = searchParams.get('recovery') === '1';

  useEffect(() => {
    setPageSeo({
      title: 'حساب کاربری | نیلا گل',
      description: 'ورود به حساب کاربری، ثبت و پیگیری سفارش‌های گل روسی و گل مصنوعی نیلا گل.',
    });
    return () => resetPageSeo();
  }, []);

  const finishRecovery = () => {
    finishPasswordRecovery();
    if (typeof window !== 'undefined') {
      window.history.replaceState({}, '', '/account');
    }
  };

  if (loading) {
    return (
      <div className="account">
        <div className="container">
          <div className="catalog-state">در حال بارگذاری…</div>
        </div>
      </div>
    );
  }

  if (session && passwordRecovery) {
    return <PasswordRecoveryForm onDone={finishRecovery} />;
  }

  if (session) return <Dashboard />;

  return (
    <AuthForm
      initialNotice={
        recoveryRequested
          ? 'لینک بازیابی معتبر نیست یا منقضی شده است. دوباره درخواست بازیابی گذرواژه بدهید.'
          : ''
      }
    />
  );
}
