import './Header.css';
import { config } from '../../data/config';
import { useEffect, useId, useState } from 'react';
import logoImg from '../../pics/logo.png';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navId = useId();

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === 'Escape') setIsMenuOpen(false);
    };

    const onHashChange = () => setIsMenuOpen(false);

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('hashchange', onHashChange);

    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('hashchange', onHashChange);
    };
  }, []);

  useEffect(() => {
    // Prevent background scroll when the mobile menu is open.
    const previousOverflow = document.documentElement.style.overflow;
    if (isMenuOpen) {
      document.documentElement.style.overflow = 'hidden';
    } else {
      document.documentElement.style.overflow = previousOverflow;
    }

    return () => {
      document.documentElement.style.overflow = previousOverflow;
    };
  }, [isMenuOpen]);

  return (
    <header className={isMenuOpen ? 'header header--menu-open' : 'header'}>
      <div className="container">
        <div className="header-content">
          <a href="#" className="logo-link">
            <img src={logoImg} alt={config.siteName} className="logo-img" />
          </a>
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

          <nav id={navId} className="nav" aria-label="ناوبری اصلی">
            <a href="#about" className="nav-link" onClick={() => setIsMenuOpen(false)}>
              درباره ما
            </a>
            <a href="#features" className="nav-link" onClick={() => setIsMenuOpen(false)}>
              ویژگی‌ها
            </a>
            <a href="#products" className="nav-link" onClick={() => setIsMenuOpen(false)}>
              محصولات
            </a>
            <a href="#contact" className="nav-link" onClick={() => setIsMenuOpen(false)}>
              تماس
            </a>
          </nav>
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
