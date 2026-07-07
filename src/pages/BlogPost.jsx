import './Blog.css';
import { Link, useLoaderData } from 'react-router-dom';
import { FaSeedling } from 'react-icons/fa';
import { formatDate } from '../lib/format';
import Seo, { SITE_URL } from '../lib/pageSeo';
import Markdown from '../lib/markdown';

export default function BlogPost() {
  // Loaded at build time (pre-rendered article HTML) and on client navigation.
  const { post, recent } = useLoaderData();

  if (!post) {
    return (
      <div className="blog">
        <div className="container">
          <p className="catalog-state">مقاله پیدا نشد.</p>
          <p style={{ textAlign: 'center' }}>
            <Link to="/blog" className="post-back">بازگشت به مجله →</Link>
          </p>
        </div>
      </div>
    );
  }

  const cover = post.cover_image_url || `${SITE_URL}/pwa-512.png`;

  return (
    <div className="blog">
      <Seo
        title={`${post.title} | مجله نیلا گل`}
        description={post.excerpt || post.title}
        path={`/blog/${post.slug}`}
        image={cover}
        jsonLd={{
          '@context': 'https://schema.org',
          '@graph': [
            {
              '@type': 'BlogPosting',
              headline: post.title,
              description: post.excerpt || undefined,
              image: cover,
              datePublished: post.published_at || undefined,
              dateModified: post.published_at || undefined,
              inLanguage: 'fa-IR',
              author: { '@type': 'Organization', name: post.author || 'نیلا گل' },
              publisher: {
                '@type': 'Organization',
                name: 'نیلا گل',
                logo: { '@type': 'ImageObject', url: `${SITE_URL}/pwa-512.png` },
              },
              mainEntityOfPage: { '@type': 'WebPage', '@id': `${SITE_URL}/blog/${post.slug}` },
            },
            {
              '@type': 'BreadcrumbList',
              itemListElement: [
                { '@type': 'ListItem', position: 1, name: 'خانه', item: `${SITE_URL}/` },
                { '@type': 'ListItem', position: 2, name: 'مجله', item: `${SITE_URL}/blog` },
                { '@type': 'ListItem', position: 3, name: post.title },
              ],
            },
          ],
        }}
      />
      <div className="container">
        <article className="post fade-in">
          <nav className="post-breadcrumb" aria-label="مسیر">
            <Link to="/">خانه</Link>
            <span aria-hidden="true">/</span>
            <Link to="/blog">مجله</Link>
            <span aria-hidden="true">/</span>
            <span className="post-crumb-current">{post.title}</span>
          </nav>

          <header className="post-head">
            {post.tags?.length > 0 && (
              <div className="post-tags">
                {post.tags.map((t, i) => (
                  <span key={i} className="post-tag">{t}</span>
                ))}
              </div>
            )}
            <h1 className="post-title">{post.title}</h1>
            <div className="post-meta">
              <span>{post.author || 'نیلا گل'}</span>
              {post.published_at && (
                <>
                  <span className="post-meta-dot" aria-hidden="true">•</span>
                  <span>{formatDate(post.published_at)}</span>
                </>
              )}
            </div>
          </header>

          {post.cover_image_url && (
            <img className="post-cover" src={post.cover_image_url} alt={post.title} />
          )}

          <div className="prose">
            <Markdown>{post.content}</Markdown>
          </div>

          <div className="post-cta">
            <h3>به دنبال گل ماندگار هستید؟</h3>
            <p>مجموعه‌ی گل‌های روسی و مصنوعی لوکس نیلا گل را ببینید و آسان سفارش دهید.</p>
            <Link to="/products" className="post-cta-btn">مشاهده‌ی محصولات</Link>
          </div>

          <Link to="/blog" className="post-back">→ بازگشت به مجله</Link>
        </article>

        {recent.length > 0 && (
          <section className="post-more">
            <h2 className="post-more-title">مقاله‌های دیگر</h2>
            <div className="blog-grid">
              {recent.map((p) => (
                <Link key={p.id} to={`/blog/${p.slug}`} className="blog-card">
                  <div className="blog-card-cover">
                    {p.cover_image_url ? (
                      <img src={p.cover_image_url} alt={p.title} loading="lazy" />
                    ) : (
                      <div className="blog-cover-fallback" aria-hidden="true"><FaSeedling /></div>
                    )}
                  </div>
                  <div className="blog-card-body">
                    {p.tags?.length > 0 && <span className="blog-card-tag">{p.tags[0]}</span>}
                    <h3 className="blog-card-title">{p.title}</h3>
                    <span className="blog-card-meta">{formatDate(p.published_at)}</span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
