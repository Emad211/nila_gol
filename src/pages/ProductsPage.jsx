import './ProductsPage.css';
import { Link, useLoaderData } from 'react-router-dom';
import { FaTruck, FaUndoAlt, FaTint, FaRegComments } from 'react-icons/fa';
import Products from '../components/Products/Products';
import { config } from '../data/config';
import Seo, { SITE_URL } from '../lib/pageSeo';
import heroImage from '../assets/hero.webp';
import featuresImage from '../assets/feature.webp';

// Honest, fact-backed reassurance shown above the catalog. Every claim maps to a
// real policy (free Gorgan delivery, 7-day return, washable durability, pre-sale
// consult) — no fabricated urgency or guarantees.
const VALUE_PROPS = [
  { icon: FaTruck, text: 'ارسال رایگان در گرگان' },
  { icon: FaUndoAlt, text: '۷ روز ضمانت بازگشت' },
  { icon: FaTint, text: 'ماندگار و قابل‌شست‌وشو' },
  { icon: FaRegComments, text: 'مشاوره پیش از خرید' },
];

const ProductsPage = () => {
  // Null-safe: on a static build, a client-side loader revalidation for a URL
  // absent from the pre-render manifest can resolve to null. Default to an empty
  // catalog so the page still renders (the grid shows its empty state) instead
  // of crashing the route. `shouldRevalidate` on the route already prevents the
  // common filter/sort case; this is defense-in-depth.
  const { products = [] } = useLoaderData() ?? {};

  // CollectionPage + ItemList structured data, built from the same build-time
  // loader data that renders the grid, so it is baked into the pre-rendered HTML.
  const itemListJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'فروشگاه گل مصنوعی و گل روسی ماندگار | نیلا گل',
    url: `${SITE_URL}/products`,
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: products.length,
      itemListElement: products.map((product, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        url: `${SITE_URL}/products/${product.slug || product.id}`,
        name: product.name,
      })),
    },
  };

  return (
    <section className="products-page">
      <Seo
        title="فروشگاه گل مصنوعی و گل روسی ماندگار | نیلا گل"
        description="مجموعه‌ی کامل گل‌های مصنوعی و روسیِ لوکس و ماندگار؛ قیمت شفاف، ارسال سراسری، سفارش در واتساپ و تلگرام."
        path="/products"
        jsonLd={itemListJsonLd}
      />
      <div className="products-page-hero">
        <div className="container">
          <div className="products-page-content">
            <div className="products-page-text">
              <p className="products-page-eyebrow">{config.productsPage.eyebrow}</p>
              <h1 className="products-page-title">{config.productsPage.title}</h1>
              <p className="products-page-subtitle">{config.productsPage.subtitle}</p>
              <div className="products-page-actions">
                <a href="#products" className="products-page-button">
                  {config.productsPage.primaryCta}
                </a>
                <Link to="/#contact" className="products-page-link">
                  {config.productsPage.secondaryCta}
                </Link>
              </div>
            </div>

            <div className="products-page-collage" aria-hidden="true">
              <img
                src={heroImage}
                alt=""
                className="products-page-photo products-page-photo--tall"
              />
              <img
                src={featuresImage}
                alt=""
                className="products-page-photo"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="products-page-valueprops" aria-label="مزایای خرید از نیلا گل">
        <div className="container">
          <ul className="products-page-valueprops-list">
            {VALUE_PROPS.map(({ icon: Icon, text }) => (
              <li key={text}>
                <span className="products-page-valueprop-icon" aria-hidden="true"><Icon /></span>
                <span>{text}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <Products initialProducts={products} />
    </section>
  );
};

export default ProductsPage;
