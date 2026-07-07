import './Blog.css';
import { useLoaderData } from 'react-router-dom';
import { FaSeedling } from 'react-icons/fa';
import { formatDate } from '../lib/format';
import Seo, { SITE_URL } from '../lib/pageSeo';
import { Reveal, MotionLinkCard } from '../lib/motion';

export default function Blog() {
  // Posts are loaded at build time (pre-rendered HTML) and on client navigation.
  const { posts } = useLoaderData();

  return (
    <div className="blog">
      <Seo
        title="مجله نیلا گل | مقالات و راهنمای گل روسی و گل مصنوعی"
        description="راهنمای خرید، نگهداری و تزئین خانه با گل روسی و گل‌های مصنوعی لوکس و ماندگار. جدیدترین مقالات و نکته‌های نیلا گل را اینجا بخوانید."
        path="/blog"
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'Blog',
          name: 'مجله نیلا گل',
          description: 'مقالات و راهنمای گل روسی و گل مصنوعی لوکس و ماندگار',
          url: `${SITE_URL}/blog`,
        }}
      />
      <div className="container">
        <Reveal as="header" className="blog-hero">
          <span className="blog-kicker">مجله</span>
          <h1 className="blog-title">مجلهٔ نیلا گل</h1>
          <p className="blog-sub">
            هر آنچه درباره‌ی خرید، نگهداری و تزئین خانه با گل‌های انعطاف‌پذیر و ماندگار باید بدانید.
          </p>
        </Reveal>

        {posts.length === 0 ? (
          <p className="catalog-state">به‌زودی مقاله‌های تازه اینجا منتشر می‌شود.</p>
        ) : (
          <div className="blog-grid">
            {posts.map((post, i) => (
              <MotionLinkCard
                key={post.id}
                to={`/blog/${post.slug}`}
                index={i}
                className={`blog-card${i === 0 && posts.length > 2 ? ' blog-card--lead' : ''}`}
              >
                <div className="blog-card-cover">
                  {post.cover_image_url ? (
                    <img src={post.cover_image_url} alt={post.title} loading="lazy" />
                  ) : (
                    <div className="blog-cover-fallback" aria-hidden="true"><FaSeedling /></div>
                  )}
                  {i === 0 && posts.length > 2 && <span className="blog-card-scrim" aria-hidden="true" />}
                </div>
                <div className="blog-card-body">
                  {post.tags?.length > 0 && <span className="blog-card-tag">{post.tags[0]}</span>}
                  <h2 className="blog-card-title">{post.title}</h2>
                  {post.excerpt && <p className="blog-card-excerpt">{post.excerpt}</p>}
                  <span className="blog-card-meta">{formatDate(post.published_at)}</span>
                </div>
              </MotionLinkCard>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
