import './Features.css';
import { useEffect, useState } from 'react';
import { FaRegGem } from 'react-icons/fa';
import { getFeatures } from '../../services/catalog';
import FeatureCard from './FeatureCard';
import { Reveal, CountUp } from '../../lib/motion';

const Features = () => {
  const [features, setFeatures] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;

    getFeatures()
      .then((data) => {
        if (active) setFeatures(data);
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const firstFeatures = features.slice(0, 3);
  const restFeatures = features.slice(3);

  return (
    <section id="features" className="features">
      <div className="container">
        <Reveal className="features-header">
          <span className="eyebrow features-eyebrow">
            <FaRegGem aria-hidden="true" />
            ویژگی‌های برجسته
          </span>
          <h2 className="section-title features-title">
            چرا <span className="text-gradient">نیلا گل</span>؟
          </h2>
          <p className="features-lead">
            هر دسته‌گل با دقت در فرم، بافت و رنگ ساخته می‌شود تا زیبایی پایدار را وارد خانه‌ی شما کند.
          </p>
        </Reveal>

        {isLoading ? (
          <p className="catalog-state">در حال بارگذاری ویژگی‌ها…</p>
        ) : (
          <div className="features-bento">
            <Reveal as="figure" className="ft-photo ft-photo--lg" amount={0.15}>
              <img src="/img/rose-pink.webp" alt="دسته‌گل رز روسی نیلا گل" loading="lazy" />
              <figcaption className="ft-photo-cap">دسته‌گل رز روسی — لطیف و ماندگار</figcaption>
            </Reveal>

            <Reveal as="div" className="ft-spot" delay={0.05}>
              <CountUp to={100} suffix="٪" className="ft-spot-stat num" />
              <span className="ft-spot-label">ماندگاری رنگ</span>
              <p className="ft-spot-text">
                رنگ‌آمیزی با مواد مرغوب که در گذر زمان نمی‌پرد؛ همان زیبایی روز اول، سال‌ها بعد.
              </p>
            </Reveal>

            {firstFeatures.map((feature, i) => (
              <FeatureCard key={feature.id} feature={feature} index={i} />
            ))}

            <Reveal as="figure" className="ft-photo ft-photo--sm" delay={0.05}>
              <img src="/img/gallery-2.webp" alt="گل صورتی روسی نیلا گل" loading="lazy" />
            </Reveal>

            {restFeatures.map((feature, i) => (
              <FeatureCard key={feature.id} feature={feature} index={i + 3} />
            ))}
          </div>
        )}

        <div className="features-bar">
          <div className="features-bar-item">
            <CountUp to={30} suffix="+" className="features-bar-number num" />
            <span className="features-bar-label">مدل پرطرفدار</span>
          </div>
          <div className="features-bar-item">
            <CountUp to={100} suffix="٪" className="features-bar-number num" />
            <span className="features-bar-label">ماندگاری رنگ</span>
          </div>
          <div className="features-bar-item">
            <span className="features-bar-number num">۲۴/۷</span>
            <span className="features-bar-label">پاسخگویی سریع</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Features;
