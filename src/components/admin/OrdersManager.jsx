import { useEffect, useState } from 'react';
import { listAllOrders, updateOrderStatus, deleteOrder } from '../../services/admin';
import { formatPrice, formatDate } from '../../lib/format';

const STATUS_OPTIONS = [
  { value: 'pending', label: 'در انتظار', tone: '' },
  { value: 'confirmed', label: 'تأییدشده', tone: 'admin-badge--feat' },
  { value: 'shipped', label: 'ارسال‌شده', tone: 'admin-badge--feat' },
  { value: 'delivered', label: 'تحویل‌شده', tone: 'admin-badge--on' },
  { value: 'canceled', label: 'لغوشده', tone: 'admin-badge--danger' },
];

const STATUS_MAP = Object.fromEntries(STATUS_OPTIONS.map((s) => [s.value, s]));

export default function OrdersManager() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      setItems(await listAllOrders());
    } catch {
      setError('خطا در دریافت سفارش‌ها.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const onStatusChange = async (order, status) => {
    if (status === order.status) return;
    const prev = order.status;
    // optimistic update
    setItems((list) => list.map((o) => (o.id === order.id ? { ...o, status } : o)));
    setSavingId(order.id);
    setError('');
    try {
      await updateOrderStatus(order.id, status);
    } catch {
      setError('تغییر وضعیت ناموفق بود.');
      setItems((list) => list.map((o) => (o.id === order.id ? { ...o, status: prev } : o)));
    } finally {
      setSavingId(null);
    }
  };

  const onDelete = async (order) => {
    if (!window.confirm(`حذف سفارش #${order.id}؟`)) return;
    setError('');
    try {
      await deleteOrder(order.id);
      await load();
    } catch {
      setError('حذف ناموفق بود.');
    }
  };

  return (
    <section className="admin-panel">
      <div className="admin-panel-head">
        <h2 className="admin-panel-title">سفارش‌ها</h2>
        <button type="button" className="admin-btn admin-btn--sm" onClick={load}>
          بروزرسانی
        </button>
      </div>

      {error && <p className="admin-error">{error}</p>}

      {loading ? (
        <p className="admin-state">در حال بارگذاری…</p>
      ) : items.length === 0 ? (
        <p className="admin-state">هنوز سفارشی ثبت نشده است.</p>
      ) : (
        <div className="admin-list">
          {items.map((o) => {
            const tone = STATUS_MAP[o.status]?.tone || '';
            const label = STATUS_MAP[o.status]?.label || o.status;
            const place = [o.city, o.address].filter(Boolean).join('، ');
            const items_ = Array.isArray(o.items) ? o.items : [];
            return (
              <div className="admin-item admin-order" key={o.id}>
                <div className="admin-item-body">
                  <p className="admin-item-title">
                    سفارش #{o.id}
                    <span className={`admin-badge ${tone}`}>{label}</span>
                    {o.payment_method === 'online' ? (
                      <span
                        className={`admin-badge ${
                          o.payment_status === 'paid'
                            ? 'admin-badge--on'
                            : o.payment_status === 'failed'
                              ? 'admin-badge--danger'
                              : ''
                        }`}
                      >
                        {o.payment_status === 'paid'
                          ? 'پرداخت آنلاین ✓'
                          : o.payment_status === 'failed'
                            ? 'پرداخت ناموفق'
                            : 'در انتظار پرداخت'}
                      </span>
                    ) : (
                      <span className="admin-badge">پرداخت در محل</span>
                    )}
                    {savingId === o.id && (
                      <span className="admin-order-saving">در حال ذخیره…</span>
                    )}
                  </p>
                  <p className="admin-item-meta">{formatDate(o.created_at)}</p>

                  <p className="admin-order-customer">
                    {o.customer_name || 'بدون نام'}
                    {o.phone && (
                      <>
                        {' · '}
                        <a href={`tel:${o.phone}`} dir="ltr">
                          {o.phone}
                        </a>
                      </>
                    )}
                  </p>
                  {place && <p className="admin-item-meta">{place}</p>}
                  {o.postal_code && (
                    <p className="admin-item-meta">کد پستی: <span className="num">{o.postal_code}</span></p>
                  )}
                  {o.note && <p className="admin-item-meta admin-order-note">یادداشت: {o.note}</p>}

                  {items_.length > 0 && (
                    <ul className="admin-order-items">
                      {items_.map((it, i) => (
                        <li key={it.id ?? i}>
                          <span>
                            {it.name}
                            {it.qty ? ` × ${it.qty}` : ''}
                          </span>
                          <span className="num">{formatPrice((it.price || 0) * (it.qty || 1))}</span>
                        </li>
                      ))}
                    </ul>
                  )}

                  <p className="admin-order-total">
                    جمع کل: <span className="num">{formatPrice(o.subtotal)}</span> تومان
                    {o.payment_ref_id && (
                      <span className="admin-item-meta"> · کد رهگیری: <span className="num">{o.payment_ref_id}</span></span>
                    )}
                  </p>
                </div>

                <div className="admin-item-actions admin-order-actions">
                  <label className="admin-order-status">
                    <span className="admin-order-status-label">وضعیت</span>
                    <select
                      value={o.status}
                      onChange={(e) => onStatusChange(o, e.target.value)}
                      disabled={savingId === o.id}
                    >
                      {STATUS_OPTIONS.map((s) => (
                        <option key={s.value} value={s.value}>
                          {s.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <button
                    type="button"
                    className="admin-btn admin-btn--sm admin-btn--danger"
                    onClick={() => onDelete(o)}
                  >
                    حذف
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
