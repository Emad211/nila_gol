import './Reviews.css';
import { useEffect, useState } from 'react';
import { FaQuoteRight, FaHeart } from 'react-icons/fa';
import { getApprovedReviews } from '../../services/reviews';
import Stars from './Stars';
import { Reveal, MotionCard } from '../../lib/motion';

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

  // Hide the whole section until there are approved reviews.
  if (loading || items.length === 0) return null;

  return (
    <section id="reviews" className="testimonials">
      <div className="container">
        <Reveal as="header" className="testimonials-head">
          <span className="eyebrow">
            <FaHeart aria-hidden="true" /> رضایت مشتریان
          </span>
          <h2 className="section-title testimonials-title">صدای کسانی که تجربه کرده‌اند</h2>
          <p className="testimonials-lead">نظر کسانی که گل‌های ما را به خانه‌شان آورده‌اند</p>
        </Reveal>

        <div className="testimonials-grid">
          {items.map((r, i) => (
            <MotionCard className="review-card" index={i} key={r.id}>
              <FaQuoteRight className="review-quote-icon" aria-hidden="true" />
              {r.photo_url && <img className="review-photo" src={r.photo_url} alt="" loading="lazy" />}
              <Stars value={r.rating} />
              {r.body && <blockquote className="review-body">«{r.body}»</blockquote>}
              <span className="review-author">
                {r.author_name}
                {r.city ? ` — ${r.city}` : ''}
              </span>
            </MotionCard>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
