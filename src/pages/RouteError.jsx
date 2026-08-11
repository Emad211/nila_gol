import './NotFound.css';
import { Link, useRouteError } from 'react-router-dom';
import { FaExclamationTriangle, FaHome, FaRedo } from 'react-icons/fa';

export default function RouteError() {
  const error = useRouteError();
  const status = Number(error?.status) || null;
  const is404 = status === 404;

  return (
    <main className="not-found" role="main">
      <div className="container">
        <div className="not-found-card glass" role="alert">
          <span className="not-found-code num" aria-hidden="true">{is404 ? '404' : '!'}</span>
          <span className="not-found-icon" aria-hidden="true"><FaExclamationTriangle /></span>
          <h1 className="not-found-title">
            {is404 ? 'این صفحه پیدا نشد' : 'نمایش این صفحه با مشکل روبه‌رو شد'}
          </h1>
          <p className="not-found-text">
            {is404
              ? 'ممکن است آدرس تغییر کرده باشد یا صفحه دیگر در دسترس نباشد.'
              : 'اطلاعات شما از بین نرفته است. صفحه را دوباره بارگذاری کنید یا به خانه برگردید.'}
          </p>
          <div className="not-found-actions">
            {!is404 && (
              <button type="button" className="btn btn-primary" onClick={() => window.location.reload()}>
                <FaRedo aria-hidden="true" /> تلاش دوباره
              </button>
            )}
            <Link to="/" className={is404 ? 'btn btn-primary' : 'btn btn-secondary'}>
              <FaHome aria-hidden="true" /> خانه
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
