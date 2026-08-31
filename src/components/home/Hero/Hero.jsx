import './Hero.css';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { rotateSlides } from '../../../lib/redesign';

// Fallback slides when the loader has no catalog products at prerender time
// (PLAN.md §6: sections render empty-safe; static assets same-origin, D3).
const FALLBACK_SLIDES = [
  { src: '/img/redesign/hero-main.jpg', alt: 'لیلیوم های سفید' },
  { src: '/img/redesign/hero-thumb-1.jpg', alt: 'دسته گل نیلا گل' },
  { src: '/img/redesign/hero-thumb-2.jpg', alt: 'گل‌های روسی نیلا گل' },
  { src: '/img/redesign/gallery-1.jpg', alt: 'چیدمان گل نیلا گل' },
];

// Decorative floral line-art for the pink panel, #000 at 3% opacity
// (spec-deep "sketch" vectors — approximate, aria-hidden).
const PanelSketch = ({ className }) => (
  <svg className={className} viewBox="0 0 585 511" aria-hidden="true" focusable="false">
    <path d="M80 470C40 400 52 320 108 268 168 212 262 208 318 258 368 303 362 380 306 416 262 444 204 430 190 384" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    <path d="M318 258C356 200 430 178 494 202 552 224 574 288 542 338 512 384 448 392 412 356" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    <path d="M150 300C122 288 106 262 112 234 140 244 156 270 150 300Z" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
    <path d="M256 352C286 346 306 324 302 296 274 302 256 324 256 352Z" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
    <path d="M420 120C392 130 376 154 382 182 410 172 428 148 420 120Z" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
    <path d="M120 140C88 96 96 44 140 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    <g transform="translate(470 92)">
      <path d="M0 0C16 -20 16 -50 0 -66C-16 -50 -16 -20 0 0Z" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
      <path d="M0 0C16 -20 16 -50 0 -66C-16 -50 -16 -20 0 0Z" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" transform="rotate(72)" />
      <path d="M0 0C16 -20 16 -50 0 -66C-16 -50 -16 -20 0 0Z" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" transform="rotate(144)" />
      <path d="M0 0C16 -20 16 -50 0 -66C-16 -50 -16 -20 0 0Z" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" transform="rotate(216)" />
      <path d="M0 0C16 -20 16 -50 0 -66C-16 -50 -16 -20 0 0Z" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" transform="rotate(288)" />
    </g>
    <circle cx="540" cy="200" r="3.5" fill="none" stroke="currentColor" strokeWidth="1.2" />
    <circle cx="70" cy="330" r="3" fill="none" stroke="currentColor" strokeWidth="1.2" />
    <circle cx="350" cy="440" r="3" fill="none" stroke="currentColor" strokeWidth="1.2" />
  </svg>
);

const renderCounter = (slides, active, goToSlide) =>
  slides.map((_, i) => (
    <button
      key={i}
      type="button"
      className={`nl-hero-num${i === active ? ' is-active' : ''}`}
      onClick={() => goToSlide(i)}
      aria-label={`نمای ${i + 1}`}
      aria-current={i === active ? 'true' : undefined}
    >
      <span className="nl-hero-num-inner">{i + 1}</span>
    </button>
  ));

