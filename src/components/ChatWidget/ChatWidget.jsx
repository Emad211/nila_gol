import './ChatWidget.css';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import {
  FaCommentDots,
  FaTimes,
  FaPaperPlane,
  FaHeadset,
  FaSpa,
  FaWhatsapp,
  FaTelegramPlane,
} from 'react-icons/fa';
import { useAuth } from '../../context/AuthProvider';
import { getMyMessages, sendMessage, subscribeMyMessages } from '../../services/chat';
import { askAI } from '../../services/aichat';
import { formatDate } from '../../lib/format';
import { whatsappOrderUrl, telegramUrl, baleUrl } from '../../lib/order';
import { config } from '../../data/config';

const EASE = [0.16, 1, 0.3, 1];

// Direct contact channels — WhatsApp / Telegram / Bale. Each entry renders only
// when its handle is configured (never a fake or empty link), so this doubles as
// the honest answer to "what is support connected to". Built once at module
// scope: the handles come from build-time env, so they never change per render.
const DIRECT_CHANNELS = [
  config.contact.whatsapp && {
    key: 'wa',
    label: 'واتساپ',
    href: whatsappOrderUrl(),
    Icon: FaWhatsapp,
  },
  telegramUrl() && {
    key: 'tg',
    label: 'تلگرام',
    href: telegramUrl(),
    Icon: FaTelegramPlane,
  },
  baleUrl() && {
    key: 'bale',
    label: 'بله',
    href: baleUrl(),
    Icon: FaCommentDots,
  },
].filter(Boolean);

// Display-only opening bubble for the AI assistant. Never sent to the API.
const AI_GREETING =
  'سلام! من «گلی»‌ام، دستیارِ نیلا گل. درباره‌ی محصولات، قیمت‌ها، نگهداری و سفارش هرچه خواستی بپرس. 🌸';

// One-tap starters shown in the empty AI state — they guide first-time visitors
// toward the questions the assistant answers best (and toward buying).
const AI_SUGGESTIONS = [
  'قیمت‌ها چنده؟',
  'برای هدیه چی پیشنهاد می‌دی؟',
  'چطور سفارش بدم؟',
  'گل‌ها رو چطور نگه دارم؟',
];

// Render a short assistant reply with **bold** spans and preserved line breaks,
// without pulling react-markdown into the always-mounted widget bundle. React
// escapes the text, so this is XSS-safe (we build elements, not raw HTML).
function renderRich(text) {
  const parts = String(text ?? '').split(/\*\*(.+?)\*\*/g);
  return parts.map((p, i) => (i % 2 ? <strong key={i}>{p}</strong> : p));
}

// Auto-grow a textarea to fit its content, capped by its CSS max-height.
function autoGrow(el) {
  if (!el) return;
  el.style.height = 'auto';
  el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
}

// One message row. `side` is 'in' (assistant/admin — avatar on the inline-start)
// or 'out' (the visitor). Hoisted to module scope: if it were defined inside
// ChatWidget, every keystroke would create a new component type and remount the
// whole list, replaying each bubble's entrance animation. It reads reduced
// motion itself so callers stay terse.
function MessageRow({ side, icon, time, children }) {
  const reduce = useReducedMotion();
  const RowTag = reduce ? 'li' : motion.li;
  const anim = reduce
    ? {}
    : {
        initial: { opacity: 0, y: 8 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.32, ease: EASE },
      };
  return (
    <RowTag className={`chat-msg chat-msg--${side}`} {...anim}>
      {side === 'in' && (
        <span className="chat-avatar" aria-hidden="true">
          {icon}
        </span>
      )}
      <span className="chat-bubble-wrap">
        <span className="chat-bubble">{children}</span>
        {time && (
          <time className="chat-time" dateTime={time}>
            {formatDate(time)}
          </time>
        )}
      </span>
    </RowTag>
  );
}

