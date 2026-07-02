import { useEffect, useState } from 'react';
import {
  listAllReviews,
  createReview,
  setReviewApproved,
  deleteReview,
  uploadImage,
} from '../../services/admin';
import Stars from '../Reviews/Stars';

const EMPTY = { author_name: '', city: '', rating: 5, body: '', photo_url: '' };

export default function ReviewsManager() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(EMPTY);
  const [adding, setAdding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      setItems(await listAllReviews());
    } catch {
      setError('خطا در دریافت نظرات.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const field = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const onUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadImage(file, 'reviews');
      setForm((f) => ({ ...f, photo_url: url }));
    } catch {
      setError('آپلود تصویر ناموفق بود.');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!form.author_name.trim()) {
      setError('نام الزامی است.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await createReview({
        author_name: form.author_name.trim(),
        city: form.city.trim() || null,
        rating: Number(form.rating),
        body: form.body.trim() || null,
        photo_url: form.photo_url || null,
        product_id: null,
      });
      setForm(EMPTY);
      setAdding(false);
      await load();
    } catch (err) {
      setError('ذخیره ناموفق بود: ' + (err.message || ''));
    } finally {
      setSaving(false);
    }
  };

  const toggle = async (r) => {
    try {
      await setReviewApproved(r.id, !r.is_approved);
      await load();
    } catch {
      setError('تغییر وضعیت ناموفق بود.');
    }
  };

  const remove = async (r) => {
    if (!window.confirm('حذف این نظر؟')) return;
    try {
      await deleteReview(r.id);
      await load();
    } catch {
      setError('حذف ناموفق بود.');
    }
  };

  return (
    <section className="admin-panel">
      <div className="admin-panel-head">
        <h2 className="admin-panel-title">نظرات مشتریان</h2>
        {!adding && (
          <button
            type="button"
            className="admin-btn admin-btn--primary"
            onClick={() => {
              setForm(EMPTY);
              setAdding(true);
              setError('');
            }}
          >
            + افزودن نظر
          </button>
        )}
      </div>

      {error && <p className="admin-error">{error}</p>}

      {adding && (
        <form className="admin-form" onSubmit={onSubmit}>
          <div className="admin-form-grid">
            <label className="admin-field">
              نام
              <input value={form.author_name} onChange={field('author_name')} required />
            </label>
            <label className="admin-field">
              شهر
              <input value={form.city} onChange={field('city')} />
            </label>
            <label className="admin-field">
              امتیاز
              <select value={form.rating} onChange={field('rating')}>
                {[5, 4, 3, 2, 1].map((n) => (
                  <option key={n} value={n}>{n} ستاره</option>
                ))}
              </select>
            </label>
          </div>

          <label className="admin-field">
            متن نظر
            <textarea value={form.body} onChange={field('body')} />
          </label>

          <div className="admin-uploader">
            {form.photo_url ? (
              <img className="admin-thumb" src={form.photo_url} alt="" />
            ) : (
              <div className="admin-thumb admin-thumb--empty">📷</div>
            )}
            <label className="admin-btn admin-btn--sm">
              {uploading ? 'در حال آپلود…' : 'آپلود عکس مشتری'}
              <input type="file" accept="image/*" hidden onChange={onUpload} disabled={uploading} />
            </label>
            {form.photo_url && (
              <button
                type="button"
                className="admin-btn admin-btn--sm admin-btn--ghost"
                onClick={() => setForm((f) => ({ ...f, photo_url: '' }))}
              >
                حذف عکس
              </button>
            )}
          </div>

          <div className="admin-form-actions">
            <button type="submit" className="admin-btn admin-btn--primary" disabled={saving}>
              {saving ? 'در حال ذخیره…' : 'ذخیره'}
            </button>
            <button type="button" className="admin-btn" onClick={() => setAdding(false)}>
              انصراف
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <p className="admin-state">در حال بارگذاری…</p>
      ) : items.length === 0 ? (
        <p className="admin-state">هنوز نظری ثبت نشده است.</p>
      ) : (
        <div className="admin-list">
          {items.map((r) => (
            <div className="admin-item" key={r.id}>
              {r.photo_url ? (
                <img className="admin-item-img" src={r.photo_url} alt="" />
              ) : (
                <div className="admin-item-img admin-thumb--empty">💬</div>
              )}
              <div className="admin-item-body">
                <p className="admin-item-title">
                  {r.author_name}
                  {r.city ? ` — ${r.city}` : ''} <Stars value={r.rating} />
                  {r.is_approved ? (
                    <span className="admin-badge admin-badge--on">تأییدشده</span>
                  ) : (
                    <span className="admin-badge">در انتظار</span>
                  )}
                </p>
                <p className="admin-item-meta">{r.body || '—'}</p>
              </div>
              <div className="admin-item-actions">
                <button type="button" className="admin-btn admin-btn--sm" onClick={() => toggle(r)}>
                  {r.is_approved ? 'لغو تأیید' : 'تأیید'}
                </button>
                <button type="button" className="admin-btn admin-btn--sm admin-btn--danger" onClick={() => remove(r)}>
                  حذف
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
