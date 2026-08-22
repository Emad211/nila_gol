import './FeaturedProducts.css';
import { Link } from 'react-router-dom';
import { FaArrowLeft, FaEye, FaSeedling, FaShoppingBag } from 'react-icons/fa';
import { formatPrice } from '../../lib/format';
import { priceInfo } from '../../lib/product';
import { useCart } from '../../context/CartProvider';

function ProductArch({ product }) {
  const { add } = useCart();
  const price = priceInfo(product);
  const isSoldOut = product.availability === 'sold_out';
  const href = `/products/${product.slug || product.id}`;

  return (
    <article className="arch-card">
      <div className="arch-media">
        <Link to={href} className="arch-imglink" aria-label={`مشاهده ${product.name}`}>
          {product.image_url ? (
            <img src={product.image_url} alt={product.name} loading="lazy" decoding="async" />
          ) : (
            <span className="arch-fallback" aria-hidden="true"><FaSeedling /></span>
          )}
        </Link>
        <div className="arch-actions">
          <button
            type="button"
            className="arch-action"
            disabled={isSoldOut}
            onClick={() => add(product)}
            aria-label={isSoldOut ? `${product.name} ناموجود است` : `افزودن ${product.name} به سبد خرید`}
            title={isSoldOut ? 'ناموجود' : 'افزودن به سبد'}
          >
            <FaShoppingBag aria-hidden="true" />
          </button>
          <Link to={href} className="arch-action" aria-label={`جزئیات ${product.name}`} title="مشاهده">
            <FaEye aria-hidden="true" />
          </Link>
        </div>
      </div>

      <h3 className="arch-name">
        <Link to={href}>{product.name}</Link>
      </h3>

      <p className="arch-price">
        {product.category && !price.hasSale && <span className="arch-price-cat">{product.category} / </span>}
        {price.hasSale && (
          <del>
            <span className="num">{formatPrice(price.original)}</span> تومان
          </del>
        )}
        <strong>
          <span className="num">{formatPrice(price.current)}</span> تومان
        </strong>
      </p>
    </article>
  );
}

export default function FeaturedProducts({ products = [] }) {
  const featured = [...products]
    .sort((a, b) => {
      const featureDelta = Number(Boolean(b.is_featured)) - Number(Boolean(a.is_featured));
      if (featureDelta !== 0) return featureDelta;
      return Number(b.id || 0) - Number(a.id || 0);
    })
    .slice(0, 3);

  if (featured.length === 0) return null;

  return (
    <section id="featured-products" className="home-products" aria-labelledby="home-products-title">
      <div className="container">
        <header className="home-products-head pdf-center">
          <span className="pdf-pill">محصولات نیلا</span>
          <h2 id="home-products-title" className="pdf-h2">
            زیبایی ماندگار، <span className="pdf-pink">همیشه سبز</span>
          </h2>
          <p className="pdf-lead">
            مجموعه‌ای از گل‌های مصنوعی با ظاهر طبیعی و طراحی زیبای نیلاگل، انتخابی ماندگار برای زیباتر کردن فضای خانه و محل کار.
          </p>
        </header>

        <div className="home-arch-grid">
          {featured.map((product) => (
            <ProductArch key={product.id} product={product} />
          ))}
        </div>

        <div className="home-products-more pdf-center">
          <Link to="/products" className="pdf-cta">
            مشاهده محصولات
            <FaArrowLeft aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>
  );
}
