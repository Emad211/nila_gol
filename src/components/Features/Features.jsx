import './Features.css';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FaArrowLeft, FaCheck, FaRegGem } from 'react-icons/fa';
import { getFeatures } from '../../services/catalog';
import { Reveal } from '../../lib/motion';
import featureImage from '../../assets/feature.webp';

const Features = ({ initialFeatures }) => {
  const hasInitialData = initialFeatures !== undefined;
  const [features, setFeatures] = useState(initialFeatures ?? []);
  const [isLoading, setIsLoading] = useState(!hasInitialData);

  useEffect(() => {
    if (hasInitialData) return undefined;
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
  }, [hasInitialData]);

  const highlights = features.slice(0, 3);

  return (
    <section id="features" className="features features--premium" aria-labelledby="features-title">
      <div className="container">
        <div className="features-editorial-grid">
          <Reveal className="features-copy">
            <span className="features-kicker">
              <FaRegGem aria-hidden="true" />
              تفاوتی که دیده می‌شود
            </span>
            <h2 id="features-title" className="features-title">
              زیبایی فقط در عکس نیست؛ در <span>جزئیات</span> محصول است.
            </h2>
            <p className="features-lead">
              انتخاب نیلا گل برای کسی است که ظاهر طبیعی، فرم تمیز و نگهداری ساده را هم‌زمان می‌خواهد.
            </p>

            {isLoading ? (
              <p className="catalog-state">در حال بارگذاری ویژگی‌ها…</p>
            ) : (
              <div className="features-list">
                {highlights.map((feature, index) => (
                  <article className="feature-proof" key={feature.id || index}>
                    <span className="feature-proof-index num">0{index + 1}</span>
                    <div>
                      <h3>{feature.title}</h3>
                      <p>{feature.description}</p>
                    </div>
                  </article>
                ))}
              </div>
            )}

            <Link to="/products" className="features-cta">
              دیدن مدل‌های موجود
              <FaArrowLeft aria-hidden="true" />
            </Link>
          </Reveal>

          <Reveal dir="start" className="features-media">
            <div className="features-image-wrap">
              <img src={featureImage} alt="جزئیات گل روسی نیلا گل" loading="lazy" decoding="async" />
              <div className="features-image-caption">
                <span>برای لمس و دیدن از نزدیک طراحی شده</span>
                <strong>لطیف. فرم‌پذیر. ماندگار.</strong>
              </div>
            </div>
          </Reveal>
        </div>

        <Reveal className="features-trust-line">
          <span><FaCheck aria-hidden="true" /> انتخاب مناسب دکور منزل</span>
          <span><FaCheck aria-hidden="true" /> مناسب هدیه و مناسبت</span>
          <span><FaCheck aria-hidden="true" /> امکان مشاوره پیش از سفارش</span>
        </Reveal>
      </div>
    </section>
  );
};

export default Features;