// Customer live-chat widget — a floating launcher that opens a glass panel with
// two modes:
//   • «دستیار هوشمند» (AI) — works for everyone, including guests (no login).
//   • «پشتیبانی» (human) — the existing realtime thread; requires login.
// The AI conversation lives entirely in local state; the human thread keeps its
// original Supabase + realtime behavior untouched.
export default function ChatWidget() {
  const { user } = useAuth();
  const reduce = useReducedMotion();
  const [open, setOpen] = useState(false);
  const [hasOpened, setHasOpened] = useState(false); // stops the launcher pulse after first open
  const [nudge, setNudge] = useState(false); // one-time "ask me" hint
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
  const fabRef = useRef(null);

  // Merge a row into state, deduped by id (so an optimistic message isn't
  // doubled when the realtime echo arrives, and re-fires are idempotent).
  const appendMessage = useCallback((row) => {
    if (!row) return;
    setMessages((prev) => (prev.some((m) => m.id === row.id) ? prev : [...prev, row]));
  }, []);

  // Close and hand focus back to the launcher (a11y: focus never gets lost).
  const closePanel = useCallback(() => {
    setOpen(false);
    fabRef.current?.focus();
  }, []);

  const openPanel = useCallback(() => {
    setOpen(true);
    setHasOpened(true);
    setNudge(false);
  }, []);

  // Show a gentle one-time "ask me" hint a few seconds after first load, unless
  // the visitor already opened the widget this session.
  useEffect(() => {
    let dismissed = false;
    try {
      dismissed = sessionStorage.getItem('nilagol_chat_nudge') === '1';
    } catch {
      /* storage may be unavailable — just skip the hint */
    }
    if (dismissed) return undefined;
    const t = setTimeout(() => setNudge(true), 5200);
    return () => clearTimeout(t);
  }, []);

  const dismissNudge = useCallback(() => {
    setNudge(false);
    try {
      sessionStorage.setItem('nilagol_chat_nudge', '1');
    } catch {
      /* ignore */
    }
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

  // Escape closes the panel (and returns focus to the launcher).
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') closePanel();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, closePanel]);

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
      if (inputRef.current) inputRef.current.style.height = 'auto';
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
  // Core send used by both the form and the suggestion chips.
  const sendAi = useCallback(
    async (content) => {
      const text = content.trim();
      if (!text || aiThinking) return;

      // Append the user's turn; send the full user/assistant history (the
      // display-only greeting is never part of aiMessages, so it's excluded).
      const next = [...aiMessages, { role: 'user', content: text }];
      setAiMessages(next);
      setAiDraft('');
      if (aiInputRef.current) aiInputRef.current.style.height = 'auto';
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
    },
    [aiMessages, aiThinking],
  );

  const handleAiSend = (e) => {
    e.preventDefault();
    sendAi(aiDraft);
  };

  const handleAiKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendAi(aiDraft);
    }
  };

  return (
    <div className="chat-widget">
      <AnimatePresence>
        {open && (
          <motion.div
            className="chat-panel glass"
            role="dialog"
            aria-modal="false"
            aria-label="گفت‌وگو با نیلا گل"
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 16, scale: 0.94 }}
            animate={reduce ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: 12, scale: 0.96 }}
            transition={{ duration: reduce ? 0.15 : 0.34, ease: EASE }}
          >
            <header className="chat-header">
              <span className="chat-brand-avatar" aria-hidden="true">
                {mode === 'ai' ? <FaSpa /> : <FaHeadset />}
              </span>
              <span className="chat-brand">
                <span className="chat-title">
                  {mode === 'ai' ? 'گلی — دستیار هوشمند' : 'پشتیبانی نیلا گل'}
                </span>
                <span className="chat-status">
                  {mode === 'ai' ? (
                    <>
                      <span className="chat-status-dot" aria-hidden="true" />
                      آنلاین، همیشه پاسخگو
                    </>
                  ) : (
                    'پاسخ در ساعات کاری، هر روز ۹ تا ۲۱'
                  )}
                </span>
              </span>
              <button
                type="button"
                className="chat-close"
                onClick={closePanel}
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
                {mode === 'ai' && (
                  <motion.span
                    className="chat-mode-pill"
                    layoutId="chatModePill"
                    transition={{ duration: reduce ? 0 : 0.3, ease: EASE }}
                    aria-hidden="true"
                  />
                )}
                <span className="chat-mode-label">
                  <FaSpa aria-hidden="true" /> دستیار هوشمند
                </span>
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
                {mode === 'human' && (
                  <motion.span
                    className="chat-mode-pill"
                    layoutId="chatModePill"
                    transition={{ duration: reduce ? 0 : 0.3, ease: EASE }}
                    aria-hidden="true"
                  />
                )}
                <span className="chat-mode-label">
                  <FaHeadset aria-hidden="true" /> پشتیبانی
                </span>
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
                    <MessageRow side="in" icon={<FaSpa />}>
                      {AI_GREETING}
                    </MessageRow>
                    {aiMessages.map((m, i) =>
                      m.role === 'user' ? (
                        <MessageRow side="out" key={i}>
                          {m.content}
                        </MessageRow>
                      ) : (
                        <MessageRow side="in" icon={<FaSpa />} key={i}>
                          {renderRich(m.content)}
                        </MessageRow>
                      ),
                    )}
                    {aiThinking && (
                      <li className="chat-msg chat-msg--in" aria-live="polite">
                        <span className="chat-avatar" aria-hidden="true">
                          <FaSpa />
                        </span>
                        <span className="chat-bubble-wrap">
                          <span
                            className="chat-bubble chat-typing"
                            aria-label="در حال نوشتن…"
                          >
                            <span className="chat-dot" />
                            <span className="chat-dot" />
                            <span className="chat-dot" />
                          </span>
                        </span>
                      </li>
                    )}
                  </ul>

                  {aiMessages.length === 0 && !aiThinking && (
                    <div className="chat-suggestions" aria-label="پیشنهاد سؤال">
                      {AI_SUGGESTIONS.map((s) => (
                        <button
                          key={s}
                          type="button"
                          className="chat-chip"
                          onClick={() => sendAi(s)}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  )}
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
                    onChange={(e) => {
                      setAiDraft(e.target.value);
                      autoGrow(e.target);
                    }}
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
                {DIRECT_CHANNELS.length > 0 && (
                  <div className="chat-channels">
                    <p className="chat-channels-lead">
                      برای پاسخ سریع، مستقیم در یکی از پیام‌رسان‌های زیر برای ما پیام بفرستید؛ هر روز ۹ تا ۲۱ پاسخگوییم.
                    </p>
                    <div className="chat-channels-row">
                      {DIRECT_CHANNELS.map(({ key, label, href, Icon }) => (
                        <a
                          key={key}
                          className={`chat-channel chat-channel--${key}`}
                          href={href}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Icon aria-hidden="true" />
                          <span>{label}</span>
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {!user ? (
                  <p className="chat-signin-hint">
                    همچنین با <Link to="/account">ورود به حساب کاربری</Link> می‌توانید گفت‌وگوی زندهٔ پشتیبانی را همین‌جا در سایت داشته باشید.
                  </p>
                ) : (
                  <>
                    <div className="chat-body" ref={scrollRef}>
                      {loading ? (
                        <p className="chat-state">در حال بارگذاری گفت‌وگو…</p>
                      ) : messages.length === 0 ? (
                        <p className="chat-state">
                          هنوز پیامی نیست؛ اولین پیام را بفرستید تا تیم پشتیبانی پاسخ دهد.
                        </p>
                      ) : (
                        <ul className="chat-messages">
                          {messages.map((m) =>
                            m.sender === 'admin' ? (
                              <MessageRow
                                side="in"
                                icon={<FaHeadset />}
                                time={m.created_at}
                                key={m.id}
                              >
                                {m.body}
                              </MessageRow>
                            ) : (
                              <MessageRow side="out" time={m.created_at} key={m.id}>
                                {m.body}
                              </MessageRow>
                            ),
                          )}
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
                        onChange={(e) => {
                          setDraft(e.target.value);
                          autoGrow(e.target);
                        }}
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
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {nudge && !open && (
          <motion.div
            className="chat-nudge"
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 8, scale: 0.9 }}
            animate={reduce ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: 6, scale: 0.94 }}
            transition={{ duration: reduce ? 0.15 : 0.3, ease: EASE }}
          >
            <button type="button" className="chat-nudge-body" onClick={openPanel}>
              سؤالی داری؟ از «گلی» بپرس 🌸
            </button>
            <button
              type="button"
              className="chat-nudge-close"
              onClick={dismissNudge}
              aria-label="بستن پیام"
            >
              <FaTimes aria-hidden="true" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        type="button"
        ref={fabRef}
        className={`chat-fab ${open ? 'is-open' : ''} ${!hasOpened && !open ? 'is-idle' : ''}`}
        onClick={() => (open ? closePanel() : openPanel())}
        aria-label={open ? 'بستن گفت‌وگو' : 'گفت‌وگو با نیلا گل'}
        aria-expanded={open}
        title="گفت‌وگو با نیلا گل"
      >
        {open ? <FaTimes aria-hidden="true" /> : <FaCommentDots aria-hidden="true" />}
      </button>
    </div>
  );
}
