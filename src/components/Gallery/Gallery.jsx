import './Gallery.css';
import { useEffect, useState } from 'react';
import { FaImages } from 'react-icons/fa';
import { getGallery } from '../../services/catalog';
import Lightbox from '../Lightbox/Lightbox';
import { Reveal, MotionCard } from '../../lib/motion';

const Gallery = () => {
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [zoom, setZoom] = useState(null);

  useEffect(() => {
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
  }, []);

  if (isLoading || items.length === 0) return null;

  return (
    <section id="gallery" className="gallery">
      <div className="container">
        <Reveal className="gallery-header">
          <span className="eyebrow gallery-eyebrow">
            <FaImages aria-hidden="true" />
            گالری نمونه‌کارها
          </span>
          <h2 className="section-title gallery-title">
            چند نمونه از <span className="text-gradient">گل‌ها و چیدمان‌ها</span>
          </h2>
        </Reveal>

        <div className="gallery-grid">
          {items.map((item, i) => (
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
                />
                <span className="gallery-scrim" aria-hidden="true" />
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
