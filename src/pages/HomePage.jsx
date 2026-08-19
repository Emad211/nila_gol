import { useLoaderData } from 'react-router-dom';
import Hero from '../components/Hero/Hero';
import FeaturedProducts from '../components/Products/FeaturedProducts';
import About from '../components/About/About';
import Gallery from '../components/Gallery/Gallery';
import Testimonials from '../components/Reviews/Testimonials';
import Contact from '../components/Contact/Contact';
import Seo from '../lib/pageSeo';
import '../styles/landing-research.css';
import '../styles/landing-a11y.css';

const HomePage = () => {
  const {
    products = [],
    gallery = [],
    reviews = [],
  } = useLoaderData() || {};

  return (
    <>
      <Seo
        title="نیلا گل | گل روسی انعطاف‌پذیر و گل مصنوعی لوکس و ماندگار"
        description="گل‌های روسی انعطاف‌پذیر و گل مصنوعی لوکس، ماندگار و قابل شستشو. ارسال به سراسر کشور؛ سفارش آسان در واتساپ و تلگرام."
        path="/"
      />
      <Hero />
      <FeaturedProducts products={products} />
      <About />
      <Gallery initialItems={gallery} />
      <Testimonials initialItems={reviews} />
      <Contact />
    </>
  );
};

export default HomePage;
