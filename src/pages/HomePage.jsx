import { useLoaderData } from 'react-router-dom';
import HeroSplit from '../components/home/HeroSplit';
import FeaturedProducts from '../components/Products/FeaturedProducts';
import Gallery from '../components/Gallery/Gallery';
import Testimonials from '../components/Reviews/Testimonials';
import FeaturesRose from '../components/home/FeaturesRose';
import Magazine from '../components/home/Magazine';
import Seo from '../lib/pageSeo';
import '../styles/pdf.css';

const HomePage = () => {
  const {
    products = [],
    gallery = [],
    reviews = [],
    posts = [],
  } = useLoaderData() || {};

  return (
    <div className="pdf-page">
      <Seo
        title="نیلا گل | گل روسی انعطاف‌پذیر و گل مصنوعی لوکس و ماندگار"
        description="گل‌های روسی انعطاف‌پذیر و گل مصنوعی لوکس، ماندگار و قابل شستشو. ارسال به سراسر کشور؛ سفارش آسان در واتساپ و تلگرام."
        path="/"
      />
      <HeroSplit products={products} />
      <Gallery initialItems={gallery} />
      <FeaturedProducts products={products} />
      <FeaturesRose />
      <Testimonials initialItems={reviews} />
      <Magazine posts={posts} />
    </div>
  );
};

export default HomePage;
