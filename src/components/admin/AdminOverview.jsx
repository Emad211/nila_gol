import { useEffect, useMemo, useState } from 'react';
import {
  FaArrowLeft,
  FaBoxOpen,
  FaComments,
  FaEnvelope,
  FaImages,
  FaRegClock,
  FaRegStar,
  FaShoppingBag,
  FaShieldAlt,
  FaStore,
} from 'react-icons/fa';
import { getAdminOverview } from '../../services/adminOverview';

const cards = [
  { key: 'orders', value: 'orders', label: 'کل سفارش‌ها', icon: FaShoppingBag, tone: 'wine' },
  { key: 'orders', value: 'pendingOrders', label: 'در انتظار بررسی', icon: FaRegClock, tone: 'amber' },
  { key: 'products', value: 'products', label: 'محصولات', icon: FaBoxOpen, tone: 'violet' },
  { key: 'chat', value: 'unreadChat', label: 'گفت‌وگوی خوانده‌نشده', icon: FaComments, tone: 'blue' },
  { key: 'reviews', value: 'pendingReviews', label: 'نظر در انتظار تأیید', icon: FaRegStar, tone: 'rose' },
  { key: 'inquiries', value: 'inquiries', label: 'پیام‌های تماس', icon: FaEnvelope, tone: 'green' },
];

export default function AdminOverview({ onNavigate, userEmail }) {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    getAdminOverview()
      .then((data) => {
        if (active) setSummary(data);
      })
      .catch(() => {
        if (active) setError('دریافت خلاصه وضعیت ممکن نشد.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'صبح بخیر';
    if (hour < 18) return 'روز بخیر';
    return 'شب بخیر';
  }, []);

  return (
    <section className="admin-overview" aria-labelledby="admin-overview-title">
      <div className="admin-overview-hero">
        <div>
          <span className="admin-overview-kicker">مرکز مدیریت نیلا گل</span>
          <h2 id="admin-overview-title">{greeting}؛ فروشگاه زیر کنترل شماست.</h2>
          <p>
            سفارش‌ها، محصولات، محتوا و پیام‌های مشتری را از یک فضای ساده و متمرکز مدیریت کنید.
          </p>
        </div>
        <div className="admin-overview-security">
          <span className="admin-security-icon"><FaShieldAlt aria-hidden="true" /></span>
          <div>
            <strong>نشست مدیریت محافظت می‌شود</strong>
            <span>دسترسی allowlist + RLS + خروج خودکار پس از عدم فعالیت</span>
          </div>
        </div>
      </div>

      {error && <p className="admin-inline-alert" role="alert">{error}</p>}

      <div className="admin-stat-grid" aria-busy={loading}>
        {cards.map((card) => {
          const Icon = card.icon;
          const value = loading ? '—' : summary?.[card.value] ?? 0;
          return (
            <button
              key={`${card.key}-${card.value}`}
              type="button"
              className={`admin-stat-card admin-stat-card--${card.tone}`}
              onClick={() => onNavigate(card.key)}
            >
              <span className="admin-stat-icon"><Icon aria-hidden="true" /></span>
              <span className="admin-stat-value num">{value}</span>
              <span className="admin-stat-label">{card.label}</span>
              <FaArrowLeft className="admin-stat-arrow" aria-hidden="true" />
            </button>
          );
        })}
      </div>

      <div className="admin-overview-lower">
        <article className="admin-quick-panel">
          <header>
            <div>
              <span>میانبرها</span>
              <h3>کارهای پرتکرار</h3>
            </div>
          </header>
          <div className="admin-quick-grid">
            <button type="button" onClick={() => onNavigate('products')}>
              <FaBoxOpen aria-hidden="true" />
              <span><strong>مدیریت محصولات</strong><small>قیمت، موجودی و تصاویر</small></span>
            </button>
            <button type="button" onClick={() => onNavigate('orders')}>
              <FaShoppingBag aria-hidden="true" />
              <span><strong>پیگیری سفارش‌ها</strong><small>وضعیت و پرداخت مشتری</small></span>
            </button>
            <button type="button" onClick={() => onNavigate('gallery')}>
              <FaImages aria-hidden="true" />
              <span><strong>گالری برند</strong><small>تصاویر صفحه اصلی</small></span>
            </button>
            <button type="button" onClick={() => onNavigate('chat')}>
              <FaComments aria-hidden="true" />
              <span><strong>پاسخ به مشتری</strong><small>گفت‌وگوهای پشتیبانی</small></span>
            </button>
          </div>
        </article>

        <aside className="admin-account-panel">
          <span className="admin-account-avatar">{(userEmail || 'N').slice(0, 1).toUpperCase()}</span>
          <span className="admin-account-label">حساب مدیریت فعال</span>
          <strong dir="ltr">{userEmail || 'admin'}</strong>
          <p>برای امنیت بیشتر، پنل پس از ۳۰ دقیقه عدم فعالیت از حساب خارج می‌شود.</p>
          <a href="/" target="_blank" rel="noopener noreferrer">
            <FaStore aria-hidden="true" /> مشاهده فروشگاه
          </a>
        </aside>
      </div>
    </section>
  );
}
