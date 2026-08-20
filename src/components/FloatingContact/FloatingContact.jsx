import './FloatingContact.css';
import { useState, useRef, useEffect } from 'react';
import { FaWhatsapp, FaTelegramPlane, FaPhoneAlt, FaTimes } from 'react-icons/fa';
import { whatsappOrderUrl, telegramUrl, phoneUrl } from '../../lib/order';

/**
 * Speed-dial contact rail — single FAB that fans out 3 channel buttons
 * (WhatsApp, Telegram, Phone) on tap. Positioned bottom-right (RTL
 * inline-start), below the ChatWidget FAB.
 */
export default function FloatingContact() {
  const [open, setOpen] = useState(false);
  const railRef = useRef(null);
  const telegram = telegramUrl();

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
    {
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
    {
      key: 'call',
      href: phoneUrl(),
      label: 'تماس تلفنی',
      icon: <FaPhoneAlt aria-hidden="true" />,
      className: 'fc-orb fc-orb--call',
    },
  ].filter(Boolean);

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
          {open ? <FaTimes aria-hidden="true" /> : <FaPhoneAlt aria-hidden="true" />}
        </span>
      </button>
    </div>
  );
}
