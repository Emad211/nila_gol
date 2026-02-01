import './Features.css';
import { features } from '../../data/products';
import FeatureCard from './FeatureCard';
import featuresBg from '../../pics/section 2.png';

const Features = () => {
  return (
    <section id="features" className="features">
      <div className="features-bg" style={{ backgroundImage: `url(${featuresBg})` }} aria-hidden="true" />
      <div className="features-overlay" aria-hidden="true" />
      <div className="container">
        <h2 className="section-title">ویژگی‌های محصولات</h2>
        <div className="features-grid stagger-animation">
          {features.map((feature) => (
            <FeatureCard key={feature.id} feature={feature} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
