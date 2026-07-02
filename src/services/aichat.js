import { supabase, isSupabaseConfigured } from '../lib/supabase';

// AI assistant chat. Calls the deployed Supabase Edge Function 'ai-chat'
// (OpenAI-compatible via Avalai). Works for everyone (no login required).
// `messages` is an array of { role: 'user'|'assistant', content }.
export async function askAI(messages) {
  if (!isSupabaseConfigured) throw new Error('سرویس در دسترس نیست.');
  const { data, error } = await supabase.functions.invoke('ai-chat', { body: { messages } });
  if (error) throw new Error(error.message || 'خطا در ارتباط با دستیار.');
  return data?.reply ?? 'پاسخی دریافت نشد.';
}
