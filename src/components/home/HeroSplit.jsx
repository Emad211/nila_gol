import './HeroSplit.css';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FaArrowLeft } from 'react-icons/fa';

const FA_DIGITS = ['۱', '۲', '۳', '۴'];

const DEFAULT_SLIDES = [
  { src: '/img/nila-hero-tulips.webp', alt: 'دسته گل لاله نیلا گل' },
  { src: '/img/nila-thumb-palm.webp', alt: 'گلدان نخل کوچک' },
  { src: '/img/nila-thumb-cactus.webp', alt: 'کاکتوس تزیینی' },
];

const HeroSplit = ({ products = [] }) => {
  const catalogSlides = products
    .filter((p) => p.image_url)
    .slice(0, 4)
    .map((p) => ({ src: p.image_url, alt: p.name }));

  const slides =
    catalogSlides.length >= 3
      ? catalogSlides
      : [
          ...catalogSlides,
          ...DEFAULT_SLIDES.filter((d) => !catalogSlides.some((s) => s.src === d.src)),
        ];
  const count = Math.min(slides.length, 4);

  // rotation offset: front slot = active slide, next two feed the thumbnails;
  // every advance shifts each image one slot to the right (queue rotation)
  const [active, setActive] = useState(0);
  const rotated = Array.from({ length: count }, (_, i) => slides[(i + active + count) % count]);
  const main = rotated[0];
  const thumbs = rotated.slice(1, 3);

  const goToSlide = (index) => setActive(index % count);
  const promoteThumb = (thumbIndex) => setActive((a) => (a + thumbIndex + 1) % count);

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

      {/* center arch stage */}
      <figure className="hs-stage">
        <div className="hs-stage-frame">
          <img key={main.src} src={main.src} alt={main.alt} width="860" height="1150" fetchpriority="high" decoding="async" />
        </div>
        <figcaption className="hs-dots">
          {FA_DIGITS.slice(0, count).map((d, i) => (
            <button
              key={d}
              type="button"
              className={`hs-dot${i === active ? ' is-active' : ''}`}
              onClick={() => goToSlide(i)}
              aria-label={`نمای ${d}`}
              aria-current={i === active ? 'true' : undefined}
            >
              {d}
            </button>
          ))}
        </figcaption>
      </figure>

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
          <span>مشاهده محصولات</span>
          <span className="hs-cta-circle" aria-hidden="true">
            <FaArrowLeft />
          </span>
        </Link>
      </div>

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
          {thumbs.map((thumb, i) => (
            <button
              key={thumb.src}
              type="button"
              className="hs-thumb"
              onClick={() => promoteThumb(i)}
              aria-label={`نمایش ${thumb.alt}`}
            >
              <img src={thumb.src} alt="" loading="lazy" decoding="async" />
            </button>
          ))}
        </div>
      </aside>
    </section>
  );
};

export default HeroSplit;