const Hero = ({ products = [] }) => {
  // Null-safe slide source: up to 4 catalog products with an image, then pad
  // with the static redesign assets (dedup by src) so the counter always has
  // 4 slots. Deterministic — identical server/client first render (SSG).
  const catalogSlides = (Array.isArray(products) ? products : [])
    .filter((p) => p && p.image_url)
    .slice(0, 4)
    .map((p) => ({ src: p.image_url, alt: p.name || 'محصول نیلا گل' }));

  const slides = [
    ...catalogSlides,
    ...FALLBACK_SLIDES.filter((d) => !catalogSlides.some((s) => s.src === d.src)),
  ].slice(0, 4);

  // Queue rotation (lib/redesign.js): front slot = active slide shown in the
  // main pic; the next slides feed the thumbs (HeroSplit semantics).
  const [active, setActive] = useState(0);
  const rotated = rotateSlides(slides, active);
  const main = rotated[0];
  const thumbs = rotated.slice(1, 3); // desktop strip: next two slides
  const mobileThumbs = rotated; // mobile strip: all four, active first (RTL rightmost)

  const goToSlide = (index) => setActive(index % slides.length);

  return (
    <section className="nl-hero" aria-labelledby="nl-hero-title nl-hero-title-m">
      {/* Decorative floral sketches, #000 @3% (spec-deep "sketch" vectors) */}
      <PanelSketch className="nl-hero-sketch-side" />

      {/* Right copy column (desktop) */}
      <div className="nl-hero-copy">
        <div className="nl-hero-txt">
          <h1 id="nl-hero-title" className="nl-hero-title">
            زیبایی گل طبیعی بدون پژمردگی
          </h1>
          <span className="nl-hero-vector" aria-hidden="true" />
          <p className="nl-hero-subtitle">
            مجموعه‌ای از گل‌های روسی لوکس با ظاهر طبیعی، بافت لطیف و فرم‌پذیری بالا؛ برای خانه، هدیه و چیدمانی که همیشه مرتب می‌ماند
          </p>
        </div>
        <Link to="/products" className="nl-hero-explore">
          <span className="nl-hero-explore-media" aria-hidden="true">
            <span className="nl-hero-explore-line" />
            <img src="/img/redesign/explore-circle.jpg" alt="" width="64" height="64" loading="lazy" decoding="async" />
          </span>
          <span className="nl-hero-explore-text">مشاهده محصولات</span>
        </Link>
      </div>

      {/* Left pink gradient panel (desktop) */}
      <aside className="nl-hero-panel">
        <PanelSketch className="nl-hero-sketch" />
        <div className="nl-hero-panel-cont">
          <div className="nl-hero-panel-media">
            <img
              key={main.src}
              className="nl-hero-main"
              src={main.src}
              alt={main.alt}
              width="454"
              height="664"
              fetchpriority="high"
              decoding="async"
            />
            <div className="nl-hero-counter">
              {renderCounter(slides, active, goToSlide)}
            </div>
          </div>
          <div className="nl-hero-panel-text">
            <header className="nl-hero-panel-head">
              <p className="nl-hero-panel-title">لیلیوم های سفید</p>
              <span className="nl-hero-panel-rule" aria-hidden="true" />
            </header>
            <p className="nl-hero-panel-p">
              ما در نیلاگل، به عنوان یک خانواده، معتقدیم هر فضایی لایق یک روح تازه است. گل‌های روسی ما با دقت و ظرافت، از بهترین متریال‌ها ساخته شده‌اند تا احساس طبیعت را بدون دغدغه نگهداری، به خانه شما بیاورند.
            </p>
            <div className="nl-hero-thumbs">
              {thumbs.map((thumb, i) => (
                <button
                  key={`${thumb.src}-${i}`}
                  type="button"
                  className={`nl-hero-thumb${i === 1 ? ' is-arch' : ''}`}
                  onClick={() => goToSlide((active + i + 1) % slides.length)}
                  aria-label={`نمایش ${thumb.alt}`}
                >
                  <img src={thumb.src} alt="" width="128" height="187" loading="lazy" decoding="async" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile stacked layout (desktop hides via CSS; own h2 avoids a
          duplicate h1 in the a11y tree) */}
      <div className="nl-hero-mobile">
        <div className="nl-hero-mobile-head">
          <h2 id="nl-hero-title-m" className="nl-hero-mobile-title">زیبایی گل طبیعی بدون پژمردگی</h2>
          <p className="nl-hero-mobile-sub">
            مجموعه‌ای از گل‌های روسی لوکس با ظاهر طبیعی، بافت لطیف و فرم‌پذیری بالا؛ برای خانه، هدیه و چیدمانی که همیشه مرتب می‌ماند
          </p>
          <span className="nl-hero-mobile-vector" aria-hidden="true" />
          <Link to="/products" className="nl-hero-explore nl-hero-mobile-explore">
            <span className="nl-hero-explore-media" aria-hidden="true">
              <span className="nl-hero-explore-line" />
              <img src="/img/redesign/explore-circle.jpg" alt="" width="64" height="64" loading="lazy" decoding="async" />
            </span>
            <span className="nl-hero-explore-text">مشاهده محصولات</span>
          </Link>
        </div>
        <div className="nl-hero-mobile-stage">
          <img
            key={main.src}
            className="nl-hero-mobile-main"
            src={main.src}
            alt={main.alt}
            width="408"
            height="596"
            fetchpriority="high"
            decoding="async"
          />
          <div className="nl-hero-counter nl-hero-mobile-counter">
            {renderCounter(slides, active, goToSlide)}
          </div>
          <div className="nl-hero-mobile-thumbs">
            {mobileThumbs.map((thumb, i) => (
              <button
                key={`${thumb.src}-m${i}`}
                type="button"
                className={`nl-hero-mobile-thumb${i === 0 ? ' is-active' : ''}`}
                onClick={() => goToSlide((active + i) % slides.length)}
                aria-label={`نمایش ${thumb.alt}`}
              >
                <img src={thumb.src} alt="" width="90" height="131" loading="lazy" decoding="async" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
