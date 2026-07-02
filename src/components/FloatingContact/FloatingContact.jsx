import './FloatingContact.css';
import { FaWhatsapp, FaTelegramPlane, FaPhoneAlt } from 'react-icons/fa';
import { whatsappOrderUrl, telegramUrl, phoneUrl } from '../../lib/order';

// Persistent one-tap contact rail — in Iran these channels are the checkout.
export default function FloatingContact() {
  const telegram = telegramUrl();

  return (
    <div className="floating-contact" aria-label="راه‌های ارتباطی سریع">
      <a
        className="fc-btn fc-btn--wa"
        href={whatsappOrderUrl()}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="سفارش در واتساپ"
        title="واتساپ"
      >
        <FaWhatsapp aria-hidden="true" />
      </a>

      {telegram && (
        <a
          className="fc-btn fc-btn--tg"
          href={telegram}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="تلگرام"
          title="تلگرام"
        >
          <FaTelegramPlane aria-hidden="true" />
        </a>
      )}

      <a className="fc-btn fc-btn--call" href={phoneUrl()} aria-label="تماس تلفنی" title="تماس">
        <FaPhoneAlt aria-hidden="true" />
      </a>
    </div>
  );
}
