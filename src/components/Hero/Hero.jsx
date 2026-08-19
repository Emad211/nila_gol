import './Hero.css';
import { Link } from 'react-router-dom';
import {
  FaArrowLeft,
  FaCheck,
  FaPhoneAlt,
  FaRegGem,
  FaShoppingBag,
  FaTruck,
} from 'react-icons/fa';
import heroImage from '../../assets/hero.webp';

const Hero = () => {
  return (
    <section className="hero hero--editorial" aria-labelledby="home-hero-title">
      <div className="container hero-editorial-grid">
        <div className="hero-content">
          <span className="hero-eyebrow">
            <FaRegGem aria-hidden="true" />
            گل روسی انعطاف‌پذیر · دکور ماندگار
          </span>

          <h1 id="home-hero-title" className="hero-title">
            زیبایی گل طبیعی، <span>بدون پژمردگی.</span>
          </h1>

          <p className="hero-subtitle">
            مجموعه‌ای از گل‌های روسی لوکس با ظاهر طبیعی، بافت لطیف و فرم‌پذیری بالا؛ برای خانه، هدیه و چیدمانی که همیشه مرتب می‌ماند.
          </p>

          <div className="hero-actions">
            <Link to="/products" className="hero-button">
              <FaShoppingBag aria-hidden="true" />
              <span>مشاهده و خرید مجموعه</span>
              <FaArrowLeft className="hero-button-arrow" aria-hidden="true" />
            </Link>
            <Link to="/how-to-order" className="hero-link">
              راهنمای انتخاب و سفارش
            </Link>
          </div>

          <ul className="hero-trust" aria-label="مزایای خرید از نیلا گل">
            <li><FaCheck aria-hidden="true" /> قابل شست‌وشو و فرم‌پذیر</li>
            <li><FaTruck aria-hidden="true" /> ارسال به سراسر کشور</li>
            <li><FaPhoneAlt aria-hidden="true" /> مشاوره پیش از سفارش</li>
          </ul>
        </div>

        <div className="hero-visual" aria-label="چیدمان الهام‌بخش گل نیلا گل">
          <div className="hero-image-frame">
            <img
              src={heroImage}
              alt="چیدمان الهام‌بخش گل سفید برای دکور نیلا گل"
              className="hero-image"
              width="1584"
              height="672"
              loading="eager"
              fetchpriority="high"
              decoding="async"
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
