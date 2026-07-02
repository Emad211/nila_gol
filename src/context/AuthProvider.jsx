import { createContext, useContext, useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);       // initial session resolve
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

    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      checkAdmin(newSession);
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

  // Used once, to bootstrap the first admin. The DB trigger promotes the first
  // signup to admin; a second account would just be a powerless authenticated user.
  const signUp = (email, password) => {
    if (!isSupabaseConfigured) {
      return Promise.resolve({ error: new Error('Supabase is not configured.') });
    }
    return supabase.auth.signUp({ email, password });
  };

  const signOut = () => (isSupabaseConfigured ? supabase.auth.signOut() : Promise.resolve());

  const value = {
    session,
    user: session?.user ?? null,
    isAdmin,
    loading,
    checkingAdmin,
    signIn,
    signUp,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
