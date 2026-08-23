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
      {/* decorative line-art florals on the light side (under the copy) */}
      <svg className="hs-doodle hs-doodle--copy" viewBox="0 0 420 300" aria-hidden="true" focusable="false">
        <path d="M402 262C302 244 240 172 282 92 312 34 398 44 394 102 390 150 322 152 322 106" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
        <path d="M312 208C342 198 364 172 358 142 328 152 310 178 312 208Z" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
        <path d="M250 250C230 220 232 190 252 168" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        <circle cx="210" cy="140" r="3" fill="none" stroke="currentColor" strokeWidth="1.2" />
        <circle cx="180" cy="200" r="2.5" fill="none" stroke="currentColor" strokeWidth="1.2" />
        <circle cx="150" cy="252" r="3" fill="none" stroke="currentColor" strokeWidth="1.2" />
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
        {/* decorative line-art florals on the pink panel (under its text) */}
        <svg className="hs-doodle hs-doodle--panel" viewBox="0 0 400 500" aria-hidden="true" focusable="false">
          <path d="M40 130C110 18 268 16 306 108 334 178 268 242 204 214 152 191 158 122 216 114" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
          <path d="M96 168C58 268 112 336 82 442" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
          <path d="M88 302C62 292 46 266 56 240 82 252 92 276 88 302Z" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
          <path d="M90 352C116 346 134 322 128 296 102 304 88 328 90 352Z" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
          <path d="M312 66C348 44 382 66 372 104" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
          <g transform="translate(150 430)">
            <path d="M0 0C14 -18 14 -44 0 -58C-14 -44 -14 -18 0 0Z" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
            <path d="M0 0C14 -18 14 -44 0 -58C-14 -44 -14 -18 0 0Z" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" transform="rotate(72)" />
            <path d="M0 0C14 -18 14 -44 0 -58C-14 -44 -14 -18 0 0Z" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" transform="rotate(144)" />
            <path d="M0 0C14 -18 14 -44 0 -58C-14 -44 -14 -18 0 0Z" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" transform="rotate(216)" />
            <path d="M0 0C14 -18 14 -44 0 -58C-14 -44 -14 -18 0 0Z" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" transform="rotate(288)" />
          </g>
          <circle cx="330" cy="150" r="4" fill="none" stroke="currentColor" strokeWidth="1.2" />
          <circle cx="60" cy="210" r="3" fill="none" stroke="currentColor" strokeWidth="1.2" />
          <circle cx="250" cy="300" r="3.5" fill="none" stroke="currentColor" strokeWidth="1.2" />
        </svg>
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
