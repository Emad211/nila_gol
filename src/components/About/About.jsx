import './About.css';
import { FaCheck, FaSeedling } from 'react-icons/fa';
import { aboutContent } from '../../data/products';

const About = () => {
  const uses = aboutContent.uses?.slice(0, 5) || [];

  return (
    <section id="about" className="about about--editorial" aria-labelledby="about-title">
      <div className="container about-editorial-grid">
        <div className="about-visual">
          <figure className="about-image-card">
            <img
              src="/img/about.webp"
              alt="چیدمان گل روسی نیلا گل"
              className="about-image"
              loading="lazy"
              decoding="async"
            />
            <figcaption>ظاهر طبیعی، بدون دردسر نگهداری روزانه</figcaption>
          </figure>
        </div>

        <div className="about-content">
          <div className="about-index" aria-hidden="true">01</div>
          <span className="about-kicker">
            <FaSeedling aria-hidden="true" />
            چرا گل روسی؟
          </span>
          <h2 id="about-title" className="about-title">
            ظاهر طبیعی، فرم‌پذیری و ماندگاری؛ بدون نگهداری گل تازه.
          </h2>
          <p className="about-description">
            گل‌های روسی انعطاف‌پذیر، لطافت و فرم گل طبیعی را با دوام یک محصول ماندگار ترکیب می‌کنند. می‌توانید شاخه‌ها را برای گلدان و چیدمان‌های مختلف فرم دهید و بدون نگرانی از پژمردگی، مدت‌ها از ظاهر مرتب آن‌ها استفاده کنید.
          </p>

          <div className="about-proof">
            <div>
              <strong>ظاهر طبیعی</strong>
              <span>فرم و بافتی که از فاصله نزدیک هم چشم‌نواز و باورپذیر می‌ماند.</span>
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
        </div>
      </div>
    </section>
  );
};

export default About;
