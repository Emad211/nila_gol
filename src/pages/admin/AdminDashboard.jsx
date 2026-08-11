import './admin.css';
import './admin-premium.css';
import { useEffect, useMemo, useState } from 'react';
import { Head } from 'vite-react-ssg';
import {
  FaBoxOpen,
  FaComments,
  FaEnvelope,
  FaExternalLinkAlt,
  FaHome,
  FaImages,
  FaNewspaper,
  FaRegStar,
  FaShieldAlt,
  FaShoppingBag,
  FaSignOutAlt,
} from 'react-icons/fa';
import { useAuth } from '../../context/AuthProvider';
import AdminOverview from '../../components/admin/AdminOverview';
import ProductsManager from '../../components/admin/ProductsManager';
import OrdersManager from '../../components/admin/OrdersManager';
import GalleryManager from '../../components/admin/GalleryManager';
import PostsManager from '../../components/admin/PostsManager';
import InquiriesViewer from '../../components/admin/InquiriesViewer';
import ReviewsManager from '../../components/admin/ReviewsManager';
import ChatManager from '../../components/admin/ChatManager';

const IDLE_TIMEOUT_MS = 30 * 60 * 1000;

const TABS = [
  { key: 'overview', label: 'داشبورد', caption: 'نمای کلی فروشگاه', icon: FaHome },
  { key: 'orders', label: 'سفارش‌ها', caption: 'پیگیری و وضعیت', icon: FaShoppingBag },
  { key: 'products', label: 'محصولات', caption: 'کالا و موجودی', icon: FaBoxOpen },
  { key: 'gallery', label: 'گالری', caption: 'تصاویر برند', icon: FaImages },
  { key: 'posts', label: 'مجله', caption: 'محتوای سایت', icon: FaNewspaper },
  { key: 'reviews', label: 'نظرات', caption: 'تأیید بازخوردها', icon: FaRegStar },
  { key: 'chat', label: 'گفت‌وگوها', caption: 'پشتیبانی مشتری', icon: FaComments },
  { key: 'inquiries', label: 'پیام‌ها', caption: 'فرم تماس', icon: FaEnvelope },
];

export default function AdminDashboard() {
  const { user, signOut } = useAuth();
  const [tab, setTab] = useState('overview');

  const activeTab = useMemo(() => TABS.find((item) => item.key === tab) || TABS[0], [tab]);

  useEffect(() => {
    let idleTimer;
    const resetIdleTimer = () => {
      window.clearTimeout(idleTimer);
      idleTimer = window.setTimeout(() => {
        void signOut();
      }, IDLE_TIMEOUT_MS);
    };

    const events = ['pointerdown', 'keydown', 'touchstart', 'focus'];
    events.forEach((eventName) => window.addEventListener(eventName, resetIdleTimer, { passive: true }));
    resetIdleTimer();

    return () => {
      window.clearTimeout(idleTimer);
      events.forEach((eventName) => window.removeEventListener(eventName, resetIdleTimer));
    };
  }, [signOut]);

  return (
    <>
      <Head>
        <title>مدیریت نیلا گل</title>
        <meta name="robots" content="noindex,nofollow,noarchive" />
      </Head>

      <div className="admin-app">
        <aside className="admin-sidebar" aria-label="منوی مدیریت">
          <div className="admin-brand">
            <span className="admin-brand-mark" aria-hidden="true">N</span>
            <div>
              <strong>نیلا گل</strong>
              <span>مرکز مدیریت</span>
            </div>
          </div>

          <nav className="admin-sidebar-nav">
            {TABS.map((item) => {
              const Icon = item.icon;
              const active = item.key === tab;
              return (
                <button
                  key={item.key}
                  type="button"
                  className={`admin-nav-item ${active ? 'is-active' : ''}`}
                  onClick={() => setTab(item.key)}
                  aria-current={active ? 'page' : undefined}
                >
                  <span className="admin-nav-icon"><Icon aria-hidden="true" /></span>
                  <span className="admin-nav-copy">
                    <strong>{item.label}</strong>
                    <small>{item.caption}</small>
                  </span>
                </button>
              );
            })}
          </nav>

          <div className="admin-sidebar-foot">
            <div className="admin-sidebar-security">
              <FaShieldAlt aria-hidden="true" />
              <div>
                <strong>دسترسی محافظت‌شده</strong>
                <span>Allowlist + RLS</span>
              </div>
            </div>
            <a href="/" target="_blank" rel="noopener noreferrer" className="admin-store-link">
              مشاهده فروشگاه
              <FaExternalLinkAlt aria-hidden="true" />
            </a>
          </div>
        </aside>

        <div className="admin-workspace">
          <header className="admin-premium-topbar">
            <div className="admin-page-heading">
              <span>نیلا گل / مدیریت</span>
              <h1>{activeTab.label}</h1>
            </div>

            <div className="admin-topbar-actions">
              <span className="admin-secure-pill">
                <FaShieldAlt aria-hidden="true" /> امن
              </span>
              <div className="admin-user-chip" title={user?.email || ''}>
                <span className="admin-user-avatar">{(user?.email || 'N').slice(0, 1).toUpperCase()}</span>
                <span className="admin-user-copy">
                  <strong>مدیر فروشگاه</strong>
                  <small dir="ltr">{user?.email}</small>
                </span>
              </div>
              <button
                type="button"
                className="admin-logout-btn"
                onClick={() => signOut()}
                aria-label="خروج از پنل مدیریت"
                title="خروج"
              >
                <FaSignOutAlt aria-hidden="true" />
              </button>
            </div>
          </header>

          <nav className="admin-mobile-tabs" aria-label="بخش‌های مدیریت">
            {TABS.map((item) => {
              const Icon = item.icon;
              const active = item.key === tab;
              return (
                <button
                  key={item.key}
                  type="button"
                  className={active ? 'is-active' : ''}
                  onClick={() => setTab(item.key)}
                  aria-current={active ? 'page' : undefined}
                >
                  <Icon aria-hidden="true" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          <main className="admin-main">
            {tab === 'overview' && <AdminOverview onNavigate={setTab} userEmail={user?.email} />}
            {tab === 'products' && <ProductsManager />}
            {tab === 'orders' && <OrdersManager />}
            {tab === 'gallery' && <GalleryManager />}
            {tab === 'posts' && <PostsManager />}
            {tab === 'reviews' && <ReviewsManager />}
            {tab === 'chat' && <ChatManager />}
            {tab === 'inquiries' && <InquiriesViewer />}
          </main>
        </div>
      </div>
    </>
  );
}
