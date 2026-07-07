import Hero from '../components/Hero/Hero';
import About from '../components/About/About';
import Features from '../components/Features/Features';
import Gallery from '../components/Gallery/Gallery';
import Testimonials from '../components/Reviews/Testimonials';
import Contact from '../components/Contact/Contact';
import Seo from '../lib/pageSeo';

const HomePage = () => (
  <>
    <Seo
      title="نیلا گل | گل روسی انعطاف‌پذیر و گل مصنوعی لوکس و ماندگار"
      description="گل‌های روسی انعطاف‌پذیر و گل مصنوعی لوکس، ماندگار و قابل شستشو. ارسال به سراسر کشور؛ سفارش آسان در واتساپ و تلگرام."
      path="/"
    />
    <Hero />
    <About />
    <Features />
    <Gallery />
    <Testimonials />
    <Contact />
  </>
);

export default HomePage;
