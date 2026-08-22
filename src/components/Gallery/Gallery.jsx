import './Gallery.css';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FaArrowLeft, FaSpa } from 'react-icons/fa';
import Lightbox from '../Lightbox/Lightbox';

const CELL_CLASSES = ['is-a', 'is-b', 'is-c', 'is-d', 'is-e'];

const Gallery = ({ initialItems }) => {
  const hasInitialData = initialItems !== undefined;
  const [items, setItems] = useState(initialItems ?? []);
  const [isLoading, setIsLoading] = useState(!hasInitialData);
  const [zoom, setZoom] = useState(null);

  useEffect(() => {
    if (hasInitialData) return undefined;
    let active = true;

    import('../../services/catalog')
      .then(({ getGallery }) => getGallery())
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
    <section id="gallery" className="gallery" aria-labelledby="gallery-title">
      <div className="container">
        <header className="gallery-header pdf-center">
          <span className="pdf-pill">
            <FaSpa aria-hidden="true" />
            گالری نیلا
          </span>
          <h2 id="gallery-title" className="pdf-h2 gallery-title">
            فضاهایی که با یک <span className="pdf-pink">جزئیات</span> تغییر می‌کنند.
          </h2>
          <p className="pdf-lead">
            بخشی از چیدمان‌ها و نمونه‌های واقعی نیلا گل؛ برای دیدن بافت، فرم و حس محصول در فضای دکور.
          </p>
        </header>

        <div className="gallery-grid">
          {items.slice(0, 5).map((item, index) => {
            const title = item.title || 'نمونه گل روسی';
            return (
              <div className={`gallery-cell ${CELL_CLASSES[index] || 'is-a'}`} key={item.id}>
                <button
                  type="button"
                  className="gallery-trigger"
                  onClick={() => setZoom(item.image_url)}
                  aria-label={`مشاهده ${title}`}
                >
                  <img src={item.image_url} alt={title} loading="lazy" decoding="async" />
                </button>
              </div>
            );
          })}
        </div>

        <div className="gallery-more pdf-center">
          <Link to="/products" className="pdf-cta">
            مشاهده محصولات
            <FaArrowLeft aria-hidden="true" />
          </Link>
        </div>
      </div>

      <Lightbox src={zoom} alt="نمونه گل روسی" onClose={() => setZoom(null)} />
    </section>
  );
};

export default Gallery;
