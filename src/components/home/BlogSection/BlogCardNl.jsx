import { Link } from 'react-router-dom';
import { FaArrowLeft } from 'react-icons/fa6';
import { postMeta } from '../../../lib/redesign';
import './BlogSection.css';

// One blog card for the figma-redesign landing (PLAN.md §4 WU7, spec-deep
// "blog card" frames). The whole card is a single Link to `/blog/:slug`;
// everything else is painted over the image inside `.nl-blog-card__media`
// (r20 + bottom scrim + frosted meta chips + bottom overlay).
// All meta comes from the pure `postMeta` helper (WU0) — no per-render Date
// math here. DOM order (RTL): [date, read-time] chips render at the inline
// start (right) corner, category chip at the far corner — matching the Figma
// layout where «آموزشی» sits at the left edge and «۷ بهمن» is rightmost.
function BlogCardNl({ post, index = 0 }) {
  const meta = postMeta(post);
  const image =
    post?.cover_image_url || `/img/redesign/blog-card-${(index % 4) + 1}.jpg`;

  return (
    <Link to={`/blog/${post?.slug ?? ''}`} className="nl-blog-card">
      <span className="nl-blog-card__media">
        <img
          src={image}
          alt={post?.title ?? 'مقاله نیلاگل'}
          width="512"
          height="640"
          loading="lazy"
          decoding="async"
        />
        <span className="nl-blog-card__scrim" aria-hidden="true" />
        <span className="nl-blog-card__top">
          <span className="nl-blog-card__details">
            {meta.dateShort && (
              <span className="nl-blog-card__chip">{meta.dateShort}</span>
            )}
            <span className="nl-blog-card__chip">
              {meta.readMinutes} دقیقه مطالعه
            </span>
          </span>
          <span className="nl-blog-card__chip nl-blog-card__chip--cat">
            {meta.category}
          </span>
        </span>
        <span className="nl-blog-card__bottom">
          <span className="nl-blog-card__title">{post?.title}</span>
          <span className="nl-blog-card__more">
            خواندن مقاله
            <FaArrowLeft
              aria-hidden="true"
              className="nl-blog-card__more-icon"
              preserveAspectRatio="none"
            />
          </span>
        </span>
      </span>
    </Link>
  );
}

export default BlogCardNl;
