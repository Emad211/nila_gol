import './Reviews.css';
import './TestimonialsPremium.css';
import { useEffect, useState } from 'react';
import { FaHeart, FaQuoteRight, FaRegStar } from 'react-icons/fa';
import { getApprovedReviews } from '../../services/reviews';
import Stars from './Stars';
import { Reveal } from '../../lib/motion';

const Testimonials = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    getApprovedReviews(3)
      .then((d) => {
        if (active) setItems(d);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  if (loading || items.length === 0) return null;

  const [featured, ...rest] = items;

  return (
    <section id="reviews" className="testimonials testimonials--editorial" aria-labelledby="testimonials-title">
      <div className="container">
        <Reveal as="header" className="testimonials-editorial-head">
          <span className="testimonials-kicker">
            <FaHeart aria-hidden="true" />
            تجربه مشتریان
          </span>
          <div className="testimonials-heading-row">
            <h2 id="testimonials-title">وقتی محصول به خانه می‌رسد، کیفیت خودش حرف می‌زند.</h2>
            <p>نظر مشتریانی که نیلا گل را از نزدیک دیده‌اند؛ بدون متن تبلیغاتی اضافه.</p>
          </div>
        </Reveal>

        <div className="testimonials-editorial-grid">
          <Reveal className="testimonial-featured">
            <FaQuoteRight className="testimonial-quote" aria-hidden="true" />
            <div className="testimonial-featured-stars">
              <Stars value={featured.rating} />
              <span><FaRegStar aria-hidden="true" /> تجربه خرید تأییدشده</span>
            </div>
            {featured.body && <blockquote>«{featured.body}»</blockquote>}
            <footer>
              {featured.photo_url ? (
                <img src={featured.photo_url} alt="" loading="lazy" />
              ) : (
                <span className="testimonial-avatar" aria-hidden="true">
                  {(featured.author_name || 'ن').slice(0, 1)}
                </span>
              )}
              <div>
                <strong>{featured.author_name}</strong>
                {featured.city && <span>{featured.city}</span>}
              </div>
            </footer>
          </Reveal>

          {rest.length > 0 && (
            <div className="testimonial-side-list">
              {rest.map((review, index) => (
                <Reveal key={review.id} className="testimonial-compact" delay={0.05 * (index + 1)}>
                  <div className="testimonial-compact-top">
                    <Stars value={review.rating} />
                    <FaQuoteRight aria-hidden="true" />
                  </div>
                  {review.body && <blockquote>«{review.body}»</blockquote>}
                  <footer>
                    <strong>{review.author_name}</strong>
                    {review.city && <span>{review.city}</span>}
                  </footer>
                </Reveal>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
