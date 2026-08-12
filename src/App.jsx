import { lazy, Suspense } from 'react';
import { Outlet } from 'react-router-dom';
import Header from './components/Header/Header';
import Footer from './components/Footer/Footer';
import ScrollProgress from './components/ScrollProgress/ScrollProgress';
import ScrollToTop from './components/ScrollToTop/ScrollToTop';
import ScrollToHash from './components/ScrollToHash/ScrollToHash';
import ScrollReveal from './components/ScrollReveal/ScrollReveal';
import FloatingContact from './components/FloatingContact/FloatingContact';
import ChatWidget from './components/ChatWidget/ChatWidget';
import CartFeedback from './components/CartFeedback/CartFeedback';
import ProtectedRoute from './components/admin/ProtectedRoute';
import { AuthProvider } from './context/AuthProvider';
import { CartProvider } from './context/CartProvider';
import HomePage from './pages/HomePage';
import RouteError from './pages/RouteError';
import AdminLogin from './pages/admin/AdminLogin';

// Keep heavy management/editor dependencies completely off the storefront path.
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));

function PageFallback() {
  return (
    <div className="container">
      <p className="catalog-state">در حال بارگذاری…</p>
    </div>
  );
}

function RootProviders() {
  return (
    <AuthProvider>
      <CartProvider>
        <Outlet />
      </CartProvider>
    </AuthProvider>
  );
}

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
// Data service modules are dynamically imported so the home shell does not pull
// all route/data code into the synchronous JavaScript graph. Build-time SSG still
// executes these loaders and serializes the resulting data into the static page.
async function homeLoader() {
  const [{ getFeatures, getGallery, getProducts }, { getApprovedReviews }] = await Promise.all([
    import('./services/catalog'),
    import('./services/reviews'),
  ]);
  const [products, features, gallery, reviews] = await Promise.all([
    getProducts(),
    getFeatures(),
    getGallery(),
    getApprovedReviews(3),
  ]);
  return { products, features, gallery, reviews };
}

async function productsLoader() {
  const { getProducts } = await import('./services/catalog');
  return { products: await getProducts() };
}

async function productLoader({ params }) {
  const { getProduct, getRelatedProducts } = await import('./services/catalog');
  const product = await getProduct(params.slug);
  const related = product ? await getRelatedProducts(product) : [];
  return { product, related };
}

async function blogLoader() {
  const { getPosts } = await import('./services/posts');
  return { posts: await getPosts() };
}

async function blogPostLoader({ params }) {
  const { getPost, getRecentPosts } = await import('./services/posts');
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
          {
            path: 'products',
            loader: productsLoader,
            lazy: () => import('./pages/ProductsPage').then((m) => ({ Component: m.default })),
          },
          {
            path: 'products/:slug',
            loader: productLoader,
            lazy: () => import('./pages/ProductDetail').then((m) => ({ Component: m.default })),
          },
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
          {
            path: 'how-to-order',
            lazy: () => import('./pages/HowToOrder').then((m) => ({ Component: m.default })),
          },
          { path: 'cart', lazy: () => import('./pages/Cart').then((m) => ({ Component: m.default })) },
          { path: 'checkout', lazy: () => import('./pages/Checkout').then((m) => ({ Component: m.default })) },
          {
            path: 'payment/callback',
            lazy: () => import('./pages/PaymentCallback').then((m) => ({ Component: m.default })),
          },
          { path: 'account', lazy: () => import('./pages/Account').then((m) => ({ Component: m.default })) },
          { path: '*', lazy: () => import('./pages/NotFound').then((m) => ({ Component: m.default })) },
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
