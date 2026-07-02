import { supabase, isSupabaseConfigured } from '../lib/supabase';

// Customer side of the live chat. Requires a logged-in user (RLS scopes every
// message to the user's own thread). Admin replies arrive via realtime.

export async function getMyMessages() {
  if (!isSupabaseConfigured) return [];
  try {
    const { data, error } = await supabase
      .from('chat_messages')
      .select('*')
      .order('created_at', { ascending: true });
    if (error) throw error;
    return data ?? [];
  } catch (err) {
    console.warn('[chat] load failed.', err);
    return [];
  }
}

export async function sendMessage(body) {
  if (!isSupabaseConfigured) throw new Error('سرویس در دسترس نیست.');
  const { data: auth } = await supabase.auth.getUser();
  const user = auth?.user;
  if (!user) throw new Error('برای گفت‌وگو ابتدا وارد شوید.');
  const { data, error } = await supabase
    .from('chat_messages')
    .insert({ user_id: user.id, sender: 'customer', body: body.trim(), customer_email: user.email ?? null })
    .select()
    .single();
  if (error) throw error;
  return data;
}

// Subscribe to new messages in the user's own thread (admin replies show live).
// Returns an unsubscribe function.
export function subscribeMyMessages(userId, onInsert) {
  if (!isSupabaseConfigured || !userId) return () => {};
  const channel = supabase
    .channel(`chat-self-${userId}`)
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `user_id=eq.${userId}` },
      (payload) => onInsert(payload.new),
    )
    .subscribe();
  return () => supabase.removeChannel(channel);
}
