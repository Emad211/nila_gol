import './About.css';
import { aboutContent } from '../../data/products';

const About = () => {
  return (
    <section id="about" className="about">
      <div className="container">
        <h2 className="section-title">درباره محصولات ما</h2>
        <div className="about-content">
          <div className="about-grid">
            <div className="about-card about-card--story">
              <h3 className="about-card-title">داستان و جنس محصول</h3>
              <p className="about-description">{aboutContent.description}</p>
              <div className="about-divider" aria-hidden="true" />
              <p className="about-caption">
                هر شاخه با دقت فرم می‌گیرد؛ برای فضایی آرام، هنری و ماندگار.
              </p>
            </div>

            <div className="about-card about-card--uses">
              <h3 className="about-card-title">کاربردها</h3>
              <ul className="uses-list">
                {aboutContent.uses.map((use, index) => (
                  <li key={index} className="use-item">
                    <span className="use-bullet" aria-hidden="true" />
                    <span className="use-text">{use}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;
