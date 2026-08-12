import './admin.css';
import './admin-premium.css';
import { useEffect, useState } from 'react';
import { Head } from 'vite-react-ssg';
import { Link, useNavigate } from 'react-router-dom';
import { FaArrowRight, FaEye, FaEyeSlash, FaShieldAlt } from 'react-icons/fa';
import { useAuth } from '../../context/AuthProvider';

export default function AdminLogin() {
  const { signIn, signOut, session, isAdmin, checkingAdmin } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [attempted, setAttempted] = useState(false);

  useEffect(() => {
    if (checkingAdmin || !session) return;
    if (isAdmin) {
      navigate('/admin', { replace: true });
      return;
    }
    if (attempted) {
      setError('ورود انجام نشد. لطفاً اطلاعات حساب مدیریت را بررسی کنید.');
      void signOut();
      setAttempted(false);
    }
  }, [attempted, checkingAdmin, session, isAdmin, navigate, signOut]);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (submitting) return;
    setError('');
    setSubmitting(true);

    const { error: err } = await signIn(email.trim(), password);
    setSubmitting(false);

    if (err) {
      const message = (err.message || '').toLowerCase();
      setError(
        message.includes('email not confirmed')
          ? 'ابتدا ایمیل این حساب را تأیید کنید.'
          : 'ورود ناموفق بود. ایمیل یا رمز عبور را دوباره بررسی کنید.',
      );
      return;
    }

    setAttempted(true);
  };

  const busy = submitting || (attempted && checkingAdmin);

  return (
    <>
      <Head>
        <title>ورود مدیریت | نیلا گل</title>
        <meta name="robots" content="noindex,nofollow,noarchive" />
      </Head>

      <div className="admin-auth admin-auth--premium">
        <div className="admin-login-shell">
          <aside className="admin-login-brand" aria-label="پنل مدیریت نیلا گل">
            <span className="admin-login-logo" aria-hidden="true">N</span>
            <div className="admin-login-brand-copy">
              <span>NILA GOL ADMIN</span>
              <h2>مدیریت فروشگاه، بدون شلوغی.</h2>
              <p>
                این بخش فقط برای حساب‌های مجاز مدیریت در دسترس است و دسترسی‌ها در سطح دیتابیس نیز کنترل می‌شوند.
              </p>
            </div>
            <div className="admin-login-security-note">
              <FaShieldAlt aria-hidden="true" />
              <span>ورود مدیریت بر پایه Supabase Auth، allowlist اختصاصی و Row Level Security انجام می‌شود.</span>
            </div>
          </aside>

          <form className="admin-auth-card" onSubmit={handleLogin} noValidate>
            <h1 className="admin-auth-title">ورود به پنل مدیریت</h1>
            <p className="admin-auth-sub">با حساب مدیریت نیلا گل وارد شوید.</p>

            <label>
              ایمیل مدیریت
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="username"
                inputMode="email"
                dir="ltr"
                spellCheck="false"
              />
            </label>

            <label>
              رمز عبور
              <div className="admin-password-wrap">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  dir="ltr"
                />
                <button
                  type="button"
                  className="admin-password-toggle"
                  onClick={() => setShowPassword((current) => !current)}
                  aria-label={showPassword ? 'پنهان کردن رمز عبور' : 'نمایش رمز عبور'}
                  title={showPassword ? 'پنهان کردن رمز عبور' : 'نمایش رمز عبور'}
                >
                  {showPassword ? <FaEyeSlash aria-hidden="true" /> : <FaEye aria-hidden="true" />}
                </button>
              </div>
            </label>

            {error && <p className="admin-auth-error" role="alert">{error}</p>}

            <button type="submit" className="admin-btn admin-btn--primary" disabled={busy}>
              {busy ? 'در حال بررسی دسترسی…' : 'ورود امن'}
            </button>

            <div className="admin-login-links">
              <Link to="/account">رمز عبور را فراموش کرده‌اید؟</Link>
              <Link to="/">
                <FaArrowRight aria-hidden="true" /> بازگشت به فروشگاه
              </Link>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
