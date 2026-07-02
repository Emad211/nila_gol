import './About.css';
import { FaSeedling } from 'react-icons/fa';
import { aboutContent } from '../../data/products';
import { Reveal } from '../../lib/motion';

const About = () => {
  return (
    <section id="about" className="about">
      <div className="container">
        <Reveal className="about-header">
          <span className="eyebrow about-eyebrow">
            <FaSeedling aria-hidden="true" />
            درباره محصولات
          </span>
          <h2 className="section-title about-title">
            جزئيات، فرم و <span className="text-gradient">حس طبيعي</span>
          </h2>
          <p className="about-lead">
            {aboutContent.subtitle} — گل‌هايي كه بافت و رنگشان ماندگار مي‌ماند و با
            دكور خانه هماهنگ است.
          </p>
        </Reveal>

        <div className="about-layout">
          <Reveal dir="start" className="about-visual">
            <div className="about-image-card">
              <img src="/img/about.webp" alt="چیدمان گل روسی نیلا گل" className="about-image" loading="lazy" />
            </div>
            <div className="about-highlight glass">
              <span className="about-highlight-title">حس واقعي در نگاه اول</span>
              <span className="about-highlight-text">فرم‌پذير، شستشوپذير و بدون افت رنگ</span>
            </div>
          </Reveal>

          <Reveal dir="end" className="about-content">
            <div className="about-story">
              <h3 className="about-card-title">داستان و جنس محصول</h3>
              <p className="about-description">{aboutContent.description}</p>
            </div>

            <div className="about-uses">
              <h3 className="about-card-title">كاربردها</h3>
              <div className="about-chips">
                {aboutContent.uses.map((use, index) => (
                  <span key={index} className="about-chip">
                    {use}
                  </span>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
};

export default About;
