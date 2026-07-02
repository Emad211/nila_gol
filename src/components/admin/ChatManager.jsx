import { useCallback, useEffect, useRef, useState } from 'react';
import {
  listChatThreads,
  getThreadMessages,
  sendAdminMessage,
  markThreadRead,
  subscribeAllChat,
} from '../../services/admin';
import { formatDate } from '../../lib/format';

// A short, readable label for a customer who has no email on the thread.
const shortId = (id) => (id ? `کاربر ${String(id).slice(0, 8)}` : 'کاربر');
const threadLabel = (t) => t.email || shortId(t.user_id);

// Time-of-day for a single bubble (date is shown per-thread in the list).
function formatTime(value) {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  try {
    return new Intl.DateTimeFormat('fa-IR', { hour: '2-digit', minute: '2-digit' }).format(d);
  } catch {
    return '';
  }
}

export default function ChatManager() {
  const [threads, setThreads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [openId, setOpenId] = useState(null); // selected user_id (null on mobile = list view)
  const [messages, setMessages] = useState([]);
  const [loadingThread, setLoadingThread] = useState(false);

  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);

  // Keep the open thread id readable inside the realtime callback without
  // re-subscribing on every selection.
  const openIdRef = useRef(null);
  openIdRef.current = openId;

  const scrollRef = useRef(null);

  const refreshThreads = useCallback(async () => {
    try {
      const list = await listChatThreads();
      setThreads(list);
      return list;
    } catch {
      setError('خطا در دریافت گفت‌وگوها.');
      return null;
    }
  }, []);

  // Initial load.
  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      const list = await refreshThreads();
      if (alive && list) setError('');
      if (alive) setLoading(false);
    })();
    return () => {
      alive = false;
    };
  }, [refreshThreads]);

  // Realtime: refresh the list on any new message; append if it belongs to the
  // open thread (skip our own admin echo, already appended optimistically).
  useEffect(() => {
    const unsubscribe = subscribeAllChat((msg) => {
      refreshThreads();
      if (msg.user_id === openIdRef.current) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === msg.id)) return prev;
          return [...prev, msg];
        });
        if (msg.sender === 'customer') markThreadRead(msg.user_id).catch(() => {});
      }
    });
    return unsubscribe;
  }, [refreshThreads]);

  // Keep the conversation pinned to the newest message.
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, openId]);

  const openThread = async (userId) => {
    setOpenId(userId);
    setDraft('');
    setLoadingThread(true);
    setMessages([]);
    try {
      const rows = await getThreadMessages(userId);
      setMessages(rows);
      await markThreadRead(userId);
      await refreshThreads();
    } catch {
      setError('خطا در دریافت پیام‌ها.');
    } finally {
      setLoadingThread(false);
    }
  };

  const closeThread = () => {
    setOpenId(null);
    setMessages([]);
  };

  const onSend = async (e) => {
    e.preventDefault();
    const body = draft.trim();
    if (!body || !openId || sending) return;
    setSending(true);
    setError('');
    // Optimistic append.
    const tempId = `temp-${Date.now()}`;
    const optimistic = {
      id: tempId,
      user_id: openId,
      sender: 'admin',
      body,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimistic]);
    setDraft('');
    try {
      const email = threads.find((t) => t.user_id === openId)?.email ?? null;
      const saved = await sendAdminMessage(openId, body, email);
      setMessages((prev) => prev.map((m) => (m.id === tempId ? saved : m)));
      await refreshThreads();
    } catch (err) {
      // Roll back the optimistic message and restore the draft.
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      setDraft(body);
      setError('ارسال پیام ناموفق بود: ' + (err.message || ''));
    } finally {
      setSending(false);
    }
  };

  const activeThread = threads.find((t) => t.user_id === openId);

  return (
    <section className="admin-panel">
      <div className="admin-panel-head">
        <h2 className="admin-panel-title">گفت‌وگوها</h2>
      </div>

      {error && <p className="admin-error">{error}</p>}

      <div className={`admin-chat ${openId ? 'has-open' : ''}`}>
        {/* Thread list */}
        <aside className="admin-chat-list">
          {loading ? (
            <p className="admin-state">در حال بارگذاری…</p>
          ) : threads.length === 0 ? (
            <p className="admin-state">هنوز گفت‌وگویی نیست</p>
          ) : (
            <ul className="admin-chat-threads">
              {threads.map((t) => (
                <li key={t.user_id}>
                  <button
                    type="button"
                    className={`admin-chat-thread ${t.user_id === openId ? 'is-active' : ''}`}
                    onClick={() => openThread(t.user_id)}
                  >
                    <span className="admin-chat-thread-top">
                      <span className="admin-chat-thread-name">{threadLabel(t)}</span>
                      {t.unread > 0 && (
                        <span className="admin-badge admin-badge--danger admin-chat-unread">
                          {t.unread}
                        </span>
                      )}
                    </span>
                    <span className="admin-chat-thread-preview">
                      {t.last?.sender === 'admin' && 'شما: '}
                      {t.last?.body || '—'}
                    </span>
                    <span className="admin-chat-thread-date">{formatDate(t.last?.created_at)}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </aside>

        {/* Conversation */}
        <div className="admin-chat-convo">
          {!openId ? (
            <div className="admin-chat-empty">
              <p className="admin-state">یک گفت‌وگو را برای مشاهده انتخاب کنید.</p>
            </div>
          ) : (
            <>
              <header className="admin-chat-convo-head">
                <button
                  type="button"
                  className="admin-btn admin-btn--sm admin-btn--ghost admin-chat-back"
                  onClick={closeThread}
                >
                  → بازگشت
                </button>
                <span className="admin-chat-convo-name">
                  {activeThread ? threadLabel(activeThread) : shortId(openId)}
                </span>
              </header>

              <div className="admin-chat-messages" ref={scrollRef}>
                {loadingThread ? (
                  <p className="admin-state">در حال بارگذاری…</p>
                ) : messages.length === 0 ? (
                  <p className="admin-state">پیامی وجود ندارد.</p>
                ) : (
                  messages.map((m) => (
                    <div
                      key={m.id}
                      className={`admin-chat-bubble ${
                        m.sender === 'admin' ? 'is-admin' : 'is-customer'
                      }`}
                    >
                      <p className="admin-chat-bubble-body">{m.body}</p>
                      <span className="admin-chat-bubble-time">{formatTime(m.created_at)}</span>
                    </div>
                  ))
                )}
              </div>

              <form className="admin-chat-reply" onSubmit={onSend}>
                <input
                  type="text"
                  className="admin-chat-reply-input"
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder="پاسخ خود را بنویسید…"
                  disabled={sending}
                />
                <button
                  type="submit"
                  className="admin-btn admin-btn--primary"
                  disabled={sending || !draft.trim()}
                >
                  {sending ? 'در حال ارسال…' : 'ارسال'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
