import './admin.css';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthProvider';

export default function AdminLogin() {
  const { signIn, signOut, session, isAdmin, checkingAdmin } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [attempted, setAttempted] = useState(false);

  // Route an existing admin session immediately. After a fresh login attempt,
  // reject authenticated users who are not explicitly present in public.admins.
  useEffect(() => {
    if (checkingAdmin || !session) return;
    if (isAdmin) {
      navigate('/admin', { replace: true });
      return;
    }
    if (attempted) {
      setError('این حساب کاربری دسترسی مدیریت ندارد.');
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
          : 'ورود ناموفق بود. ایمیل یا رمز عبور اشتباه است.',
      );
      return;
    }

    setAttempted(true);
  };

  const busy = submitting || (attempted && checkingAdmin);

  return (
    <div className="admin-auth">
      <form className="admin-auth-card" onSubmit={handleLogin}>
        <h1 className="admin-auth-title">ورود به پنل مدیریت</h1>
        <p className="admin-auth-sub">فقط حساب‌های مجاز مدیریت</p>

        <label>
          ایمیل
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            dir="ltr"
          />
        </label>

        <label>
          رمز عبور
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            dir="ltr"
          />
        </label>

        {error && <p className="admin-auth-error" role="alert">{error}</p>}

        <button type="submit" className="admin-btn admin-btn--primary" disabled={busy}>
          {busy ? 'لطفاً صبر کنید…' : 'ورود'}
        </button>

        <a className="admin-auth-toggle" href="/account">
          رمز عبور را فراموش کرده‌اید؟
        </a>
        <a className="admin-auth-back" href="/">← بازگشت به سایت</a>
      </form>
    </div>
  );
}
