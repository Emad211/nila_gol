import './Gallery.css';
import { useEffect, useState } from 'react';
import { FaImages } from 'react-icons/fa';
import { getGallery } from '../../services/catalog';
import Lightbox from '../Lightbox/Lightbox';
import { Reveal, MotionCard } from '../../lib/motion';

const Gallery = ({ initialItems }) => {
  const hasInitialData = initialItems !== undefined;
  const [items, setItems] = useState(initialItems ?? []);
  const [isLoading, setIsLoading] = useState(!hasInitialData);
  const [zoom, setZoom] = useState(null);

  useEffect(() => {
    if (hasInitialData) return undefined;
    let active = true;

    getGallery()
      .then((data) => {
        if (active) setItems(data);
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [hasInitialData]);

  if (isLoading || items.length === 0) return null;

  return (
    <section id="gallery" className="gallery gallery--lookbook" aria-labelledby="gallery-title">
      <div className="container">
        <Reveal className="gallery-header">
          <span className="gallery-kicker">
            <FaImages aria-hidden="true" />
            NILA LOOKBOOK
          </span>
          <div className="gallery-heading-row">
            <h2 id="gallery-title" className="gallery-title">
              فضاهایی که با یک <span>جزئیات</span> تغییر می‌کنند.
            </h2>
            <p className="gallery-lead">
              بخشی از چیدمان‌ها و نمونه‌های واقعی نیلا گل؛ برای دیدن بافت، فرم و حس محصول در فضای دکور.
            </p>
          </div>
        </Reveal>

        <div className="gallery-grid">
          {items.slice(0, 6).map((item, i) => (
            <MotionCard className="gallery-cell" index={i} key={item.id}>
              <button
                type="button"
                className="gallery-trigger"
                onClick={() => setZoom(item.image_url)}
                aria-label={item.title || 'بزرگ‌نمایی نمونه گل روسی'}
              >
                <img
                  src={item.image_url}
                  alt={item.title || 'نمونه گل روسی'}
                  loading="lazy"
                  decoding="async"
                />
                <span className="gallery-scrim" aria-hidden="true" />
                <span className="gallery-view" aria-hidden="true">مشاهده</span>
              </button>
              {item.title && <span className="gallery-caption">{item.title}</span>}
            </MotionCard>
          ))}
        </div>
      </div>

      <Lightbox src={zoom} alt="نمونه گل روسی" onClose={() => setZoom(null)} />
    </section>
  );
};

export default Gallery;
