import './FeaturesRose.css';
import { FaSpa, FaSeedling, FaTint, FaRegClock } from 'react-icons/fa';

const FEATURES = [
  {
    icon: <FaSpa aria-hidden="true" />,
    title: 'ظاهر طبیعی و باورپذیر',
    desc: 'فرم و بافتی که از فاصله‌ی نزدیک هم چشم‌نواز می‌ماند.',
  },
  {
    icon: <FaSeedling aria-hidden="true" />,
    title: 'فرم‌پذیر و انعطاف‌پذیر',
    desc: 'شاخه‌ها را برای گلدان، باکس و چیدمان دلخواه خم کنید.',
  },
  {
    icon: <FaTint aria-hidden="true" />,
    title: 'قابل شست‌وشو',
    desc: 'گردوغبار را به‌سادگی پاک می‌کنید؛ همیشه تمیز و تازه.',
  },
  {
    icon: <FaRegClock aria-hidden="true" />,
    title: 'ماندگاری بالا',
    desc: 'بدون پژمردگی و بدون نگهداری روزانه؛ گل تازه.',
  },
];

function Feature({ icon, title, desc }) {
  return (
    <article className="fr-item">
      <span className="fr-icon" aria-hidden="true">{icon}</span>
      <h3 className="fr-title">{title}</h3>
      <p className="fr-desc">{desc}</p>
    </article>
  );
}

const FeaturesRose = () => (
  <section className="fr" id="why-nila" aria-labelledby="fr-title">
    <div className="container">
      <header className="fr-head">
        <span className="pdf-pill">
          <FaSpa aria-hidden="true" />
          چرا نیلاگل؟
        </span>
        <h2 id="fr-title" className="pdf-h2">
          ظاهر طبیعی و <span className="pdf-pink">ماندگاری</span> بالا
        </h2>
      </header>

      <div className="fr-grid">
        <div className="fr-col">
          <Feature {...FEATURES[2]} />
          <Feature {...FEATURES[3]} />
        </div>

        <figure className="fr-blob">
          <img src="/img/nila-feat-rose.webp" alt="گل رز سفید روسی نیلا گل" loading="lazy" decoding="async" />
        </figure>

        <div className="fr-col">
          <Feature {...FEATURES[0]} />
          <Feature {...FEATURES[1]} />
        </div>
      </div>
    </div>
  </section>
);

export default FeaturesRose;
