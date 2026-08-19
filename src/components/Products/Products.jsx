import './Products.css';
import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { FaSearch, FaSeedling } from 'react-icons/fa';
import { getProducts } from '../../services/catalog';
import { Reveal } from '../../lib/motion';
import ProductCard from './ProductCard';
import { priceInfo } from '../../lib/product';

const SORT_VALUES = new Set(['recommended', 'newest', 'price-asc', 'price-desc']);

// `initialProducts` comes from the route loader so the grid is present in the
// pre-rendered HTML; the effect still refreshes it on the client for freshness.
const Products = ({ initialProducts }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedSort = searchParams.get('sort');
  const [products, setProducts] = useState(initialProducts ?? []);
  const [isLoading, setIsLoading] = useState(!initialProducts);
  const [activeCategory, setActiveCategory] = useState(searchParams.get('category') || 'all');
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [sortBy, setSortBy] = useState(SORT_VALUES.has(requestedSort) ? requestedSort : 'recommended');
  // Honest quick-filters, each tied to a real product field. URL-synced so they
  // are shareable and survive back/forward, like the category/sort controls.
  const [inStockOnly, setInStockOnly] = useState(searchParams.get('stock') === '1');
  const [saleOnly, setSaleOnly] = useState(searchParams.get('sale') === '1');
  const [featuredOnly, setFeaturedOnly] = useState(searchParams.get('featured') === '1');

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
      if (inStockOnly && product.availability === 'sold_out') return false;
      if (saleOnly && !priceInfo(product).hasSale) return false;
      if (featuredOnly && !product.is_featured) return false;
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
  }, [products, activeCategory, query, sortBy, inStockOnly, saleOnly, featuredOnly]);

  const chooseCategory = (category) => {
    setActiveCategory(category);
    const next = new URLSearchParams(searchParams);
    if (category === 'all') next.delete('category');
    else next.set('category', category);
    setSearchParams(next, { replace: true });
  };

  const chooseSort = (value) => {
    setSortBy(value);
    const next = new URLSearchParams(searchParams);
    if (value === 'recommended') next.delete('sort');
    else next.set('sort', value);
    setSearchParams(next, { replace: true });
  };

  // Toggle a boolean quick-filter and mirror it into the URL (?stock/sale/featured=1).
  const toggleFlag = (param, value, setter) => {
    setter(value);
    const next = new URLSearchParams(searchParams);
    if (value) next.set(param, '1');
    else next.delete(param);
    setSearchParams(next, { replace: true });
  };

  const clearFilters = () => {
    setQuery('');
    setActiveCategory('all');
    setSortBy('recommended');
    setInStockOnly(false);
    setSaleOnly(false);
    setFeaturedOnly(false);
    setSearchParams({}, { replace: true });
  };

  const hasActiveFilters =
    query || activeCategory !== 'all' || sortBy !== 'recommended' || inStockOnly || saleOnly || featuredOnly;

  const quickFilters = [
    { key: 'stock', label: 'فقط موجود', active: inStockOnly, set: setInStockOnly },
    { key: 'sale', label: 'تخفیف‌دار', active: saleOnly, set: setSaleOnly },
    { key: 'featured', label: 'ویژه', active: featuredOnly, set: setFeaturedOnly },
  ];

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
                <select value={sortBy} onChange={(event) => chooseSort(event.target.value)}>
                  <option value="recommended">پیشنهادی</option>
                  <option value="newest">جدیدترین</option>
                  <option value="price-asc">کمترین قیمت</option>
                  <option value="price-desc">بیشترین قیمت</option>
                </select>
              </label>
            </Reveal>

            {categories.length > 2 && (
              <Reveal className="products-filter" aria-label="فیلتر دسته‌بندی" delay={0.06}>
                {categories.map((cat) => {
                  const active = activeCategory === cat;
                  return (
                    <button
                      key={cat}
                      type="button"
                      aria-pressed={active}
                      className={`products-filter-chip ${active ? 'is-active' : ''}`}
                      onClick={() => chooseCategory(cat)}
                    >
                      {cat === 'all' ? 'همه' : cat}
                    </button>
                  );
                })}
              </Reveal>
            )}

            <div className="catalog-result-bar" aria-live="polite">
              <div className="catalog-quickfilters" role="group" aria-label="فیلتر سریع">
                <span className="catalog-count"><strong className="num">{visible.length}</strong> محصول</span>
                {quickFilters.map(({ key, label, active, set }) => (
                  <button
                    key={key}
                    type="button"
                    aria-pressed={active}
                    className={`catalog-quickchip ${active ? 'is-active' : ''}`}
                    onClick={() => toggleFlag(key, !active, set)}
                  >
                    {label}
                  </button>
                ))}
              </div>
              {hasActiveFilters && (
                <button type="button" className="catalog-clear" onClick={clearFilters}>
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
                <button type="button" className="btn btn-secondary" onClick={clearFilters}>
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
