import './Footer.css';
import { Link } from 'react-router-dom';
import { FaWhatsapp, FaTelegramPlane, FaCommentDots } from 'react-icons/fa';
import { config } from '../../data/config';
import { whatsappUrl, telegramUrl, baleUrl } from '../../lib/order';
import logoImg from '../../assets/logo.webp';

const NAV_LINKS = [
  { to: '/', label: 'خانه' },
  { to: '/products', label: 'محصولات' },
  { to: '/blog', label: 'مجلات' },
  { to: '/how-to-order', label: 'روش خرید و پرداخت' },
];

/* Raw HTML keeps Enamad's non-standard `code` attribute intact in the
   pre-rendered HTML without triggering React's unknown-prop warning. */
const enamadHtml =
  config.enamad?.img && config.enamad?.link
    ? `<a href="${config.enamad.link}" target="_blank" rel="noopener noreferrer" referrerpolicy="origin"><img src="${config.enamad.img}" alt="نماد اعتماد الکترونیکی" referrerpolicy="origin" code="${config.enamad.code || ''}"></a>`
    : '';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  const telegram = telegramUrl();
  const bale = baleUrl();
  const whatsapp = config.contact.whatsapp ? whatsappUrl() : '';

  return (
    <footer className="footer">
      <div className="footer-shell">
        <div className="footer-top">
          <div className="footer-navs">
            <nav className="footer-nav" aria-label="دسترسی سریع">
              <span className="footer-heading">دسترسی سریع</span>
              <div className="footer-links-row">
                {NAV_LINKS.map((link) => (
                  <Link key={link.to} to={link.to} className="footer-link">
                    {link.label}
                  </Link>
                ))}
                {whatsapp && (
                  <a
                    href={whatsapp}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="footer-link"
                  >
                    تماس با ما
                  </a>
                )}
              </div>
            </nav>

            <div className="footer-channels-block">
              <span className="footer-heading">راه های ارتباطی</span>
              <div className="footer-channels">
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

          <Link to="/" className="footer-logo" aria-label={config.siteName}>
            <img src={logoImg} alt={config.siteName} loading="lazy" decoding="async" />
          </Link>
        </div>

        <hr className="footer-divider" />

        <div className="footer-bottom">
          {enamadHtml ? (
            <div
              className="footer-enamad"
              // eslint-disable-next-line react/no-danger
              dangerouslySetInnerHTML={{ __html: enamadHtml }}
            />
          ) : (
            <span aria-hidden="true" />
          )}
          <p className="footer-text">
            کلیه حقوق این وب سایت متعلق به {config.siteName} می باشد © {currentYear}
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
