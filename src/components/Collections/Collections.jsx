import './Collections.css';
import { FaLayerGroup, FaArrowLeft } from 'react-icons/fa';
import { Reveal, MotionLinkCard } from '../../lib/motion';

const COLLECTIONS = [
  { name: 'گل رز', desc: 'کلاسیک و همیشه‌زیبا', img: '/img/collection-rose.webp' },
  { name: 'لاله', desc: 'رنگارنگ و شاداب', img: '/img/collection-tulip.webp' },
  { name: 'آفتابگردان', desc: 'گرم و درخشان', img: '/img/sunflower.webp' },
  { name: 'دسته‌گل ترکیبی', desc: 'هماهنگ برای هدیه', img: '/img/collection-mixed.webp' },
];

const Collections = () => (
  <section id="collections" className="collections">
    <div className="container">
      <Reveal className="collections-header">
        <span className="eyebrow">
          <FaLayerGroup aria-hidden="true" />
          دسته‌بندی‌ها
        </span>
        <h2 className="section-title">
          مجموعه‌ها را <span className="text-gradient">کاوش کنید</span>
        </h2>
        <p className="collections-lead">
          از رز کلاسیک تا دسته‌گل‌های ترکیبی؛ سلیقه‌ی خود را پیدا کنید و آسان سفارش دهید.
        </p>
      </Reveal>

      <div className="collections-grid">
        {COLLECTIONS.map((c, i) => (
          <MotionLinkCard key={c.name} to="/products" className="collection-card" index={i}>
            <img src={c.img} alt={c.name} loading="lazy" />
            <div className="collection-body">
              <h3 className="collection-name">{c.name}</h3>
              <span className="collection-desc">{c.desc}</span>
              <span className="collection-cta">
                مشاهده محصولات <FaArrowLeft aria-hidden="true" />
              </span>
            </div>
          </MotionLinkCard>
        ))}
      </div>
    </div>
  </section>
);

export default Collections;
