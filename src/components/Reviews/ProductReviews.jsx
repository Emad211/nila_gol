import './Reviews.css';
import { useEffect, useState } from 'react';
import { FaStar } from 'react-icons/fa';
import { getProductReviews, submitReview } from '../../services/reviews';
import Stars from './Stars';

const EMPTY = { author_name: '', city: '', rating: 5, body: '' };

const ProductReviews = ({ productId }) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(EMPTY);
  const [status, setStatus] = useState('idle'); // idle | submitting | done | error
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    getProductReviews(productId)
      .then((d) => {
        if (active) setItems(d);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [productId]);

  const avg = items.length ? items.reduce((s, r) => s + r.rating, 0) / items.length : 0;

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!form.author_name.trim()) {
      setStatus('error');
      return;
    }
    setStatus('submitting');
    try {
      await submitReview({ ...form, product_id: productId });
      setForm(EMPTY);
      setStatus('done');
      setShowForm(false);
    } catch {
      setStatus('error');
    }
  };

  const field = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  return (
    <section className="product-reviews" id="product-reviews">
      <div className="product-reviews-head">
        <div className="product-reviews-title">
          <span className="eyebrow">
            <FaStar aria-hidden="true" /> نظرات
          </span>
          <h2 className="section-title">نظرات مشتریان</h2>
        </div>
        {items.length > 0 && (
          <div className="reviews-avg">
            <Stars value={avg} size="lg" />{' '}
            <span>
              <span className="num">{avg.toFixed(1)}</span> از ۵ ({items.length} نظر)
            </span>
          </div>
        )}
      </div>

      {loading ? (
        <p className="catalog-state">در حال بارگذاری…</p>
      ) : items.length === 0 ? (
        <p className="reviews-empty">هنوز نظری ثبت نشده — اولین نفر باشید.</p>
      ) : (
        <div className="reviews-list">
          {items.map((r) => (
            <div className="review-row" key={r.id}>
              <div className="review-row-head">
                <strong>
                  {r.author_name}
                  {r.city ? ` — ${r.city}` : ''}
                </strong>
                <Stars value={r.rating} />
              </div>
              {r.body && <p className="review-row-body">{r.body}</p>}
            </div>
          ))}
        </div>
      )}

      {status === 'done' && (
        <p className="reviews-thanks">✅ نظر شما ثبت شد و پس از تأیید نمایش داده می‌شود.</p>
      )}

      {!showForm ? (
        <button
          type="button"
          className="reviews-toggle"
          onClick={() => {
            setShowForm(true);
            setStatus('idle');
          }}
        >
          + ثبت نظر
        </button>
      ) : (
        <form className="reviews-form" onSubmit={onSubmit}>
          <div className="reviews-form-row">
            <input placeholder="نام شما *" value={form.author_name} onChange={field('author_name')} maxLength={80} />
            <input placeholder="شهر (اختیاری)" value={form.city} onChange={field('city')} maxLength={60} />
            <select value={form.rating} onChange={field('rating')}>
              {[5, 4, 3, 2, 1].map((n) => (
                <option key={n} value={n}>{n} ستاره</option>
              ))}
            </select>
          </div>
          <textarea placeholder="نظر شما…" value={form.body} onChange={field('body')} maxLength={1000} rows={3} />
          {status === 'error' && <p className="reviews-err">لطفاً نام را وارد کنید.</p>}
          <div className="reviews-form-actions">
            <button type="submit" className="reviews-submit" disabled={status === 'submitting'}>
              {status === 'submitting' ? 'در حال ارسال…' : 'ارسال نظر'}
            </button>
            <button type="button" className="reviews-cancel" onClick={() => setShowForm(false)}>
              انصراف
            </button>
          </div>
        </form>
      )}
    </section>
  );
};

export default ProductReviews;
