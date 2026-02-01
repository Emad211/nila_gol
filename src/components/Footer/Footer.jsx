import './Footer.css';
import { config } from '../../data/config';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-content">
          <p className="footer-text">
            © {currentYear} {config.siteName} - تمامی حقوق محفوظ است
          </p>
          <p className="footer-subtitle">
            زیبایی پایدار برای خانه شما 🌸
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
