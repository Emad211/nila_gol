import './Products.css';
import { useEffect, useMemo, useState } from 'react';
import { FaSeedling } from 'react-icons/fa';
import { getProducts } from '../../services/catalog';
import { Reveal } from '../../lib/motion';
import ProductCard from './ProductCard';

// `initialProducts` comes from the route loader so the grid is present in the
// pre-rendered HTML; the effect still refreshes it on the client for freshness.
const Products = ({ initialProducts }) => {
  const [products, setProducts] = useState(initialProducts ?? []);
  const [isLoading, setIsLoading] = useState(!initialProducts);
  const [activeCategory, setActiveCategory] = useState('all');

  useEffect(() => {
    let active = true;

    getProducts()
      .then((data) => {
        if (active) setProducts(data);
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const categories = useMemo(() => {
    const set = new Set(products.map((p) => p.category).filter(Boolean));
    return ['all', ...set];
  }, [products]);

  const visible = useMemo(() => {
    const filtered =
      activeCategory === 'all'
        ? products
        : products.filter((p) => p.category === activeCategory);
    // Featured first; stable sort keeps the sort_order within each group.
    return [...filtered].sort((a, b) => (b.is_featured ? 1 : 0) - (a.is_featured ? 1 : 0));
  }, [products, activeCategory]);

  return (
    <section id="products" className="products">
      <div className="container">
        <Reveal as="header" className="products-head">
          <span className="eyebrow">
            <FaSeedling aria-hidden="true" /> مجموعه‌ی گل‌ها
          </span>
          <h2 className="section-title products-title">محصولات ما</h2>
          <p className="products-lead">
            هر مدل با فرم پایدار و حسی لطیف آماده شده است؛ سفارش تنها یک پیام فاصله دارد.
          </p>
        </Reveal>

        {isLoading ? (
          <p className="catalog-state">در حال بارگذاری محصولات…</p>
        ) : products.length === 0 ? (
          <p className="catalog-state">فعلاً محصولی برای نمایش موجود نیست.</p>
        ) : (
          <>
            {categories.length > 2 && (
              <Reveal className="products-filter" role="tablist" aria-label="فیلتر دسته‌بندی" delay={0.05}>
                {categories.map((cat) => {
                  const active = activeCategory === cat;
                  return (
                    <button
                      key={cat}
                      type="button"
                      role="tab"
                      aria-selected={active}
                      className={`products-filter-chip ${active ? 'is-active' : ''}`}
                      onClick={() => setActiveCategory(cat)}
                    >
                      {cat === 'all' ? 'همه' : cat}
                    </button>
                  );
                })}
              </Reveal>
            )}

            <div className="products-grid" aria-live="polite">
              {visible.map((product, i) => (
                <ProductCard key={product.id} product={product} index={i} />
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
};

export default Products;
