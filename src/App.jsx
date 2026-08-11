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
import ProductsPage from './pages/ProductsPage';
import ProductDetail from './pages/ProductDetail';
import HowToOrder from './pages/HowToOrder';
import Account from './pages/Account';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import PaymentCallback from './pages/PaymentCallback';
import NotFound from './pages/NotFound';
import RouteError from './pages/RouteError';
import AdminLogin from './pages/admin/AdminLogin';
import { getProducts, getProduct, getRelatedProducts } from './services/catalog';
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
  return { products: await getProducts() };
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
          { path: 'products', element: <ProductsPage />, loader: productsLoader },
          { path: 'products/:slug', element: <ProductDetail />, loader: productLoader },
          {
            path: 'blog',
            loader: blogLoader,
            lazy: () => import('./pages/Blog').then((m) => ({ Component: m.default })),
          },
          {
            path: 'blog/:slug',
            loader: blogPostLoader,
            lazy: () => import('./pages/BlogPost').then((m) => ({ Component: m.default })),
          },
          { path: 'how-to-order', element: <HowToOrder /> },
          { path: 'cart', element: <Cart /> },
          { path: 'checkout', element: <Checkout /> },
          { path: 'payment/callback', element: <PaymentCallback /> },
          { path: 'account', element: <Account /> },
          { path: '*', element: <NotFound /> },
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
