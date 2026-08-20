import './Header.css';
import { config } from '../../data/config';
import { useEffect, useId, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FaPhoneAlt, FaRegUser, FaShoppingBag, FaTelegramPlane, FaWhatsapp } from 'react-icons/fa';
import logoImg from '../../assets/logo.webp';
import ThemeToggle from '../ThemeToggle/ThemeToggle';
import { useCart } from '../../context/CartProvider';
import { phoneUrl, telegramUrl, whatsappOrderUrl } from '../../lib/order';

const LINKS = [
  { to: '/products', label: 'محصولات' },
  { to: '/blog', label: 'مجله' },
  { to: '/how-to-order', label: 'روش خرید' },
  { to: '/account', label: 'حساب کاربری', mobileOnly: true },
];

function linkIsActive(link, location) {
  if (link.to === '/products') return location.pathname.startsWith('/products');
  if (link.to === '/blog') return location.pathname.startsWith('/blog');
  return location.pathname === link.to;
}

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navId = useId();
  const navRef = useRef(null);
  const toggleRef = useRef(null);
  const location = useLocation();
  const { count } = useCart();
  const telegram = telegramUrl();

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

  useEffect(() => {
    if (!isMenuOpen) return undefined;

    const panel = navRef.current;
    const previousFocus = document.activeElement;
    const selector = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';
    const focusables = () => Array.from(panel?.querySelectorAll(selector) || []);

    window.requestAnimationFrame(() => focusables()[0]?.focus());

    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        setIsMenuOpen(false);
        return;
      }

      if (event.key !== 'Tab') return;
      const nodes = focusables();
      if (nodes.length === 0) return;
      const first = nodes[0];
      const last = nodes[nodes.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      if (previousFocus instanceof HTMLElement) previousFocus.focus();
      else toggleRef.current?.focus();
    };
  }, [isMenuOpen]);

  const cartActive = location.pathname === '/cart' || location.pathname === '/checkout';
  const accountActive = location.pathname === '/account';

  return (
    <header className={isMenuOpen ? 'header header--menu-open' : 'header'}>
      <div className="container">
        <div className="header-content">
          <Link to="/" className="logo-link" aria-label={config.siteName}>
            <img
              src={logoImg}
              alt={config.siteName}
              className="logo-img"
              width="512"
              height="208"
              decoding="async"
            />
          </Link>

          <nav ref={navRef} id={navId} className="nav" aria-label="ناوبری اصلی">
            {LINKS.map((l) => {
              const active = linkIsActive(l, location);
              const classes = [
                'nav-link',
                l.mobileOnly ? 'nav-link--mobile-only' : '',
                active ? 'is-active' : '',
              ]
                .filter(Boolean)
                .join(' ');

              return (
                <Link
                  key={l.to}
                  to={l.to}
                  className={classes}
                  aria-current={active ? 'page' : undefined}
                >
                  {l.label}
                </Link>
              );
            })}
            <div className="nav-channels" aria-label="راه‌های ارتباطی">
              <a href={whatsappOrderUrl()} target="_blank" rel="noopener noreferrer" aria-label="واتساپ">
                <FaWhatsapp aria-hidden="true" />
              </a>
              {telegram && (
                <a href={telegram} target="_blank" rel="noopener noreferrer" aria-label="تلگرام">
                  <FaTelegramPlane aria-hidden="true" />
                </a>
              )}
              <a href={phoneUrl()} aria-label="تماس">
                <FaPhoneAlt aria-hidden="true" />
              </a>
            </div>
          </nav>

          <div className="header-actions">
            <Link
              to="/cart"
              className={`header-cart ${cartActive ? 'is-active' : ''}`}
              aria-current={cartActive ? 'page' : undefined}
              aria-label={count > 0 ? `سبد خرید (${count} کالا)` : 'سبد خرید'}
            >
              <FaShoppingBag aria-hidden="true" />
              {count > 0 && <span className="header-cart-badge num" aria-hidden="true">{count}</span>}
            </Link>
            <ThemeToggle />
            <Link
              to="/account"
              className={`header-account ${accountActive ? 'is-active' : ''}`}
              aria-current={accountActive ? 'page' : undefined}
            >
              <FaRegUser aria-hidden="true" />
              <span className="header-account-label">حساب من</span>
            </Link>
            <button
              ref={toggleRef}
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
