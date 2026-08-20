import './FloatingContact.css';
import { useState, useRef, useEffect } from 'react';
import { FaWhatsapp, FaTelegramPlane, FaCommentDots, FaComments, FaTimes } from 'react-icons/fa';
import { config } from '../../data/config';
import { whatsappOrderUrl, telegramUrl, baleUrl } from '../../lib/order';

/**
 * Speed-dial contact rail — single FAB that fans out the active channel buttons
 * (WhatsApp, Telegram, Bale) on tap. Positioned bottom-right (RTL
 * inline-start), below the ChatWidget FAB. Renders nothing if no channel is set.
 */
export default function FloatingContact() {
  const [open, setOpen] = useState(false);
  const railRef = useRef(null);
  const telegram = telegramUrl();
  const bale = baleUrl();

  // Close on outside click or Escape
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    const onClick = (e) => {
      if (railRef.current && !railRef.current.contains(e.target)) setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener('mousedown', onClick);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('mousedown', onClick);
    };
  }, [open]);

  const channels = [
    config.contact.whatsapp && {
      key: 'wa',
      href: whatsappOrderUrl(),
      label: 'سفارش در واتساپ',
      icon: <FaWhatsapp aria-hidden="true" />,
      className: 'fc-orb fc-orb--wa',
      target: '_blank',
      rel: 'noopener noreferrer',
    },
    telegram && {
      key: 'tg',
      href: telegram,
      label: 'تلگرام',
      icon: <FaTelegramPlane aria-hidden="true" />,
      className: 'fc-orb fc-orb--tg',
      target: '_blank',
      rel: 'noopener noreferrer',
    },
    bale && {
      key: 'bale',
      href: bale,
      label: 'بله',
      icon: <FaCommentDots aria-hidden="true" />,
      className: 'fc-orb fc-orb--bale',
      target: '_blank',
      rel: 'noopener noreferrer',
    },
  ].filter(Boolean);

  if (channels.length === 0) return null;

  return (
    <div className={`fc-speed-dial ${open ? 'is-open' : ''}`} ref={railRef}>
      {/* Expanded orbs */}
      <div className="fc-orbs" aria-hidden={!open}>
        {channels.map((ch, i) => (
          <a
            key={ch.key}
            className={ch.className}
            href={ch.href}
            target={ch.target}
            rel={ch.rel}
            aria-label={ch.label}
            title={ch.label}
            tabIndex={open ? 0 : -1}
            style={{ '--fc-i': i }}
          >
            {ch.icon}
          </a>
        ))}
      </div>

      {/* Main FAB */}
      <button
        type="button"
        className="fc-fab"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? 'بستن راه‌های تماس' : 'راه‌های تماس'}
        aria-expanded={open}
      >
        <span className="fc-fab-icon">
          {open ? <FaTimes aria-hidden="true" /> : <FaComments aria-hidden="true" />}
        </span>
      </button>
    </div>
  );
}
