import { lazy, Suspense } from 'react';
import { Outlet } from 'react-router-dom';
import Header from './components/Header/Header';
import Footer from './components/Footer/Footer';
import ScrollToTop from './components/ScrollToTop/ScrollToTop';
import ScrollToHash from './components/ScrollToHash/ScrollToHash';
import ScrollReveal from './components/ScrollReveal/ScrollReveal';
import FloatingContact from './components/FloatingContact/FloatingContact';
import ChatWidget from './components/ChatWidget/ChatWidget';
import CartFeedback from './components/CartFeedback/CartFeedback';
import ProtectedRoute from './components/admin/ProtectedRoute';
import { ScrollProgress } from './lib/motion';
import { AuthProvider } from './context/AuthProvider';
import { CartProvider } from './context/CartProvider';
import HomePage from './pages/HomePage';
import RouteError from './pages/RouteError';
import AdminLogin from './pages/admin/AdminLogin';
import { getFeatures, getGallery, getProducts, getProduct, getRelatedProducts } from './services/catalog';
import { getApprovedReviews } from './services/reviews';
import { getPosts, getPost, getRecentPosts } from './services/posts';

// The admin dashboard pulls in the markdown editor — load it on demand so that
// bundle stays off the marketing critical path. Admin routes are never
// pre-rendered (excluded in vite.config's includedRoutes), so lazy is safe here.
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));

function PageFallback() {
  return (
    <div className="container">
      <p className="catalog-state">در حال بارگذاری…</p>
    </div>
  );
}

// Context providers wrap the whole router as a pathless root layout (ViteReactSSG
// manages the RouterProvider internally, so providers can't sit "outside" it).
function RootProviders() {
  return (
    <AuthProvider>
      <CartProvider>
        <Outlet />
      </CartProvider>
    </AuthProvider>
  );
}

// Public-facing pages share the marketing chrome (header/footer/scroll helpers).
function PublicLayout() {
  return (
    <div className="app">
      <ScrollProgress />
      <Header />
      <CartFeedback />
      <ScrollToHash />
      <ScrollReveal />
      <main>
        <Suspense fallback={<PageFallback />}>
          <Outlet />
        </Suspense>
      </main>
      <Footer />
      <ScrollToTop />
      <FloatingContact />
      <ChatWidget />
    </div>
  );
}

// ── Route loaders ───────────────────────────────────────────────────────────
// These run at build time (so the pre-rendered HTML carries real product/article
// content for SEO) and again on client-side navigation. vite-react-ssg serialises
// the build-time result into the page, so the first client render hydrates from it
// without a refetch or mismatch.
async function homeLoader() {
  const [products, features, gallery, reviews] = await Promise.all([
    getProducts(),
    getFeatures(),
    getGallery(),
    getApprovedReviews(3),
  ]);
  return { products, features, gallery, reviews };
}

async function productsLoader() {
  return { products: await getProducts() };
}

async function productLoader({ params }) {
  const product = await getProduct(params.slug);
  const related = product ? await getRelatedProducts(product) : [];
  return { product, related };
}

async function blogLoader() {
  return { posts: await getPosts() };
}

async function blogPostLoader({ params }) {
  const post = await getPost(params.slug);
  const recent = post ? await getRecentPosts(post.id, 3) : [];
  return { post, recent };
}

const lazyPage = (path) => () => import(path).then((module) => ({ Component: module.default }));

export const routes = [
  {
    element: <RootProviders />,
    errorElement: <RouteError />,
    children: [
      {
        element: <PublicLayout />,
        errorElement: <RouteError />,
        children: [
          { index: true, element: <HomePage />, loader: homeLoader },
          { path: 'products', loader: productsLoader, lazy: lazyPage('./pages/ProductsPage') },
          { path: 'products/:slug', loader: productLoader, lazy: lazyPage('./pages/ProductDetail') },
          { path: 'blog', loader: blogLoader, lazy: lazyPage('./pages/Blog') },
          { path: 'blog/:slug', loader: blogPostLoader, lazy: lazyPage('./pages/BlogPost') },
          { path: 'how-to-order', lazy: lazyPage('./pages/HowToOrder') },
          { path: 'cart', lazy: lazyPage('./pages/Cart') },
          { path: 'checkout', lazy: lazyPage('./pages/Checkout') },
          { path: 'payment/callback', lazy: lazyPage('./pages/PaymentCallback') },
          { path: 'account', lazy: lazyPage('./pages/Account') },
          { path: '*', lazy: lazyPage('./pages/NotFound') },
        ],
      },
      { path: 'admin/login', element: <AdminLogin /> },
      {
        path: 'admin',
        element: (
          <ProtectedRoute>
            <Suspense fallback={<PageFallback />}>
              <AdminDashboard />
            </Suspense>
          </ProtectedRoute>
        ),
      },
    ],
  },
];
