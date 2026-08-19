import { supabase, isSupabaseConfigured } from '../lib/supabase';

// AI assistant chat. Calls the deployed Supabase Edge Function 'ai-chat'
// (OpenAI-compatible via Avalai). Works for everyone (no login required).
// `messages` is an array of { role: 'user'|'assistant', content }.
//
// The function rate-limits by IP and returns HTTP 429 with a friendly Persian
// `reply` when a caller exceeds their budget. supabase-js surfaces any non-2xx
// as a FunctionsHttpError (with the Response on `error.context`), so we read
// that body and show the polite message as a normal assistant turn instead of
// throwing a generic error.
export async function askAI(messages) {
  if (!isSupabaseConfigured) throw new Error('سرویس در دسترس نیست.');
  const { data, error } = await supabase.functions.invoke('ai-chat', { body: { messages } });
  if (error) {
    try {
      const body = await error.context?.json?.();
      if (body?.reply) return body.reply;
    } catch {
      /* fall through to the generic error below */
    }
    throw new Error(error.message || 'خطا در ارتباط با دستیار.');
  }
  return data?.reply ?? 'پاسخی دریافت نشد.';
}
