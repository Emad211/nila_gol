import { createClient } from '@supabase/supabase-js';

// vite.config.js resolves the public Supabase settings from both native Vite
// variables and Vercel Marketplace aliases. Keep the legacy anon-key alias for
// local environments that have not migrated to Supabase publishable keys yet.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  import.meta.env.VITE_SUPABASE_ANON_KEY;

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
