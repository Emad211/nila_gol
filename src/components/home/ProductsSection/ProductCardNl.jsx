import { Link } from 'react-router-dom';
import { FaArrowLeft, FaWhatsapp } from 'react-icons/fa6';
import { formatPrice } from '../../../lib/format';
import { whatsappOrderUrl } from '../../../lib/order';
import { priceView } from '../../../lib/redesign';
import { MotionCard } from '../../../lib/motion';

// Figma image slot is empty-safe: live image_url or the redesign hero shot.
const FALLBACK_IMAGE = '/img/redesign/hero-main.jpg';

// ProductCardNl — figma-redesign "prod cart" (565×812 desktop / 408×603 mobile).
// Interaction semantics mirror ProductCard.jsx / FeaturedProducts.jsx with new
// visuals: the arrow opens the product page, the WhatsApp button starts a
// prefilled order chat. When sold_out the WhatsApp action stays usable but
// switches to استعلام wording — exactly what ProductCard does (only an
// add-to-cart control would be disabled, and this design has none).
function ProductCardNl({ product, index = 0 }) {
  if (!product) return null;

  const { price, oldPrice } = priceView(product);
  const href = `/products/${product.slug || product.id}`;
  const isSoldOut = product.availability === 'sold_out';
  const name = product.name || '';

  return (
    <MotionCard className="nl-pcard" index={index}>
      <div className="nl-pcard__media">
        <img
          className="nl-pcard__img"
          src={product.image_url || FALLBACK_IMAGE}
          alt={name}
          width={565}
          height={664}
          loading={index === 0 ? 'eager' : 'lazy'}
          decoding="async"
        />
        <div className="nl-pcard__actions">
          <Link
            to={href}
            className="nl-pcard__action"
            aria-label={`مشاهده ${name}`}
            title="مشاهده محصول"
          >
            <FaArrowLeft aria-hidden="true" />
          </Link>
          <a
            className="nl-pcard__action"
            href={whatsappOrderUrl(product)}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={
              isSoldOut ? `استعلام ${name} در واتساپ` : `سفارش ${name} در واتساپ`
            }
            title={isSoldOut ? 'استعلام' : 'سفارش در واتساپ'}
          >
            <FaWhatsapp aria-hidden="true" />
          </a>
        </div>
      </div>

      <div className="nl-pcard__detail">
        <h3 className="nl-pcard__name">{name}</h3>
        {price != null && (
          <div className="nl-pcard__price-row">
            <p className="nl-pcard__price">
              <span className="nl-pcard__value num">{formatPrice(price)}</span>
              <span className="nl-pcard__toman" aria-hidden="true">
                تومان
              </span>
            </p>
            {oldPrice != null && (
              <span className="nl-pcard__old">
                <span className="nl-pcard__old-toman" aria-hidden="true">
                  تومان
                </span>
                <del className="nl-pcard__old-value num">
                  {formatPrice(oldPrice)}
                </del>
              </span>
            )}
            <span className="nl-pcard__unit">/ شاخه</span>
          </div>
        )}
      </div>
    </MotionCard>
  );
}

export default ProductCardNl;
