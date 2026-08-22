import './HeroSplit.css';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FaArrowLeft } from 'react-icons/fa';

const FA_DIGITS = ['۱', '۲', '۳', '۴'];

const HeroSplit = ({ products = [] }) => {
  // Up to 4 slides: live catalog images first, then the design's tulips shot.
  const slides = [
    ...products
      .filter((p) => p.image_url)
      .slice(0, 4)
      .map((p) => ({ src: p.image_url, alt: p.name })),
  ];
  if (slides.length === 0) {
    slides.push({ src: '/img/nila-hero-tulips.webp', alt: 'دسته گل لاله سفید نیلا گل' });
  }
  const [active, setActive] = useState(0);
  const slide = slides[Math.min(active, slides.length - 1)];

  return (
    <section className="hs" aria-labelledby="hs-title">
      {/* decorative line-art doodles */}
      <svg className="hs-doodle hs-doodle--panel" viewBox="0 0 400 400" aria-hidden="true" focusable="false">
        <path d="M60 300c40-90 130-150 220-120s110 140 40 180-160-10-130-90 130-100 190-40" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        <path d="M320 60c-60 20-80 80-50 120" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      </svg>
      <svg className="hs-doodle hs-doodle--copy" viewBox="0 0 420 420" aria-hidden="true" focusable="false">
        <path d="M380 380C300 340 260 240 310 150S470 30 500 90" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      </svg>

      {/* right copy block */}
      <div className="hs-copy">
        <h1 id="hs-title" className="hs-title">
          زیبایی گل طبیعی
          <span className="hs-title-hl">
            <span className="hs-title-mark">بدون پژمردگی</span>
          </span>
        </h1>
        <p className="hs-subtitle">
          مجموعه‌ای از گل‌های روسی لوکس با ظاهر طبیعی؛ بافت لطیف و فرم‌پذیری بالا؛ برای خانه، هدیه و چیدمانی که همیشه مرتب می‌مانند.
        </p>
        <Link to="/products" className="hs-cta">
          <span className="hs-cta-circle" aria-hidden="true">
            <FaArrowLeft />
          </span>
          <span>مشاهده محصولات</span>
        </Link>
      </div>

      {/* center arch stage */}
      <figure className="hs-stage">
        <div className="hs-stage-frame">
          <img key={slide.src} src={slide.src} alt={slide.alt} width="860" height="1150" fetchpriority="high" decoding="async" />
        </div>
        <figcaption className="hs-dots">
          {FA_DIGITS.slice(0, Math.max(1, Math.min(4, slides.length))).map((d, i) => (
            <button
              key={d}
              type="button"
              className={`hs-dot${i === active ? ' is-active' : ''}`}
              onClick={() => setActive(i)}
              aria-label={`نمای ${d}`}
              aria-current={i === active ? 'true' : undefined}
            >
              {d}
            </button>
          ))}
        </figcaption>
      </figure>

      {/* left pink brand panel */}
      <aside className="hs-panel">
        <header className="hs-panel-head">
          <p className="hs-panel-eyebrow">لیلیوم های سفید</p>
          <span className="hs-panel-rule" aria-hidden="true" />
        </header>
        <p className="hs-panel-p">
          ما در نیلاگل، به عنوان یک خانواده، معتقدیم هر فضایی لایق یک روح تازه است. گل‌های روسی ما با دقت و ظرافت، از بهترین متریال‌ها ساخته شده‌اند تا احساس طبیعت را بدون دغدغه نگهداری، به خانه شما بیاورند.
        </p>
        <p className="hs-panel-p">
          کلا اینجا راجب چندتا محصولی که خیلی دوستشون داریم متن میذاریم که چطوری درستشون کردیم از چه متریالی استفاده کردیم.
        </p>
        <div className="hs-thumbs">
          <figure className="hs-thumb">
            <img src="/img/nila-thumb-palm.webp" alt="گلدان نخل کوچک" loading="lazy" decoding="async" />
          </figure>
          <figure className="hs-thumb">
            <img src="/img/nila-thumb-cactus.webp" alt="کاکتوس تزیینی در گلدان سفالی" loading="lazy" decoding="async" />
          </figure>
        </div>
      </aside>
    </section>
  );
};

export default HeroSplit;
