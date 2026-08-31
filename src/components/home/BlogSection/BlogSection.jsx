import { FaRegNewspaper } from 'react-icons/fa6';
import SectionHeading from '../SectionHeading.jsx';
import CtaButton from '../CtaButton.jsx';
import BlogCardNl from './BlogCardNl.jsx';
import './BlogSection.css';

// «مقاله ها و مجله ها» — seventh landing section (PLAN.md §4 WU7). Live posts
// from the home loader: up to 4 cards; an empty/failed feed still renders the
// heading and the «مشاهده همه» CTA (PLAN §7 empty-safe rule, posts.js has no
// static fallback). Desktop = 4-column grid; ≤900px = horizontal scroll-snap
// row (CSS in BlogSection.css).
function BlogSection({ posts }) {
  const data = (Array.isArray(posts) ? posts : [])
    .filter(Boolean)
    .slice(0, 4);

  return (
    <section id="blog" className="nl-blog nl-container">
      <SectionHeading
        icon={FaRegNewspaper}
        eyebrow="مجله ها"
        title="مقاله ها و مجله ها"
        underline={[70, 5]}
        center
      />
      {data.length > 0 && (
        <div className="nl-blog__cards">
          {data.map((post, index) => (
            <BlogCardNl
              key={post.id ?? post.slug ?? index}
              post={post}
              index={index}
            />
          ))}
        </div>
      )}
      <div className="nl-blog__cta">
        <CtaButton to="/blog">مشاهده همه</CtaButton>
      </div>
    </section>
  );
}

export default BlogSection;
