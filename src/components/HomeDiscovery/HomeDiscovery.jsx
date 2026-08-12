import './HomeDiscovery.css';
import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaSearch, FaSparkles, FaThLarge } from 'react-icons/fa';

function representativeCategories(products) {
  const groups = new Map();
  for (const product of products || []) {
    const category = product?.category?.trim();
    if (!category) continue;
    if (!groups.has(category)) groups.set(category, []);
    groups.get(category).push(product);
  }

  return [...groups.entries()]
    .map(([name, items]) => ({
      name,
      count: items.length,
      image: items.find((item) => item.image_url)?.image_url || null,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 4);
}

export default function HomeDiscovery({ products = [] }) {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const categories = useMemo(() => representativeCategories(products), [products]);

  const submitSearch = (event) => {
    event.preventDefault();
    const value = query.trim();
    navigate(value ? `/products?q=${encodeURIComponent(value)}` : '/products');
  };

  return (
    <section className="home-discovery" aria-labelledby="home-discovery-title">
      <div className="container">
        <div className="home-discovery-top">
          <div className="home-discovery-copy">
            <span className="home-discovery-kicker">
              <FaSparkles aria-hidden="true" /> شروع انتخاب
            </span>
            <h2 id="home-discovery-title">گل مناسب فضای خودت را سریع‌تر پیدا کن.</h2>
            <p>نام گل، رنگ، سبک یا دسته‌ای که در ذهن داری را جست‌وجو کن؛ یا از مجموعه‌ها شروع کن.</p>
          </div>

          <form className="home-discovery-search" role="search" onSubmit={submitSearch}>
            <FaSearch aria-hidden="true" />
            <label className="sr-only" htmlFor="home-product-search">جست‌وجوی محصولات</label>
            <input
              id="home-product-search"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="مثلاً رز صورتی، لاله، گل سفید…"
              autoComplete="off"
            />
            <button type="submit" aria-label="جست‌وجوی محصولات">
              <span>جست‌وجو</span>
              <FaArrowLeft aria-hidden="true" />
            </button>
          </form>
        </div>

        {categories.length > 0 && (
          <div className="home-category-grid" aria-label="دسته‌بندی‌های اصلی محصولات">
            {categories.map((category) => (
              <Link
                key={category.name}
                to={`/products?category=${encodeURIComponent(category.name)}`}
                className={`home-category-card ${category.image ? 'has-image' : ''}`}
              >
                {category.image ? (
                  <img src={category.image} alt="" loading="lazy" decoding="async" />
                ) : (
                  <span className="home-category-placeholder" aria-hidden="true"><FaThLarge /></span>
                )}
                <span className="home-category-scrim" aria-hidden="true" />
                <span className="home-category-content">
                  <small><span className="num">{category.count}</span> مدل</small>
                  <strong>{category.name}</strong>
                  <span className="home-category-action">مشاهده مجموعه <FaArrowLeft aria-hidden="true" /></span>
                </span>
              </Link>
            ))}
          </div>
        )}

        <div className="home-discovery-paths" aria-label="مسیرهای پیشنهادی خرید">
          <Link to="/#featured-products">منتخب نیلا</Link>
          <Link to="/how-to-order">راهنمای انتخاب</Link>
          <Link to="/products">همه محصولات <FaArrowLeft aria-hidden="true" /></Link>
        </div>
      </div>
    </section>
  );
}
