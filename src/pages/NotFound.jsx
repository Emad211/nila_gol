import './NotFound.css';
import { Link } from 'react-router-dom';
import { FaHome, FaSeedling } from 'react-icons/fa';
import { useEffect } from 'react';
import { setPageSeo, resetPageSeo } from '../lib/seo';

export default function NotFound() {
  useEffect(() => {
    setPageSeo({
      title: 'صفحه پیدا نشد | نیلا گل',
      description: 'صفحه‌ای که به دنبال آن بودید در نیلا گل پیدا نشد.',
    });
    return () => resetPageSeo();
  }, []);

  return (
    <section className="not-found" aria-labelledby="not-found-title">
      <div className="container">
        <div className="not-found-card glass">
          <span className="not-found-code num" aria-hidden="true">404</span>
          <span className="not-found-icon" aria-hidden="true"><FaSeedling /></span>
          <h1 id="not-found-title" className="not-found-title">این صفحه پیدا نشد</h1>
          <p className="not-found-text">
            ممکن است آدرس تغییر کرده باشد یا صفحه دیگر در دسترس نباشد. از اینجا می‌توانید به مسیر اصلی برگردید.
          </p>
          <div className="not-found-actions">
            <Link to="/" className="btn btn-primary">
              <FaHome aria-hidden="true" /> خانه
            </Link>
            <Link to="/products" className="btn btn-secondary">مشاهده محصولات</Link>
          </div>
        </div>
      </div>
    </section>
  );
}
