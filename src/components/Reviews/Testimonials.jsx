import './Reviews.css';
import './TestimonialsBand.css';
import { useEffect, useState } from 'react';
import { FaChevronLeft, FaChevronRight, FaRegCommentDots } from 'react-icons/fa';
import Stars from './Stars';

const Testimonials = ({ initialItems }) => {
  const hasInitialData = initialItems !== undefined;
  const [items, setItems] = useState(initialItems ?? []);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(!hasInitialData);

  useEffect(() => {
    if (hasInitialData) return undefined;
    let active = true;

    import('../../services/reviews')
      .then(({ getApprovedReviews }) => getApprovedReviews(3))
      .then((data) => {
        if (active) setItems(data);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [hasInitialData]);

  if (loading || items.length === 0) return null;

  const ordered = items.map((_, i) => items[(i + offset + items.length) % items.length]);

  return (
    <section id="reviews" className="tst" aria-labelledby="tst-title">
      <div className="container tst-head pdf-center">
        <span className="pdf-pill">
          <FaRegCommentDots aria-hidden="true" />
          تجربه مشتریان
        </span>
        <h2 id="tst-title" className="pdf-h2">
          نظرات <span className="pdf-pink">شما</span>
        </h2>
      </div>

      <div className="tst-band">
        <img
          className="tst-plant"
          src="/img/nila-testi-plant.webp"
          alt=""
          aria-hidden="true"
          loading="lazy"
          decoding="async"
        />

        <div className="tst-arrows">
          <button
            type="button"
            className="tst-arrow"
            onClick={() => setOffset((o) => o - 1)}
            aria-label="نظر قبلی"
          >
            <FaChevronRight aria-hidden="true" />
          </button>
          <button
            type="button"
            className="tst-arrow tst-arrow--ghost"
            onClick={() => setOffset((o) => o + 1)}
            aria-label="نظر بعدی"
          >
            <FaChevronLeft aria-hidden="true" />
          </button>
        </div>

        <div className="container tst-cards">
          {ordered.slice(0, 3).map((review) => (
            <article key={review.id} className="tst-card">
              {review.body && <blockquote>«{review.body}»</blockquote>}
              <Stars value={review.rating} />
              <footer>
                {review.photo_url ? (
                  <img className="tst-avatar" src={review.photo_url} alt="" loading="lazy" decoding="async" />
                ) : (
                  <span className="tst-avatar tst-avatar--initial" aria-hidden="true">
                    {(review.author_name || 'ن').slice(0, 1)}
                  </span>
                )}
                <div>
                  <strong>{review.author_name}</strong>
                  {review.city && <span>{review.city}</span>}
                </div>
              </footer>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
