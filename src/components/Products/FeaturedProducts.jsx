import './Products.css';
import './FeaturedProducts.css';
import { Link } from 'react-router-dom';
import { FaArrowLeft, FaShoppingBag } from 'react-icons/fa';
import ProductCard from './ProductCard';
import { Reveal } from '../../lib/motion';

export default function FeaturedProducts({ products = [] }) {
  const featured = [...products]
    .sort((a, b) => (b.is_featured ? 1 : 0) - (a.is_featured ? 1 : 0))
    .slice(0, 3);

  if (featured.length === 0) return null;

  return (
    <section className="home-products" aria-labelledby="home-products-title">
      <div className="container">
        <Reveal as="header" className="home-products-head">
          <span className="eyebrow">
            <FaShoppingBag aria-hidden="true" /> انتخاب سریع
          </span>
          <h2 id="home-products-title" className="section-title home-products-title">
            محبوب‌ترین <span className="text-gradient">گل‌ها</span>
          </h2>
          <p className="home-products-lead">
            چند انتخاب پیشنهادی برای شروع؛ جزئیات، قیمت و سفارش هر مدل را همان‌جا ببینید.
          </p>
        </Reveal>

        <div className="products-grid home-products-grid">
          {featured.map((product, index) => (
            <ProductCard key={product.id} product={product} index={index} />
          ))}
        </div>

        <div className="home-products-more">
          <Link to="/products" className="btn btn-secondary">
            مشاهده همه محصولات
            <FaArrowLeft aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>
  );
}
