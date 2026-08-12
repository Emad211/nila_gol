import { ViteReactSSG } from 'vite-react-ssg';
import { routes } from './App';
import './styles/global.css';
import './styles/ui-polish.css';
import './styles/premium-storefront.css';
import './pages/CheckoutLayout.css';

// vite-react-ssg owns mounting (hydration on the client, pre-rendering at build
// time). The data router — with build-time loaders — and our context providers
// live in the routes array exported from App.jsx.
export const createRoot = ViteReactSSG({ routes });
