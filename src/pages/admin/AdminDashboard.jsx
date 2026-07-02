import './admin.css';
import { useState } from 'react';
import { useAuth } from '../../context/AuthProvider';
import ProductsManager from '../../components/admin/ProductsManager';
import OrdersManager from '../../components/admin/OrdersManager';
import GalleryManager from '../../components/admin/GalleryManager';
import PostsManager from '../../components/admin/PostsManager';
import InquiriesViewer from '../../components/admin/InquiriesViewer';
import ReviewsManager from '../../components/admin/ReviewsManager';
import ChatManager from '../../components/admin/ChatManager';

const TABS = [
  { key: 'products', label: 'محصولات' },
  { key: 'orders', label: 'سفارش‌ها' },
  { key: 'gallery', label: 'گالری' },
  { key: 'posts', label: 'مجله' },
  { key: 'reviews', label: 'نظرات' },
  { key: 'chat', label: 'گفت‌وگوها' },
  { key: 'inquiries', label: 'پیام‌ها' },
];

export default function AdminDashboard() {
  const { user, signOut } = useAuth();
  const [tab, setTab] = useState('products');

  return (
    <div className="admin-shell">
      <header className="admin-topbar">
        <h1 className="admin-topbar-title">پنل مدیریت 🌸</h1>
        <div className="admin-topbar-end">
          <span className="admin-topbar-user">{user?.email}</span>
          <button className="admin-btn admin-btn--sm" onClick={() => signOut()}>
            خروج
          </button>
        </div>
      </header>

      <nav className="admin-tabs">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            className={`admin-tab ${tab === t.key ? 'is-active' : ''}`}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </nav>

      {tab === 'products' && <ProductsManager />}
      {tab === 'orders' && <OrdersManager />}
      {tab === 'gallery' && <GalleryManager />}
      {tab === 'posts' && <PostsManager />}
      {tab === 'reviews' && <ReviewsManager />}
      {tab === 'chat' && <ChatManager />}
      {tab === 'inquiries' && <InquiriesViewer />}
    </div>
  );
}
