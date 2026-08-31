import './LandingHeader.css';
import { config } from '../../../data/config';
import { useEffect, useId, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FaCommentDots, FaShoppingBag, FaTelegramPlane, FaTimes, FaWhatsapp } from 'react-icons/fa';
import logoImg from '../../../assets/logo.webp';
import ThemeToggle from '../../ThemeToggle/ThemeToggle';
import { useCart } from '../../../context/CartProvider';
import { baleUrl, telegramUrl, whatsappOrderUrl } from '../../../lib/order';

const NAV_LINKS = [
  { to: '/', label: 'خانه' },
  { to: '/products', label: 'محصولات' },
  { to: '/blog', label: 'مجله' },
  { to: '/how-to-order', label: 'روش خرید' },
  { to: '/account', label: 'حساب کاربری' },
];

function linkIsActive(link, location) {
  if (link.to === '/') return location.pathname === '/';
  if (link.to === '/products') return location.pathname.startsWith('/products');
  if (link.to === '/blog') return location.pathname.startsWith('/blog');
  return location.pathname === link.to;
}

// Contact channels from config — an unset env never renders a fake link.
// The bar shows only the first configured channel (decision D2); the drawer
// lists all of them.
function buildChannels() {
  const channels = [];
  if (config.contact.whatsapp) {
    channels.push({ key: 'whatsapp', href: whatsappOrderUrl(), label: 'واتساپ', Icon: FaWhatsapp });
  }
  const telegram = telegramUrl();
  if (telegram) {
    channels.push({ key: 'telegram', href: telegram, label: 'تلگرام', Icon: FaTelegramPlane });
  }
  const bale = baleUrl();
  if (bale) {
    channels.push({ key: 'bale', href: bale, label: 'بله', Icon: FaCommentDots });
  }
  return channels;
}

const LandingHeader = () => {
  // Deterministic first render (closed drawer) keeps SSG output and hydration
  // identical; everything browser-flavoured lives in effects/handlers below.
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navId = useId();
  const drawerRef = useRef(null);
  const toggleRef = useRef(null);
  const location = useLocation();
  const { count } = useCart();
  const channels = buildChannels();
  const contact = channels[0] || null;
  const ContactIcon = contact?.Icon;

  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname, location.hash]);

  // Scroll-lock while the full-screen drawer is open.
  useEffect(() => {
    const previousOverflow = document.documentElement.style.overflow;
    if (isMenuOpen) document.documentElement.style.overflow = 'hidden';
    else document.documentElement.style.overflow = previousOverflow;
    return () => {
      document.documentElement.style.overflow = previousOverflow;
    };
  }, [isMenuOpen]);

  // Focus-trap + Escape + focus restore (same a11y pattern as Header.jsx).
  useEffect(() => {
    if (!isMenuOpen) return undefined;

    const panel = drawerRef.current;
    const toggle = toggleRef.current;
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
      else toggle?.focus();
    };
  }, [isMenuOpen]);

  const closeMenu = () => setIsMenuOpen(false);

  return (
    <header className="nl-header">
      <div className="nl-header__bar">
        {/* RTL: first child sits at inline-start (physical right) — the render
            places the logo flush at the container's right edge (spec-deep
            "logo 133x62@(1670,8173)", container 43..1803). */}
        <Link to="/" className="nl-header__logo-link" aria-label={config.siteName}>
          <img
            src={logoImg}
            alt={config.siteName}
            className="nl-header__logo"
            width="133"
            height="62"
            decoding="async"
          />
        </Link>

        {/* DOM order [contact, cart, hamburger] renders (RTL) as hamburger at
            the physical-left container edge, then cart, then contact — matching
            the render (Menu button@43, cart@119, contact@177). */}
        <div className="nl-header__actions">
          {contact && (
            <a
              href={contact.href}
              target="_blank"
              rel="noopener noreferrer"
              className="nl-header__icon-link"
              aria-label={contact.label}
            >
              <ContactIcon aria-hidden="true" />
            </a>
          )}
          <Link
            to="/cart"
            className="nl-header__icon-link"
            aria-label={count > 0 ? `سبد خرید (${count} کالا)` : 'سبد خرید'}
          >
            <FaShoppingBag aria-hidden="true" />
          </Link>
          <button
            ref={toggleRef}
            type="button"
            className="nl-header__menu-btn"
            aria-label={isMenuOpen ? 'بستن منو' : 'باز کردن منو'}
            aria-expanded={isMenuOpen}
            aria-controls={navId}
            onClick={() => setIsMenuOpen((v) => !v)}
          >
            <span className="nl-header__menu-lines" aria-hidden="true">
              <span className="nl-header__menu-line" />
              <span className="nl-header__menu-line" />
            </span>
          </button>
        </div>
      </div>

      {isMenuOpen && (
        <div className="nl-drawer" id={navId}>
          <div
            className="nl-drawer__overlay"
            onClick={closeMenu}
            aria-hidden="true"
          />
          <div
            ref={drawerRef}
            className="nl-drawer__panel"
            role="dialog"
            aria-modal="true"
            aria-label="منوی ناوبری"
          >
            <div className="nl-drawer__content">
              <div className="nl-drawer__top">
                <button
                  type="button"
                  className="nl-drawer__close"
                  onClick={closeMenu}
                  aria-label="بستن منو"
                >
                  <FaTimes aria-hidden="true" />
                </button>
              </div>

              <nav className="nl-drawer__nav" aria-label="ناوبری اصلی">
                {NAV_LINKS.map((l) => {
                  const active = linkIsActive(l, location);
                  return (
                    <Link
                      key={l.to}
                      to={l.to}
                      className={active ? 'nl-drawer__link is-active' : 'nl-drawer__link'}
                      aria-current={active ? 'page' : undefined}
                      onClick={closeMenu}
                    >
                      {l.label}
                    </Link>
                  );
                })}
              </nav>

              <div className="nl-drawer__meta">
                <Link to="/cart" className="nl-drawer__cart" onClick={closeMenu}>
                  <FaShoppingBag aria-hidden="true" />
                  <span>سبد خرید</span>
                  {count > 0 && (
                    <span className="nl-drawer__count num" aria-hidden="true">{count}</span>
                  )}
                </Link>

                <div className="nl-drawer__meta-row">
                  <ThemeToggle />
                  {channels.length > 0 && (
                    <div className="nl-drawer__channels" aria-label="راه‌های ارتباطی">
                      {channels.map(({ key, href, label, Icon }) => (
                        <a
                          key={key}
                          href={href}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={label}
                        >
                          <Icon aria-hidden="true" />
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default LandingHeader;
