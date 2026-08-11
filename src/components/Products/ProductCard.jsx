import './ProductCard.css';
import { Link } from 'react-router-dom';
import { FaWhatsapp, FaShoppingBag } from 'react-icons/fa';
import { formatPrice } from '../../lib/format';
import { whatsappOrderUrl } from '../../lib/order';
import { priceInfo, availabilityInfo } from '../../lib/product';
import { MotionCard } from '../../lib/motion';
import { useCart } from '../../context/CartProvider';

const ProductCard = ({ product, index = 0 }) => {
  const { add } = useCart();
  const price = priceInfo(product);
  const avail = availabilityInfo(product);
  const showAvail = product.availability && product.availability !== 'in_stock';
  const isSoldOut = product.availability === 'sold_out';

  return (
    <MotionCard className="product-card" index={index}>
      <Link to={`/products/${product.slug || product.id}`} className="product-card-link">
        <div className="product-cover">
          {product.image_url ? (
            <img className="product-image" src={product.image_url} alt={product.name} loading="lazy" />
          ) : (
            <div className="product-orb" aria-hidden="true" />
          )}
          {price.hasSale && <span className="product-badge product-badge--sale">{price.discountPct}٪ تخفیف</span>}
          {product.is_featured && <span className="product-badge product-badge--feat">ویژه</span>}
          {showAvail && <span className={`product-avail product-avail--${avail.tone}`}>{avail.label}</span>}
        </div>

        {product.category && <div className="product-category">{product.category}</div>}
        <h3 className="product-name">{product.name}</h3>
        {product.description && <p className="product-description">{product.description}</p>}

        {product.features?.length > 0 && (
          <div className="product-features">
            {product.features.slice(0, 3).map((feature, featureIndex) => (
              <span key={featureIndex} className="product-feature-tag">
                {feature}
              </span>
            ))}
          </div>
        )}
      </Link>

      <div className="product-footer">
        <div className="product-price-wrap">
          {price.hasSale && (
            <span className="product-price-old">
              <span className="num">{formatPrice(price.original)}</span> تومان
            </span>
          )}
          <span className="product-price">
            <span className="num">{formatPrice(price.current)}</span> تومان
          </span>
        </div>
        <div className="product-actions">
          <button
            type="button"
            className="product-add"
            onClick={() => add(product)}
            aria-label={isSoldOut ? `${product.name} ناموجود است` : `افزودن ${product.name} به سبد`}
            disabled={isSoldOut}
          >
            <FaShoppingBag aria-hidden="true" />
            <span className="product-add-label">{isSoldOut ? 'ناموجود' : 'افزودن به سبد'}</span>
          </button>
          <a
            className="product-order"
            href={whatsappOrderUrl(product)}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${isSoldOut ? 'استعلام' : 'سفارش'} ${product.name} در واتساپ`}
          >
            <FaWhatsapp aria-hidden="true" />
            {isSoldOut ? 'استعلام' : 'سفارش'}
          </a>
        </div>
      </div>
    </MotionCard>
  );
};

export default ProductCard;
