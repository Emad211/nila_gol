import './Header.css';
import { config } from '../../data/config';
import { useEffect, useId, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FaRegUser, FaShoppingBag } from 'react-icons/fa';
import logoImg from '../../assets/logo.webp';
import ThemeToggle from '../ThemeToggle/ThemeToggle';
import { useCart } from '../../context/CartProvider';

// Minimal nav — only links that lead to other pages (no in-page hash anchors).
const LINKS = [
  { to: '/products', label: 'محصولات' },
  { to: '/blog', label: 'مجله' },
  { to: '/how-to-order', label: 'روش خرید' },
];

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navId = useId();
  const location = useLocation();
  const { count } = useCart();

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === 'Escape') setIsMenuOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname, location.hash]);

  useEffect(() => {
    const previousOverflow = document.documentElement.style.overflow;
    if (isMenuOpen) document.documentElement.style.overflow = 'hidden';
    else document.documentElement.style.overflow = previousOverflow;
    return () => {
      document.documentElement.style.overflow = previousOverflow;
    };
  }, [isMenuOpen]);

  return (
    <header className={isMenuOpen ? 'header header--menu-open' : 'header'}>
      <div className="container">
        <div className="header-content">
          <Link to="/" className="logo-link" aria-label={config.siteName}>
            <img src={logoImg} alt={config.siteName} className="logo-img" />
          </Link>

          <nav id={navId} className="nav" aria-label="ناوبری اصلی">
            {LINKS.map((l) => (
              <Link key={l.to} to={l.to} className="nav-link">
                {l.label}
              </Link>
            ))}
          </nav>

          <div className="header-actions">
            <Link to="/cart" className="header-cart" aria-label={count > 0 ? `سبد خرید (${count} کالا)` : 'سبد خرید'}>
              <FaShoppingBag aria-hidden="true" />
              {count > 0 && <span className="header-cart-badge num" aria-hidden="true">{count}</span>}
            </Link>
            <ThemeToggle />
            <Link to="/account" className="header-account">
              <FaRegUser aria-hidden="true" />
              <span className="header-account-label">حساب من</span>
            </Link>
            <button
              type="button"
              className="nav-toggle"
              aria-label={isMenuOpen ? 'بستن منو' : 'باز کردن منو'}
              aria-expanded={isMenuOpen}
              aria-controls={navId}
              onClick={() => setIsMenuOpen((v) => !v)}
            >
              <span className="nav-toggle-lines" aria-hidden="true">
                <span className="nav-toggle-line" />
                <span className="nav-toggle-line" />
              </span>
            </button>
          </div>
        </div>
      </div>

      <div
        className={isMenuOpen ? 'nav-backdrop nav-backdrop--open' : 'nav-backdrop'}
        onClick={() => setIsMenuOpen(false)}
        aria-hidden="true"
      />
    </header>
  );
};

export default Header;
