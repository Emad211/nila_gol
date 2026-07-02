import { useEffect, useState } from 'react';
import { listInquiries, deleteInquiry } from '../../services/admin';

const formatDate = (iso) => {
  try {
    return new Date(iso).toLocaleString('fa-IR', {
      dateStyle: 'short',
      timeStyle: 'short',
    });
  } catch {
    return iso;
  }
};

export default function InquiriesViewer() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      setItems(await listInquiries());
    } catch {
      setError('خطا در دریافت پیام‌ها.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const onDelete = async (id) => {
    if (!window.confirm('حذف این پیام؟')) return;
    try {
      await deleteInquiry(id);
      await load();
    } catch {
      setError('حذف ناموفق بود.');
    }
  };

  return (
    <section className="admin-panel">
      <div className="admin-panel-head">
        <h2 className="admin-panel-title">پیام‌های تماس</h2>
        <button type="button" className="admin-btn admin-btn--sm" onClick={load}>
          بروزرسانی
        </button>
      </div>

      {error && <p className="admin-error">{error}</p>}

      {loading ? (
        <p className="admin-state">در حال بارگذاری…</p>
      ) : items.length === 0 ? (
        <p className="admin-state">هنوز پیامی دریافت نشده است.</p>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>تاریخ</th>
                <th>نام</th>
                <th>تلفن</th>
                <th>پیام</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {items.map((q) => (
                <tr key={q.id}>
                  <td>{formatDate(q.created_at)}</td>
                  <td>{q.name || '—'}</td>
                  <td dir="ltr">
                    <a href={`tel:${q.phone}`}>{q.phone}</a>
                  </td>
                  <td>{q.message || '—'}</td>
                  <td>
                    <button
                      type="button"
                      className="admin-btn admin-btn--sm admin-btn--danger"
                      onClick={() => onDelete(q.id)}
                    >
                      حذف
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
