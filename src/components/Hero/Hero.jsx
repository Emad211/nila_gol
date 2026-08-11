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
import { Stagger, RevealItem, MagneticButton } from '../../lib/motion';
import heroImage from '../../assets/hero.webp';

const Hero = () => {
  return (
    <section className="hero hero--editorial" aria-labelledby="home-hero-title">
      <div className="container hero-editorial-grid">
        <Stagger className="hero-content" amount={0.08} stagger={0.08}>
          <RevealItem as="span" className="hero-eyebrow">
            <FaRegGem aria-hidden="true" />
            NILA SIGNATURE COLLECTION
          </RevealItem>

          <RevealItem as="h1" id="home-hero-title" className="hero-title">
            گل‌هایی برای خانه‌ای که قرار نیست <span>معمولی</span> باشد.
          </RevealItem>

          <RevealItem as="p" className="hero-subtitle">
            گل‌های روسی انعطاف‌پذیر با ظاهر طبیعی، بافت لطیف و ماندگاری بالا؛ برای دکوری که هر روز مرتب و چشم‌نواز می‌ماند.
          </RevealItem>

          <RevealItem as="div" className="hero-actions">
            <MagneticButton as="link" to="/products" className="hero-button">
              <FaShoppingBag aria-hidden="true" />
              <span>مشاهده مجموعه</span>
              <FaArrowLeft className="hero-button-arrow" aria-hidden="true" />
            </MagneticButton>
            <Link to="/how-to-order" className="hero-link">
              راهنمای انتخاب و سفارش
            </Link>
          </RevealItem>

          <RevealItem as="ul" className="hero-trust" aria-label="مزایای خرید از نیلا گل">
            <li><FaCheck aria-hidden="true" /> قابل شست‌وشو و فرم‌پذیر</li>
            <li><FaTruck aria-hidden="true" /> ارسال به سراسر کشور</li>
            <li><FaShieldAlt aria-hidden="true" /> تضمین کیفیت و دوام</li>
          </RevealItem>
        </Stagger>

        <div className="hero-visual" aria-label="نمونه گل روسی نیلا گل">
          <div className="hero-image-frame">
            <img
              src={heroImage}
              alt="گل روسی انعطاف‌پذیر نیلا گل در چیدمان دکور"
              className="hero-image"
              loading="eager"
              fetchPriority="high"
              decoding="async"
            />
          </div>

          <div className="hero-visual-note hero-visual-note--top">
            <span className="hero-visual-note-kicker">فرم طبیعی</span>
            <strong>بدون پژمردگی</strong>
          </div>

          <div className="hero-visual-note hero-visual-note--bottom">
            <span className="hero-visual-mark" aria-hidden="true">N</span>
            <div>
              <strong>نیلا گل</strong>
              <span>زیبایی ماندگار برای فضای شما</span>
            </div>
          </div>
        </div>
      </div>

      <div className="hero-bottom-line" aria-hidden="true">
        <span>گل ماندگار</span>
        <i />
        <span>انتخاب خاص</span>
        <i />
        <span>چیدمان آرام</span>
      </div>
    </section>
  );
};

export default Hero;
