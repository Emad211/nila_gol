import { lazy, Suspense } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Header from './components/Header/Header';
import Footer from './components/Footer/Footer';
import ScrollProgress from './components/ScrollProgress/ScrollProgress';
import ScrollToTop from './components/ScrollToTop/ScrollToTop';
import ScrollToHash from './components/ScrollToHash/ScrollToHash';
import ScrollReveal from './components/ScrollReveal/ScrollReveal';
import CartFeedback from './components/CartFeedback/CartFeedback';
import { CartProvider } from './context/CartProvider';
import HomePage from './pages/HomePage';
import RouteError from './pages/RouteError';

const SupportChatBoundary = lazy(() => import('./components/ChatWidget/SupportChatBoundary'));

function PageFallback() {
  return (
    <div className="container">
      <p className="catalog-state">در حال بارگذاری…</p>
    </div>
  );
}

// Cart state is lightweight/local and useful across the storefront. Auth is
// deliberately NOT mounted here: Home, catalog and editorial pages do not need
// a Supabase session just to render, so auth is loaded only on dependent routes.
function RootProviders() {
  return (
    <CartProvider>
      <Outlet />
    </CartProvider>
  );
}

function PublicLayout() {
  const { pathname } = useLocation();
  // One unified support widget (AI concierge «گلی» + real human channels) sits
  // on every public page EXCEPT the focused checkout/account/payment flows:
  // those already mount their own AuthProvider (via authLayout), so the widget's
  // boundary would spin up a second one — and a floating launcher only distracts
  // from a conversion step.
  const widgetAllowed =
    pathname !== '/checkout' &&
    pathname !== '/account' &&
    !pathname.startsWith('/payment/');

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
      {widgetAllowed && (
        <Suspense fallback={null}>
          <SupportChatBoundary />
        </Suspense>
      )}
    </div>
  );
}

// ── Route loaders ───────────────────────────────────────────────────────────
// Data service modules are dynamically imported so the home shell does not pull
// route/data clients into its synchronous JavaScript graph. Build-time SSG still
// executes these loaders and serializes the resulting data into static HTML.
async function homeLoader() {
  const [{ getGallery, getProducts }, { getApprovedReviews }] = await Promise.all([
    import('./services/catalog'),
    import('./services/reviews'),
  ]);
  const [products, gallery, reviews] = await Promise.all([
    getProducts(),
    getGallery(),
    getApprovedReviews(3),
  ]);
  return { products, gallery, reviews };
}

async function productsLoader() {
  const { getProducts } = await import('./services/catalog');
  return { products: await getProducts() };
}

async function productLoader({ params }) {
  const [{ getProduct, getRelatedProducts }, { getProductReviews }] = await Promise.all([
    import('./services/catalog'),
    import('./services/reviews'),
  ]);
  const product = await getProduct(params.slug);
  const [related, reviews] = product
    ? await Promise.all([getRelatedProducts(product), getProductReviews(product.id)])
    : [[], []];
  return { product, related, reviews };
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

// These loaders' data is a pure function of the pathname (and the `:slug`
// param) — never the query string or hash. React Router revalidates every
// active loader on any location change by default, including in-page
// `setSearchParams` (filter/sort) and `#anchor` clicks. Under vite-react-ssg's
// static build, that client revalidation resolves data by exact-pathname
// manifest lookup, which returns `null` for the trailing-slash canonical URL a
// fresh page load lands on (`/products/` vs manifest key `/products`) — and a
// `null` `useLoaderData()` would crash the consumer. Skipping revalidation when
// the pathname is unchanged keeps the hydrated data alive across filter/sort/
// anchor interactions (and avoids a redundant catalog refetch on every click).
const revalidateOnPathChange = ({ currentUrl, nextUrl }) =>
  currentUrl.pathname !== nextUrl.pathname;

const authLayout = () => import('./layouts/AuthOutlet').then((m) => ({ Component: m.default }));

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
            shouldRevalidate: revalidateOnPathChange,
            lazy: () => import('./pages/ProductsPage').then((m) => ({ Component: m.default })),
          },
          {
            path: 'products/:slug',
            loader: productLoader,
            shouldRevalidate: revalidateOnPathChange,
            lazy: () => import('./pages/ProductDetail').then((m) => ({ Component: m.default })),
          },
          {
            path: 'blog',
            loader: blogLoader,
            shouldRevalidate: revalidateOnPathChange,
            lazy: () => import('./pages/Blog').then((m) => ({ Component: m.default })),
          },
          {
            path: 'blog/:slug',
            loader: blogPostLoader,
            shouldRevalidate: revalidateOnPathChange,
            lazy: () => import('./pages/BlogPost').then((m) => ({ Component: m.default })),
          },
          {
            path: 'how-to-order',
            lazy: () => import('./pages/HowToOrder').then((m) => ({ Component: m.default })),
          },
          { path: 'cart', lazy: () => import('./pages/Cart').then((m) => ({ Component: m.default })) },
          {
            path: 'payment/callback',
            lazy: () => import('./pages/PaymentCallback').then((m) => ({ Component: m.default })),
          },
          {
            lazy: authLayout,
            children: [
              { path: 'checkout', lazy: () => import('./pages/Checkout').then((m) => ({ Component: m.default })) },
              { path: 'account', lazy: () => import('./pages/Account').then((m) => ({ Component: m.default })) },
            ],
          },
          { path: '*', lazy: () => import('./pages/NotFound').then((m) => ({ Component: m.default })) },
        ],
      },
      {
        lazy: authLayout,
        children: [
          {
            path: 'admin/login',
            lazy: () => import('./pages/admin/AdminLogin').then((m) => ({ Component: m.default })),
          },
          {
            path: 'admin',
            lazy: () => import('./pages/admin/ProtectedAdminPage').then((m) => ({ Component: m.default })),
          },
        ],
      },
    ],
  },
];
