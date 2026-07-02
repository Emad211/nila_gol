import './ProductsPage.css';
import { Link, useLoaderData } from 'react-router-dom';
import Products from '../components/Products/Products';
import { config } from '../data/config';
import Seo from '../lib/pageSeo';
import heroImage from '../assets/hero.webp';
import featuresImage from '../assets/feature.webp';

const ProductsPage = () => {
  const { products } = useLoaderData();

  return (
    <section className="products-page">
      <Seo
        title="فروشگاه گل مصنوعی و گل روسی ماندگار | نیلا گل"
        description="مجموعه‌ی کامل گل‌های مصنوعی و روسیِ لوکس و ماندگار؛ قیمت شفاف، ارسال سراسری، سفارش در واتساپ و تلگرام."
        path="/products"
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

      <Products initialProducts={products} />
    </section>
  );
};

export default ProductsPage;
