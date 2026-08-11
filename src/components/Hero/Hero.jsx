import { lazy, Suspense, useEffect, useState } from 'react';
import './Hero.css';
import { aboutContent } from '../../data/products';
import { Link } from 'react-router-dom';
import { FaBookOpen, FaShoppingBag, FaTruck, FaShieldAlt, FaHandHoldingHeart } from 'react-icons/fa';
import { Stagger, RevealItem, MagneticButton } from '../../lib/motion';

const HeroOrchid3D = lazy(() => import('./HeroOrchid3D.jsx'));

function useCanRender3D() {
  const [canRender, setCanRender] = useState(false);

  useEffect(() => {
    const canvas = document.createElement('canvas');
    const supportsWebGL = Boolean(
      window.WebGLRenderingContext &&
      (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')),
    );
    setCanRender(supportsWebGL);
  }, []);

  return canRender;
}

const Hero = () => {
  const canRender3D = useCanRender3D();

  return (
    <section className="hero on-dark" aria-label="معرفی">
      {canRender3D ? (
        <Suspense fallback={<div className="orchid-canvas orchid-canvas--loading" aria-hidden="true" />}>
          <HeroOrchid3D />
        </Suspense>
      ) : null}
      <div className="hero-scrim" aria-hidden="true" />

      <div className="container">
        <Stagger className="hero-content" amount={0.1} stagger={0.1}>
          <RevealItem as="span" className="hero-eyebrow">دکورهای آرام، ماندگار و خاص</RevealItem>
          <RevealItem as="h1" className="hero-title">
            گل‌های روسی <span className="hero-title-grad">انعطاف‌پذیر</span>
          </RevealItem>
          {canRender3D && <div className="hero-mobile-media-space" aria-hidden="true" />}
          <RevealItem as="p" className="hero-subtitle">{aboutContent.subtitle}</RevealItem>
          <RevealItem as="p" className="hero-note">
            بافت نرم، فرم‌پذیر و قابل شستشو — برای زیبایی‌ای که هر روز کنار شما می‌ماند؛ بدون
            پژمردگی، بدون دردسر نگهداری.
          </RevealItem>
          <RevealItem as="div" className="hero-actions">
            <MagneticButton as="link" to="/products" className="hero-button">
              <FaShoppingBag aria-hidden="true" />
              <span>مشاهده محصولات</span>
            </MagneticButton>
            <Link to="/#about" className="hero-link">
              <FaBookOpen aria-hidden="true" />
              <span>داستان محصول</span>
            </Link>
          </RevealItem>
          <RevealItem as="ul" className="hero-trust" aria-label="مزایای خرید">
            <li className="hero-chip"><FaTruck aria-hidden="true" /> ارسال به سراسر کشور</li>
            <li className="hero-chip"><FaHandHoldingHeart aria-hidden="true" /> پرداخت آنلاین یا درب منزل</li>
            <li className="hero-chip"><FaShieldAlt aria-hidden="true" /> ضمانت دوام رنگ</li>
          </RevealItem>
        </Stagger>
      </div>
    </section>
  );
};

export default Hero;
