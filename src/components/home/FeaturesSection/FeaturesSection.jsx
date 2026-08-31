import { PiFlowerTulip } from 'react-icons/pi';
import { FaSoap, FaInfinity, FaLeaf, FaWind } from 'react-icons/fa6';
import SectionHeading from '../SectionHeading.jsx';
import './FeaturesSection.css';

// Static copy locked by the design (decision D8) — verbatim from
// design-briefs/figma-redesign/spec-deep.txt (ZWNJ preserved). Icons verified
// to exist in react-icons/fa6 + react-icons/pi.
const REASONS = [
  {
    icon: FaSoap,
    title: 'قابل شست‌وشو',
    desc: 'گردوغبار را به‌سادگی پاک می‌کنید؛ همیشه تمیز و تازه.',
  },
  {
    icon: FaInfinity,
    title: 'ماندگاری بالا',
    desc: 'بدون پژمردگی و بدون نگهداری روزانه‌ی گل تازه.',
  },
  {
    icon: FaLeaf,
    title: 'ظاهر طبیعی و باورپذیر',
    desc: 'فرم و بافتی که از فاصله‌ی نزدیک هم چشم‌نواز می‌ماند.',
  },
  {
    icon: FaWind,
    title: 'فرم‌پذیر و انعطاف‌پذیر',
    desc: 'شاخه‌ها را برای گلدان، باکس و چیدمان دلخواه خم کنید.',
  },
];

function Reason({ icon: Icon, title, desc }) {
  return (
    <div className="nl-features__reason">
      <span className="nl-features__iconbox" aria-hidden="true">
        <Icon className="nl-features__icon" />
      </span>
      <h3 className="nl-features__reason-title">{title}</h3>
      <p className="nl-features__reason-desc">{desc}</p>
    </div>
  );
}

function FeaturesSection() {
  return (
    <section id="features" className="nl-features nl-container">
      <SectionHeading
        icon={PiFlowerTulip}
        eyebrow="چرا نیلاگل؟"
        title="ظاهر طبیعی و ماندگاری بالا"
        underline={[199, 13]}
        titleSize={128}
        titleSizeMobile={80}
        center
      />
      <div className="nl-features__grid">
        <div className="nl-features__col nl-features__col--start">
          <Reason icon={REASONS[0].icon} title={REASONS[0].title} desc={REASONS[0].desc} />
          <Reason icon={REASONS[1].icon} title={REASONS[1].title} desc={REASONS[1].desc} />
        </div>
        <div className="nl-features__mid">
          <img
            src="/img/redesign/features-mid.jpg"
            alt="چیدمانی از گل‌های روسی ماندگار نیلاگل"
            width={738}
            height={587}
            loading="lazy"
            className="nl-features__mid-img"
          />
        </div>
        <div className="nl-features__col nl-features__col--end">
          <Reason icon={REASONS[2].icon} title={REASONS[2].title} desc={REASONS[2].desc} />
          <Reason icon={REASONS[3].icon} title={REASONS[3].title} desc={REASONS[3].desc} />
        </div>
      </div>
    </section>
  );
}

export default FeaturesSection;
