import './Products.css';
import { useEffect, useMemo, useState } from 'react';
import { FaSearch, FaSeedling } from 'react-icons/fa';
import { getProducts } from '../../services/catalog';
import { Reveal } from '../../lib/motion';
import ProductCard from './ProductCard';
import { priceInfo } from '../../lib/product';

// `initialProducts` comes from the route loader so the grid is present in the
// pre-rendered HTML; the effect still refreshes it on the client for freshness.
const Products = ({ initialProducts }) => {
  const [products, setProducts] = useState(initialProducts ?? []);
  const [isLoading, setIsLoading] = useState(!initialProducts);
  const [activeCategory, setActiveCategory] = useState('all');
  const [query, setQuery] = useState('');
  const [sortBy, setSortBy] = useState('recommended');

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
    const normalizedQuery = query.trim().toLocaleLowerCase('fa');
    let result = products.filter((product) => {
      if (activeCategory !== 'all' && product.category !== activeCategory) return false;
      if (!normalizedQuery) return true;

      const haystack = [
        product.name,
        product.category,
        product.description,
        ...(product.features || []),
      ]
        .filter(Boolean)
        .join(' ')
        .toLocaleLowerCase('fa');

      return haystack.includes(normalizedQuery);
    });

    result = [...result].sort((a, b) => {
      if (sortBy === 'price-asc') return priceInfo(a).current - priceInfo(b).current;
      if (sortBy === 'price-desc') return priceInfo(b).current - priceInfo(a).current;
      if (sortBy === 'newest') return Number(b.id || 0) - Number(a.id || 0);
      return (b.is_featured ? 1 : 0) - (a.is_featured ? 1 : 0);
    });

    return result;
  }, [products, activeCategory, query, sortBy]);

  return (
    <section id="products" className="products">
      <div className="container">
        <Reveal as="header" className="products-head">
          <span className="eyebrow">
            <FaSeedling aria-hidden="true" /> مجموعه‌ی گل‌ها
          </span>
          <h2 className="section-title products-title">محصولات نیلا گل</h2>
          <p className="products-lead">
            مدل مناسب فضای خود را پیدا کنید؛ قیمت، موجودی و سفارش هر گل شفاف و در دسترس است.
          </p>
        </Reveal>

        {isLoading ? (
          <p className="catalog-state">در حال بارگذاری محصولات…</p>
        ) : products.length === 0 ? (
          <p className="catalog-state">فعلاً محصولی برای نمایش موجود نیست.</p>
        ) : (
          <>
            <Reveal className="catalog-toolbar" delay={0.04}>
              <label className="catalog-search">
                <FaSearch aria-hidden="true" />
                <span className="sr-only">جست‌وجوی محصولات</span>
                <input
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="جست‌وجو بین محصولات…"
                  autoComplete="off"
                />
              </label>

              <label className="catalog-sort">
                <span>مرتب‌سازی</span>
                <select value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
                  <option value="recommended">پیشنهادی</option>
                  <option value="newest">جدیدترین</option>
                  <option value="price-asc">کمترین قیمت</option>
                  <option value="price-desc">بیشترین قیمت</option>
                </select>
              </label>
            </Reveal>

            {categories.length > 2 && (
              <Reveal className="products-filter" role="tablist" aria-label="فیلتر دسته‌بندی" delay={0.06}>
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

            <div className="catalog-result-bar" aria-live="polite">
              <span><strong className="num">{visible.length}</strong> محصول</span>
              {(query || activeCategory !== 'all') && (
                <button
                  type="button"
                  className="catalog-clear"
                  onClick={() => {
                    setQuery('');
                    setActiveCategory('all');
                  }}
                >
                  پاک کردن فیلترها
                </button>
              )}
            </div>

            {visible.length > 0 ? (
              <div className="products-grid">
                {visible.map((product, i) => (
                  <ProductCard key={product.id} product={product} index={i} />
                ))}
              </div>
            ) : (
              <div className="catalog-empty-search">
                <FaSearch aria-hidden="true" />
                <strong>محصولی با این مشخصات پیدا نشد</strong>
                <span>عبارت دیگری جست‌وجو کنید یا فیلترها را پاک کنید.</span>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setQuery('');
                    setActiveCategory('all');
                  }}
                >
                  نمایش همه محصولات
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
};

export default Products;
