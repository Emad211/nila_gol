import './About.css';
import { FaCheck, FaSeedling } from 'react-icons/fa';
import { aboutContent } from '../../data/products';
import { Reveal } from '../../lib/motion';

const About = () => {
  const uses = aboutContent.uses?.slice(0, 5) || [];

  return (
    <section id="about" className="about about--editorial" aria-labelledby="about-title">
      <div className="container about-editorial-grid">
        <Reveal dir="start" className="about-visual">
          <figure className="about-image-card">
            <img
              src="/img/about.webp"
              alt="چیدمان گل روسی نیلا گل"
              className="about-image"
              loading="lazy"
            />
            <figcaption>جزئیات طبیعی، بدون دردسر نگهداری روزانه</figcaption>
          </figure>
        </Reveal>

        <Reveal dir="end" className="about-content">
          <div className="about-index" aria-hidden="true">01</div>
          <span className="about-kicker">
            <FaSeedling aria-hidden="true" />
            داستان محصول
          </span>
          <h2 id="about-title" className="about-title">
            چیزی میان لطافت گل طبیعی و آرامشِ یک انتخاب ماندگار.
          </h2>
          <p className="about-description">{aboutContent.description}</p>

          <div className="about-proof">
            <div>
              <strong>ظاهر طبیعی</strong>
              <span>فرم و بافتی که از فاصله نزدیک هم مصنوعی به نظر نمی‌رسد.</span>
            </div>
            <div>
              <strong>قابل فرم‌دهی</strong>
              <span>برای گلدان، باکس، میز پذیرایی و چیدمان‌های مختلف.</span>
            </div>
          </div>

          {uses.length > 0 && (
            <div className="about-uses" aria-label="کاربردهای پیشنهادی">
              {uses.map((use, index) => (
                <span key={index} className="about-use">
                  <FaCheck aria-hidden="true" />
                  {use}
                </span>
              ))}
            </div>
          )}
        </Reveal>
      </div>
    </section>
  );
};

export default About;
