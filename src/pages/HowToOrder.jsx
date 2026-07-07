import './HowToOrder.css';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FaWhatsapp,
  FaTelegramPlane,
  FaPhoneAlt,
  FaShieldAlt,
  FaExchangeAlt,
  FaRegComments,
  FaTruck,
  FaChevronDown,
  FaRegHandPointer,
  FaComments,
  FaCreditCard,
  FaBoxOpen,
} from 'react-icons/fa';
import { whatsappOrderUrl, telegramUrl, phoneUrl } from '../lib/order';
import { config } from '../data/config';
import Seo from '../lib/pageSeo';

const STEPS = [
  {
    n: '۱',
    Icon: FaRegHandPointer,
    title: 'محصول را انتخاب کنید',
    text: 'در صفحه‌ی محصولات گل موردنظرتان را ببینید و روی دکمه‌ی «سفارش در واتساپ» بزنید.',
  },
  {
    n: '۲',
    Icon: FaComments,
    title: 'هماهنگی و مشاوره',
    text: 'نام محصول به‌صورت خودکار در پیام می‌آید. تعداد، رنگ و آدرس را با ما هماهنگ کنید؛ مشاوره‌ی چیدمان رایگان است.',
  },
  {
    n: '۳',
    Icon: FaCreditCard,
    title: 'پرداخت',
    text: 'پرداخت را می‌توانید آنلاین از طریق درگاه امن زرین‌پال انجام دهید؛ در گرگان امکان پرداخت در محل هم وجود دارد.',
  },
  {
    n: '۴',
    Icon: FaBoxOpen,
    title: 'ارسال',
    text: 'سفارش شما بسته‌بندی و ارسال می‌شود و کد رهگیری برایتان فرستاده می‌شود.',
  },
];

const TRUST = [
  { Icon: FaShieldAlt, label: 'ضمانت کیفیت و دوام' },
  { Icon: FaExchangeAlt, label: 'امکان تعویض/مرجوعی' },
  { Icon: FaRegComments, label: 'مشاوره‌ی رایگان چیدمان' },
  { Icon: FaTruck, label: 'ارسال به سراسر کشور' },
];

// Single source of truth for both the visible accordion and the FAQ structured data.
const FAQS = [
  {
    q: 'آیا گل‌ها قابل شستشو هستند؟',
    a: 'بله، گل‌های روسی ما با آب و صابون ملایم قابل شست‌وشو و تمیز کردن هستند.',
  },
  {
    q: 'گل‌ها چقدر ماندگاری دارند؟',
    a: 'برخلاف گل طبیعی، این گل‌ها سال‌ها بدون پژمردگی زیبایی خود را حفظ می‌کنند.',
  },
  {
    q: 'ارسال به شهرستان دارید؟',
    a: 'بله، به سراسر کشور با پست ارسال می‌کنیم. در گرگان ارسال و پرداخت درب منزل انجام می‌شود.',
  },
  {
    q: 'پرداخت چگونه است؟',
    a: 'پیش‌فرض checkout پرداخت آنلاین از طریق درگاه امن زرین‌پال است. در گرگان پرداخت در محل هم فعال است و برای سفارش‌های پستی هماهنگی نهایی قبل از ارسال انجام می‌شود.',
  },
];

export default function HowToOrder() {
  const telegram = telegramUrl();
  const [openFaq, setOpenFaq] = useState(0);

  return (
    <section className="how">
      <Seo
        title="روش خرید و پرداخت گل مصنوعی | نیلا گل"
        description="سفارش گل مصنوعی و روسی در چند قدم ساده؛ پرداخت آنلاین امن با زرین‌پال، پرداخت درب منزل در گرگان و ارسال سراسری با پست."
        path="/how-to-order"
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: FAQS.map((f) => ({
            '@type': 'Question',
            name: f.q,
            acceptedAnswer: { '@type': 'Answer', text: f.a },
          })),
        }}
      />
      <div className="container">
        <div className="how-head">
          <span className="how-eyebrow">ساده، امن و چندمسیره</span>
          <h1 className="how-title">روش خرید و پرداخت</h1>
          <p className="how-lead">
            سفارش گل‌های ما از طریق سایت، واتساپ یا تلگرام انجام می‌شود و در checkout می‌توانید روش پرداخت را انتخاب کنید.
          </p>
        </div>

        <ol className="how-steps">
          {STEPS.map(({ n, Icon, title, text }) => (
            <li className="how-step" key={n}>
              <span className="how-step-num num" aria-hidden="true">{n}</span>
              <span className="how-step-ico" aria-hidden="true"><Icon /></span>
              <h3 className="how-step-title">{title}</h3>
              <p className="how-step-text">{text}</p>
            </li>
          ))}
        </ol>

        <div className="how-trust">
          {TRUST.map(({ Icon, label }) => (
            <div className="how-trust-item" key={label}>
              <Icon aria-hidden="true" /> {label}
            </div>
          ))}
        </div>

        <div className="how-faq">
          <h2 className="how-faq-title">پرسش‌های پرتکرار</h2>
          <div className="how-faq-list">
            {FAQS.map((f, i) => {
              const isOpen = openFaq === i;
              return (
                <div className={`how-faq-item ${isOpen ? 'is-open' : ''}`} key={f.q}>
                  <button
                    type="button"
                    className="how-faq-q"
                    aria-expanded={isOpen}
                    onClick={() => setOpenFaq(isOpen ? -1 : i)}
                  >
                    <span>{f.q}</span>
                    <FaChevronDown className="how-faq-chevron" aria-hidden="true" />
                  </button>
                  <div className="how-faq-a" hidden={!isOpen}>
                    <p>{f.a}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="how-cta">
          <h2 className="how-cta-title">آماده‌ی سفارش هستید؟</h2>
          <p className="how-cta-text">یک پیام بفرستید؛ بقیه‌اش با ما.</p>
          <div className="how-cta-actions">
            <a className="how-cta-btn how-cta-btn--wa" href={whatsappOrderUrl()} target="_blank" rel="noopener noreferrer">
              <FaWhatsapp aria-hidden="true" /> سفارش در واتساپ
            </a>
            {telegram && (
              <a className="how-cta-btn how-cta-btn--tg" href={telegram} target="_blank" rel="noopener noreferrer">
                <FaTelegramPlane aria-hidden="true" /> تلگرام
              </a>
            )}
            <a className="how-cta-btn how-cta-btn--call" href={phoneUrl()}>
              <FaPhoneAlt aria-hidden="true" /> {config.contact.phone}
            </a>
          </div>
        </div>

        <p className="how-back">
          <Link to="/products">مشاهده‌ی محصولات ←</Link>
        </p>
      </div>
    </section>
  );
}
