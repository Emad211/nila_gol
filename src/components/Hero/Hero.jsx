import './Hero.css';
import { aboutContent } from '../../data/products';
import heroImage from '../../pics/first section.png';

const Hero = () => {
  return (
    <section className="hero">
      <div className="hero-bg" style={{ backgroundImage: `url(${heroImage})` }} aria-hidden="true" />
      <div className="hero-overlay" aria-hidden="true" />
      <div className="container">
        <div className="hero-content">
          <p className="hero-eyebrow">دکورهای آرام، ماندگار و خاص</p>
          <h2 className="hero-title">{aboutContent.title}</h2>
          <p className="hero-subtitle">{aboutContent.subtitle}</p>
          <p className="hero-note">
            بافت نرم، فرم‌پذیر و قابل شستشو — برای زیبایی‌ای که هر روز کنار شما می‌ماند.
          </p>
          <div className="hero-actions">
            <a href="#products" className="hero-button">مشاهده محصولات</a>
            <a href="#about" className="hero-link">داستان محصول</a>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
