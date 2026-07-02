import { supabase, isSupabaseConfigured } from '../lib/supabase';

// Persist a contact-form submission. RLS allows anonymous INSERT only, so these
// rows are write-only from the browser and readable from the Supabase dashboard.
export async function submitInquiry({ name, phone, message }) {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase is not configured.');
  }

  const { error } = await supabase.from('inquiries').insert({
    name: name?.trim() || null,
    phone: phone.trim(),
    message: message?.trim() || null,
  });

  if (error) throw error;
}
