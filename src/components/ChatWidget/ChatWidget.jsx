import './ChatWidget.css';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { FaCommentDots, FaTimes, FaPaperPlane } from 'react-icons/fa';
import { useAuth } from '../../context/AuthProvider';
import { getMyMessages, sendMessage, subscribeMyMessages } from '../../services/chat';
import { askAI } from '../../services/aichat';
import { formatDate } from '../../lib/format';

// Display-only opening bubble for the AI assistant. Never sent to the API.
const AI_GREETING =
  'سلام! من دستیار نیلا گل‌ام 🌷 درباره‌ی محصولات، نگهداری و سفارش بپرس.';

// Customer live-chat widget — a floating launcher that opens a glass panel with
// two modes:
//   • «دستیار هوشمند» (AI) — works for everyone, including guests (no login).
//   • «پشتیبانی» (human) — the existing realtime thread; requires login.
// The AI conversation lives entirely in local state; the human thread keeps its
// original Supabase + realtime behavior untouched.
export default function ChatWidget() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState('ai'); // 'ai' (default) | 'human'

  // ---- Human-support state (unchanged behavior) ----
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  // ---- AI assistant state ----
  const [aiMessages, setAiMessages] = useState([]); // [{ role, content }]
  const [aiDraft, setAiDraft] = useState('');
  const [aiThinking, setAiThinking] = useState(false);
  const [aiError, setAiError] = useState('');

  const scrollRef = useRef(null);
  const inputRef = useRef(null);
  const aiScrollRef = useRef(null);
  const aiInputRef = useRef(null);

  // Merge a row into state, deduped by id (so an optimistic message isn't
  // doubled when the realtime echo arrives, and re-fires are idempotent).
  const appendMessage = useCallback((row) => {
    if (!row) return;
    setMessages((prev) => (prev.some((m) => m.id === row.id) ? prev : [...prev, row]));
  }, []);

  // On open (human mode, logged-in): load history, then subscribe to the user's
  // thread for live admin replies. Unsubscribe on close/unmount/mode change.
  useEffect(() => {
    if (!open || mode !== 'human' || !user) return undefined;

    let active = true;
    setLoading(true);
    setError('');

    getMyMessages()
      .then((rows) => {
        if (active) setMessages(rows);
      })
      .catch(() => {
        if (active) setError('بارگذاری گفت‌وگو ممکن نشد.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    const unsubscribe = subscribeMyMessages(user.id, (row) => {
      if (active) appendMessage(row);
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, [open, mode, user, appendMessage]);

  // Keep the human view pinned to the newest message.
  useEffect(() => {
    if (!open || mode !== 'human') return;
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, loading, open, mode]);

  // Keep the AI view pinned to the newest message / typing indicator.
  useEffect(() => {
    if (!open || mode !== 'ai') return;
    const el = aiScrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [aiMessages, aiThinking, open, mode]);

  // Move focus into the active input when the panel opens or the mode changes.
  useEffect(() => {
    if (!open) return;
    if (mode === 'ai') aiInputRef.current?.focus();
    else if (user) inputRef.current?.focus();
  }, [open, mode, user]);

  // Escape closes the panel.
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  // ---- Human send (unchanged) ----
  const handleSend = async (e) => {
    e.preventDefault();
    const body = draft.trim();
    if (!body || sending) return;

    setSending(true);
    setError('');
    try {
      const row = await sendMessage(body);
      appendMessage(row); // optimistic; realtime echo is deduped by id
      setDraft('');
    } catch {
      setError('ارسال پیام ممکن نشد. دوباره تلاش کنید.');
    } finally {
      setSending(false);
    }
  };

  // Send on Enter, newline on Shift+Enter.
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend(e);
    }
  };

  // ---- AI send ----
  const handleAiSend = async (e) => {
    e.preventDefault();
    const content = aiDraft.trim();
    if (!content || aiThinking) return;

    // Append the user's turn; send the full user/assistant history (the
    // display-only greeting is never part of aiMessages, so it's excluded).
    const next = [...aiMessages, { role: 'user', content }];
    setAiMessages(next);
    setAiDraft('');
    setAiError('');
    setAiThinking(true);
    try {
      const reply = await askAI(next);
      setAiMessages((prev) => [...prev, { role: 'assistant', content: reply }]);
    } catch (err) {
      setAiError(err?.message || 'خطا در ارتباط با دستیار.');
    } finally {
      setAiThinking(false);
    }
  };

  const handleAiKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAiSend(e);
    }
  };

  return (
    <div className="chat-widget">
      {open && (
        <div
          className="chat-panel glass"
          role="dialog"
          aria-modal="false"
          aria-label="گفت‌وگو با نیلا گل"
        >
          <header className="chat-header">
            <h2 className="chat-title">گفت‌وگو با نیلا گل</h2>
            <button
              type="button"
              className="chat-close"
              onClick={() => setOpen(false)}
              aria-label="بستن گفت‌وگو"
            >
              <FaTimes aria-hidden="true" />
            </button>
          </header>

          <div className="chat-modes" role="tablist" aria-label="حالت گفت‌وگو">
            <button
              type="button"
              role="tab"
              id="chat-tab-ai"
              aria-selected={mode === 'ai'}
              aria-controls="chat-panel-ai"
              className={`chat-mode ${mode === 'ai' ? 'is-active' : ''}`}
              onClick={() => setMode('ai')}
            >
              دستیار هوشمند
            </button>
            <button
              type="button"
              role="tab"
              id="chat-tab-human"
              aria-selected={mode === 'human'}
              aria-controls="chat-panel-human"
              className={`chat-mode ${mode === 'human' ? 'is-active' : ''}`}
              onClick={() => setMode('human')}
            >
              پشتیبانی
            </button>
          </div>

          {mode === 'ai' ? (
            <div
              id="chat-panel-ai"
              role="tabpanel"
              aria-labelledby="chat-tab-ai"
              className="chat-mode-panel"
            >
              <div className="chat-body" ref={aiScrollRef}>
                <ul className="chat-messages">
                  <li className="chat-msg chat-msg--admin">
                    <span className="chat-bubble">{AI_GREETING}</span>
                  </li>
                  {aiMessages.map((m, i) => (
                    <li
                      key={i}
                      className={`chat-msg chat-msg--${
                        m.role === 'user' ? 'customer' : 'admin'
                      }`}
                    >
                      <span className="chat-bubble">{m.content}</span>
                    </li>
                  ))}
                  {aiThinking && (
                    <li className="chat-msg chat-msg--admin" aria-live="polite">
                      <span className="chat-bubble chat-typing" aria-label="در حال نوشتن…">
                        <span className="chat-dot" />
                        <span className="chat-dot" />
                        <span className="chat-dot" />
                      </span>
                    </li>
                  )}
                </ul>
              </div>

              {aiError && (
                <p className="chat-error" role="alert">
                  {aiError}
                </p>
              )}

              <form className="chat-input-row" onSubmit={handleAiSend}>
                <textarea
                  ref={aiInputRef}
                  className="chat-input"
                  rows={1}
                  value={aiDraft}
                  onChange={(e) => setAiDraft(e.target.value)}
                  onKeyDown={handleAiKeyDown}
                  disabled={aiThinking}
                  placeholder="سؤالت را بنویس…"
                  aria-label="پیام به دستیار هوشمند"
                />
                <button
                  type="submit"
                  className="chat-send"
                  disabled={aiThinking || !aiDraft.trim()}
                  aria-label="ارسال پیام"
                >
                  <FaPaperPlane aria-hidden="true" />
                </button>
              </form>
            </div>
          ) : (
            <div
              id="chat-panel-human"
              role="tabpanel"
              aria-labelledby="chat-tab-human"
              className="chat-mode-panel"
            >
              {!user ? (
                <div className="chat-guest">
                  <p className="chat-guest-text">
                    برای گفت‌وگوی مستقیم، وارد حساب کاربری شوید.
                  </p>
                  <Link to="/account" className="btn btn-primary chat-guest-cta">
                    ورود / ثبت‌نام
                  </Link>
                </div>
              ) : (
                <>
                  <div className="chat-body" ref={scrollRef}>
                    {loading ? (
                      <p className="chat-state">در حال بارگذاری گفت‌وگو…</p>
                    ) : messages.length === 0 ? (
                      <p className="chat-state">هنوز پیامی نیست؛ اولین پیام را بفرستید.</p>
                    ) : (
                      <ul className="chat-messages">
                        {messages.map((m) => (
                          <li
                            key={m.id}
                            className={`chat-msg chat-msg--${
                              m.sender === 'admin' ? 'admin' : 'customer'
                            }`}
                          >
                            <span className="chat-bubble">{m.body}</span>
                            {m.created_at && (
                              <time className="chat-time" dateTime={m.created_at}>
                                {formatDate(m.created_at)}
                              </time>
                            )}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  {error && (
                    <p className="chat-error" role="alert">
                      {error}
                    </p>
                  )}

                  <form className="chat-input-row" onSubmit={handleSend}>
                    <textarea
                      ref={inputRef}
                      className="chat-input"
                      rows={1}
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="پیام خود را بنویسید…"
                      aria-label="متن پیام"
                    />
                    <button
                      type="submit"
                      className="chat-send"
                      disabled={sending || !draft.trim()}
                      aria-label="ارسال پیام"
                    >
                      <FaPaperPlane aria-hidden="true" />
                    </button>
                  </form>
                </>
              )}
            </div>
          )}
        </div>
      )}

      <button
        type="button"
        className={`chat-fab ${open ? 'is-open' : ''}`}
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? 'بستن گفت‌وگو' : 'گفت‌وگو با نیلا گل'}
        aria-expanded={open}
        title="گفت‌وگو با نیلا گل"
      >
        {open ? <FaTimes aria-hidden="true" /> : <FaCommentDots aria-hidden="true" />}
      </button>
    </div>
  );
}
