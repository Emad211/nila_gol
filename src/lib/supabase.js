import { createClient } from '@supabase/supabase-js';

// Vite exposes only VITE_* variables automatically, but vite.config.js also
// bridges Vercel Marketplace's SUPABASE_URL / SUPABASE_PUBLISHABLE_KEY into
// these build-time constants. Keep the legacy VITE_SUPABASE_ANON_KEY alias for
// existing local setups while preferring Supabase's current publishable key.
const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL ||
  (typeof __NILA_SUPABASE_URL__ !== 'undefined' ? __NILA_SUPABASE_URL__ : '');

const supabaseKey =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  (typeof __NILA_SUPABASE_PUBLISHABLE_KEY__ !== 'undefined'
    ? __NILA_SUPABASE_PUBLISHABLE_KEY__
    : '');

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseKey);

if (!isSupabaseConfigured && typeof window !== 'undefined') {
  console.error(
    '[supabase] Public configuration is missing. Check the Vercel/Supabase integration or VITE_SUPABASE_* environment variables.',
  );
}

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;
