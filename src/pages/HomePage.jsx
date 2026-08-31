import { useLoaderData } from 'react-router-dom';
import LandingHeader from '../components/home/LandingHeader/LandingHeader';
import Hero from '../components/home/Hero/Hero';
import GallerySection from '../components/home/GallerySection/GallerySection';
import ProductsSection from '../components/home/ProductsSection/ProductsSection';
import FeaturesSection from '../components/home/FeaturesSection/FeaturesSection';
import TestimonialsSection from '../components/home/TestimonialsSection/TestimonialsSection';
import BlogSection from '../components/home/BlogSection/BlogSection';
import LandingFooter from '../components/home/LandingFooter/LandingFooter';
import Seo from '../lib/pageSeo';

// Global Header/Footer are suppressed on '/' by PublicLayout (PLAN.md D1) — this page owns its full chrome.
const HomePage = () => {
  const {
    products = [],
    gallery = [],
    reviews = [],
    posts = [],
  } = useLoaderData() || {};

  return (
    <div className="landing">
      <Seo
        title="نیلا گل | گل روسی انعطاف‌پذیر و گل مصنوعی لوکس و ماندگار"
        description="گل‌های روسی انعطاف‌پذیر و گل مصنوعی لوکس، ماندگار و قابل شستشو. ارسال به سراسر کشور؛ سفارش آسان در واتساپ و تلگرام."
        path="/"
      />
      <LandingHeader />
      <Hero products={products} />
      <GallerySection items={gallery} />
      <ProductsSection products={products} />
      <FeaturesSection />
      <TestimonialsSection reviews={reviews} />
      <BlogSection posts={posts} />
      <LandingFooter />
    </div>
  );
};

export default HomePage;
