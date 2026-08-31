import { FaImages } from 'react-icons/fa6';
import SectionHeading from '../SectionHeading.jsx';
import './GallerySection.css';

// Static fallback for the 5 grid slots (spec-deep.txt desktop "collection"):
// DOM order = A1, A2, B (tall), C1, C2 — matches public/img/redesign/gallery-1..5.
// w/h are the desktop reference box sizes; they double as the <img> width/height
// attrs so the browser reserves the right space pre-CSS (CLS).
const STATIC_SLOTS = [
  { src: '/img/redesign/gallery-1.jpg', alt: 'نمونه چیدمان گل‌های روسی در فضای دکور', w: 621, h: 316 },
  { src: '/img/redesign/gallery-2.jpg', alt: 'ترکیب گل‌های روسی نیلا گل با دکور داخلی', w: 621, h: 316 },
  { src: '/img/redesign/gallery-3.jpg', alt: 'چیدمان بلند گل‌های روسی در فضای دکور', w: 454, h: 664 },
  { src: '/img/redesign/gallery-4.jpg', alt: 'جزئیات بافت و فرم گل‌های ماندگار نیلا گل', w: 621, h: 316 },
  { src: '/img/redesign/gallery-5.jpg', alt: 'چیدمان گل‌های روسی در فضای نشیمن', w: 621, h: 316 },
];

// GallerySection — figma-redesign "collection" frame (PLAN.md §4 WU3).
// Live loader items fill the 5 slots in order (max 5); missing/empty slots
// fall back to the static redesign images. Null-safe: items may be undefined.
function GallerySection({ items }) {
  const live = Array.isArray(items) ? items.slice(0, STATIC_SLOTS.length) : [];
  const slots = STATIC_SLOTS.map((stat, i) => {
    const item = live[i];
    return item && item.image_url
      ? { ...stat, src: item.image_url, alt: item.title || stat.alt }
      : stat;
  });

  return (
    <section id="gallery" className="nl-gallery">
      <div className="nl-container">
        <SectionHeading
          icon={FaImages}
          eyebrow="گالری نیلا"
          title="فضاهایی که با یک جزئیات تغییر می‌کنند."
          sub="بخشی از چیدمان‌ها و نمونه‌های واقعی نیلا گل؛ برای دیدن بافت، فرم و حس محصول در فضای دکور."
          underline={[83, 2]}
          titleSize={64}
          titleSizeMobile={48}
          center
        />
        <div className="nl-gallery__grid">
          {slots.map((slot, i) => (
            <figure key={i} className="nl-gallery__cell">
              <img
                className="nl-gallery__img"
                src={slot.src}
                alt={slot.alt}
                width={slot.w}
                height={slot.h}
                loading="lazy"
                decoding="async"
              />
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}

export default GallerySection;
