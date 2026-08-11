import './Footer.css';
import { Link } from 'react-router-dom';
import {
  FaShieldAlt,
  FaExchangeAlt,
  FaRegComments,
  FaTruck,
  FaWhatsapp,
  FaTelegramPlane,
  FaPhoneAlt,
} from 'react-icons/fa';
import { config } from '../../data/config';
import { whatsappUrl, telegramUrl, phoneUrl } from '../../lib/order';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  const telegram = telegramUrl();

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-brand">
            <h3 className="footer-title">{config.siteName}</h3>
            <p className="footer-description">
              زیبایی ماندگار برای خانه و فضای شما؛ گل‌های روسیِ فرم‌پذیر، قابل شست‌وشو و همیشه مرتب.
            </p>
            <div className="footer-channels" aria-label="کانال‌های ارتباطی">
              <a
                className="footer-channel footer-channel--wa"
                href={whatsappUrl()}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="واتساپ"
                title="واتساپ"
              >
                <FaWhatsapp aria-hidden="true" />
              </a>
              {telegram && (
                <a
                  className="footer-channel"
                  href={telegram}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="تلگرام"
                  title="تلگرام"
                >
                  <FaTelegramPlane aria-hidden="true" />
                </a>
              )}
              <a
                className="footer-channel"
                href={phoneUrl()}
                aria-label="تماس تلفنی"
                title="تماس"
              >
                <FaPhoneAlt aria-hidden="true" />
              </a>
            </div>
          </div>

          <div className="footer-links">
            <span className="footer-heading">لینک‌های سریع</span>
            <Link to="/" className="footer-link">صفحه اصلی</Link>
            <Link to="/products" className="footer-link">محصولات</Link>
            <Link to="/blog" className="footer-link">مجله</Link>
            <Link to="/how-to-order" className="footer-link">روش خرید و پرداخت</Link>
            <Link to="/#contact" className="footer-link">تماس با ما</Link>
          </div>

          <div className="footer-contact">
            <span className="footer-heading">ارتباط سریع</span>
            <a href={`tel:${config.contact.phone}`} className="footer-link">
              {config.contact.phone}
            </a>
            {config.contact.telegram && (
              <a
                href={config.contact.telegram}
                target="_blank"
                rel="noopener noreferrer"
                className="footer-link"
              >
                تلگرام
              </a>
            )}
          </div>
        </div>

        <div className="footer-trust">
          <span className="footer-trust-item"><FaShieldAlt aria-hidden="true" /> ضمانت کیفیت و دوام</span>
          <span className="footer-trust-item"><FaExchangeAlt aria-hidden="true" /> تعویض و مرجوعی</span>
          <span className="footer-trust-item"><FaRegComments aria-hidden="true" /> مشاوره رایگان</span>
          <span className="footer-trust-item"><FaTruck aria-hidden="true" /> ارسال به سراسر کشور</span>
        </div>

        {config.enamad?.img && config.enamad?.link && (
          <div className="footer-enamad">
            <a href={config.enamad.link} target="_blank" rel="noopener noreferrer" referrerPolicy="origin">
              <img src={config.enamad.img} alt="نماد اعتماد الکترونیکی" />
            </a>
          </div>
        )}

        <div className="footer-bottom">
          <p className="footer-text">
            © {currentYear} {config.siteName} — تمامی حقوق محفوظ است
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
