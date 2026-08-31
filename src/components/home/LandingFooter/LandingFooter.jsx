import './LandingFooter.css';
import { Link } from 'react-router-dom';
import { FaArrowUp, FaCommentDots, FaTelegramPlane, FaWhatsapp } from 'react-icons/fa';
import { config } from '../../../data/config';
import { baleUrl, telegramUrl, whatsappUrl } from '../../../lib/order';
import logoImg from '../../../assets/logo.webp';

// Same targets as the current Footer.jsx (WU8 contract: reuse exactly).
const NAV_LINKS = [
  { to: '/', label: 'خانه' },
  { to: '/products', label: 'محصولات' },
  { to: '/blog', label: 'مجلات' },
  { to: '/how-to-order', label: 'روش خرید و پرداخت' },
];

/* Raw HTML keeps Enamad's non-standard `code` attribute intact in the
   pre-rendered HTML without triggering React's unknown-prop warning.
   Copied verbatim from Footer.jsx — the `code` attribute is REQUIRED by
   Enamad's domain-verification scanner; do not drop it. */
const enamadHtml =
  config.enamad?.img && config.enamad?.link
    ? `<a href="${config.enamad.link}" target="_blank" rel="noopener noreferrer" referrerpolicy="origin"><img src="${config.enamad.img}" alt="نماد اعتماد الکترونیکی" referrerpolicy="origin" code="${config.enamad.code || ''}"></a>`
    : '';

const LandingFooter = () => {
  // Channels from config — an unset env renders nothing (Footer.jsx pattern).
  const telegram = telegramUrl();
  const bale = baleUrl();
  const whatsapp = config.contact.whatsapp ? whatsappUrl() : '';

  const scrollTop = () => {
    const prefersReduced =
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: 0, behavior: prefersReduced ? 'auto' : 'smooth' });
  };

  return (
    <footer className="nl-footer">
      <div className="nl-container">
        <div className="nl-footer__inner">
          <div className="nl-footer__top">
            <Link to="/" className="nl-footer__logo-link" aria-label="نیلا گل">
              <img
                className="nl-footer__logo"
                src={logoImg}
                alt="نیلا گل"
                width={469}
                height={218}
                loading="lazy"
                decoding="async"
              />
            </Link>

            <div className="nl-footer__cols">
              <nav className="nl-footer__col" aria-label="دسترسی سریع">
                <h3 className="nl-footer__heading">
                  دسترسی سریع
                  <span className="nl-footer__heading-rule" aria-hidden="true" />
                </h3>
                <div className="nl-footer__links">
                  {NAV_LINKS.map((link) => (
                    <Link key={link.to} to={link.to} className="nl-footer__link">
                      {link.label}
                    </Link>
                  ))}
                  {whatsapp && (
                    <a
                      href={whatsapp}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="nl-footer__link"
                    >
                      تماس با ما
                    </a>
                  )}
                </div>
              </nav>

              <div className="nl-footer__col">
                <h3 className="nl-footer__heading">
                  راه های ارتباطی
                  <span className="nl-footer__heading-rule" aria-hidden="true" />
                </h3>
                <div className="nl-footer__channels">
                  {whatsapp && (
                    <a
                      href={whatsapp}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="واتساپ"
                    >
                      <FaWhatsapp aria-hidden="true" />
                    </a>
                  )}
                  {telegram && (
                    <a
                      href={telegram}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="تلگرام"
                    >
                      <FaTelegramPlane aria-hidden="true" />
                    </a>
                  )}
                  {bale && (
                    <a href={bale} target="_blank" rel="noopener noreferrer" aria-label="بله">
                      <FaCommentDots aria-hidden="true" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>

          <hr className="nl-footer__divider" />

          <div className="nl-footer__bottom">
            {enamadHtml ? (
              <div
                className="nl-footer__enamad"
                // eslint-disable-next-line react/no-danger
                dangerouslySetInnerHTML={{ __html: enamadHtml }}
              />
            ) : (
              <span aria-hidden="true" />
            )}
            <p className="nl-footer__copyright">
              کلیه حقوق این وب سایت متعلق به شرکت ____ می باشد
            </p>
            <button
              type="button"
              className="nl-footer__top-btn"
              aria-label="بازگشت به بالا"
              onClick={scrollTop}
            >
              <FaArrowUp aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default LandingFooter;
