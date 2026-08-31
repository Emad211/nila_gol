import { PiFlowerTulip } from 'react-icons/pi';
import SectionHeading from '../SectionHeading.jsx';
import CtaButton from '../CtaButton.jsx';
import { topProducts } from '../../../lib/redesign';
import ProductCardNl from './ProductCardNl.jsx';
import './ProductsSection.css';

// ProductsSection — figma-redesign "products" frame (PLAN.md §4 WU4).
// Live catalog rows via topProducts(products, 3) (featured first, then
// sort_order). An empty catalog renders heading + CTA only — SSG-empty safe.
function ProductsSection({ products }) {
  const cards = topProducts(products, 3);

  return (
    <section id="products" className="nl-products">
      <div className="nl-container">
        <SectionHeading
          icon={PiFlowerTulip}
          eyebrow="محصولات نیلا"
          title={
            <>
              زیبایی ماندگار، <span className="nl-accent">همیشه سبز</span>
            </>
          }
          sub="مجموعه‌ای از گل‌های مصنوعی با ظاهر طبیعی و طراحی زیبای نیلاگل، انتخابی ماندگار برای زیباتر کردن فضای خانه و محل کار."
          underline={[41, 2]}
          titleSize={64}
          titleSizeMobile={48}
          center
        />

        {cards.length > 0 && (
          <div className="nl-products__grid">
            {cards.map((product, index) => (
              <ProductCardNl
                key={product.id ?? product.slug ?? index}
                product={product}
                index={index}
              />
            ))}
          </div>
        )}

        <div className="nl-products__cta">
          <CtaButton to="/products">مشاهده محصولات</CtaButton>
        </div>
      </div>
    </section>
  );
}

export default ProductsSection;
