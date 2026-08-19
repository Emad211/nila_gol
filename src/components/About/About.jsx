import './About.css';
import { Link } from 'react-router-dom';
import { FaCheck, FaSeedling, FaTint, FaMagic, FaRegClock, FaArrowLeft } from 'react-icons/fa';
import { aboutContent } from '../../data/products';

// Single "why نیلا گل" section — merges the former About + Features blocks into one
// honest narrative. Every proof point maps to a real product attribute
// (natural look / washable / flexible-form / durable — all present in
// products[].features); no fabricated claims. Fully static (imports aboutContent),
// so it renders identically at build (SSG) and on the client.
const PROOF = [
  { Icon: FaSeedling, title: 'ظاهر طبیعی و باورپذیر', text: 'فرم و بافتی که از فاصله‌ی نزدیک هم چشم‌نواز می‌ماند.' },
  { Icon: FaTint, title: 'قابل شست‌وشو', text: 'گردوغبار را به‌سادگی پاک می‌کنید؛ همیشه تمیز و تازه.' },
  { Icon: FaMagic, title: 'فرم‌پذیر و انعطاف‌پذیر', text: 'شاخه‌ها را برای گلدان، باکس و چیدمان دلخواه خم کنید.' },
  { Icon: FaRegClock, title: 'ماندگاری بالا', text: 'بدون پژمردگی و بدون نگهداری روزانه‌ی گل تازه.' },
];

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
          <span className="about-kicker">
            <FaSeedling aria-hidden="true" />
            چرا نیلا گل؟
          </span>
          <h2 id="about-title" className="about-title">
            ظاهر طبیعی، فرم‌پذیری و ماندگاری؛ بدون نگهداری گل تازه.
          </h2>
          <p className="about-description">
            گل‌های روسی انعطاف‌پذیر، لطافت و فرم گل طبیعی را با دوام یک محصول ماندگار ترکیب می‌کنند؛ برای گلدان و چیدمان‌های مختلف فرم می‌گیرند و بدون پژمردگی، مدت‌ها مرتب می‌مانند.
          </p>

          <ul className="about-proof">
            {PROOF.map(({ Icon, title, text }) => (
              <li key={title}>
                <span className="about-proof-icon" aria-hidden="true"><Icon /></span>
                <strong>{title}</strong>
                <span className="about-proof-text">{text}</span>
              </li>
            ))}
          </ul>

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

          <Link to="/products" className="about-cta">
            مشاهده مجموعه
            <FaArrowLeft aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>
  );
};

export default About;
