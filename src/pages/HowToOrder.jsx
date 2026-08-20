import './HowToOrder.css';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FaWhatsapp,
  FaTelegramPlane,
  FaCommentDots,
  FaRegComments,
  FaTruck,
  FaChevronDown,
  FaRegHandPointer,
  FaComments,
  FaCreditCard,
  FaBoxOpen,
} from 'react-icons/fa';
import { whatsappOrderUrl, telegramUrl, baleUrl } from '../lib/order';
import { config } from '../data/config';
import Seo from '../lib/pageSeo';

const STEPS = [
  {
    n: '۱',
    Icon: FaRegHandPointer,
    title: 'محصول را انتخاب کنید',
    text: 'مدل موردنظرتان را در سایت ببینید و به سبد خرید اضافه کنید؛ اگر برای انتخاب نیاز به راهنمایی دارید، می‌توانید از همان صفحه در واتساپ پیام بدهید.',
  },
  {
    n: '۲',
    Icon: FaComments,
    title: 'در صورت نیاز مشاوره بگیرید',
    text: 'برای انتخاب مدل، رنگ یا چیدمان می‌توانید قبل از ثبت سفارش با ما در واتساپ، تلگرام یا تلفن هماهنگ کنید.',
  },
  {
    n: '۳',
    Icon: FaCreditCard,
    title: 'روش پرداخت را انتخاب کنید',
    text: 'پرداخت را می‌توانید آنلاین از طریق درگاه زرین‌پال انجام دهید؛ در گرگان امکان پرداخت در محل هم در checkout ارائه می‌شود.',
  },
  {
    n: '۴',
    Icon: FaBoxOpen,
    title: 'ارسال و پیگیری سفارش',
    text: 'پس از ثبت سفارش، برای هماهنگی ارسال و ادامه فرایند پیگیری با شما در ارتباط خواهیم بود.',
  },
];

const TRUST = [
  { Icon: FaRegComments, label: 'مشاوره پیش از سفارش' },
  { Icon: FaTruck, label: 'ارسال به سراسر کشور' },
  { Icon: FaBoxOpen, label: 'پیگیری سفارش' },
  { Icon: FaCreditCard, label: 'پرداخت آنلاین یا در محل گرگان' },
];

// Single source of truth for both the visible accordion and the FAQ structured data.
const FAQS = [
  {
    q: 'آیا گل‌ها قابل شستشو هستند؟',
    a: 'بله، گل‌های روسی ما با آب و صابون ملایم قابل شست‌وشو و تمیز کردن هستند.',
  },
  {
    q: 'گل‌ها چقدر ماندگاری دارند؟',
    a: 'این محصولات برخلاف گل طبیعی پژمرده نمی‌شوند و برای استفاده و چیدمان طولانی‌مدت طراحی شده‌اند.',
  },
  {
    q: 'ارسال به شهرستان دارید؟',
    a: 'بله، ارسال به سراسر کشور انجام می‌شود. در گرگان امکان ارسال و پرداخت درب منزل هم وجود دارد.',
  },
  {
    q: 'پرداخت چگونه است؟',
    a: 'پیش‌فرض checkout پرداخت آنلاین از طریق درگاه زرین‌پال است. در گرگان پرداخت در محل هم فعال است و برای سفارش‌های پستی هماهنگی نهایی قبل از ارسال انجام می‌شود.',
  },
];

export default function HowToOrder() {
  const telegram = telegramUrl();
  const bale = baleUrl();
  const [openFaq, setOpenFaq] = useState(0);

  return (
    <section className="how">
      <Seo
        title="روش خرید و پرداخت گل مصنوعی | نیلا گل"
        description="سفارش گل مصنوعی و روسی در چند قدم ساده؛ پرداخت آنلاین با زرین‌پال، پرداخت درب منزل در گرگان و ارسال به سراسر کشور."
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
          <span className="how-eyebrow">ساده، شفاف و چندمسیره</span>
          <h1 className="how-title">روش خرید و پرداخت</h1>
          <p className="how-lead">
            می‌توانید خرید را مستقیم از سایت انجام دهید و در صورت نیاز، پیش از سفارش از واتساپ، تلگرام یا تلفن برای انتخاب مدل و چیدمان راهنمایی بگیرید.
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
          <p className="how-cta-text">محصول را در سایت انتخاب کنید یا برای راهنمایی قبل از خرید با ما تماس بگیرید.</p>
          <div className="how-cta-actions">
            <Link className="how-cta-btn how-cta-btn--wa" to="/products">
              <FaBoxOpen aria-hidden="true" /> مشاهده محصولات
            </Link>
            {config.contact.whatsapp && (
              <a className="how-cta-btn how-cta-btn--wa" href={whatsappOrderUrl()} target="_blank" rel="noopener noreferrer">
                <FaWhatsapp aria-hidden="true" /> مشاوره در واتساپ
              </a>
            )}
            {telegram && (
              <a className="how-cta-btn how-cta-btn--tg" href={telegram} target="_blank" rel="noopener noreferrer">
                <FaTelegramPlane aria-hidden="true" /> تلگرام
              </a>
            )}
            {bale && (
              <a className="how-cta-btn how-cta-btn--bale" href={bale} target="_blank" rel="noopener noreferrer">
                <FaCommentDots aria-hidden="true" /> بله
              </a>
            )}
          </div>
        </div>

        <p className="how-back">
          <Link to="/products">مشاهده‌ی محصولات ←</Link>
        </p>
      </div>
    </section>
  );
}
