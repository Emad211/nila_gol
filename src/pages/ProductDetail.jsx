import './ProductDetail.css';
import { useEffect, useState } from 'react';
import { Link, useLoaderData } from 'react-router-dom';
import { FaWhatsapp, FaTelegramPlane, FaPhoneAlt, FaShieldAlt, FaExchangeAlt, FaRegComments, FaCheck, FaChevronLeft, FaShoppingBag } from 'react-icons/fa';
import { useCart } from '../context/CartProvider';
import { formatPrice } from '../lib/format';
import { productImages, priceInfo, availabilityInfo } from '../lib/product';
import { whatsappOrderUrl, telegramUrl, phoneUrl } from '../lib/order';
import Seo, { SITE_URL } from '../lib/pageSeo';
import ProductCard from '../components/Products/ProductCard';
import ProductReviews from '../components/Reviews/ProductReviews';
import Lightbox from '../components/Lightbox/Lightbox';

export default function ProductDetail() {
  // Product + related items are loaded at build time (pre-rendered HTML) and on
  // client-side navigation, so the page always renders with real content.
  const { product, related } = useLoaderData();
  const { add } = useCart();
  const [activeImg, setActiveImg] = useState(0);
  const [zoom, setZoom] = useState(null);

  // Reset the gallery selection when navigating between products on the client.
  useEffect(() => {
    setActiveImg(0);
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
                <div className="pdp-image-empty" aria-hidden="true">🌸</div>
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

            <div className="pdp-order">
              <button
                type="button"
                className="btn btn-primary pdp-order-btn pdp-order-btn--wa pdp-order-btn--cart"
                onClick={() => add(product)}
              >
                <FaShoppingBag aria-hidden="true" /> افزودن به سبد خرید
              </button>
              <a
                className="btn btn-primary pdp-order-btn pdp-order-btn--wa"
                href={whatsappOrderUrl(product)}
                target="_blank"
                rel="noopener noreferrer"
              >
                <FaWhatsapp aria-hidden="true" /> سفارش در واتساپ
              </a>
              <div className="pdp-order-secondary">
                {telegram && (
                  <a
                    className="btn btn-secondary pdp-order-btn pdp-order-btn--tg"
                    href={telegram}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <FaTelegramPlane aria-hidden="true" /> تلگرام
                  </a>
                )}
                <a className="btn btn-secondary pdp-order-btn pdp-order-btn--call" href={phoneUrl()}>
                  <FaPhoneAlt aria-hidden="true" /> تماس
                </a>
              </div>
            </div>

            <p className="pdp-help">
              <Link to="/how-to-order">روش خرید و پرداخت را ببینید ←</Link>
            </p>

            <div className="pdp-trust">
              <span><FaShieldAlt aria-hidden="true" /> ضمانت دوام</span>
              <span><FaExchangeAlt aria-hidden="true" /> تعویض/مرجوعی</span>
              <span><FaRegComments aria-hidden="true" /> مشاوره رایگان</span>
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
          onClick={() => add(product)}
          aria-label="افزودن به سبد خرید"
        >
          <FaShoppingBag aria-hidden="true" />
        </button>
        <a
          className="pdp-sticky-btn"
          href={whatsappOrderUrl(product)}
          target="_blank"
          rel="noopener noreferrer"
        >
          <FaWhatsapp aria-hidden="true" /> سفارش در واتساپ
        </a>
      </div>

      <Lightbox src={zoom} alt={product.name} onClose={() => setZoom(null)} />
    </div>
  );
}
