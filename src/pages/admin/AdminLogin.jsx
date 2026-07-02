import './admin.css';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthProvider';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';

export default function AdminLogin() {
  const { signIn, signUp, signOut, session, isAdmin, checkingAdmin } = useAuth();
  const navigate = useNavigate();

  const [mode, setMode] = useState('login'); // 'login' | 'signup'
  const [adminExists, setAdminExists] = useState(null); // null = still checking
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [attempted, setAttempted] = useState(false);

  // First run? If there is no admin yet, default to the create-account form.
  useEffect(() => {
    let active = true;
    if (!isSupabaseConfigured) {
      setAdminExists(true);
      return;
    }
    supabase.rpc('admin_exists').then(({ data, error: rpcError }) => {
      if (!active) return;
      const exists = rpcError ? true : data === true; // on error, hide signup to be safe
      setAdminExists(exists);
      setMode(exists ? 'login' : 'signup');
    });
    return () => {
      active = false;
    };
  }, []);

  // Route only once the admin check settles (avoids the post-auth race).
  useEffect(() => {
    if (!attempted || checkingAdmin || !session) return;
    if (isAdmin) {
      navigate('/admin', { replace: true });
    } else {
      setError('این حساب کاربری دسترسی مدیریت ندارد.');
      signOut();
      setAttempted(false);
    }
  }, [attempted, checkingAdmin, session, isAdmin, navigate, signOut]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setNotice('');
    setSubmitting(true);
    const { error: err } = await signIn(email.trim(), password);
    setSubmitting(false);
    if (err) {
      setError('ورود ناموفق بود. ایمیل یا رمز عبور اشتباه است.');
      return;
    }
    setAttempted(true);
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    if (password.length < 6) {
      setError('رمز عبور باید حداقل ۶ کاراکتر باشد.');
      return;
    }
    setError('');
    setNotice('');
    setSubmitting(true);
    const { data, error: err } = await signUp(email.trim(), password);
    setSubmitting(false);
    if (err) {
      setError('ساخت حساب ناموفق بود: ' + (err.message || ''));
      return;
    }
    if (data.session) {
      setAttempted(true); // email confirmation off → logged in immediately
    } else {
      setNotice('حساب ساخته شد. یک ایمیل تأیید برایت ارسال شد؛ روی لینک کلیک کن و سپس وارد شو.');
      setMode('login');
    }
  };

  const busy = submitting || (attempted && checkingAdmin);
  const isSignup = mode === 'signup';

  return (
    <div className="admin-auth">
      <form className="admin-auth-card" onSubmit={isSignup ? handleSignup : handleLogin}>
        <h1 className="admin-auth-title">{isSignup ? 'ساخت حساب مدیر' : 'ورود به پنل مدیریت'}</h1>
        <p className="admin-auth-sub">گل‌های روسی انعطاف‌پذیر</p>

        {isSignup && (
          <p className="admin-auth-hint">این اولین حساب است و به‌صورت خودکار مدیر سایت می‌شود.</p>
        )}

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
            minLength={6}
            autoComplete={isSignup ? 'new-password' : 'current-password'}
            dir="ltr"
          />
        </label>

        {error && <p className="admin-auth-error">{error}</p>}
        {notice && <p className="admin-auth-notice">{notice}</p>}

        <button type="submit" className="admin-btn admin-btn--primary" disabled={busy}>
          {busy ? 'لطفاً صبر کنید…' : isSignup ? 'ساخت حساب و ورود' : 'ورود'}
        </button>

        {adminExists === false && (
          <button
            type="button"
            className="admin-auth-toggle"
            onClick={() => {
              setMode(isSignup ? 'login' : 'signup');
              setError('');
              setNotice('');
            }}
          >
            {isSignup ? 'قبلاً حساب ساخته‌ام، وارد می‌شوم' : 'ساخت حساب مدیر'}
          </button>
        )}

        <a className="admin-auth-back" href="/">← بازگشت به سایت</a>
      </form>
    </div>
  );
}
