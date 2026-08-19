import './ProductDetail.css';
import './ProductDetailPurchase.css';
import { useEffect, useState } from 'react';
import { Link, useLoaderData } from 'react-router-dom';
import { FaWhatsapp, FaTelegramPlane, FaPhoneAlt, FaRegComments, FaCheck, FaChevronLeft, FaShoppingBag, FaSeedling, FaTruck, FaBoxOpen, FaMinus, FaPlus, FaRegClock, FaUndoAlt } from 'react-icons/fa';
import { useCart } from '../context/CartProvider';
import { formatPrice } from '../lib/format';
import { productImages, priceInfo, availabilityInfo } from '../lib/product';
import { MAX_CART_QTY, normalizeCartQty } from '../lib/cart';
import { whatsappOrderUrl, telegramUrl, phoneUrl } from '../lib/order';
import Seo, { SITE_URL } from '../lib/pageSeo';
import ProductCard from '../components/Products/ProductCard';
import ProductReviews from '../components/Reviews/ProductReviews';
import Stars from '../components/Reviews/Stars';
import Lightbox from '../components/Lightbox/Lightbox';

export default function ProductDetail() {
  // Product, related items and reviews are loaded at build time (pre-rendered
  // HTML) and on client-side navigation, so the page always renders with real
  // content — including the rating for SEO structured data. Null-safe: a client
  // loader revalidation for a slug absent from the static pre-render manifest
  // (e.g. a product added after the last build) can resolve to null; default to
  // an empty shape so the `!product` guard below shows the graceful not-found
  // state instead of crashing the route.
  const { product, related = [], reviews = [] } = useLoaderData() ?? {};
  const { add } = useCart();
  const [activeImg, setActiveImg] = useState(0);
  const [zoom, setZoom] = useState(null);
  const [qty, setQty] = useState(1);

  // Reset the gallery selection and quantity when navigating between products.
  useEffect(() => {
    setActiveImg(0);
    setQty(1);
  }, [product?.id]);

  if (!product) {
    return (
      <div className="pdp">
        <div className="container">
          <p className="catalog-state">محصول پیدا نشد.</p>
          <p className="pdp-center">
            <Link to="/products" className="pdp-back-link">بازگشت به محصولات</Link>
          </p>
        </div>
      </div>
    );
  }

  const imgs = productImages(product);
  const price = priceInfo(product);
  const avail = availabilityInfo(product);
  const telegram = telegramUrl();
  const isSoldOut = product.availability === 'sold_out';
  const isMadeToOrder = product.availability === 'made_to_order';

  // Real, moderated reviews only (no fabricated ratings). The average powers both
  // the inline rating badge and the JSON-LD aggregateRating — both gated on count.
  const reviewList = Array.isArray(reviews) ? reviews : [];
  const reviewCount = reviewList.length;
  const avgRating = reviewCount
    ? reviewList.reduce((sum, r) => sum + Number(r.rating || 0), 0) / reviewCount
    : 0;

  return (
    <div className="pdp">
      <Seo
        title={`${product.name} | گل مصنوعی ماندگار | نیلا گل`}
        description={product.description || product.name}
        path={`/products/${product.slug || product.id}`}
        image={imgs[0]}
        jsonLd={{
          '@context': 'https://schema.org',
          '@graph': [
            {
              '@type': 'Product',
              name: product.name,
              description: product.description || undefined,
              image: imgs.length ? imgs.map((i) => (i.startsWith('http') ? i : SITE_URL + i)) : undefined,
              category: product.category || undefined,
              brand: { '@type': 'Brand', name: 'نیلا گل' },
              // Only emitted when real approved reviews exist — never fabricated.
              ...(reviewCount > 0 && {
                aggregateRating: {
                  '@type': 'AggregateRating',
                  ratingValue: Number(avgRating.toFixed(1)),
                  reviewCount,
                },
              }),
              offers: {
                '@type': 'Offer',
                price: price.current * 10,
                priceCurrency: 'IRR',
                availability:
                  product.availability === 'sold_out'
                    ? 'https://schema.org/OutOfStock'
                    : 'https://schema.org/InStock',
                url: `${SITE_URL}/products/${product.slug || product.id}`,
              },
            },
            {
              '@type': 'BreadcrumbList',
              itemListElement: [
                { '@type': 'ListItem', position: 1, name: 'خانه', item: `${SITE_URL}/` },
                { '@type': 'ListItem', position: 2, name: 'محصولات', item: `${SITE_URL}/products` },
                { '@type': 'ListItem', position: 3, name: product.name },
              ],
            },
          ],
        }}
      />
      <div className="container">
        <nav className="pdp-breadcrumb" aria-label="مسیر">
          <Link to="/">خانه</Link>
          <FaChevronLeft className="pdp-crumb-sep" aria-hidden="true" />
          <Link to="/products">محصولات</Link>
          <FaChevronLeft className="pdp-crumb-sep" aria-hidden="true" />
          <span className="pdp-crumb-current">{product.name}</span>
        </nav>

        <div className="pdp-layout">
          <div className="pdp-gallery">
            <div className="pdp-main-image">
              {imgs.length ? (
                <img
                  src={imgs[activeImg]}
                  alt={product.name}
                  onClick={() => setZoom(imgs[activeImg])}
                  className="pdp-main-img"
                />
              ) : (
                <div className="pdp-image-empty" aria-hidden="true"><FaSeedling /></div>
              )}
              {price.hasSale && <span className="pdp-badge pdp-badge--sale">{price.discountPct}٪ تخفیف</span>}
              {product.is_featured && <span className="pdp-badge pdp-badge--feat"><span>ویژه</span></span>}
            </div>

            {imgs.length > 1 && (
              <div className="pdp-thumbs">
                {imgs.map((src, i) => (
                  <button
                    key={i}
                    type="button"
                    className={`pdp-thumb ${i === activeImg ? 'is-active' : ''}`}
                    onClick={() => setActiveImg(i)}
                    aria-label={`تصویر ${i + 1}`}
                  >
                    <img src={src} alt="" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="pdp-info">
            {product.category && <span className="pdp-category">{product.category}</span>}
            <h1 className="pdp-name">{product.name}</h1>

            <div className="pdp-price-row">
              {price.hasSale && <span className="pdp-price-old">{formatPrice(price.original)}</span>}
              <span className="pdp-price num">{formatPrice(price.current)} <span className="pdp-price-unit">تومان</span></span>
              <span className={`pdp-avail pdp-avail--${avail.tone}`}>{avail.label}</span>
            </div>

            {reviewCount > 0 && (
              <a href="#product-reviews" className="pdp-rating-inline">
                <Stars value={avgRating} size="sm" />
                <span className="pdp-rating-avg num">{avgRating.toFixed(1)}</span>
                <span className="pdp-rating-count">
                  ({<span className="num">{reviewCount}</span>} نظر)
                </span>
              </a>
            )}

            {product.description && <p className="pdp-desc">{product.description}</p>}

            {product.features?.length > 0 && (
              <ul className="pdp-features">
                {product.features.map((f, i) => (
                  <li key={i}>
                    <span className="pdp-feature-check" aria-hidden="true"><FaCheck /></span>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            )}

            {isMadeToOrder && (
              <p className="pdp-madeorder-note">
                <FaRegClock aria-hidden="true" /> این مدل به‌صورت سفارشی و پس از ثبت سفارش برای شما آماده می‌شود.
              </p>
            )}

            <div className="pdp-order" aria-label="گزینه‌های خرید">
              {!isSoldOut && (
                <div className="pdp-qty" role="group" aria-label="تعداد">
                  <span className="pdp-qty-label">تعداد</span>
                  <div className="qty-stepper">
                    <button
                      type="button"
                      className="qty-btn"
                      onClick={() => setQty((q) => normalizeCartQty(q - 1))}
                      aria-label="کاهش تعداد"
                      disabled={qty <= 1}
                    >
                      <FaMinus aria-hidden="true" />
                    </button>
                    <span className="qty-value num" aria-live="polite">{qty}</span>
                    <button
                      type="button"
                      className="qty-btn"
                      onClick={() => setQty((q) => normalizeCartQty(q + 1))}
                      aria-label={qty >= MAX_CART_QTY ? `حداکثر تعداد ${MAX_CART_QTY} است` : 'افزایش تعداد'}
                      disabled={qty >= MAX_CART_QTY}
                    >
                      <FaPlus aria-hidden="true" />
                    </button>
                  </div>
                </div>
              )}

              <button
                type="button"
                className="btn btn-primary pdp-order-btn pdp-order-btn--cart"
                onClick={() => add(product, qty)}
                disabled={isSoldOut}
              >
                <FaShoppingBag aria-hidden="true" /> {isSoldOut ? 'ناموجود' : 'افزودن به سبد خرید'}
              </button>
              <a
                className="btn btn-secondary pdp-order-btn pdp-order-btn--consult"
                href={whatsappOrderUrl(product)}
                target="_blank"
                rel="noopener noreferrer"
              >
                <FaWhatsapp aria-hidden="true" /> {isSoldOut ? 'استعلام موجودی در واتساپ' : 'مشاوره در واتساپ'}
              </a>
            </div>

            <div className="pdp-direct-help" aria-label="راه‌های تماس برای مشاوره">
              <span>نیاز به راهنمایی دارید؟</span>
              <div className="pdp-direct-help-links">
                {telegram && (
                  <a href={telegram} target="_blank" rel="noopener noreferrer">
                    <FaTelegramPlane aria-hidden="true" /> تلگرام
                  </a>
                )}
                <a href={phoneUrl()}>
                  <FaPhoneAlt aria-hidden="true" /> تماس
                </a>
              </div>
            </div>

            <p className="pdp-help">
              <Link to="/how-to-order">روش خرید و پرداخت را ببینید ←</Link>
            </p>

            <div className="pdp-trust" aria-label="خدمات خرید از نیلا گل">
              <span><FaTruck aria-hidden="true" /> ارسال رایگان در گرگان</span>
              <span><FaUndoAlt aria-hidden="true" /> ۷ روز ضمانت بازگشت</span>
              <span><FaRegComments aria-hidden="true" /> مشاوره پیش از سفارش</span>
              <span><FaBoxOpen aria-hidden="true" /> پیگیری سفارش</span>
            </div>
          </div>
        </div>

        <ProductReviews productId={product.id} />

        {related.length > 0 && (
          <section className="pdp-related">
            <h2 className="section-title">محصولات مرتبط</h2>
            <div className="pdp-related-grid">
              {related.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </section>
        )}
      </div>

      <div className="pdp-sticky">
        <div className="pdp-sticky-price">
          {price.hasSale && <span className="pdp-price-old">{formatPrice(price.original)}</span>}
          <strong className="num">{formatPrice(price.current)} <span className="pdp-sticky-unit">تومان</span></strong>
        </div>
        <button
          type="button"
          className="pdp-sticky-btn pdp-sticky-btn--cart"
          onClick={() => add(product, qty)}
          aria-label={isSoldOut ? 'محصول ناموجود است' : 'افزودن به سبد خرید'}
          disabled={isSoldOut}
        >
          <FaShoppingBag aria-hidden="true" />
        </button>
        <a
          className="pdp-sticky-btn"
          href={whatsappOrderUrl(product)}
          target="_blank"
          rel="noopener noreferrer"
        >
          <FaWhatsapp aria-hidden="true" /> {isSoldOut ? 'استعلام موجودی' : 'واتساپ'}
        </a>
      </div>

      <Lightbox src={zoom} alt={product.name} onClose={() => setZoom(null)} />
    </div>
  );
}
