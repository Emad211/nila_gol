import './Magazine.css';
import { Link } from 'react-router-dom';
import { FaArrowLeft, FaRegNewspaper } from 'react-icons/fa';
import { formatDate } from '../../lib/format';

function readMinutes(content = '') {
  const words = content.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

const Magazine = ({ posts = [] }) => {
  const items = posts.slice(0, 4);
  if (items.length === 0) return null;

  return (
    <section className="mag" id="magazine" aria-labelledby="mag-title">
      <div className="container">
        <header className="mag-head pdf-center">
          <span className="pdf-pill">
            <FaRegNewspaper aria-hidden="true" />
            مجله ها
          </span>
          <h2 id="mag-title" className="pdf-h2">
            مقاله ها و <span className="pdf-pink">مجله ها</span>
          </h2>
        </header>

        <div className="mag-grid">
          {items.map((post, i) => (
            <Link key={post.id} to={`/blog/${post.slug}`} className="mag-card">
              <img
                src={post.cover_image_url || `/img/nila-blog-${i + 1}.webp`}
                alt={post.title}
                loading="lazy"
                decoding="async"
              />
              <span className="mag-badge">{post.tags?.[0] || 'مجله'}</span>
              <span className="mag-meta">
                <b>{formatDate(post.published_at)}</b>
                <i>{readMinutes(post.content)} دقیقه مطالعه</i>
              </span>
              <span className="mag-overlay" aria-hidden="true" />
              <span className="mag-body">
                <strong>{post.title}</strong>
                <em>
                  خواندن مقاله <FaArrowLeft aria-hidden="true" />
                </em>
              </span>
            </Link>
          ))}
        </div>

        <div className="mag-more pdf-center">
          <Link to="/blog" className="pdf-cta">
            همه مقاله ها
            <FaArrowLeft aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>
  );
};

export default Magazine;
