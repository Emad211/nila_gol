import './Hero.css';
import { lazy, Suspense, useEffect, useState } from 'react';
import { aboutContent } from '../../data/products';
import { Link } from 'react-router-dom';
import { FaTruck, FaShieldAlt, FaHandHoldingHeart, FaUndo } from 'react-icons/fa';
import { Stagger, RevealItem, MagneticButton } from '../../lib/motion';
import orchidImg from '../../assets/hero.webp';

// three.js is heavy — only load the 3D orchid on capable desktops.
const HeroOrchid3D = lazy(() => import('./HeroOrchid3D'));

function useCanRender3D() {
  const [ok, setOk] = useState(false);
  useEffect(() => {
    try {
      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const small = window.matchMedia('(max-width: 767px)').matches;
      const c = document.createElement('canvas');
      const webgl = !!(c.getContext('webgl2') || c.getContext('webgl'));
      setOk(!reduce && !small && webgl);
    } catch {
      setOk(false);
    }
  }, []);
  return ok;
}

const StaticOrchid = () => (
  <div className="orchid-static" aria-hidden="true">
    <img src={orchidImg} alt="" />
  </div>
);

const Hero = () => {
  const can3D = useCanRender3D();

  return (
    <section className="hero on-dark" aria-label="معرفی">
      {can3D ? (
        <Suspense fallback={<StaticOrchid />}>
          <HeroOrchid3D />
        </Suspense>
      ) : (
        <StaticOrchid />
      )}
      <div className="hero-scrim" aria-hidden="true" />

      <div className="container">
        <Stagger className="hero-content" amount={0.1} stagger={0.1}>
          <RevealItem as="span" className="hero-eyebrow">دکورهای آرام، ماندگار و خاص</RevealItem>
          <RevealItem as="h1" className="hero-title">
            گل‌های روسی <span className="hero-title-grad">انعطاف‌پذیر</span>
          </RevealItem>
          <RevealItem as="p" className="hero-subtitle">{aboutContent.subtitle}</RevealItem>
          <RevealItem as="p" className="hero-note">
            بافت نرم، فرم‌پذیر و قابل شستشو — برای زیبایی‌ای که هر روز کنار شما می‌ماند؛ بدون
            پژمردگی، بدون دردسر نگهداری.
          </RevealItem>
          <RevealItem as="div" className="hero-actions">
            <MagneticButton as="link" to="/products" className="hero-button">مشاهده محصولات</MagneticButton>
            <Link to="/#about" className="hero-link">داستان محصول</Link>
          </RevealItem>
          <RevealItem as="ul" className="hero-trust" aria-label="مزایای خرید">
            <li className="hero-chip"><FaTruck aria-hidden="true" /> ارسال به سراسر کشور</li>
            <li className="hero-chip"><FaHandHoldingHeart aria-hidden="true" /> پرداخت درب منزل (گرگان)</li>
            <li className="hero-chip"><FaShieldAlt aria-hidden="true" /> ضمانت دوام رنگ</li>
          </RevealItem>
        </Stagger>
      </div>

      {can3D && (
        <span className="hero-drag-hint">
          <FaUndo aria-hidden="true" /> گل را بگیرید و ۳۶۰° بچرخانید
        </span>
      )}
    </section>
  );
};

export default Hero;
