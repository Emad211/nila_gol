import './Hero.css';
import { Link } from 'react-router-dom';
import {
  FaArrowLeft,
  FaCheck,
  FaRegGem,
  FaShieldAlt,
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
              <span>خرید گل‌های روسی</span>
              <FaArrowLeft className="hero-button-arrow" aria-hidden="true" />
            </Link>
            <Link to="/how-to-order" className="hero-link">
              راهنمای انتخاب و سفارش
            </Link>
          </div>

          <ul className="hero-trust" aria-label="مزایای خرید از نیلا گل">
            <li><FaCheck aria-hidden="true" /> قابل شست‌وشو و فرم‌پذیر</li>
            <li><FaTruck aria-hidden="true" /> ارسال به سراسر کشور</li>
            <li><FaShieldAlt aria-hidden="true" /> تضمین کیفیت و دوام</li>
          </ul>
        </div>

        <div className="hero-visual" aria-label="نمونه گل روسی نیلا گل">
          <div className="hero-image-frame">
            <img
              src={heroImage}
              alt="گل روسی انعطاف‌پذیر نیلا گل در چیدمان دکور"
              className="hero-image"
              width="1584"
              height="672"
              loading="eager"
              fetchPriority="high"
              decoding="async"
            />
          </div>

          <div className="hero-visual-note hero-visual-note--top">
            <span className="hero-visual-note-kicker">بافت نرم و طبیعی</span>
            <strong>قابل شست‌وشو</strong>
          </div>

          <div className="hero-visual-note hero-visual-note--bottom">
            <span className="hero-visual-mark" aria-hidden="true">N</span>
            <div>
              <strong>نیلا گل</strong>
              <span>گل ماندگار برای فضای خاص شما</span>
            </div>
          </div>
        </div>
      </div>

      <div className="hero-bottom-line" aria-hidden="true">
        <span>ظاهر طبیعی</span>
        <i />
        <span>ماندگاری بالا</span>
        <i />
        <span>انتخاب آسان</span>
      </div>
    </section>
  );
};

export default Hero;
