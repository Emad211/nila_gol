import { useEffect, useMemo, useState } from 'react';
import {
  FaChevronDown,
  FaPhoneAlt,
  FaRedoAlt,
  FaSearch,
  FaTrashAlt,
} from 'react-icons/fa';
import { listAllOrders, updateOrderStatus, deleteOrder, reconcilePayment } from '../../services/admin';
import { formatPrice, formatDate } from '../../lib/format';
import { orderPublicCode } from '../../lib/order';

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
  const [reconcilingId, setReconcilingId] = useState(null);
  const [reconcileMsg, setReconcileMsg] = useState({});
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');

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

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return items.filter((order) => {
      if (filter !== 'all' && order.status !== filter) return false;
      if (!needle) return true;
      const haystack = [
        order.id,
        order.public_id,
        orderPublicCode(order),
        order.customer_name,
        order.phone,
        order.city,
        order.address,
        order.postal_code,
        order.payment_ref_id,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(needle);
    });
  }, [items, query, filter]);

  const pendingCount = items.filter((order) => order.status === 'pending').length;

  const onStatusChange = async (order, status) => {
    if (status === order.status) return;
    const prev = order.status;
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
    const code = orderPublicCode(order);
    if (!window.confirm(`حذف سفارش با کد #${code}؟ این عمل قابل بازگشت نیست.`)) return;
    setError('');
    try {
      await deleteOrder(order.id);
      setItems((list) => list.filter((item) => item.id !== order.id));
    } catch {
      setError('حذف ناموفق بود.');
    }
  };

  const onReconcile = async (order) => {
    const code = orderPublicCode(order);
    if (!window.confirm(`وضعیت پرداخت سفارش #${code} از زرین‌پال دوباره بررسی شود؟`)) return;
    setReconcilingId(order.id);
    setReconcileMsg((m) => ({ ...m, [order.id]: null }));
    try {
      const res = await reconcilePayment(order.id);
      const text = res?.ok
        ? res.already
          ? `پرداخت قبلاً تأیید شده بود — کد رهگیری ${res.ref_id || '—'}`
          : `پرداخت تأیید شد — کد رهگیری ${res.ref_id || '—'}`
        : res?.reason || 'پرداخت تأیید نشد.';
      setReconcileMsg((m) => ({ ...m, [order.id]: { ok: !!res?.ok, text } }));
      await load();
    } catch (err) {
      setReconcileMsg((m) => ({ ...m, [order.id]: { ok: false, text: err.message || 'خطا در بررسی پرداخت.' } }));
    } finally {
      setReconcilingId(null);
    }
  };

  return (
    <section className="admin-panel admin-orders-panel">
      <div className="admin-panel-head admin-panel-head--rich">
        <div>
          <h2 className="admin-panel-title">سفارش‌ها</h2>
          <p className="admin-panel-subtitle">
            <span className="num">{items.length}</span> سفارش
            {pendingCount > 0 && <> · <strong className="num">{pendingCount}</strong> مورد در انتظار بررسی</>}
          </p>
        </div>
        <button type="button" className="admin-btn admin-btn--sm" onClick={load} disabled={loading}>
          <FaRedoAlt aria-hidden="true" />
          {loading ? 'در حال دریافت…' : 'بروزرسانی'}
        </button>
      </div>

      <div className="admin-orders-toolbar">
        <label className="admin-manager-search">
          <FaSearch aria-hidden="true" />
          <span className="sr-only">جستجوی سفارش</span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="کد پیگیری، ID داخلی، نام، موبایل یا شهر…"
          />
        </label>
        <div className="admin-manager-filters" aria-label="فیلتر وضعیت سفارش">
          <button type="button" className={filter === 'all' ? 'is-active' : ''} onClick={() => setFilter('all')}>همه</button>
          <button type="button" className={filter === 'pending' ? 'is-active' : ''} onClick={() => setFilter('pending')}>در انتظار</button>
          <button type="button" className={filter === 'confirmed' ? 'is-active' : ''} onClick={() => setFilter('confirmed')}>تأییدشده</button>
          <button type="button" className={filter === 'shipped' ? 'is-active' : ''} onClick={() => setFilter('shipped')}>ارسال‌شده</button>
          <button type="button" className={filter === 'delivered' ? 'is-active' : ''} onClick={() => setFilter('delivered')}>تحویل‌شده</button>
        </div>
      </div>

      {error && <p className="admin-error" role="alert">{error}</p>}

      {loading ? (
        <p className="admin-state">در حال بارگذاری…</p>
      ) : items.length === 0 ? (
        <p className="admin-state">هنوز سفارشی ثبت نشده است.</p>
      ) : visible.length === 0 ? (
        <div className="admin-state">
          <span>سفارشی با این فیلتر پیدا نشد.</span>
          <button type="button" className="admin-btn admin-btn--sm" onClick={() => { setQuery(''); setFilter('all'); }}>
            نمایش همه
          </button>
        </div>
      ) : (
        <div className="admin-orders-list">
          {visible.map((o) => {
            const tone = STATUS_MAP[o.status]?.tone || '';
            const label = STATUS_MAP[o.status]?.label || o.status;
            const place = [o.city, o.address].filter(Boolean).join('، ');
            const orderItems = Array.isArray(o.items) ? o.items : [];
            const publicCode = orderPublicCode(o);

            return (
              <details className="admin-order-card" key={o.id}>
                <summary className="admin-order-summary">
                  <div className="admin-order-summary-id">
                    <span className="admin-order-number num">#{publicCode}</span>
                    <span className="admin-order-date">{formatDate(o.created_at)}</span>
                  </div>

                  <div className="admin-order-summary-customer">
                    <strong>{o.customer_name || 'بدون نام'}</strong>
                    <span dir="ltr">{o.phone || 'بدون شماره'}</span>
                  </div>

                  <div className="admin-order-summary-badges">
                    <span className={`admin-badge ${tone}`}>{label}</span>
                    <span className={`admin-badge ${o.payment_status === 'paid' ? 'admin-badge--on' : o.payment_status === 'failed' ? 'admin-badge--danger' : ''}`}>
                      {o.payment_method === 'online'
                        ? o.payment_status === 'paid'
                          ? 'پرداخت شده'
                          : o.payment_status === 'failed'
                            ? 'پرداخت ناموفق'
                            : 'پرداخت آنلاین'
                        : 'پرداخت در محل'}
                    </span>
                  </div>

                  <strong className="admin-order-summary-total">
                    <span className="num">{formatPrice(o.subtotal)}</span>
                    <small>تومان</small>
                  </strong>

                  <span className="admin-order-expand" aria-hidden="true"><FaChevronDown /></span>
                </summary>

                <div className="admin-order-detail">
                  <div className="admin-order-detail-main">
                    <div className="admin-order-contact-row">
                      <span>کد مشتری: <b className="num">#{publicCode}</b></span>
                      <span>شناسه داخلی: <b className="num">#{o.id}</b></span>
                      {o.phone && (
                        <a href={`tel:${o.phone}`} className="admin-order-phone">
                          <FaPhoneAlt aria-hidden="true" />
                          <span dir="ltr">{o.phone}</span>
                        </a>
                      )}
                      {o.city && <span>{o.city}</span>}
                      {o.postal_code && <span>کد پستی: <b className="num">{o.postal_code}</b></span>}
                    </div>

                    {place && <p className="admin-order-address">{place}</p>}
                    {o.note && <p className="admin-order-note"><strong>یادداشت مشتری:</strong> {o.note}</p>}

                    {orderItems.length > 0 && (
                      <div className="admin-order-lines">
                        <span className="admin-order-lines-title">اقلام سفارش</span>
                        <ul>
                          {orderItems.map((it, i) => (
                            <li key={it.id ?? i}>
                              <span>{it.name}<small className="num"> × {it.qty || 1}</small></span>
                              <strong><span className="num">{formatPrice((it.price || 0) * (it.qty || 1))}</span> تومان</strong>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {o.payment_ref_id && (
                      <p className="admin-payment-ref">کد رهگیری پرداخت: <strong className="num">{o.payment_ref_id}</strong></p>
                    )}
                  </div>

                  <aside className="admin-order-controls">
                    <label className="admin-order-status">
                      <span className="admin-order-status-label">وضعیت سفارش</span>
                      <select
                        value={o.status}
                        onChange={(e) => onStatusChange(o, e.target.value)}
                        disabled={savingId === o.id}
                      >
                        {STATUS_OPTIONS.map((s) => (
                          <option key={s.value} value={s.value}>{s.label}</option>
                        ))}
                      </select>
                    </label>
                    {savingId === o.id && <span className="admin-order-saving">در حال ذخیره…</span>}

                    {o.payment_method === 'online' && o.payment_status !== 'paid' && o.payment_authority && (
                      <button
                        type="button"
                        className="admin-btn admin-btn--sm"
                        onClick={() => onReconcile(o)}
                        disabled={reconcilingId === o.id}
                      >
                        <FaRedoAlt aria-hidden="true" />
                        {reconcilingId === o.id ? 'در حال بررسی…' : 'بررسی مجدد پرداخت'}
                      </button>
                    )}

                    {reconcileMsg[o.id] && (
                      <p className={`admin-reconcile-message ${reconcileMsg[o.id].ok ? 'is-ok' : 'is-error'}`}>
                        {reconcileMsg[o.id].text}
                      </p>
                    )}

                    <button type="button" className="admin-btn admin-btn--sm admin-btn--danger" onClick={() => onDelete(o)}>
                      <FaTrashAlt aria-hidden="true" /> حذف سفارش
                    </button>
                  </aside>
                </div>
              </details>
            );
          })}
        </div>
      )}
    </section>
  );
}
