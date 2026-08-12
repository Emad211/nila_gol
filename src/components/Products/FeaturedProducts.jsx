import './FeaturedProducts.css';
import { Link } from 'react-router-dom';
import { FaArrowLeft, FaShoppingBag, FaStar } from 'react-icons/fa';
import { formatPrice } from '../../lib/format';
import { availabilityInfo, priceInfo } from '../../lib/product';
import { useCart } from '../../context/CartProvider';

function HomeProductTile({ product, lead = false }) {
  const { add } = useCart();
  const price = priceInfo(product);
  const availability = availabilityInfo(product);
  const isSoldOut = product.availability === 'sold_out';
  const href = `/products/${product.slug || product.id}`;

  return (
    <article className={`home-edit-card ${lead ? 'home-edit-card--lead' : 'home-edit-card--compact'}`}>
      <Link to={href} className="home-edit-media" aria-label={`مشاهده ${product.name}`}>
        {product.image_url ? (
          <img src={product.image_url} alt={product.name} loading="lazy" decoding="async" />
        ) : (
          <span className="home-edit-placeholder" aria-hidden="true">N</span>
        )}
        <span className="home-edit-media-scrim" aria-hidden="true" />
        <span className="home-edit-badges">
          {product.is_featured && <span><FaStar aria-hidden="true" /> منتخب</span>}
          {price.hasSale && <span className="is-sale"><b className="num">{price.discountPct}٪</b> تخفیف</span>}
          {product.availability && product.availability !== 'in_stock' && (
            <span className={`is-${availability.tone}`}>{availability.label}</span>
          )}
        </span>
      </Link>

      <div className="home-edit-copy">
        <div className="home-edit-meta">
          {product.category && <span>{product.category}</span>}
          {lead && <small>انتخاب این هفته</small>}
        </div>

        <Link to={href} className="home-edit-name">{product.name}</Link>

        <div className="home-edit-price-row">
          <div className="home-edit-price">
            {price.hasSale && <del><span className="num">{formatPrice(price.original)}</span> تومان</del>}
            <strong><span className="num">{formatPrice(price.current)}</span> تومان</strong>
          </div>

          <button
            type="button"
            className="home-edit-add"
            disabled={isSoldOut}
            onClick={() => add(product)}
            aria-label={isSoldOut ? `${product.name} ناموجود است` : `افزودن ${product.name} به سبد خرید`}
          >
            <FaShoppingBag aria-hidden="true" />
            <span>{isSoldOut ? 'ناموجود' : 'افزودن'}</span>
          </button>
        </div>
      </div>
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
        <header className="home-products-head">
          <div>
            <span className="home-products-kicker">NILA EDIT</span>
            <h2 id="home-products-title" className="home-products-title">منتخب‌هایی برای شروع.</h2>
          </div>
          <div className="home-products-intro">
            <p>سه مدل پیشنهادی از مجموعه؛ برای وقتی که می‌خواهید سریع‌تر به یک انتخاب مطمئن برسید.</p>
            <Link to="/products">مشاهده تمام محصولات <FaArrowLeft aria-hidden="true" /></Link>
          </div>
        </header>

        <div className="home-edit-grid">
          {featured.map((product, index) => (
            <HomeProductTile key={product.id} product={product} lead={index === 0} />
          ))}
        </div>

        <div className="home-products-mobile-more">
          <Link to="/products">همه محصولات <FaArrowLeft aria-hidden="true" /></Link>
        </div>
      </div>
    </section>
  );
}
