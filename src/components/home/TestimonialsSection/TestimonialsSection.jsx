import { useEffect, useState } from 'react';
import { FaChevronLeft, FaChevronRight, FaCommentDots, FaStar } from 'react-icons/fa6';
import SectionHeading from '../SectionHeading';
import './TestimonialsSection.css';

// «نظرات شما» — figma-redesign testimonials (PLAN.md §4 WU6 + spec-deep
// desktop "products" frame @y12641 / mobile frame @y15576).
// Full-bleed accent band with white comment cards (r 5/35/5/35, physical)
// and circular prev/next controls. Reviews come from the home loader
// (getApprovedReviews(3)); null/empty renders the heading + band shell only.

const FALLBACK_PHOTO = '/img/redesign/testimonial-pfp.jpg';
const MOBILE_QUERY = '(max-width: 900px)';
const DESKTOP_WINDOW = 3;
const MOBILE_WINDOW = 1;

function StarsNl({ rating }) {
  // Solid glyphs for both states — the mockup shows a solid grey star for the
  // empty slot (color #E6E6E6 @ 50%), not an outline. In the RTL row the
  // first icon lands rightmost, so rating N gives N filled on the right and
  // the empty star on the left, exactly like the spec frames.
  const filled = Math.max(0, Math.min(5, Math.round(Number(rating) || 0)));
  return (
    <span className="nl-testi__stars" role="img" aria-label={`${filled} از ۵`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <FaStar
          key={n}
          aria-hidden="true"
          className={n <= filled ? 'nl-testi__star nl-testi__star--on' : 'nl-testi__star'}
        />
      ))}
    </span>
  );
}

function TestimonialsSection({ reviews }) {
  const list = Array.isArray(reviews) ? reviews.filter(Boolean) : [];
  const count = list.length;

  // SSG-safe: server and first client render assume the desktop window with
  // index 0 (deterministic hydration); the effect switches to the mobile
  // window only after mount.
  const [isMobile, setIsMobile] = useState(false);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const mq = window.matchMedia(MOBILE_QUERY);
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  const visible = Math.min(isMobile ? MOBILE_WINDOW : DESKTOP_WINDOW, count);
  const showControls = count > (isMobile ? MOBILE_WINDOW : DESKTOP_WINDOW);
  const safeIndex = count > 0 ? ((index % count) + count) % count : 0;
  const goPrev = () => setIndex((safeIndex - 1 + count) % count);
  const goNext = () => setIndex((safeIndex + 1) % count);

  return (
    <section id="testimonials" className="nl-testi" aria-label="نظرات شما">
      <div className="nl-container">
        <SectionHeading
          icon={FaCommentDots}
          eyebrow="تجربه مشتریان"
          title="نظرات شما"
          underline={[100, 7]}
          titleSize={128}
          titleSizeMobile={80}
          center
        />
      </div>

      <div className="nl-testi__band">
        <div className="nl-container nl-testi__inner">
          {count > 0 && (
            <ul className="nl-testi__cards">
              {Array.from({ length: visible }, (_, k) => {
                const review = list[(safeIndex + k) % count];
                return (
                  <li className="nl-testi__card" key={review.id ?? k}>
                    <p className="nl-testi__quote">{review.body}</p>
                    <div className="nl-testi__info">
                      {/* RTL row: person (pfp rightmost) … stars leftmost,
                          per the spec info-cont frames. */}
                      <div className="nl-testi__person">
                        <img
                          className="nl-testi__pfp"
                          src={review.photo_url || FALLBACK_PHOTO}
                          alt={`عکس ${review.author_name || 'مشتری'}`}
                          width={64}
                          height={64}
                          loading="lazy"
                          decoding="async"
                        />
                        <div className="nl-testi__who">
                          <span className="nl-testi__name">{review.author_name}</span>
                          {review.city && <span className="nl-testi__city">{review.city}</span>}
                        </div>
                      </div>
                      <StarsNl rating={review.rating} />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}

          {showControls && (
            <div className="nl-testi__controls">
              {/* The mockup places the white «نظر قبلی» button physically
                  LEFT of the muted one; the RTL row renders the first child
                  on the right, so «نظر بعدی» comes first in the DOM. */}
              <button
                type="button"
                className="nl-testi__btn nl-testi__btn--next"
                aria-label="نظر بعدی"
                onClick={goNext}
              >
                <FaChevronLeft aria-hidden="true" />
              </button>
              <button
                type="button"
                className="nl-testi__btn nl-testi__btn--prev"
                aria-label="نظر قبلی"
                onClick={goPrev}
              >
                <FaChevronRight aria-hidden="true" />
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

export default TestimonialsSection;
