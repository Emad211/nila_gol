import { createContext, useContext, useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

const AuthContext = createContext(null);

function redirectUrl(path) {
  if (typeof window === 'undefined') return null;
  return new URL(path, window.location.origin).toString();
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [passwordRecovery, setPasswordRecovery] = useState(false);
  const [loading, setLoading] = useState(true); // initial session resolve
  const [checkingAdmin, setCheckingAdmin] = useState(false); // admin re-check in flight

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    let active = true;

    const checkAdmin = async (currentSession) => {
      if (!currentSession) {
        if (active) setIsAdmin(false);
        return;
      }
      if (active) setCheckingAdmin(true);
      const { data, error } = await supabase.rpc('is_admin');
      if (active) {
        setIsAdmin(!error && data === true);
        setCheckingAdmin(false);
      }
    };

    supabase.auth.getSession().then(async ({ data }) => {
      if (!active) return;
      setSession(data.session);
      await checkAdmin(data.session);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((event, newSession) => {
      if (!active) return;
      setSession(newSession);
      if (event === 'PASSWORD_RECOVERY') setPasswordRecovery(true);
      if (event === 'SIGNED_OUT') setPasswordRecovery(false);
      void checkAdmin(newSession);
    });

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const signIn = (email, password) => {
    if (!isSupabaseConfigured) {
      return Promise.resolve({ error: new Error('Supabase is not configured.') });
    }
    return supabase.auth.signInWithPassword({ email, password });
  };

  const signUp = (email, password) => {
    if (!isSupabaseConfigured) {
      return Promise.resolve({ error: new Error('Supabase is not configured.') });
    }

    const emailRedirectTo = redirectUrl('/account');
    return supabase.auth.signUp({
      email,
      password,
      ...(emailRedirectTo ? { options: { emailRedirectTo } } : {}),
    });
  };

  const requestPasswordReset = (email) => {
    if (!isSupabaseConfigured) {
      return Promise.resolve({ error: new Error('Supabase is not configured.') });
    }

    const redirectTo = redirectUrl('/account?recovery=1');
    return supabase.auth.resetPasswordForEmail(
      email,
      redirectTo ? { redirectTo } : undefined,
    );
  };

  const updatePassword = (password, currentPassword = '') => {
    if (!isSupabaseConfigured) {
      return Promise.resolve({ error: new Error('Supabase is not configured.') });
    }

    const attributes = { password };
    if (currentPassword) attributes.current_password = currentPassword;
    return supabase.auth.updateUser(attributes);
  };

  const finishPasswordRecovery = () => setPasswordRecovery(false);

  const signOut = () => (isSupabaseConfigured ? supabase.auth.signOut() : Promise.resolve());

  const value = {
    session,
    user: session?.user ?? null,
    isAdmin,
    loading,
    checkingAdmin,
    passwordRecovery,
    signIn,
    signUp,
    signOut,
    requestPasswordReset,
    updatePassword,
    finishPasswordRecovery,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
